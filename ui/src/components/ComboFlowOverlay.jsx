// src/components/ComboFlowOverlay.jsx - ARMA TU COMBO (alimento + bebida)
import React, { useState, useEffect, useRef } from "react";
import CustomizePage from "../pages/CustomizePage";
import { getProductById, getHiddenProducts } from "../data/products";
import { useCart } from "../context/CartContext";

// Único flujo: el cliente arma su combo eligiendo 1 alimento salado + 1 bebida.
// Las opciones bloqueadas en AdminVisibilidad se filtran solas (getHiddenProducts).
const COMBO_FLOWS = {
  combo_arma_tu_combo: {
    name: "ARMA TU COMBO",
    steps: [
      {
        type: "food",
        name: "Elige tu alimento salado",
        options: [
          { productId: "1899", name: "BAGUETTE JAMÓN, PANELA Y ESPINACA", image: "./images/espanela.jpg" },
          { productId: "1900", name: "BAGUETTE JAMÓN CON QUESO", image: "./images/quesomon.jpg" },
          { productId: "1901", name: "CROISSANT JAMÓN Y QUESO" },
          { productId: "2342", name: "BAGUETTE ITALIANO", image: "./images/bitaliano.jpg" }
        ]
      },
      {
        type: "drink",
        name: "Elige tu bebida",
        forceSize: "Grande",
        options: [
          { productId: "1931", name: "REFRESHER MANGO LIMÓN" },
          { productId: "1930", name: "REFRESHER FRESA LIMÓN" },
          { productId: "1913", name: "ICED COFFEE" },
          { productId: "1917", name: "AMERICANO A LAS ROCAS" },
          { productId: "1965", name: "LATTE" },
          { productId: "1963", name: "ESPRESSO AMERICANO" }
        ]
      }
    ]
  }
};

