// src/components/SeasonalDrinkOverlay.jsx
// VERSIÓN DINÁMICA - Lee configuración de seasonal_config.json
import React, { useState, useEffect } from "react";
import CustomizePage from "../pages/CustomizePage";
import { getProductById } from "../data/products";

// Importar configuración de temporada
import seasonalConfig from "../data/seasonal_config.json";

// Construir mapa de bebidas desde la configuración
const SEASONAL_DRINKS = {};
if (seasonalConfig.enabled && seasonalConfig.drinks) {
  seasonalConfig.drinks.forEach(drink => {
    SEASONAL_DRINKS[drink.seasonalKey] = {
      name: drink.name,
      displayName: drink.displayName,
      image: drink.image,
      variants: drink.variants
    };
  });
}

// Configuración de los tipos de bebida - RUTAS CON %20 EN LUGAR DE ESPACIOS
const DRINK_TYPES = [
  {
    key: "caliente",
    label: "Caliente",
    icon: "./images/mods/ICONOS%20KIOSKO/VASO/VASO%20BEBIDA%20CALIENTE.png",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-300"
  },
  {
    key: "rocas",
    label: "En las Rocas",
    icon: "./images/mods/ICONOS%20KIOSKO/VASO/ICED%20COFFE%20VASO.png",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-300"
  },
  {
    key: "frappe",
    label: "Frappé",
    icon: "./images/mods/ICONOS%20KIOSKO/VASO/VASO%20FRAPPE.png",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-300"
  }
];

