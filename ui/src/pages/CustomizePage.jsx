// src/pages/CustomizePage.jsx - VERSIÓN CON BOTÓN ENVIAR AHORA
import React, { useMemo, useState, useRef, useEffect } from "react";
import { useCart } from "../context/CartContext";
import useSteps from "../lib/useSteps.js";
import ModifierStep from "../components/ModifierStep";
import SuggestedItemsOverlay from "../components/SuggestedItemsOverlay";
import AtrasFlotante from "../components/AtrasFlotante";

// Great Vibes en MAYÚSCULAS no se lee: Title Case para .k-script (mismo helper que MenuPage)
const tituloScript = (t = "") => String(t || "").toLowerCase().replace(/(^|[\s/(-])(\S)/g, (_, a, c) => a + c.toUpperCase());

function formatModifierLabelForView(text = "") {
  const value = String(text || "").trim();
  if (/^AGUA MINERAL\s+\d+\s*OZ$/i.test(value)) {
    return "AGUA MINERAL";
  }
  return value;
}

export default function CustomizePage({ producto, onClose, onGoHome, onNavigateToCategory, onPay, preferOnCloseOnAdd = false, showSendButton = true, autoAddOnFinal = false, onBuildItem = null }) {
  const { addItem, checkout, isProcessing } = useCart();
  const contentRef = useRef(null);
  const [showSuggested, setShowSuggested] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const variants = producto?.ProductsBySize || [];
  const hasMultipleSizes = variants.length > 1;
  const modifiers = Array.isArray(producto.modifiers) ? producto.modifiers : [];
  const modGroups = modifiers.filter((m) => (m.tipo || m.type) !== "size");

  const [selectedSize, setSelectedSize] = useState(
    producto?.DefaultSizeLabel || "Grande"
  );
  const [pickedMap, setPickedMap] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(null);

  const visibleColors = Array.isArray(producto?.colorOptions)
    ? producto.colorOptions.filter(c => !c.disabled)
    : null;
  const hasColors = visibleColors && visibleColors.length > 0;
  const autoAddKeyRef = useRef("");

  const isPastel = (producto?.category === "REPOSTERIA" || 
                   producto?.grupo === "REPOSTERIA DE LINEA" ||
                   producto?.grupo === "REPOSTERIA") &&
                   !producto?.category?.includes("MINIPOSTRES") &&
                   !producto?.grupo?.includes("MINIPOSTRES");
  
  const isMinipostre = producto?.category === "MINIPOSTRES" || 
                       producto?.grupo === "MINIPOSTRES";

  const currentVariant = useMemo(() => {
    return variants.find(v => v.label === selectedSize) || variants[0];
  }, [selectedSize, variants]);

  const basePrice = Number(currentVariant?.BasePrice || producto.precio || 0);

  const extras = useMemo(() => {
    return Object.entries(pickedMap).reduce((sum, [k, opt]) => {
      if (opt?.pricesPerSize && opt.pricesPerSize[selectedSize] != null) {
        return sum + Number(opt.pricesPerSize[selectedSize]);
      }
      return sum + Number(opt?.priceDelta || 0);
    }, 0);
  }, [pickedMap, selectedSize]);

  const total = basePrice + extras;

  const steps = useMemo(() => {
    const s = [];
    if (hasMultipleSizes) {
      s.push({ kind: "size" });
    }
    if (hasColors) {
      s.push({ kind: "color" });
    }
    modGroups.forEach((g) => s.push({
      kind: "mod",
      grupo: { ...g, tipo: g.tipo || g.type }
    }));
    s.push({ kind: "final" });
    return s;
  }, [hasMultipleSizes, hasColors, modGroups]);

  const { current, next, prev, stepIndex } = useSteps(steps);

  const handleSizeSelect = (label, variant) => {
    setSelectedSize(label);
    next();
  };

  const setPick = (type, opt) => {
    const label = opt?.nombre || opt?.name || opt?.label || String(opt?.id || "");
    const normalized = { ...opt, nombre: label };
    setPickedMap((prev) => ({ ...prev, [type]: normalized }));
    next();
  };

  const buildCartItem = () => {
    const selectedModifiers = {};
    Object.entries(pickedMap).forEach(([tipo, opcion]) => {
      selectedModifiers[tipo] = opcion;
    });

    const colorFoto = selectedColor
      ? (visibleColors?.find(c => c.id === selectedColor)?.image || producto.foto)
      : producto.foto;

    // Si hay color, inyectarlo en el nombre de la variante para que api.js lo recoja sin cambios
    const productoParaCarrito = selectedColor ? {
      ...producto,
      ProductsBySize: (producto.ProductsBySize || []).map(v =>
        v.label === selectedSize
          ? { ...v, ProductName: `${v.ProductName} - ${selectedColor}`, productName: `${v.productName} - ${selectedColor}` }
          : v
      ),
      sizes: (producto.sizes || []).map(v =>
        v.label === selectedSize
          ? { ...v, productName: `${v.productName} - ${selectedColor}` }
          : v
      ),
    } : producto;

    return {
      product: productoParaCarrito,
      selectedSize: selectedSize,
      quantity: quantity,
      selectedModifiers: selectedModifiers,
      productoId: currentVariant.ProductId || producto.id,
      nombre: producto.displayName || producto.nombre,
      foto: colorFoto,
      talla: selectedSize,
      base: basePrice,
      modificadores: Object.entries(pickedMap).map(([tipo, opcion]) => ({
        tipo,
        opcion,
      })),
      totalItem: total * quantity,
    };
  };

  const handleAdd = () => {
    const cartItem = buildCartItem();
    // En combo: onBuildItem recolecta el item SIN agregarlo al carrito (commit atómico al final).
    if (onBuildItem) {
      onBuildItem(cartItem);
    } else {
      addItem(cartItem);
    }

    if (preferOnCloseOnAdd && onClose) {
      onClose();
    } else if (onGoHome) {
      onGoHome();
    } else if (onClose) {
      onClose();
    }
  };

const handleAddAndSend = async () => {
    if (isSending || isProcessing) return;

    setIsSending(true);

    // 1. Construimos el item base (fuera del try para poder rescatarlo si falla el envio)
    const cartItem = buildCartItem();

    // 2. Logica de separacion de Minipostres (CRUCIAL)
    let itemsToSend = [cartItem];
    if (isMinipostre && quantity > 1) {
      itemsToSend = [];
      const precioUnitario = cartItem.totalItem / quantity;
      for (let i = 0; i < quantity; i++) {
        itemsToSend.push({
          ...cartItem,
          quantity: 1,
          cantidad: 1,
          totalItem: precioUnitario,
          _uniqueId: `${cartItem.productoId}_${Date.now()}_${i}_direct`,
          _isSeparated: true
        });
      }
    }

    try {
      // 3. Enviamos el array (carrito previo + estos items lo fusiona handlePay)
      if (onPay) {
        await onPay(itemsToSend);
      }
      onClose();
    } catch (error) {
      console.error("Error enviando pedido:", error);
      // RESILIENCIA: si el envio falla, NO perder el producto en curso.
      // Lo dejamos en el carrito para que el cliente reintente sin rearmarlo.
      try {
        if (onBuildItem) {
          onBuildItem(cartItem);
        } else {
          addItem(cartItem);
        }
      } catch (e2) {
        console.error("No se pudo preservar el item tras fallo de envio:", e2);
      }
      alert("No se pudo enviar. Tu producto quedó en el carrito; intenta enviar de nuevo.");
      onClose();
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectSuggestedCategory = (category) => {
    setShowSuggested(false);
    onClose();
    if (onNavigateToCategory) {
      setTimeout(() => onNavigateToCategory(category), 100);
    }
  };

  const handleAddSuggestedDirectly = (item) => {
    addItem(item);
    setShowSuggested(false);
    onClose();
  };

  const handleSkipSuggested = () => {
    setShowSuggested(false);
    onClose();
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      prev();
    } else {
      onClose();
    }
  };

  useEffect(() => {
    if (!autoAddOnFinal) {
      autoAddKeyRef.current = "";
      return;
    }

    if (current?.kind !== "final") {
      autoAddKeyRef.current = "";
      return;
    }

    const autoAddKey = `${producto?.id || producto?.nombre || "producto"}_${stepIndex}`;
    if (autoAddKeyRef.current === autoAddKey) return;

    autoAddKeyRef.current = autoAddKey;
    handleAdd();
  }, [autoAddOnFinal, current?.kind, stepIndex, producto?.id, producto?.nombre]);

  // Título del paso: vive en la pastilla del encabezado decorativo (no en la banda tocable)
  const stepTitle =
    current?.kind === "size" ? (producto?.sizeStepTitle || "Elige el tamaño")
    : current?.kind === "color" ? "Elige el color"
    : current?.kind === "mod" ? (current.grupo.titulo || current.grupo.title || "Elige una opción")
    : current?.kind === "final" ? (autoAddOnFinal ? "Agregando" : "Listo para agregar")
    : "";

  const palomita = (
    <span className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-k-primario text-k-sobreprimario border-4 border-k-superficie flex items-center justify-center pointer-events-none" aria-hidden="true">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5 10 17.5 19.5 7" /></svg>
    </span>
  );

  return (
    <div className="h-screen w-full k-app relative overflow-hidden flex flex-col">
      {/* Encabezado decorativo (y 0–600): nada tocable, el cliente de auto no alcanza */}
      <header className="relative h-[600px] shrink-0 flex flex-col items-center pt-[44px] px-8 text-center select-none">
        <div className="k-nieve" aria-hidden="true" />
        <span className="k-logo w-[220px] relative" role="img" aria-label="Lamarque Repostería & Café" />
        <div className="k-foto relative mt-6 w-[150px] h-[150px] rounded-[26px] border-[3px] border-k-borde overflow-hidden">
          <img
            src={producto.foto || "./images/placeholder.png"}
            alt={producto.displayName}
            className="w-full h-full object-contain"
            onError={(e) => {
              e.currentTarget.src = "./images/placeholder.png";
            }}
          />
        </div>
        <h1 className="k-script relative mt-3 px-4 pb-3 text-k-sobrefondo max-w-[860px] truncate" style={{ '--fs': '72px' }}>
          {tituloScript(producto.displayName)}
        </h1>
        <div className="relative mt-2 h-[60px] px-[30px] rounded-full border-2 border-k-borde text-k-sobrefondo font-extrabold text-[30px] flex items-center">
          Total: ${total}
        </div>
        {stepTitle && (
          <div
            className="absolute bottom-[22px] left-1/2 -translate-x-1/2 max-w-[1000px] whitespace-nowrap h-[72px] px-10 rounded-full flex items-center gap-[18px] font-semibold text-[40px]"
            style={{ background: 'var(--k-paso-bg)', color: 'var(--k-paso-color)', border: 'var(--k-paso-borde)' }}
          >
            <span className="k-destello text-k-sobrefondo2 text-[22px] shrink-0" aria-hidden="true" />
            <span className="truncate">{stepTitle}</span>
            <span className="k-destello text-k-sobrefondo2 text-[22px] shrink-0" aria-hidden="true" />
          </div>
        )}
      </header>

      {/* Banda de alcance (y 600–1500): todo lo tocable vive aquí, con scroll propio */}
      <main
        ref={contentRef}
        className="h-[900px] shrink-0 overflow-y-auto flex flex-col"
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          overflowY: 'auto'
        }}
      >
        <div className="w-full px-8 py-10 my-auto">
          {/* Paso de Tamaño */}
          {current?.kind === "size" && (
            <div className="grid gap-8"
                 style={{
                   gridTemplateColumns: `repeat(${Math.min(variants.length, 3)}, minmax(0, max-content))`,
                   justifyContent: 'center'
                 }}>
              {variants.map((variant) => {
                // Usar disabled del variant (viene de products.js basado en hidden_sizes.json)
                const isDisabled = variant.disabled === true;

                return (
                  <button
                    key={variant.label}
                    onClick={() => !isDisabled && handleSizeSelect(variant.label, variant)}
                    disabled={isDisabled}
                    className={`k-card w-[320px] h-[240px] flex flex-col items-center justify-center gap-3 transition-transform
                      ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                  >
                    <div className="font-bold text-[44px] text-k-tinta">
                      {variant.label}
                    </div>
                    <div className={`font-extrabold text-[34px] ${isDisabled ? 'text-k-tinta2' : 'text-k-acento'}`}>
                      ${variant.BasePrice}
                    </div>
                    {isDisabled && (
                      <div className="text-[28px] font-semibold text-k-tinta2">No disponible</div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Paso de Color */}
          {current?.kind === "color" && (
            <div className="flex gap-8 flex-wrap justify-center">
              {visibleColors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => { setSelectedColor(color.id); next(); }}
                  className={`k-card relative flex flex-col items-center gap-4 w-[260px] p-5 active:scale-95 transition-transform ${selectedColor === color.id ? 'k-sel' : ''}`}
                >
                  <img
                    src={color.image}
                    alt={color.label}
                    className="w-[200px] h-[200px] object-cover rounded-2xl"
                    onError={(e) => { e.currentTarget.src = "./images/placeholder.png"; }}
                  />
                  <span className="text-[30px] font-bold text-k-tinta">{color.label}</span>
                  {selectedColor === color.id && palomita}
                </button>
              ))}
            </div>
          )}

          {/* Pasos de Modificadores (el título va en la pastilla del encabezado) */}
          {current?.kind === "mod" && (
            <ModifierStep
              key={(current.grupo.tipo || current.grupo.type) + "_step"}
              grupo={current.grupo}
              product={producto}
              sizeLabel={selectedSize}
              showTitle={false}
              selected={pickedMap[current.grupo.tipo || current.grupo.type]}
              onPick={(opt) => setPick(current.grupo.tipo || current.grupo.type, opt)}
            />
          )}

          {/* Paso Final */}
          {current?.kind === "final" && (
            autoAddOnFinal ? (
              <div className="k-card max-w-2xl w-full mx-auto p-10 text-center">
                <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-k-primario mx-auto" />
                <p className="text-[30px] text-k-tinta font-semibold mt-6">Agregando al carrito...</p>
              </div>
            ) : (
            <div className="k-card w-[720px] max-w-full mx-auto px-9 py-8 flex flex-col gap-[18px]">
              <div className="text-center flex flex-col gap-1">
                <p className="text-[38px] font-bold text-k-tinta leading-tight">
                  {producto.displayName}
                </p>
                <p className="text-[28px] font-medium text-k-tinta2">
                  Tamaño: {selectedSize}
                </p>
                {selectedColor && (
                  <p className="text-[28px] font-semibold text-k-acento">
                    Color: {selectedColor}
                  </p>
                )}
              </div>

              {/* Resumen de modificadores */}
              {Object.keys(pickedMap).length > 0 && (
                <div className="bg-k-superficie2 border border-k-borde rounded-[18px] px-[26px] py-5 flex flex-col gap-1">
                  <p className="text-[28px] font-bold text-k-tinta mb-1">Modificadores:</p>
                  {Object.entries(pickedMap).map(([tipo, opt]) => (
                    <div key={tipo} className="flex justify-between gap-4 text-[28px] font-medium leading-snug text-k-tinta">
                      <span>{formatModifierLabelForView(opt.nombre)}</span>
                      {opt.priceDelta > 0 && (
                        <span className="text-k-acento font-bold shrink-0">+${opt.priceDelta}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Contador de cantidad para minipostres */}
              {isMinipostre && (
                <div className="flex items-center justify-center gap-8">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-[120px] h-[120px] rounded-full bg-k-superficie border-[3px] border-k-acento text-k-acento flex items-center justify-center active:scale-95 transition-transform"
                    aria-label="Menos"
                  >
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /></svg>
                  </button>
                  <span className="text-[56px] font-bold w-24 text-center text-k-tinta">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-[120px] h-[120px] rounded-full bg-k-superficie border-[3px] border-k-acento text-k-acento flex items-center justify-center active:scale-95 transition-transform"
                    aria-label="Más"
                  >
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                  </button>
                </div>
              )}

              {/* Botón Agregar y Seguir Comprando */}
              <button
                onClick={handleAdd}
                disabled={isSending || isProcessing}
                className="w-full h-[128px] rounded-[22px] bg-k-primario text-k-sobreprimario text-[36px] font-bold shadow-lg active:scale-95 transition-transform disabled:opacity-50"
              >
                Agregar y Seguir Comprando • ${total * quantity}
              </button>

              {/* Botón Agregar y Enviar */}
              {showSendButton && (
                <button
                  onClick={handleAddAndSend}
                  disabled={isSending || isProcessing}
                  className="w-full h-[128px] rounded-[22px] bg-k-superficie border-[3px] border-k-acento text-k-acento text-[36px] font-bold active:scale-95 transition-transform disabled:opacity-50"
                >
                  {isSending || isProcessing ? "Enviando..." : "Enviar Pedido"}
                </button>
              )}
            </div>
            )
          )}
        </div>
      </main>

      {/* Zona muerta 1500–pie: solo fondo */}
      <div className="flex-1 min-h-0" aria-hidden="true" />

      <AtrasFlotante onClick={handleBack} />

      {/* Pie: Atrás (contorno) ≠ Inicio (relleno), progreso abajo */}
      <footer className="k-barra shrink-0 flex flex-col items-center gap-[10px] pt-[22px] pb-[40px]">
        <div className="flex gap-8">
          <button
            onClick={handleBack}
            className="w-[120px] h-[120px] rounded-full k-btn-atras shadow-lg active:scale-95 flex items-center justify-center"
            aria-label="Regresar"
            title="Regresar"
          >
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
          </button>
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="w-[120px] h-[120px] rounded-full k-btn-inicio shadow-lg active:scale-95 flex items-center justify-center"
              aria-label="Inicio"
              title="Ir al inicio"
            >
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3.5 11 12 4l8.5 7M5.5 9.5V20h13V9.5M10 20v-5.5h4V20" />
              </svg>
            </button>
          )}
        </div>
        <span className="text-[28px] font-semibold" style={{ color: 'var(--k-paso-texto)' }}>
          Paso {Math.min(stepIndex + 1, steps.length)} de {steps.length}
        </span>
      </footer>

      {/* Overlay de venta sugerida */}
      {showSuggested && (
        <SuggestedItemsOverlay
          onSelectCategory={handleSelectSuggestedCategory}
          onAddDirectly={handleAddSuggestedDirectly}
          onSkip={handleSkipSuggested}
        />
      )}
    </div>
  );
}
