// src/components/CartSummary.jsx - VERSIÓN FINAL MEJORADA
import React from "react";
import { useCart } from "../context/CartContext";
import { usePromociones } from "../hooks/usePromociones";

function formatModifierLabelForView(text = "") {
  const value = String(text || "").trim();
  if (/^AGUA MINERAL\s+\d+\s*OZ$/i.test(value)) {
    return "AGUA MINERAL";
  }
  return value;
}

function PromoIcon({ tipo, className = "w-8 h-8" }) {
  if (tipo === "HORA_FELIZ") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 3h8" />
        <path d="M10 3v4" />
        <path d="M14 3v4" />
        <path d="M6 7h12" />
        <path d="M7 7l2 12h6l2-12" />
        <path d="M4 12h2" />
      </svg>
    );
  }

  if (tipo === "MINIPOSTRES_6X4") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 19h18" />
        <path d="M6 19l1.5-8h9L18 19" />
        <path d="M8 11a4 4 0 0 1 8 0" />
      </svg>
    );
  }

  if (tipo === "REBANADAS_2X180") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 19h16" />
        <path d="M6 19l2-10h8l2 10" />
        <path d="M12 9V6" />
      </svg>
    );
  }

  if (tipo === "ROLES_2X130") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="9" cy="12" r="5" />
        <circle cx="15" cy="12" r="5" />
        <circle cx="9" cy="12" r="1.5" />
        <circle cx="15" cy="12" r="1.5" />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2l2.5 5 5.5.8-4 3.8.9 5.4L12 15l-4.9 2.6.9-5.4-4-3.8 5.5-.8L12 2z" />
    </svg>
  );
}

function getPromoTheme(tipo) {
  const themes = {
    HORA_FELIZ: {
      container: "bg-[#0F766E] border-[#0F766E]",
      iconWrap: "bg-white/15 text-white",
      title: "text-white",
      description: "text-teal-100",
      notice: "bg-white/20 text-white",
      tag: "bg-[#0B5E58] text-white border border-white/25",
      price: "text-[#0F766E]",
      card: "border-[#0F766E] bg-[#DFF7F3] ring-2 ring-[#0F766E]/25 shadow-lg",
    },
    MINIPOSTRES_6X4: {
      container: "bg-[#B45309] border-[#B45309]",
      iconWrap: "bg-white/15 text-white",
      title: "text-white",
      description: "text-amber-100",
      notice: "bg-white/20 text-white",
      tag: "bg-[#92400E] text-white border border-white/25",
      price: "text-[#B45309]",
      card: "border-[#B45309] bg-[#FFF1E6] ring-2 ring-[#B45309]/25 shadow-lg",
    },
    REBANADAS_2X180: {
      container: "bg-[#9A3412] border-[#9A3412]",
      iconWrap: "bg-white/15 text-white",
      title: "text-white",
      description: "text-orange-100",
      notice: "bg-white/20 text-white",
      tag: "bg-[#7C2D12] text-white border border-white/25",
      price: "text-[#9A3412]",
      card: "border-[#9A3412] bg-[#FFE8DC] ring-2 ring-[#9A3412]/25 shadow-lg",
    },
    ROLES_2X130: {
      container: "bg-[#1D4ED8] border-[#1D4ED8]",
      iconWrap: "bg-white/15 text-white",
      title: "text-white",
      description: "text-blue-100",
      notice: "bg-white/20 text-white",
      tag: "bg-[#1E40AF] text-white border border-white/25",
      price: "text-[#1D4ED8]",
      card: "border-[#1D4ED8] bg-[#E7EEFF] ring-2 ring-[#1D4ED8]/25 shadow-lg",
    },
    DEFAULT: {
      container: "bg-[#334155] border-[#334155]",
      iconWrap: "bg-white/15 text-white",
      title: "text-white",
      description: "text-slate-100",
      notice: "bg-white/20 text-white",
      tag: "bg-[#1E293B] text-white border border-white/25",
      price: "text-[#334155]",
      card: "border-[#334155] bg-[#EEF2F7] ring-2 ring-[#334155]/20 shadow-lg",
    },
  };

  return themes[tipo] || themes.DEFAULT;
}

