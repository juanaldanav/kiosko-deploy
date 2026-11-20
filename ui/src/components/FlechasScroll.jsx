import React, { useEffect, useRef, useState } from "react";

// Botones de hoja arriba/abajo para las bandas con scroll.
// Hay kioskos viejos cuyo touch llega como mouse: no arrastran ni agarran la barra,
// pero el clic sí funciona. Va como ULTIMO hijo del contenedor con scroll (sticky abajo).
const RESERVA = 136; // 96 de pastilla + 20 de margen + 20 de aire: la ultima fila sube por encima

export default function FlechasScroll({ target }) {
  const [st, setSt] = useState({ arriba: false, abajo: false, hoja: 1, hojas: 1 });
  const ocupado = useRef(false);

  useEffect(() => {
    const el = target.current;
    if (!el) return;
    const medir = () => {
      const max = el.scrollHeight - el.clientHeight;
      const reserva = el.querySelector(":scope > [data-reserva]") ? RESERVA : 0;
      if (max - reserva <= 4) { setSt({ arriba: false, abajo: false, hoja: 1, hojas: 1 }); return; }
      const paso = el.clientHeight * 0.8;
      const hojas = Math.ceil(max / paso) + 1;
      const alFinal = el.scrollTop >= max - 4;
      setSt({
        arriba: el.scrollTop > 4,
        abajo: !alFinal,
        hoja: alFinal ? hojas : Math.min(hojas, Math.round(el.scrollTop / paso) + 1),
        hojas,
      });
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

  if (st.hojas <= 1) return null;

  // 350 ms de antirrebote: el touch que llega como mouse a veces manda dos clics
  const ir = (dir) => {
    const el = target.current;
    if (!el || ocupado.current) return;
    ocupado.current = true;
    setTimeout(() => { ocupado.current = false; }, 350);
    const suave = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    if (dir === 0) el.scrollTo({ top: 0, behavior: suave });
    else el.scrollBy({ top: dir * el.clientHeight * 0.8, behavior: suave });
  };
  const final = !st.abajo;

  return (
    <>
      <div data-reserva="" aria-hidden="true" className="!mt-0" style={{ height: RESERVA }} />
      <div className="sticky bottom-0 h-0 w-full !mt-0 z-30 pointer-events-none">
        <div className="absolute bottom-5 inset-x-0 flex justify-center items-center gap-5">
          {st.arriba && !final && (
            <button type="button" onClick={() => ir(-1)} aria-label="Subir"
              className="k-flecha k-flecha-sub pointer-events-auto w-24 h-24 rounded-full">
              <Chevron arriba />
            </button>
          )}
          <button type="button" onClick={() => ir(final ? 0 : 1)}
            aria-label={final ? "Volver arriba" : `Ver más, hoja ${st.hoja} de ${st.hojas}`}
            className="k-flecha pointer-events-auto h-24 pl-10 pr-4 rounded-full gap-4 text-[30px] font-extrabold">
            {final ? "Volver arriba" : "Ver más"}
            <Chevron arriba={final} />
            <span className="k-flecha-hoja h-16 min-w-24 px-4 rounded-full flex items-center justify-center text-[26px] font-extrabold tabular-nums">
              {st.hoja}/{st.hojas}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}

const Chevron = ({ arriba }) => (
  <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={arriba ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"} />
  </svg>
);
