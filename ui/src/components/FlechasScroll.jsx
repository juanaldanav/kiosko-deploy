import React, { useEffect, useRef, useState } from "react";

// Botones de hoja arriba/abajo para las bandas con scroll.
// Hay kioskos viejos cuyo touch llega como mouse: no arrastran ni agarran la barra,
// pero el clic sí funciona. Va JUSTO DEBAJO del contenedor con scroll (no encima de los
// productos) y cada toque deja arriba la fila que estaba cortada o era la siguiente.
const AIRE = 12; // separacion entre el borde de la banda y la fila alineada

export default function FlechasScroll({ target }) {
  const [st, setSt] = useState({ arriba: false, abajo: false });
  const ocupado = useRef(false);

  useEffect(() => {
    const el = target.current;
    if (!el) return;
    const medir = () => {
      const max = el.scrollHeight - el.clientHeight;
      setSt({ arriba: max > 4 && el.scrollTop > 4, abajo: max > 4 && el.scrollTop < max - 4 });
    };
    medir();
    el.addEventListener("scroll", medir, { passive: true });
    el.addEventListener("load", medir, true); // imagenes que crecen el contenido
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    const mo = new MutationObserver(medir);
    mo.observe(el, { childList: true, subtree: true });
    return () => {
      el.removeEventListener("scroll", medir);
      el.removeEventListener("load", medir, true);
      ro.disconnect();
      mo.disconnect();
    };
  }, [target]);

  if (!st.arriba && !st.abajo) return null;

  // Tops de tarjetas y titulos, medidos dentro del contenido con scroll
  const filas = (el) => {
    const caja = el.getBoundingClientRect();
    const k = caja.height / el.offsetHeight || 1; // modo vitrina escala con transform
    const sel = ".k-card, button, h2, h3, li, [data-fila]";
    // solo la tarjeta completa, no los botones −/+ que trae adentro
    const externos = [...el.querySelectorAll(sel)].filter((n) => {
      const padre = n.parentElement.closest(sel);
      return !padre || !el.contains(padre);
    });
    return externos.map((n) => {
      const r = n.getBoundingClientRect();
      return { top: (r.top - caja.top) / k + el.scrollTop, bottom: (r.bottom - caja.top) / k + el.scrollTop };
    });
  };

  // 350 ms de antirrebote: el touch que llega como mouse a veces manda dos clics
  const ir = (dir) => {
    const el = target.current;
    if (!el || ocupado.current) return;
    ocupado.current = true;
    setTimeout(() => { ocupado.current = false; }, 350);
    const max = el.scrollHeight - el.clientHeight;
    const vista = el.scrollTop, alto = el.clientHeight;
    const fs = filas(el);
    let top;
    if (dir === 0) top = 0;
    else if (dir > 0) {
      // primera fila que no se ve completa: queda arriba
      const cortadas = fs.filter((f) => f.top > vista + AIRE + 2 && f.bottom > vista + alto + 1).map((f) => f.top);
      top = cortadas.length ? Math.min(...cortadas) - AIRE : vista + alto * 0.8;
    } else {
      // la hoja anterior: la fila mas alta que cabe completa arriba de la actual
      const caben = fs.filter((f) => f.top >= vista - alto + AIRE && f.top < vista).map((f) => f.top);
      top = caben.length ? Math.min(...caben) - AIRE : vista - alto * 0.8;
    }
    const suave = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    el.scrollTo({ top: Math.max(0, Math.min(max, top)), behavior: suave });
  };
  const final = !st.abajo;

  return (
    <div className="flex justify-center items-center gap-4 py-3">
      {st.arriba && !final && (
        <button type="button" onClick={() => ir(-1)} aria-label="Subir"
          className="k-flecha k-flecha-sub w-16 h-16 rounded-full">
          <Chevron arriba />
        </button>
      )}
      <button type="button" onClick={() => ir(final ? 0 : 1)}
        className="k-flecha h-16 pl-7 pr-5 rounded-full gap-2 text-[24px] font-extrabold">
        {final ? "Volver arriba" : "Ver más"}
        <Chevron arriba={final} />
      </button>
    </div>
  );
}

const Chevron = ({ arriba }) => (
  <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={arriba ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"} />
  </svg>
);
