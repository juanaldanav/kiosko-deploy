import React, { useState, useRef } from "react";
import { useCart } from "../context/CartContext";
import CartSummary from "./CartSummary";
import FlechasScroll from "./FlechasScroll";

export default function FloatingCart({ onPay, ocultarPestana = false }) {
  const { items, clear, total, isProcessing } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const listaRef = useRef(null);

  const totalItems = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  if (totalItems === 0) {
    return null;
  }

  const handleSendOrder = () => {
    if (onPay) {
      onPay();
    }
    setIsCartOpen(false);
  };

  // Pestana/cerrar: semicirculo lateral izquierdo a media altura (y≈890–1030, dentro de la banda)
  const semicirculo = {
    width: '80px',
    height: '140px',
    borderTopRightRadius: '70px',
    borderBottomRightRadius: '70px',
    borderLeft: 'none'
  };

  return (
    <>
      {/* Pestana Semicircular Lateral Izquierda (se oculta bajo el modal de inactividad) */}
      {!ocultarPestana && (
        <button
          onClick={() => setIsCartOpen(true)}
          aria-label={`Ver mi pedido (${totalItems})`}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-[900] bg-k-flota text-k-sobreflota border-[3px] border-k-borde shadow-2xl hover:brightness-110 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 font-bold"
          style={semicirculo}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <span className="text-2xl font-black">{totalItems}</span>
        </button>
      )}

      {/* Modal de Pantalla Completa (px reales, sin zoom) */}
      {isCartOpen && (
        <div className="k-app fixed inset-0 z-[999] flex flex-col items-center overflow-hidden">

          {/* Boton Cerrar - Semicirculo Lateral Izquierdo (contorno) */}
          <button
            onClick={() => setIsCartOpen(false)}
            aria-label="Cerrar mi pedido"
            className="k-btn-atras fixed left-0 top-1/2 -translate-y-1/2 z-[1000] shadow-2xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center"
            style={semicirculo}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>

          {/* Encabezado decorativo (y 0–600): nada tocable */}
          <header className="relative w-full h-[600px] shrink-0 flex flex-col items-center justify-center text-center select-none">
            <div className="k-nieve" aria-hidden="true" />
            <span className="k-logo w-[240px] mb-12" role="img" aria-label="Lamarque Repostería & Café" />
            <div className="flex items-center justify-center gap-8 text-k-sobrefondo">
              <span className="w-[96px] h-[96px] rounded-full border-[3px] border-k-sobrefondo2 grid place-items-center shrink-0">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              </span>
              <h2 className="k-script" style={{ '--fs': '110px' }}>Mi Pedido</h2>
              <span className="min-w-[72px] px-6 py-2 rounded-full bg-k-superficie text-k-tinta text-[40px] font-extrabold leading-tight shrink-0">
                {totalItems}
              </span>
            </div>
            <div className="mt-8 flex items-center gap-5 text-k-sobrefondo2" aria-hidden="true">
              <span className="w-[220px] h-px bg-current opacity-70" />
              <i className="k-destello text-[28px]" />
              <span className="w-[220px] h-px bg-current opacity-70" />
            </div>
          </header>

          {/* Panel centrado (y≈660–1630): lista con scroll interno + total y botones fijos */}
          <section className="k-card mt-[60px] w-[960px] max-w-[calc(100%-32px)] h-[970px] shrink-0 flex flex-col overflow-hidden">
            <div
              ref={listaRef}
              className="flex-1 min-h-0 overflow-y-auto px-6 pt-6 pb-3"
              style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
            >
              <CartSummary className="h-auto" hideActions={true} />
              <FlechasScroll target={listaRef} />
            </div>

            <div className="shrink-0 border-t-[3px] border-k-borde px-6 pt-5 pb-6 space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[34px] font-bold text-k-tinta">Total:</span>
                <span className="text-[60px] leading-none font-extrabold text-k-tinta">${Number(total || 0).toFixed(2)}</span>
              </div>

              {items.length > 0 && (
                <p className="py-3 rounded-full bg-k-info text-k-sobreinfo text-center text-[26px] font-bold">
                  Promociones se aplican en ventanilla
                </p>
              )}

              <div className="flex gap-5">
                <button
                  onClick={clear}
                  disabled={isProcessing}
                  className="flex-1 h-[120px] rounded-2xl bg-k-superficie border-[3px] border-k-acento text-k-primario hover:bg-k-superficie2 disabled:opacity-50 font-bold text-[32px] transition-colors"
                >
                  Vaciar
                </button>
                <button
                  onClick={handleSendOrder}
                  disabled={isProcessing}
                  className="flex-[2] h-[120px] rounded-2xl bg-k-primario text-k-sobreprimario text-[36px] font-bold shadow-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isProcessing ? "Enviando..." : "Enviar Pedido"}
                </button>
              </div>
            </div>
          </section>

          {/* Pie decorativo */}
          <p className="k-script mt-10 text-k-sobrefondo2 select-none" style={{ '--fs': '64px' }} aria-hidden="true">
            Hoy es un buen día.
          </p>
        </div>
      )}
    </>
  );
}
