// src/components/InactivityModal.jsx - VERSIÓN ESTABLE (onExit fuera del setState)
import React, { useState, useEffect } from 'react';

export default function InactivityModal({ isOpen, onContinue, onExit, timeoutSeconds = 30 }) {
  const [countdown, setCountdown] = useState(timeoutSeconds);

  // Manejo del temporizador del contador
  useEffect(() => {
    if (!isOpen) {
      // Si el modal no está abierto, resetea el contador
      setCountdown(timeoutSeconds);
      return;
    }

    const id = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(id);
  }, [isOpen, timeoutSeconds]);

  // Dispara la salida cuando llega a 0 (después del commit, sin setState en render)
  useEffect(() => {
    if (!isOpen) return;
    if (countdown === 0) {
      const t = setTimeout(() => {
        // Refrescar toda la aplicación cuando se acabe el tiempo
        window.location.reload();
      }, 0);
      return () => clearTimeout(t);
    }
  }, [countdown, isOpen, onExit]);

  if (!isOpen) return null;

  const handleContinue = () => {
    setCountdown(timeoutSeconds); // reset visual
    onContinue?.();
  };

  const handleExit = () => {
    // Refrescar toda la aplicación al hacer clic en Salir
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center px-12">
      {/* Tarjeta centrada en y≈960: botones dentro de la banda de alcance (600–1500) */}
      <div className="k-card w-full max-w-[820px] px-14 py-14 text-center" role="alertdialog" aria-labelledby="inact-titulo">
        <svg className="mx-auto mb-6 text-k-acento" width="112" height="112" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="13" r="8"></circle>
          <path d="M12 9v4l2 2"></path>
          <path d="M5 3 2 6"></path>
          <path d="m22 6-3-3"></path>
        </svg>

        <h2 id="inact-titulo" className="k-script text-k-primario mb-4" style={{ '--fs': '84px' }}>
          ¿Sigues ahí?
        </h2>

        <p className="text-[30px] leading-snug text-k-tinta2 mb-6">
          Tu sesión se cerrará por inactividad en:
        </p>

        <div className="text-[160px] leading-none font-extrabold mb-12 tabular-nums" aria-live="polite">
          <span className={countdown <= 10 ? "text-k-badge animate-pulse" : "text-k-tinta"}>
            {countdown}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <button
            onClick={handleExit}
            className="min-h-[120px] px-8 text-[32px] rounded-[var(--k-radio)] bg-transparent border-[3px] border-k-acento text-k-acento font-bold active:scale-95 transition-transform"
          >
            Salir
          </button>
          <button
            onClick={handleContinue}
            className="min-h-[120px] px-8 text-[32px] rounded-[var(--k-radio)] bg-k-primario text-k-sobreprimario font-bold shadow-lg active:scale-95 transition-transform"
          >
            Continuar pidiendo
          </button>
        </div>
      </div>
    </div>
  );
}
