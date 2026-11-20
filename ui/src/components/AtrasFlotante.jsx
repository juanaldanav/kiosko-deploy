// Pestaña "Atrás" a media altura, borde derecho (el izquierdo es del carrito).
// Para el carril de auto: el Atrás de la barra de abajo queda muy bajo.
export default function AtrasFlotante({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="k-btn-atras fixed right-0 top-1/2 -translate-y-1/2 z-[950] shadow-2xl active:scale-95 transition-transform flex items-center justify-center"
      style={{ width: '80px', height: '140px', borderTopLeftRadius: '70px', borderBottomLeftRadius: '70px', borderRight: 'none' }}
      aria-label="Regresar"
      title="Regresar"
    >
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
    </button>
  );
}
