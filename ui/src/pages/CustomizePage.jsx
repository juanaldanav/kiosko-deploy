// src/pages/CustomizePage.jsx - VERSIÓN CON BOTÓN ENVIAR AHORA
import React, { useMemo, useState, useRef, useEffect } from "react";
import { useCart } from "../context/CartContext";
import useSteps from "../lib/useSteps.js";
import ModifierStep from "../components/ModifierStep";
import SuggestedItemsOverlay from "../components/SuggestedItemsOverlay";

function formatModifierLabelForView(text = "") {
  const value = String(text || "").trim();
  if (/^AGUA MINERAL\s+\d+\s*OZ$/i.test(value)) {
    return "AGUA MINERAL";
  }
  return value;
}

export default function CustomizePage({ producto, onClose, onGoHome, onNavigateToCategory, onPay, preferOnCloseOnAdd = false, showSendButton = true, autoAddOnFinal = false }) {
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
    addItem(cartItem);

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
    try {
      // 1. Construimos el item base
      const cartItem = buildCartItem();
      
      // 2. Lógica de separación de Minipostres (CRUCIAL)
      // Si es minipostre y son varios, creamos un array con items individuales
      let itemsToSend = [cartItem];

      if (isMinipostre && quantity > 1) {
        itemsToSend = []; // Vaciamos para llenar con los individuales
        
        // El precio total que calculó buildCartItem incluye la multiplicación por cantidad.
        // Lo dividimos para obtener el precio unitario real.
        const precioUnitario = cartItem.totalItem / quantity; 
        
        for (let i = 0; i < quantity; i++) {
          itemsToSend.push({
            ...cartItem,
            quantity: 1, // Forzamos cantidad 1
            cantidad: 1,
            totalItem: precioUnitario, // Precio de uno solo
            _uniqueId: `${cartItem.productoId}_${Date.now()}_${i}_direct`,
            _isSeparated: true
          });
        }
      }

      // 3. Enviamos el array (ya sea el item único o los desglosados)
      if (onPay) {
        await onPay(itemsToSend);
      }

      onClose();
      
    } catch (error) {
      console.error("Error enviando pedido:", error);
      alert("No se pudo enviar la orden");
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

  return (
    <div className="h-screen w-full bg-[#E8FBFF] relative overflow-hidden flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 bg-white/90 backdrop-blur border-b-2 border-gray-200">
        <div className="flex items-center gap-5">
          <img
            src={producto.foto || "./images/placeholder.png"}
            alt={producto.displayName}
            className="w-28 h-28 rounded-xl object-cover shadow-md"
            onError={(e) => {
              e.currentTarget.src = "./images/placeholder.png";
            }}
          />
          <div>
            <div className="text-sm text-slate-500 font-medium">Lamarque</div>
            <h1 className="text-3xl font-bold text-slate-800">{producto.displayName}</h1>
          </div>
        </div>
        <div className="px-8 py-4 rounded-full bg-gradient-to-r from-[#00B7C6] to-[#00A5B3] text-white font-bold text-2xl shadow-lg">
          Total: ${total}
        </div>
      </header>

      {/* Main Content - Con altura calculada para dejar espacio al footer MÁS ALTO */}
      <main 
        ref={contentRef}
        className="flex-1 overflow-y-auto flex items-center justify-center"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          overflowY: 'auto',
          paddingBottom: '30px' // Más espacio para el footer más alto
        }}
      >
        <div className="w-full px-8">
          {/* Paso de Tamaño */}
          {current?.kind === "size" && (
            <div className="w-full flex flex-col items-center justify-center">
              <h2 className="text-4xl font-semibold text-slate-700 mb-12 text-center">
                <span className="bg-[#BFF0F7] px-10 py-5 rounded-full">Elige el tamaño</span>
              </h2>
              
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
                      className={`w-[320px] h-[220px] rounded-3xl bg-white shadow-xl border-3 flex flex-col items-center justify-center gap-4 transition-all
                        ${isDisabled 
                          ? 'opacity-50 cursor-not-allowed border-gray-300 bg-gray-100' 
                          : 'border-gray-200 hover:shadow-2xl hover:border-[#00B7C6] hover:scale-105 active:scale-95'}`}
                    >
                      <div className={`font-bold text-4xl ${isDisabled ? 'text-gray-400' : 'text-slate-700'}`}>
                        {variant.label}
                      </div>
                      <div className={`font-bold text-3xl ${isDisabled ? 'text-gray-400' : 'text-[#00B7C6]'}`}>
                        ${variant.BasePrice}
                      </div>
                      {isDisabled && (
                        <div className="text-base text-red-500 font-medium">No disponible</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Paso de Color */}
          {current?.kind === "color" && (
            <div className="w-full flex flex-col items-center justify-center">
              <h2 className="text-4xl font-semibold text-slate-700 mb-12 text-center">
                <span className="bg-[#BFF0F7] px-10 py-5 rounded-full">Elige el color</span>
              </h2>
              <div className="flex gap-8 flex-wrap justify-center">
                {visibleColors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => { setSelectedColor(color.id); next(); }}
                    className="flex flex-col items-center gap-4 w-[260px] bg-white rounded-3xl shadow-xl border-3 border-gray-200 p-5 hover:shadow-2xl hover:border-[#00B7C6] hover:scale-105 active:scale-95 transition-all"
                  >
                    <img
                      src={color.image}
                      alt={color.label}
                      className="w-[200px] h-[200px] object-cover rounded-2xl"
                      onError={(e) => { e.currentTarget.src = "./images/placeholder.png"; }}
                    />
                    <span className="text-3xl font-bold text-slate-700">{color.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pasos de Modificadores - Se renderiza sin el footer ya que está separado */}
          {current?.kind === "mod" && (
            <div className="w-full">
              <ModifierStep
                key={(current.grupo.tipo || current.grupo.type) + "_step"}
                grupo={current.grupo} 
                product={producto} 
                sizeLabel={selectedSize}
                onPick={(opt) => setPick(current.grupo.tipo || current.grupo.type, opt)} 
              />
            </div>
          )}

          {/* Paso Final */}
          {current?.kind === "final" && (
            autoAddOnFinal ? (
              <div className="w-full flex flex-col items-center justify-center py-8">
                <div className="bg-white rounded-3xl shadow-xl p-10 max-w-2xl w-full text-center">
                  <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-[#00B7C6] mx-auto" />
                  <p className="text-2xl text-slate-700 font-semibold mt-6">Agregando al carrito...</p>
                </div>
              </div>
            ) : (
            <div className="w-full flex flex-col items-center justify-center py-8">
              <h2 className="text-4xl font-semibold text-slate-700 mb-10">
                <span className="bg-[#BFF0F7] px-10 py-5 rounded-full">Listo para agregar</span>
              </h2>
              
              <div className="bg-white rounded-3xl shadow-xl p-8 max-w-2xl w-full">
                <div className="text-center mb-8">
                  <p className="text-2xl text-slate-700 font-medium">
                    {producto.displayName}
                  </p>
                  <p className="text-xl text-slate-500 mt-2">
                    Tamaño: {selectedSize}
                  </p>
                  {selectedColor && (
                    <p className="text-xl font-semibold mt-2" style={{ color: '#00B7C6' }}>
                      Color: {selectedColor}
                    </p>
                  )}
                </div>
                
                {/* Resumen de modificadores */}
                {Object.keys(pickedMap).length > 0 && (
                  <div className="mb-8 p-4 bg-gray-50 rounded-xl">
                    <p className="text-lg font-semibold text-slate-700 mb-3">Modificadores:</p>
                    <div className="space-y-2">
                      {Object.entries(pickedMap).map(([tipo, opt]) => (
                        <div key={tipo} className="flex justify-between text-base">
                          <span className="text-slate-600">{formatModifierLabelForView(opt.nombre)}</span>
                          {opt.priceDelta > 0 && (
                            <span className="text-slate-500">+${opt.priceDelta}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Contador de cantidad para minipostres */}
                {isMinipostre && (
                  <div className="flex items-center justify-center gap-8 mb-8">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-20 h-20 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-4xl font-bold transition-colors"
                    >
                      -
                    </button>
                    <span className="text-4xl font-bold w-24 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-20 h-20 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-4xl font-bold transition-colors"
                    >
                      +
                    </button>
                  </div>
                )}
                
                {/* Botón Agregar y Seguir Comprando */}
                <button
                  onClick={handleAdd}
                  disabled={isSending || isProcessing}
                  className="w-full py-6 mt-4 rounded-2xl bg-gradient-to-r from-[#00B7C6] to-[#00A5B3] text-white text-3xl font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                >
                  Agregar y Seguir Comprando • ${total * quantity}
                </button>

                {/* Botón Agregar y Enviar */}
                {showSendButton && (
                  <button
                    onClick={handleAddAndSend}
                    disabled={isSending || isProcessing}
                    className="w-full py-6 mt-4 rounded-2xl bg-white border-4 border-[#00B7C6] text-[#00B7C6] text-3xl font-bold shadow-lg hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSending || isProcessing ? "Enviando..." : "Enviar Pedido"}
                  </button>
                )}
              </div>
            </div>
            )
          )}
        </div>
      </main>

      {/* Footer ESTÁTICO SIEMPRE VISIBLE - BOTONES ARRIBA, PROGRESO ABAJO */}
      <footer className="h-[160px] bg-white/95 backdrop-blur-sm border-t-2 border-gray-200 px-8 flex-shrink-0">
        {/* Botones de navegación ARRIBA */}
        <div className="flex items-center justify-center gap-6 pt-4 pb-3">
          <button
            onClick={handleBack}
            className="w-24 h-24 rounded-full bg-[#67CDD9] text-white shadow-xl hover:brightness-110 active:scale-95 flex items-center justify-center"
            aria-label="Regresar"
            title="Regresar"
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="w-24 h-24 rounded-full bg-[#00B7C6] text-white shadow-xl hover:brightness-110 active:scale-95 flex items-center justify-center"
              aria-label="Inicio"
              title="Ir al inicio"
            >
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9.5L12 3l9 6.5"></path>
                <path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10"></path>
                <path d="M9 21v-6h6v6"></path>
              </svg>
            </button>
          )}
        </div>
        
        {/* Barra de progreso ABAJO */}
        <div className="pt-2 pb-4">
          <div className="flex items-center justify-center mb-2">
            <span className="text-lg text-slate-600 font-medium">
              Paso {Math.min(stepIndex + 1, steps.length)} de {steps.length}
            </span>
          </div>
          <div className="w-full max-w-2xl mx-auto h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#00B7C6] to-[#00A5B3] transition-all duration-300"
              style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
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