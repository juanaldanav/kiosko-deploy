// src/components/ComboFlowOverlay.jsx - VERSIÓN CORREGIDA
import React, { useState, useEffect } from "react";
import CustomizePage from "../pages/CustomizePage";
import { getProductById, getHiddenProducts } from "../data/products";

// Configuración de combos con TAMAÑOS ESPECÍFICOS
const COMBO_FLOWS = {
  // === ARMA TU COMBO: elige 1 alimento salado + 1 bebida ===
  // Las opciones bloqueadas en AdminVisibilidad se filtran solas (getHiddenProducts).
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
          { productId: "1965", name: "LATTE" },
          { productId: "1931", name: "REFRESHER MANGO LIMÓN" },
          { productId: "1930", name: "REFRESHER FRESA LIMÓN" },
          { productId: "1963", name: "ESPRESSO AMERICANO" },
          { productId: "1917", name: "AMERICANO A LAS ROCAS" },
          { productId: "1913", name: "ICED COFFEE" }
        ]
      }
    ]
  },
  combo_americano_baguette: {
    name: "COMBO AMERICANO + BAGUETTE",
    steps: [
      { 
        type: "food", 
        name: "Elige tu Baguette",
        options: [
          { productId: "1899", name: "BAGUETTE JAMÓN, PANELA Y ESPINACA", image: "./images/espanela.jpg" },
          { productId: "1900", name: "BAGUETTE JAMÓN CON QUESO", image: "./images/quesomon.jpg" }
        ]
      },
      { 
        type: "drink", 
        productId: "1963",
        name: "ESPRESSO AMERICANO",
        forceSize: "Grande" // FORZAR TAMAÑO GRANDE
      }
    ]
  },
  combo_americano_croissant: {
    name: "COMBO AMERICANO + CROISSANT",
    steps: [
      { 
        type: "food", 
        productId: "1901",
        name: "CROISSANT JAMÓN Y QUESO" 
      },
      { 
        type: "drink", 
        productId: "1963",
        name: "ESPRESSO AMERICANO",
        forceSize: "Grande"
      }
    ]
  },
  combo_iced_americano_baguette: {
    name: "COMBO ICED AMERICANO + BAGUETTE",
    steps: [
      { 
        type: "food", 
        name: "Elige tu Baguette",
        options: [
          { productId: "1899", name: "BAGUETTE JAMÓN, PANELA Y ESPINACA", image: "./images/espanela.jpg" },
          { productId: "1900", name: "BAGUETTE JAMÓN CON QUESO", image: "./images/quesomon.jpg" }
        ]
      },
      { 
        type: "drink", 
        productId: "1917",
        name: "AMERICANO A LAS ROCAS",
        forceSize: "Grande"
      }
    ]
  },
  combo_iced_americano_croissant: {
    name: "COMBO ICED AMERICANO + CROISSANT",
    steps: [
      { 
        type: "food", 
        productId: "1901",
        name: "CROISSANT JAMÓN Y QUESO" 
      },
      { 
        type: "drink", 
        productId: "1917",
        name: "AMERICANO A LAS ROCAS",
        forceSize: "Grande"
      }
    ]
  },
  combo_iced_chocolate_doradito: {
    name: "COMBO ICED CHOCOLATE + SANDWICH DORADITO",
    steps: [
      { 
        type: "food", 
        productId: "2180", // Verifica que este ID existe en tu catálogo
        name: "SANDWICH DORADITO" 
      },
      { 
        type: "drink", 
        productId: "2000",
        name: "ICED CHOCOLATE",
        forceSize: "Grande"
      }
    ]
  },
  combo_iced_coffee_baguette: {
    name: "COMBO ICED COFFEE + BAGUETTE",
    steps: [
      { 
        type: "food", 
        name: "Elige tu Baguette",
        options: [
          { productId: "1899", name: "BAGUETTE JAMÓN, PANELA Y ESPINACA", image: "./images/espanela.jpg" },
          { productId: "1900", name: "BAGUETTE JAMÓN CON QUESO", image: "./images/quesomon.jpg" }
        ]
      },
      { 
        type: "drink", 
        productId: "1913",
        name: "ICED COFFEE",
        forceSize: "Grande"
      }
    ]
  },
  combo_iced_coffee_croissant: {
    name: "COMBO ICED COFFEE + CROISSANT",
    steps: [
      { 
        type: "food", 
        productId: "1901",
        name: "CROISSANT JAMÓN Y QUESO" 
      },
      { 
        type: "drink", 
        productId: "1913",
        name: "ICED COFFEE",
        forceSize: "Grande"
      }
    ]
  },
  combo_latte_baguette: {
    name: "COMBO LATTE + BAGUETTE",
    steps: [
      { 
        type: "food", 
        name: "Elige tu Baguette",
        options: [
          { productId: "1899", name: "BAGUETTE JAMÓN, PANELA Y ESPINACA", image: "./images/espanela.jpg" },
          { productId: "1900", name: "BAGUETTE JAMÓN CON QUESO", image: "./images/quesomon.jpg" }
        ]
      },
      { 
        type: "drink", 
        productId: "1965",
        name: "LATTE",
        forceSize: "Grande"
      }
    ]
  },
   // === NUEVOS: BAGUETTE ITALIANO + {BEBIDA} ===
  combo_italiano_americano_rocks: {
    name: "COMBO BAGUETTE ITALIANO + ICED AMERICANO",
    steps: [
      { 
        type: "food",
        productId: "2342",
        name: "BAGUETTE ITALIANO"
      },
      { 
        type: "drink",
        productId: "1917", // AMERICANO A LAS ROCAS
        name: "AMERICANO A LAS ROCAS",
        forceSize: "Grande"
      }
    ]
  },

  combo_italiano_latte: {
    name: "COMBO BAGUETTE ITALIANO + LATTE",
    steps: [
      { 
        type: "food",
        productId: "2342",
        name: "BAGUETTE ITALIANO"
      },
      { 
        type: "drink",
        productId: "1965", // LATTE
        name: "LATTE",
        forceSize: "Grande"
      }
    ]
  },

  combo_italiano_iced_coffee: {
    name: "COMBO BAGUETTE ITALIANO + ICED COFFEE",
    steps: [
      { 
        type: "food",
        productId: "2342",
        name: "BAGUETTE ITALIANO"
      },
      { 
        type: "drink",
        productId: "1913", // ICED COFFEE
        name: "ICED COFFEE",
        forceSize: "Grande"
      }
    ]
  },
  combo_latte_croissant: {
    name: "COMBO LATTE + CROISSANT",
    steps: [
      { 
        type: "food", 
        productId: "1901",
        name: "CROISSANT JAMÓN Y QUESO" 
      },
      { 
        type: "drink", 
        productId: "1965",
        name: "LATTE",
        forceSize: "Grande"
      },
    ]
  }
};

