// src/components/ModifierStep.jsx - VERSIÓN CON ICONOS OFICIALES DE MARKETING
import React, { useState, useRef, useEffect } from "react";
import { getModifierIcon } from "../data/modifiersImages";

function formatModifierLabelForView(text = "") {
  const value = String(text || "").trim();
  if (/^AGUA MINERAL\s+\d+\s*OZ$/i.test(value)) {
    return "AGUA MINERAL";
  }
  return value;
}

function normOpt(raw = {}) {
  const id =
    raw.id ??
    raw.value ??
    raw.key ??
    raw.Nombre ??
    raw.nombre ??
    raw.label ??
    raw.name ??
    "";

  let nombre =
    raw.nombre ??
    raw.name ??
    raw.label ??
    (typeof id === "string" ? id : String(id));

  if (typeof nombre === "string" && nombre === nombre.toLowerCase()) {
    nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);
  }

  return {
    id,
    nombre,
    priceDelta: Number(raw.priceDelta ?? raw.precio_adicional ?? 0),
    basePrice: Number(raw.basePrice ?? 0),
    idsPerSize: raw.idsPerSize || raw.idsBySize || raw._raw?.idsPerSize || {},
    pricesPerSize: raw.pricesPerSize || raw.pricesBySize || raw._raw?.pricesPerSize || {},
    labelsPerSize: raw.labelsPerSize || raw._raw?.labelsPerSize || {},
    icon: raw.icon || raw.image || null,
    disabled: Boolean(raw.disabled),
    _raw: raw,
  };
}

// Tamaños por cantidad de opciones y tipo. Todo debe caber en la banda de alcance (900px de alto);
// si no cabe, la banda hace scroll. Texto de modificador siempre ≥28px (regla de Juan).
const G3 = "gap-x-[22px] gap-y-[28px]";
function getOptimalLayout(optionCount, groupType = "") {
  const typeU = (groupType || "").toUpperCase();

  // VELAS: 12 opciones en 3×4 caben en la banda
  if (typeU.includes("FORMA") || typeU.includes("VELA") || typeU.includes("MARKELAN") || typeU.includes("NUMERO")) {
    if (optionCount <= 4) {
      return { columns: 2, tileWidth: "w-[404px]", tileHeight: "h-[300px]", iconSize: "w-40 h-40", gap: "gap-8" };
    }
    return { columns: 3, tileWidth: "w-[296px]", tileHeight: "h-[196px]", iconSize: "w-[104px] h-[104px]", gap: "gap-x-[22px] gap-y-4" };
  }

  // LECHE, COLD FOAM, VASO, AZÚCAR, TERMO: íconos grandes
  const isSpecialCategory =
    typeU.includes("LECHE") ||
    typeU.includes("MILK") ||
    typeU.includes("AZUCAR") ||
    (typeU.includes("COLD") && typeU.includes("FOAM")) ||
    typeU.includes("VASO") ||
    typeU.includes("TERMO");

  if (isSpecialCategory) {
    if (optionCount <= 2) return { columns: 2, tileWidth: "w-[404px]", tileHeight: "h-[360px]", iconSize: "w-48 h-48", gap: "gap-8" };
    if (optionCount <= 4) return { columns: 2, tileWidth: "w-[404px]", tileHeight: "h-[320px]", iconSize: "w-44 h-44", gap: "gap-8" };
    return { columns: 3, tileWidth: "w-[296px]", tileHeight: "h-[290px]", iconSize: "w-[120px] h-[120px]", gap: G3 };
  }

  // Resto de modificadores
  if (optionCount <= 2) return { columns: 2, tileWidth: "w-[404px]", tileHeight: "h-[320px]", iconSize: "w-40 h-40", gap: "gap-8" };
  if (optionCount <= 4) return { columns: 2, tileWidth: "w-[404px]", tileHeight: "h-[300px]", iconSize: "w-36 h-36", gap: "gap-8" };
  if (optionCount <= 9) return { columns: 3, tileWidth: "w-[296px]", tileHeight: "h-[260px]", iconSize: "w-28 h-28", gap: G3 };
  return { columns: 3, tileWidth: "w-[296px]", tileHeight: "h-[232px]", iconSize: "w-20 h-20", gap: G3 };
}