// Selector de opciones: tarjetas del MISMO tamaño, 2 por fila, centradas en vertical.
function OptionSelector({ options, onSelect, title, onBack, onHome }) {
  return (
    <div className="h-full flex flex-col bg-[#E8FBFF] pt-6 pb-32">
      <h2 className="text-4xl font-bold text-center mb-8 text-slate-700 flex-shrink-0 px-6">
        {title}
      </h2>
      <div
        className="flex-1 overflow-y-auto px-6"
        style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
      >
        {/* min-h-full + center => centrado vertical cuando caben, scroll cuando no */}
        <div className="min-h-full flex items-center justify-center py-4">
          <div className="flex flex-wrap justify-center gap-6 max-w-[680px]">
            {options.map((option) => (
              <button
                key={option.productId}
                onClick={() => onSelect(option)}
                className="w-[300px] bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all p-4 border-2 border-transparent hover:border-[#00B7C6] group active:scale-95 flex flex-col"
              >
                <img
                  src={option.image || "./images/placeholder.png"}
                  alt={option.name}
                  className="w-full h-[200px] object-cover rounded-2xl group-hover:brightness-110 transition-all"
                  onError={(e) => { e.currentTarget.src = "./images/placeholder.png"; }}
                />
                <h3 className="text-2xl font-bold text-slate-700 text-center mt-4 h-[68px] flex items-center justify-center leading-tight">
                  {option.name}
                </h3>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navegación */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 flex gap-4">
        <button
          onClick={onBack}
          className="w-20 h-20 rounded-full bg-[#67CDD9] text-white shadow-lg hover:brightness-110 active:scale-95 flex items-center justify-center"
          aria-label="Regresar"
          title="Regresar"
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <button
          onClick={onHome}
          className="w-20 h-20 rounded-full bg-[#00B7C6] text-white shadow-lg hover:brightness-110 active:scale-95 flex items-center justify-center"
          aria-label="Inicio"
          title="Ir al inicio"
        >
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5L12 3l9 6.5"></path>
            <path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10"></path>
            <path d="M9 21v-6h6v6"></path>
          </svg>
        </button>
      </div>
    </div>
  );
}

// Bebida con tamaño forzado (Grande): recorta ProductsBySize a esa talla -> sin paso de tamaño.
function ForcedSizeCustomizePage({ producto, onClose, onGoHome, forcedSize, onBuildItem }) {
  const adjustedProduct = {
    ...producto,
    DefaultSizeLabel: forcedSize,
    ProductsBySize: producto.ProductsBySize?.filter((v) => v.label === forcedSize) || []
  };
  if (adjustedProduct.ProductsBySize.length === 1) {
    adjustedProduct.modifiers = (adjustedProduct.modifiers || []).filter(
      (m) => (m.tipo || m.type) !== "size"
    );
  }
  return (
    <CustomizePage
      producto={adjustedProduct}
      onClose={onClose}
      onGoHome={onGoHome}
      preferOnCloseOnAdd={true}
      showSendButton={false}
      autoAddOnFinal={true}
      onBuildItem={onBuildItem}
    />
  );
}

export default function ComboFlowOverlay({ flowKey, onClose, onComplete }) {
  const { addItem } = useCart();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [visibleOptions, setVisibleOptions] = useState([]);

  // Items construidos del combo: NO se agregan al carrito hasta completar TODO (commit atómico).
  const builtItemsRef = useRef([]);
  // true justo después de que CustomizePage construyó un item (para distinguir avanzar vs regresar).
  const justBuiltRef = useRef(false);

  const comboDefinition = COMBO_FLOWS[flowKey];
  if (!comboDefinition) {
    console.error(`Combo no definido: ${flowKey}`);
    onClose();
    return null;
  }

  const currentStep = comboDefinition.steps[currentStepIndex];
  const isLastStep = currentStepIndex === comboDefinition.steps.length - 1;

  const getVisibleStepOptions = (step) => {
    if (!step?.options) return [];
    const hidden = new Set((getHiddenProducts() || []).map((id) => Number(id)));
    return step.options.filter((option) => !hidden.has(Number(option.productId)));
  };

  // Completa la foto de cada opción desde el catálogo (devuelve el array, no hace setState).
  const enrichOptions = async (options) =>
    Promise.all(
      options.map(async (o) => {
        if (o.image) return o;
        try {
          const p = await getProductById(o.productId);
          return p?.foto ? { ...o, image: p.foto } : o;
        } catch {
          return o;
        }
      })
    );

  // Al cambiar de paso: resuelve fotos CON spinner (evita el flash de placeholders) y muestra opciones.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!currentStep?.options) return;
      const options = getVisibleStepOptions(currentStep);
      if (options.length === 0) {
        alert("Este combo no esta disponible por el momento.");
        onClose();
        return;
      }
      setIsLoading(true);
      setShowOptions(false);
      setCurrentProduct(null);
      const enriched = await enrichOptions(options);
      if (cancelled) return;
      setVisibleOptions(enriched);
      setShowOptions(true);
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [currentStepIndex]);

  const loadProduct = async (productId, forceSize = null) => {
    setIsLoading(true);
    setShowOptions(false);
    try {
      const product = await getProductById(productId);
      if (!product) {
        alert(`El producto ${currentStep.name} (ID: ${productId}) no está en el catálogo.`);
        goBack();
        return;
      }
      setCurrentProduct(
        forceSize
          ? { ...product, DefaultSizeLabel: forceSize, forcedSize: forceSize }
          : product
      );
    } catch (error) {
      alert(`Error cargando ${currentStep.name}: ${error.message}`);
      goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelected = (option) => {
    const productId = option.productId;
    const hidden = new Set((getHiddenProducts() || []).map((id) => Number(id)));
    if (hidden.has(Number(productId))) {
      alert("Ese producto ya no esta disponible. Por favor elige otra opcion.");
      return;
    }
    const forceSize = currentStep?.forceSize || option.forceSize || null;
    loadProduct(productId, forceSize);
  };

  // CustomizePage construyó el item (aún NO va al carrito).
  const handleItemBuilt = (item) => {
    builtItemsRef.current.push(item);
    justBuiltRef.current = true;
  };

  // onClose de CustomizePage: si acaba de construir -> avanza/commit; si no (back en paso 0) -> regresar.
  const handleStepClose = () => {
    if (justBuiltRef.current) {
      justBuiltRef.current = false;
      if (isLastStep) {
        // Commit atómico: ahora sí se agregan todos los items del combo al carrito.
        builtItemsRef.current.forEach((it) => addItem(it));
        builtItemsRef.current = [];
        (onComplete || onClose)();
      } else {
        setCurrentStepIndex((i) => i + 1);
      }
    } else {
      goBack();
    }
  };

  const goBack = () => {
    // Personalizando un producto de un paso con opciones -> volver a sus opciones (sin agregar nada).
    if (!showOptions && currentProduct && currentStep?.options) {
      setCurrentProduct(null);
      setShowOptions(true);
      return;
    }
    // Mostrando opciones -> retroceder de paso, descartando el item del paso anterior.
    if (currentStepIndex > 0) {
      builtItemsRef.current.pop();
      setCurrentProduct(null);
      setCurrentStepIndex((i) => i - 1);
    } else {
      builtItemsRef.current = [];
      onClose();
    }
  };

  const handleHome = () => {
    builtItemsRef.current = [];
    onClose();
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00B7C6] mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando {currentStep?.name || "producto"}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Header con progreso */}
      <div className="absolute top-0 left-0 right-0 z-[60] bg-[#00B7C6] text-white shadow-lg pointer-events-none">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex-1">
            <h2 className="text-base font-bold">{comboDefinition.name}</h2>
            <p className="text-xs opacity-90">
              {currentStepIndex + 1}/{comboDefinition.steps.length}
            </p>
          </div>
        </div>
        <div className="h-1 bg-white/30">
          <div
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / comboDefinition.steps.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="pt-14 h-full">
        {showOptions ? (
          <OptionSelector
            options={visibleOptions}
            onSelect={handleOptionSelected}
            title={currentStep.name}
            onBack={goBack}
            onHome={handleHome}
          />
        ) : currentProduct ? (
          currentProduct.forcedSize ? (
            <ForcedSizeCustomizePage
              producto={currentProduct}
              onClose={handleStepClose}
              onGoHome={handleHome}
              forcedSize={currentProduct.forcedSize}
              onBuildItem={handleItemBuilt}
            />
          ) : (
            <CustomizePage
              producto={currentProduct}
              onClose={handleStepClose}
              onGoHome={handleHome}
              preferOnCloseOnAdd={true}
              showSendButton={false}
              autoAddOnFinal={true}
              onBuildItem={handleItemBuilt}
            />
          )
        ) : null}
      </div>
    </div>
  );
}