export default function CartSummary({ className = "", onPay = () => {}, hideActions = false }) {
  const { items, total, removeItem, removeByUniqueIds, duplicateItem, clear, isProcessing } = useCart();
  const { 
    promocionDelDia, 
    itemsConDescuento, 
    promocionesAplicadas,
    hayPromociones 
  } = usePromociones(items);

  const handlePay = () => {
    if (!items.length || isProcessing) return;
    onPay();
  };

  const formatPrice = (price) => Number(price || 0).toFixed(2);

  const getItemConDescuento = (item, index) => {
    return itemsConDescuento[index] || item;
  };

  const promoTheme = getPromoTheme(promocionDelDia?.tipo);

  // Agrupa items idénticos para mostrarlos como una sola tarjeta con stepper.
  // IMPORTANTE: los items siguen separados en el carrito (uno por _uniqueId),
  // el puente los recibe sin apilar. El agrupado es solo visual.
  const buildGroups = () => {
    const groups = [];
    const byKey = {};
    items.forEach((item, idx) => {
      const dto = getItemConDescuento(item, idx);
      const key = [
        item.productoId,
        item.nombre,
        item.talla || item.selectedSize,
        JSON.stringify(item.modificadores || []),
      ].join("||");
      if (byKey[key] == null) {
        byKey[key] = groups.length;
        groups.push({
          key,
          rep: item,
          dto,
          indices: [idx],
          uniqueIds: [item._uniqueId],
          total: Number(item.totalItem || 0),
        });
      } else {
        const g = groups[byKey[key]];
        g.indices.push(idx);
        g.uniqueIds.push(item._uniqueId);
        g.total += Number(item.totalItem || 0);
      }
    });
    return groups;
  };

  // Si hideActions es true, solo renderizar la lista de items sin contenedor
  if (hideActions) {
    const groups = buildGroups();

    return (
      <div className="space-y-3">
        {items.length === 0 && (
          <div className="text-2xl text-slate-500 py-12 text-center">
            Tu carrito está vacío
          </div>
        )}

        {groups.map((g) => {
          const item = g.rep;
          const tienePromo = g.dto.tienePromo;
          const count = g.indices.length;
          const lastIdx = g.indices[g.indices.length - 1];

          return (
            <div
              key={g.key}
              className={`rounded-2xl p-3 transition-all flex items-center gap-3 ${
                tienePromo
                  ? `border-2 ${getPromoTheme(g.dto.tipoPromo).card}`
                  : "border border-slate-200 bg-white shadow-sm"
              }`}
            >
              {/* Imagen compacta */}
              <img
                src={item.foto || "/images/placeholder.png"}
                onError={(e) => (e.currentTarget.src = "/images/placeholder.png")}
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                alt=""
              />

              {/* Contenido */}
              <div className="flex-1 min-w-0">
                <div className="text-xl font-extrabold leading-tight truncate text-slate-900">
                  {item.nombre}
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span className="text-base font-semibold text-slate-600">
                    {item.talla || item.selectedSize}
                  </span>
                  {tienePromo && g.dto.mensajePromo && (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-sm font-bold ${getPromoTheme(g.dto.tipoPromo).tag}`}>
                      <PromoIcon tipo={g.dto.tipoPromo} className="w-4 h-4" />
                      {g.dto.mensajePromo}
                    </span>
                  )}
                </div>

                {Array.isArray(item.modificadores) && item.modificadores.length > 0 && (
                  <div className="text-base font-medium text-slate-600 truncate mt-1">
                    {item.modificadores
                      .map((m) => formatModifierLabelForView(m?.opcion?.nombre || m?.opcion?.name || ""))
                      .filter(Boolean)
                      .join(" • ")}
                  </div>
                )}

                <div className={`text-2xl font-extrabold mt-1 ${tienePromo ? getPromoTheme(g.dto.tipoPromo).price : "text-green-700"}`}>
                  ${formatPrice(g.total)}
                </div>
              </div>

              {/* Stepper -N+ y eliminar */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <div className="flex items-center gap-2 bg-slate-100 rounded-full p-1">
                  <button
                    onClick={() => removeItem(lastIdx)}
                    disabled={isProcessing}
                    title="Quitar uno"
                    className="w-10 h-10 grid place-items-center rounded-full bg-white text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 disabled:opacity-50 text-2xl font-bold transition-all"
                  >
                    −
                  </button>
                  <span className="w-7 text-center text-xl font-bold text-slate-800">{count}</span>
                  <button
                    onClick={() => duplicateItem(lastIdx)}
                    disabled={isProcessing}
                    title="Agregar uno"
                    className="w-10 h-10 grid place-items-center rounded-full bg-[#00B7C6] text-white shadow-sm hover:brightness-110 active:scale-95 disabled:opacity-50 text-2xl font-bold transition-all"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeByUniqueIds(g.uniqueIds)}
                  disabled={isProcessing}
                  title="Eliminar"
                  className="w-9 h-9 grid place-items-center rounded-full bg-rose-100 text-rose-600 hover:bg-rose-200 active:scale-95 disabled:opacity-50 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <aside className={`bg-white/80 rounded-3xl shadow-xl border-2 border-white/60 h-full flex flex-col ${className}`}>
      
      {/* Header */}
      <div className="px-6 py-5 border-b-2">
        <h3 className="text-3xl font-bold text-slate-700">Carrito</h3>
        
        {/* Banner de promoción mejorado con texto MÁS GRANDE */}
        {promocionDelDia && (
          <div className={`mt-4 p-6 rounded-xl border-2 ${promoTheme.container}`}>
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl grid place-items-center ${promoTheme.iconWrap}`}>
                <PromoIcon tipo={promocionDelDia.tipo} className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <p className={`text-2xl font-bold ${promoTheme.title}`}>
                  {promocionDelDia.titulo}
                </p>
                <p className={`text-lg mt-2 ${promoTheme.description}`}>
                  {promocionDelDia.descripcion}
                </p>
                {/* Texto MÁS GRANDE Y NOTORIO */}
                <p className={`text-xl font-extrabold mt-3 px-4 py-2 rounded-lg inline-block ${promoTheme.notice}`}>
                 Descuentos aplicados en ventanilla
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de items */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
        {items.length === 0 && (
          <div className="text-2xl text-slate-500 py-12 text-center">
            Tu carrito está vacío
          </div>
        )}

        {items.map((item, idx) => {
          const itemConDescuento = getItemConDescuento(item, idx);
          const tienePromo = itemConDescuento.tienePromo;
          
          return (
            <div 
              key={idx} 
              className={`rounded-2xl p-5 transition-all ${
                tienePromo 
                  ? `border-4 ${getPromoTheme(itemConDescuento.tipoPromo).card}`
                  : 'border-2 border-slate-200 bg-white'
              }`}
            >
              <div className="flex gap-4">
                {/* Imagen */}
                <img
                  src={item.foto || "/images/placeholder.png"}
                  onError={(e) => (e.currentTarget.src = "/images/placeholder.png")}
                  className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
                  alt=""
                />
                
                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="text-xl font-bold leading-tight truncate">
                    {item.nombre}
                  </div>
                  
                  {/* Tag de promoción con texto más visible */}
                  {tienePromo && itemConDescuento.mensajePromo && (
                    <div className={`inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg text-sm font-bold ${getPromoTheme(itemConDescuento.tipoPromo).tag}`}>
                      <PromoIcon tipo={itemConDescuento.tipoPromo} className="w-4 h-4" />
                      {itemConDescuento.mensajePromo}
                    </div>
                  )}
                  
                  <div className="text-lg text-slate-600 mt-2">
                    {item.talla || item.selectedSize} 
                    {item.quantity > 1 && ` x${item.quantity}`}
                  </div>
                  
                  {Array.isArray(item.modificadores) && item.modificadores.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {item.modificadores.map((m, i) => (
                        <div key={i} className="text-base text-slate-600 truncate">
                          • {formatModifierLabelForView(m?.opcion?.nombre || m?.opcion?.name || '')}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Precio y botones */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t-2">
                <div className={`text-2xl font-bold ${tienePromo ? getPromoTheme(itemConDescuento.tipoPromo).price : 'text-green-700'}`}>
                  ${formatPrice(item.totalItem)}
                </div>
                
                <div className="flex gap-3">
                  {duplicateItem && (
                    <button
                      onClick={() => duplicateItem(idx)}
                      title="Duplicar"
                      disabled={isProcessing}
                      className="w-14 h-14 grid place-items-center rounded-full bg-cyan-100 text-cyan-700 hover:bg-cyan-200 disabled:opacity-50 transition-colors"
                    >
                      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                        <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => removeItem(idx)}
                    title="Eliminar"
                    disabled={isProcessing}
                    className="w-14 h-14 grid place-items-center rounded-full bg-rose-100 text-rose-700 hover:bg-rose-200 disabled:opacity-50 transition-colors"
                  >
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer con total */}
      {!hideActions && (
        <div className="border-t-2 p-5">
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl text-slate-700 font-bold">Total:</span>
              <div className="text-right">
                <span className="font-bold text-3xl text-slate-900">
                  ${formatPrice(total)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Leyenda de promociones - SIEMPRE VISIBLE */}
          {items.length > 0 && (
            <div className="mb-4 p-3 bg-slate-700 rounded-xl">
              <p className="text-center text-base font-bold text-white">
                Promociones se aplican en ventanilla
              </p>
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={clear}
              disabled={isProcessing}
              className="flex-1 h-16 rounded-2xl bg-white border-4 border-slate-400 text-slate-700 hover:bg-slate-50 hover:border-slate-500 disabled:opacity-50 font-bold text-xl transition-colors"
            >
              Vaciar
            </button>
            <button
              onClick={handlePay}
              disabled={items.length === 0 || isProcessing}
              className={`flex-1 h-16 rounded-2xl font-bold text-xl transition-all ${
                items.length === 0 || isProcessing
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : hayPromociones 
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
                    : "bg-[#00B7C6] text-white hover:brightness-110"
              }`}
            >
              {isProcessing ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}