// Palomita de "opción elegida" (esquina superior derecha, 64px)
function Palomita() {
  return (
    <span className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-k-primario text-k-sobreprimario border-4 border-k-superficie flex items-center justify-center pointer-events-none" aria-hidden="true">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5 10 17.5 19.5 7" /></svg>
    </span>
  );
}

function OptTile({ tipo, opt, onClick, product, group, layout, isSel }) {
  const o = normOpt(opt);
  const displayName = formatModifierLabelForView(o.nombre);

  // Skeleton mientras el icono decodifica/pinta (evita el flash en blanco)
  const imgRef = useRef(null);
  const [iconLoaded, setIconLoaded] = useState(false);

  // 🎯 USAR EL SISTEMA INTELIGENTE DE ICONOS
  const iconSrc = getModifierIcon(group, product, o.nombre);
  const hasRealIcon = iconSrc && iconSrc !== "./images/placeholder.png" && iconSrc !== "./images/mods/placeholder.png";

  // Si la imagen ya estaba en cache (complete), marcarla cargada de una
  useEffect(() => {
    setIconLoaded(false);
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIconLoaded(true);
    }
  }, [iconSrc]);

  const handle = () => {
    if (o.disabled) return;
    onClick?.(o);
  };

  return (
    <button
      onClick={handle}
      disabled={o.disabled}
      className={`
        k-card relative
        ${layout.tileWidth} ${layout.tileHeight}
        flex flex-col items-center justify-center gap-[10px] p-4
        active:scale-95 transition-transform
        ${isSel ? "k-sel" : ""}
        ${o.disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      {/* Icono original de la diseñadora, con skeleton mientras carga */}
      {hasRealIcon && (
        <div className={`flex-shrink-0 relative ${layout.iconSize}`}>
          {!iconLoaded && (
            <div className="absolute inset-0 rounded-xl skeleton-shimmer" />
          )}
          <img
            ref={imgRef}
            src={iconSrc}
            onLoad={() => setIconLoaded(true)}
            onError={(e) => {
              e.currentTarget.src = "./images/placeholder.png";
              setIconLoaded(true);
            }}
            alt={displayName}
            className={`${layout.iconSize} object-contain mix-blend-multiply transition-opacity duration-200 ${iconLoaded ? "opacity-100" : "opacity-0"}`}
          />
        </div>
      )}

      {/* Texto */}
      <div className="text-k-tinta font-semibold text-[28px] uppercase text-center leading-[1.1] px-1 flex-shrink-0 line-clamp-2">
        {displayName.split("\n")[0]}
      </div>

      {/* Precio */}
      {o.priceDelta > 0 && (
        <div className="text-[30px] text-k-acento font-bold leading-none flex-shrink-0">
          +${o.priceDelta}
        </div>
      )}

      {isSel && <Palomita />}
    </button>
  );
}

function SizeTile({ opt, onClick, layout, isSel }) {
  const o = normOpt(opt);
  const sizeLabel = o.nombre || String(o.id || "");

  const handle = () => {
    if (o.disabled) return;
    onClick?.(sizeLabel, opt);
  };

  return (
    <button
      onClick={handle}
      disabled={o.disabled}
      className={`
        k-card relative
        ${layout.tileWidth} ${layout.tileHeight}
        flex flex-col items-center justify-center gap-3
        active:scale-95 transition-transform
        ${isSel ? "k-sel" : ""}
        ${o.disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <div className="text-k-tinta font-bold text-[44px] flex-shrink-0">
        {sizeLabel}
      </div>
      {o.basePrice > 0 && (
        <div className="text-k-acento font-extrabold text-[34px] flex-shrink-0">
          ${o.basePrice}
        </div>
      )}
      {isSel && <Palomita />}
    </button>
  );
}

// Rectangulo alargado para EXTRAS: nombre y luego icono pequeno a la derecha.
function ExtraRow({ opt, onClick, product, group, isSel }) {
  const o = normOpt(opt);
  const displayName = formatModifierLabelForView(o.nombre);
  const iconSrc = getModifierIcon(group, product, o.nombre);
  const hasRealIcon = iconSrc && !String(iconSrc).includes("placeholder");
  return (
    <button
      onClick={() => { if (!o.disabled) onClick?.(o); }}
      disabled={o.disabled}
      className={`k-card relative w-[760px] max-w-full min-h-[104px] py-3
        flex items-center justify-center gap-4 px-8 transition-transform
        ${isSel ? "k-sel" : ""}
        ${o.disabled ? "opacity-50 cursor-not-allowed" : "active:scale-95"}`}
    >
      <span className="text-[28px] font-semibold uppercase text-k-tinta leading-tight">{displayName.split("\n")[0]}</span>
      {hasRealIcon && (
        <img src={iconSrc} alt="" className="w-14 h-14 object-contain mix-blend-multiply flex-shrink-0"
          onError={(e) => { e.currentTarget.style.display = "none"; }} />
      )}
      {o.priceDelta > 0 && (
        <span className="text-[30px] font-bold text-k-acento ml-1 flex-shrink-0">+${o.priceDelta}</span>
      )}
      {isSel && <Palomita />}
    </button>
  );
}

// Pastilla de paso (solo si el contenedor no la pinta en su encabezado)
function PasoTitulo({ titulo }) {
  return (
    <h2 className="mb-10 text-center">
      <span
        className="inline-flex items-center gap-[18px] h-[72px] px-10 rounded-full font-semibold text-[40px]"
        style={{ background: 'var(--k-paso-bg)', color: 'var(--k-paso-color)', border: 'var(--k-paso-borde)' }}
      >
        {titulo}
      </span>
    </h2>
  );
}

export default function ModifierStep({ grupo, onPick, product, sizeLabel, showTitle = true, selected = null }) {
  if (!grupo) return null;

  const tipo = (grupo.tipo || grupo.type || "").toString();
  const titulo = grupo.titulo || grupo.title || "Elige una opción";

  const rawOptions = Array.isArray(grupo.opciones)
    ? grupo.opciones
    : Array.isArray(grupo.options)
    ? grupo.options
    : [];

  const isSize = tipo.toLowerCase() === "size";

  const _sizeLabel =
    sizeLabel ||
    product?.DefaultSizeLabel ||
    product?.defaultSize ||
    "Grande";

  const visibleOptions = (Array.isArray(rawOptions) ? rawOptions : []).filter(
    (o) => {
      const ids = o?.idsPerSize || (o?._raw && o._raw.idsPerSize) || null;
      if (!ids || Object.keys(ids).length === 0) return true;
      return ids[_sizeLabel] != null;
    }
  );

  // Opción ya elegida (al regresar con Atrás): solo visual
  const esElegida = (opt) => {
    if (!selected) return false;
    const o = normOpt(opt);
    return String(o.id) === String(selected.id ?? "") || (!!selected.nombre && o.nombre === selected.nombre);
  };

  // EXTRAS: layout de rectangulos alargados (nombre + icono pequeno a la derecha)
  const isExtras = ["extras", "extrashot"].includes(tipo.toLowerCase());
  if (isExtras) {
    return (
      <div className="w-full flex flex-col items-center">
        {showTitle && <PasoTitulo titulo={titulo} />}
        <div className="flex flex-col gap-5 items-center w-full">
          {visibleOptions.map((opt, idx) => (
            <ExtraRow
              key={`extra_${String(normOpt(opt).id || normOpt(opt).nombre || idx)}_${idx}`}
              opt={opt}
              product={product}
              group={grupo}
              isSel={esElegida(opt)}
              onClick={(o) => onPick?.(o)}
            />
          ))}
        </div>
      </div>
    );
  }

  // 🔥 Obtener el layout óptimo basado en la cantidad de opciones Y el tipo de grupo
  const layout = getOptimalLayout(visibleOptions.length, tipo || titulo);

  return (
    <div className="w-full flex flex-col items-center">
      {showTitle && <PasoTitulo titulo={titulo} />}

      <div
        className={`grid ${layout.gap}`}
        style={{
          gridTemplateColumns: `repeat(${layout.columns}, minmax(0, max-content))`,
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        {visibleOptions.map((opt, idx) => {
          const k = `${tipo}_${String(normOpt(opt).id || idx)}_${idx}`;

          if (isSize) {
            return <SizeTile key={k} opt={opt} isSel={esElegida(opt)} onClick={(o) => onPick?.(o)} layout={layout} />;
          }

          return (
            <OptTile
              key={k}
              tipo={tipo}
              opt={opt}
              product={product}
              group={grupo}
              isSel={esElegida(opt)}
              onClick={(o) => onPick?.(o)}
              layout={layout}
            />
          );
        })}
      </div>
    </div>
  );
}
