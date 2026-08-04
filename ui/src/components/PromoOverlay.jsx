import React, { useState, useRef, useEffect } from "react";

// Usa dos elementos <video> alternados para pre-cargar el siguiente
// y eliminar el flash negro entre videos.
export default function PromoOverlay({ onStart, videoSources = [] }) {
  const [idx, setIdx] = useState(0);   // índice del video activo
  const [slot, setSlot] = useState(0); // 0 o 1: cuál <video> está al frente
  const ref0 = useRef(null);
  const ref1 = useRef(null);
  const refs = [ref0, ref1];

  // Cerrar con ESC
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onStart?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onStart]);

  // Inicializar cuando llegan las fuentes
  useEffect(() => {
    if (!videoSources.length) return;
    refs[0].current.src = videoSources[0];
    refs[0].current.play().catch(() => {});
    // Pre-cargar el segundo
    refs[1].current.src = videoSources[1 % videoSources.length];
    refs[1].current.load();
  }, [videoSources]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEnded = () => {
    const nextIdx  = (idx + 1) % videoSources.length;
    const nextSlot = 1 - slot;
    const oldSlot  = slot;
    // Arrancar el video ya pre-cargado (entra con fundido)
    refs[nextSlot].current?.play().catch(() => {});
    setIdx(nextIdx);
    setSlot(nextSlot);
    // Pre-cargar el siguiente-siguiente en el slot que acaba de terminar,
    // PERO despues del fundido, para que conserve su ultimo frame mientras entra el nuevo.
    setTimeout(() => {
      const el = refs[oldSlot].current;
      if (!el) return;
      el.src = videoSources[(nextIdx + 1) % videoSources.length];
      el.load();
    }, 800); // > duracion del fade (700ms)
  };

  if (!videoSources.length) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      {[0, 1].map((s) => (
        <video
          key={s}
          ref={refs[s]}
          className={`absolute inset-0 w-screen h-[100dvh] object-cover transition-opacity duration-700 ease-in-out ${
            s === slot ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
          muted
          playsInline
          preload="auto"
          onEnded={s === slot ? handleEnded : undefined}
        />
      ))}
      {/* Toque en cualquier parte para comenzar el pedido */}
      <button
        onClick={onStart}
        className="absolute inset-0 cursor-pointer"
        aria-label="Comenzar pedido"
        title="Comenzar pedido"
      />
    </div>
  );
}