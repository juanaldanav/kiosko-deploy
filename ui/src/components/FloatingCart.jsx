import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import CartSummary from "./CartSummary";

export default function FloatingCart({ onPay }) {
  const { items, clear, total, isProcessing } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

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

  return (
    <>
      {/* Pestana Semicircular Lateral Izquierda */}
      <button
        onClick={() => setIsCartOpen(true)}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-[900] bg-gradient-to-br from-[#00B7C6] to-[#00A5B3] text-white shadow-2xl hover:brightness-110 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 font-bold"
        style={{
          width: '80px',
          height: '140px',
          borderTopRightRadius: '70px',
          borderBottomRightRadius: '70px',
          borderLeft: 'none'
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        <span className="text-2xl font-black">{totalItems}</span>
      </button>

      {/* Modal de Pantalla Completa */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[999] bg-[#EAF7FA] flex flex-col" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
          
          {/* Boton Cerrar - Semicirculo Lateral Izquierdo */}
          <button
            onClick={() => setIsCartOpen(false)}
            className="fixed left-0 top-1/2 -translate-y-1/2 z-[1000] bg-gradient-to-br from-slate-600 to-slate-700 text-white shadow-2xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center"
            style={{
              width: '80px',
              height: '140px',
              borderTopRightRadius: '70px',
              borderBottomRightRadius: '70px',
              borderLeft: 'none'
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>

          {/* Header con gradiente, icono y conteo */}
          <header className="bg-gradient-to-r from-[#00B7C6] to-[#00A5B3] px-8 py-6 shadow-md flex-shrink-0">
            <div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
              <span className="w-14 h-14 rounded-full bg-white/20 grid place-items-center">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
              </span>
              <h2 className="text-4xl font-bold text-white tracking-wide">Mi Pedido</h2>
              <span className="ml-1 px-4 py-1 rounded-full bg-white/25 text-white text-xl font-bold">{totalItems}</span>
            </div>
          </header>

          {/* Lista del carrito - ARRANCA DESDE ARRIBA y llena el alto disponible */}
          <div
            className="flex-1 min-h-0 overflow-y-auto px-6 pt-5 pb-3"
            style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
          >
            <div className="max-w-4xl mx-auto">
              <CartSummary className="h-auto" hideActions={true} />
            </div>
          </div>

          {/* Total + botones - FIJOS abajo */}
          <div className="flex-shrink-0 bg-white border-t-2 border-gray-200 px-6 py-5 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-slate-700">Total:</span>
                <span className="text-4xl font-extrabold text-slate-900">${Number(total || 0).toFixed(2)}</span>
              </div>

              {items.length > 0 && (
                <div className="py-2.5 bg-slate-700 rounded-xl">
                  <p className="text-center text-base font-bold text-white">
                    Promociones se aplican en ventanilla
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={clear}
                  disabled={isProcessing}
                  className="flex-1 py-5 rounded-2xl bg-white border-4 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 font-bold text-xl transition-colors"
                  style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}
                >
                  Vaciar
                </button>
                <button
                  onClick={handleSendOrder}
                  disabled={isProcessing}
                  className="flex-[2] py-5 rounded-2xl bg-gradient-to-r from-[#00B7C6] to-[#00A5B3] text-white text-2xl font-bold shadow-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                  style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}
                >
                  {isProcessing ? "Enviando..." : "Enviar Pedido"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
