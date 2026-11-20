import React, { useEffect, useState } from "react";

// Botones de hoja arriba/abajo para las bandas con scroll.
// Hay kioskos viejos cuyo touch llega como mouse: no arrastran ni agarran la barra,
// pero el clic sí funciona. Va como ULTIMO hijo del contenedor con scroll (sticky abajo).
export default function FlechasScroll({ target }) {
  const [puede, setPuede] = useState({ arriba: false, abajo: false });

  useEffect(() => {
    const el = target.current;
    if (!el) return;
    const medir = () => setPuede({
      arriba: el.scrollTop > 4,
      abajo: el.scrollTop + el.clientHeight < el.scrollHeight - 4,
    });
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

  if (!puede.arriba && !puede.abajo) return null;

  const hoja = (dir) => {
    const el = target.current;
    if (el) el.scrollBy({ top: dir * el.clientHeight * 0.8, behavior: "smooth" });
  };

  return (
    <div className="sticky bottom-0 h-0 w-full !mt-0 z-30 pointer-events-none">
      <div className="absolute bottom-5 inset-x-0 flex justify-center gap-4">
        {puede.arriba && (
          <button type="button" onClick={() => hoja(-1)} aria-label="Subir"
            className="k-flecha pointer-events-auto w-[96px] h-[96px] rounded-full">
            <svg viewBox="0 0 24 24" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6" /></svg>
          </button>
        )}
        {puede.abajo && (
          <button type="button" onClick={() => hoja(1)}
            className="k-flecha pointer-events-auto h-[96px] pl-10 pr-8 rounded-full gap-3 text-[30px] font-extrabold tracking-wide">
            Ver más
            <svg viewBox="0 0 24 24" className="w-11 h-11" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
          </button>
        )}
      </div>
    </div>
  );
}