// Componente para seleccionar el tipo de bebida
function DrinkTypeSelector({ seasonalDrink, onSelect, onClose, onHome }) {
  const drinkConfig = SEASONAL_DRINKS[seasonalDrink];
  
  if (!drinkConfig) {
    console.error(`Bebida de temporada no configurada: ${seasonalDrink}`);
    onClose();
    return null;
  }

  const availableTypes = DRINK_TYPES.filter((type) => drinkConfig.variants?.[type.key]);

  const gridClassName =
    availableTypes.length <= 1
      ? "grid grid-cols-1 gap-8 max-w-xl mx-auto"
      : availableTypes.length === 2
      ? "grid grid-cols-2 gap-8 max-w-3xl mx-auto"
      : "grid grid-cols-3 gap-8";

  return (
    <div className="h-screen w-full bg-[#E8FBFF] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 bg-white/90 backdrop-blur border-b-2 border-gray-200">
        <div className="flex items-center gap-5">
          <img
            src={drinkConfig.image || "./images/placeholder.png"}
            alt={drinkConfig.displayName}
            className="w-24 h-24 rounded-xl object-cover shadow-md"
            onError={(e) => { e.currentTarget.src = "./images/placeholder.png"; }}
          />
          <div>
            <div className="text-sm text-slate-500 font-medium">Bebida de Temporada</div>
            <h1 className="text-3xl font-bold text-slate-800">{drinkConfig.displayName}</h1>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 flex items-center justify-center px-8 pb-32">
        <div className="w-full max-w-5xl">
          <h2 className="text-4xl font-semibold text-slate-700 mb-12 text-center">
            <span className="bg-[#BFF0F7] px-10 py-5 rounded-full">
              ¿Cómo lo prefieres?
            </span>
          </h2>
          
          <div className={gridClassName}>
            {availableTypes.map((type) => {
              const variant = drinkConfig.variants[type.key];
              
              return (
                <button
                  key={type.key}
                  onClick={() => onSelect(type.key, variant.productId)}
                  className={`relative rounded-3xl bg-white shadow-xl border-3 ${type.borderColor}
                           hover:shadow-2xl hover:scale-105 active:scale-95 
                           transition-all duration-200 overflow-hidden
                           flex flex-col items-center justify-center p-8 min-h-[320px]`}
                >
                  {/* Icono - Imagen del vaso */}
                  <div className="w-32 h-32 mb-6 flex items-center justify-center">
                    <img 
                      src={type.icon}
                      alt={type.label}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  
                  {/* Nombre del tipo */}
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">
                    {type.label}
                  </h3>
                  
                  {/* Nombre específico del producto */}
                  <div className={`px-4 py-2 rounded-full ${type.bgColor} text-sm font-medium text-slate-700`}>
                    {variant.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer con botones de navegación */}
      <footer className="h-[140px] bg-white/95 backdrop-blur-sm border-t-2 border-gray-200 flex items-center justify-center px-8">
        <div className="flex gap-6">
          <button
            onClick={onClose}
            className="w-24 h-24 rounded-full bg-[#67CDD9] text-white text-5xl shadow-xl hover:brightness-110 active:scale-95 flex items-center justify-center"
            aria-label="Regresar"
            title="Regresar"
          >
            ←
          </button>
          {onHome && (
            <button
              onClick={onHome}
              className="w-24 h-24 rounded-full bg-[#00B7C6] text-white text-4xl shadow-xl hover:brightness-110 active:scale-95 flex items-center justify-center"
              aria-label="Inicio"
              title="Ir al inicio"
            >
              🏠
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

export default function SeasonalDrinkOverlay({ seasonalKey, onClose, onGoHome, onNavigateToCategory, onPay }) {
  const [currentProduct, setCurrentProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  // Si la bebida tiene UNA sola variante, saltamos el paso "¿Cómo lo prefieres?"
  const drinkCfg = SEASONAL_DRINKS[seasonalKey];
  const variantKeys = drinkCfg ? Object.keys(drinkCfg.variants || {}) : [];
  const isSingleVariant = variantKeys.length === 1;

  // Cuando se selecciona un tipo de bebida, cargar el producto correspondiente
  const handleTypeSelect = async (typeKey, productId) => {
    setSelectedType(typeKey);
    setIsLoading(true);
    
    try {
      const product = await getProductById(productId);
      
      if (product) {
        console.log(`✅ Producto cargado para ${typeKey}:`, product);
        setCurrentProduct(product);
      } else {
        console.error(`❌ Producto ${productId} no encontrado en el catálogo`);
        alert(`Error: El producto no se encuentra en el catálogo.`);
        setSelectedType(null);
      }
    } catch (error) {
      console.error("Error cargando producto:", error);
      alert(`Error cargando el producto: ${error.message}`);
      setSelectedType(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-seleccionar cuando solo hay una variante (sin paso extra para el cliente)
  useEffect(() => {
    if (isSingleVariant && !currentProduct && !selectedType) {
      const k = variantKeys[0];
      handleTypeSelect(k, drinkCfg.variants[k].productId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seasonalKey]);

  // Cuando se agrega al carrito desde CustomizePage
  const handleProductAdded = () => {
    console.log(`Bebida de temporada agregada al carrito`);
    onClose();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#00B7C6] mx-auto"></div>
          <p className="mt-6 text-xl text-slate-600">Cargando tu bebida...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Header indicador de bebida de temporada - USA CONFIG DINÁMICA */}
      {currentProduct && (
        <div 
          className="absolute top-0 left-0 right-0 z-[60] text-white shadow-lg pointer-events-none"
          style={{ backgroundColor: '#00B7C6' }}
        >
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex-1">
              <h2 className="text-base font-bold flex items-center gap-2">
                {seasonalConfig.badge?.emoji || ''} BEBIDA DE TEMPORADA
              </h2>
              <p className="text-xs opacity-90">
                {SEASONAL_DRINKS[seasonalKey]?.displayName} - {DRINK_TYPES.find(t => t.key === selectedType)?.label}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Contenido */}
      <div className={currentProduct ? "pt-14 h-full" : "h-full"}>
        {!currentProduct ? (
          isSingleVariant ? (
            // Una sola variante: no mostramos selector (se auto-selecciona)
            <div className="h-screen w-full flex items-center justify-center bg-white">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#00B7C6]"></div>
            </div>
          ) : (
            // Mostrar selector de tipo
            <DrinkTypeSelector
              seasonalDrink={seasonalKey}
              onSelect={handleTypeSelect}
              onClose={onClose}
              onHome={onGoHome}
            />
          )
        ) : (
          // Mostrar página de personalización
          <CustomizePage
            producto={currentProduct}
            onClose={handleProductAdded}
            onGoHome={onGoHome}
            onNavigateToCategory={onNavigateToCategory}
            onPay={onPay}
          />
        )}
      </div>
    </div>
  );
}

// Exportar la configuración para uso en products.js
export { SEASONAL_DRINKS };

// Exportar la configuración completa
export { seasonalConfig };

// Helper para verificar si un producto es bebida de temporada
export function isSeasonalDrink(productId) {
  return Object.keys(SEASONAL_DRINKS).includes(productId);
}

// Helper para obtener la configuración de una bebida de temporada
export function getSeasonalDrinkConfig(seasonalKey) {
  return SEASONAL_DRINKS[seasonalKey] || null;
}

// Helper para verificar si hay bebidas de temporada activas
export function hasSeasonalDrinks() {
  return seasonalConfig.enabled && seasonalConfig.drinks && seasonalConfig.drinks.length > 0;
}