// Componente para seleccionar entre opciones de baguette
function OptionSelector({ options, onSelect, title, onBack, onHome }) {
  return (
    <div className="h-full flex flex-col bg-[#E8FBFF] pt-6 pb-32">
      <h2 className="text-4xl font-bold text-center mb-8 text-slate-700 flex-shrink-0 px-6">
        {title}
      </h2>
      {/* Grid de tarjetas del MISMO tamaño, 2 por fila, scroll vertical */}
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

      {/* Botones de navegación para el selector */}
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

// Componente personalizado para bebidas con tamaño forzado
function ForcedSizeCustomizePage({ producto, onClose, onGoHome, forcedSize, autoAddOnFinal = false }) {
  // Clonar el producto y ajustar para el tamaño forzado
  const adjustedProduct = {
    ...producto,
    DefaultSizeLabel: forcedSize,
    // Filtrar solo la variante del tamaño correcto
    ProductsBySize: producto.ProductsBySize?.filter(v => v.label === forcedSize) || []
  };
  
  // Si solo hay un tamaño, no mostrar selector de tamaño
  if (adjustedProduct.ProductsBySize.length === 1) {
    // Quitar el step de tamaño de los modificadores si existe
    const modifiersWithoutSize = adjustedProduct.modifiers?.filter(m => 
      (m.tipo || m.type) !== "size"
    ) || [];
    
    adjustedProduct.modifiers = modifiersWithoutSize;
  }
  
  return (
    <CustomizePage
      producto={adjustedProduct}
      onClose={onClose}
      onGoHome={onGoHome}
      preferOnCloseOnAdd={true}
      showSendButton={false}
      autoAddOnFinal={autoAddOnFinal}
    />
  );
}

export default function ComboFlowOverlay({ flowKey, onClose, onComplete }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [visibleOptions, setVisibleOptions] = useState([]);
  const [comboItems, setComboItems] = useState([]);
  
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
  
  // Completa la foto de cada opción desde el catálogo (para tarjetas sin imagen fija)
  const enrichOptionImages = async (options) => {
    if (!options.some((o) => !o.image)) return;
    try {
      const updated = await Promise.all(
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
      setVisibleOptions(updated);
    } catch {
      /* deja las opciones sin foto; el selector usa placeholder */
    }
  };

  // Verificar si el paso actual tiene opciones múltiples
  useEffect(() => {
    if (currentStep?.options) {
      const options = getVisibleStepOptions(currentStep);
      setVisibleOptions(options);

      if (options.length === 0) {
        alert("Este combo no esta disponible por el momento.");
        onClose();
        return;
      }

      setShowOptions(true);
      setCurrentProduct(null);
      enrichOptionImages(options);
    } else if (currentStep?.productId) {
      setShowOptions(false);
      setVisibleOptions([]);
      loadProduct(currentStep.productId, currentStep.forceSize);
    }
  }, [currentStepIndex]);
  
  const loadProduct = async (productId, forceSize = null) => {
    setIsLoading(true);
    try {
      const product = await getProductById(productId);
      
      if (product) {
        console.log(`Producto cargado:`, product);
        console.log(`Tamaño forzado:`, forceSize);
        
        // Si hay un tamaño forzado, ajustar el producto
        if (forceSize) {
          const adjustedProduct = {
            ...product,
            DefaultSizeLabel: forceSize,
            forcedSize: forceSize,
            // Verificar que el tamaño existe
            hasRequestedSize: product.ProductsBySize?.some(v => v.label === forceSize)
          };
          setCurrentProduct(adjustedProduct);
        } else {
          setCurrentProduct(product);
        }
      } else {
        console.error(`⚠️ Producto ${productId} no encontrado en el catálogo`);
        alert(`Error: El producto ${currentStep.name} (ID: ${productId}) no se encuentra en el catálogo. Por favor verifica el ID.`);
        
        // Producto fallback para evitar que se rompa
        setCurrentProduct({
          id: String(productId),
          nombre: currentStep.name || "Producto no encontrado",
          displayName: currentStep.name || "Producto no encontrado",
          foto: "./images/placeholder.png",
          precio: 0,
          modifiers: [],
          Modifiers: [],
          ProductsBySize: [{
            label: forceSize || "Grande",
            ProductId: productId,
            ProductName: currentStep.name || "Producto",
            BasePrice: 0
          }],
          DefaultSizeLabel: forceSize || "Grande",
          forcedSize: forceSize
        });
      }
    } catch (error) {
      console.error("Error cargando producto:", error);
      alert(`Error cargando ${currentStep.name}: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOptionSelected = (option) => {
    const productId = typeof option === "object" ? option.productId : option;
    const hidden = new Set((getHiddenProducts() || []).map((id) => Number(id)));
    if (hidden.has(Number(productId))) {
      alert("Ese producto ya no esta disponible. Por favor elige otra opcion.");
      return;
    }

    setShowOptions(false);
    // Bebidas: talla forzada (del step o de la opción). Alimentos: sin forzar.
    const forceSize = currentStep?.forceSize || (typeof option === "object" ? option.forceSize : null) || null;
    loadProduct(productId, forceSize);
  };
  
  const handleProductAdded = () => {
    const itemInfo = currentStep.name || currentProduct?.displayName || "Producto";
    setComboItems([...comboItems, itemInfo]);
    console.log(`✅ Producto agregado al combo: ${itemInfo}`);
    
    if (isLastStep) {
      console.log("🎉 Combo completado con:", comboItems);
      if (onComplete) {
        onComplete();
      } else {
        onClose();
      }
    } else {
      // Siguiente paso
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };
  
  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setComboItems(comboItems.slice(0, -1));
    } else {
      onClose();
    }
  };
  
  const handleHome = () => {
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
      {/* Header del combo - Versión compacta */}
      <div className="absolute top-0 left-0 right-0 z-[60] bg-[#00B7C6] text-white shadow-lg pointer-events-none">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex-1">
            <h2 className="text-base font-bold">{comboDefinition.name}</h2>
            <p className="text-xs opacity-90">
              {currentStepIndex + 1}/{comboDefinition.steps.length}
            </p>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-1 bg-white/30">
          <div 
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / comboDefinition.steps.length) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Contenido */}
      <div className="pt-14 h-full">
        {showOptions ? (
          <OptionSelector
            options={visibleOptions}
            onSelect={handleOptionSelected}
            title={currentStep.name}
            onBack={handleBack}
            onHome={handleHome}
          />
        ) : currentProduct ? (
          currentProduct.forcedSize ? (
            <ForcedSizeCustomizePage
              producto={currentProduct}
              onClose={handleProductAdded}
              onGoHome={handleHome}
              forcedSize={currentProduct.forcedSize}
              autoAddOnFinal={true}
            />
          ) : (
            <CustomizePage
              producto={currentProduct}
              onClose={handleProductAdded}
              onGoHome={handleHome}
              preferOnCloseOnAdd={true}
              showSendButton={false}
              autoAddOnFinal={true}
            />
          )
        ) : null}
      </div>
    </div>
  );
}