// src/components/SeasonalDrinkOverlay.jsx
// VERSIÓN DINÁMICA - Lee configuración de seasonal_config.json
import React, { useState, useEffect } from "react";
import CustomizePage from "../pages/CustomizePage";
import { getProductById } from "../data/products";

// Importar configuración de temporada
import seasonalConfig from "../data/seasonal_config.json";
import AtrasFlotante from "./AtrasFlotante";

// Construir mapa de bebidas desde la configuración
const SEASONAL_DRINKS = {};
if (seasonalConfig.enabled && seasonalConfig.drinks) {
  seasonalConfig.drinks.forEach(drink => {
    SEASONAL_DRINKS[drink.seasonalKey] = {
      name: drink.name,
      displayName: drink.displayName,
      image: drink.image,
      sinEtiqueta: !!drink.sinEtiqueta,
      variants: drink.variants
    };
  });
}

// Configuración de los tipos de bebida - RUTAS CON %20 EN LUGAR DE ESPACIOS
const DRINK_TYPES = [
  {
    key: "caliente",
    label: "Caliente",
    icon: "./images/mods/ICONOS%20KIOSKO/VASO/VASO%20BEBIDA%20CALIENTE.png"
  },
  {
    key: "rocas",
    label: "A las rocas",
    icon: "./images/mods/ICONOS%20KIOSKO/VASO/ICED%20COFFE%20VASO.png"
  },
  {
    key: "frappe",
    label: "Frappé",
    icon: "./images/mods/ICONOS%20KIOSKO/VASO/VASO%20FRAPPE.png"
  }
];

// Great Vibes en MAYÚSCULAS no se lee: Title Case (mismo helper que MenuPage)
const tituloScript = (t = "") => t.toLowerCase().replace(/(^|[\s/(-])(\S)/g, (_, a, c) => a + c.toUpperCase());

const IconoAtras = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);
const IconoInicio = () => (
  <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 9.5L12 3l9 6.5"></path>
    <path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10"></path>
    <path d="M9 21v-6h6v6"></path>
  </svg>
);

// Componente para seleccionar el tipo de bebida
function DrinkTypeSelector({ seasonalDrink, selectedType, onSelect, onClose, onHome }) {
  const drinkConfig = SEASONAL_DRINKS[seasonalDrink];
  
  if (!drinkConfig) return null; // el padre cierra el overlay en un efecto

  const availableTypes = DRINK_TYPES.filter((type) => drinkConfig.variants?.[type.key]);

  const gridClassName =
    availableTypes.length <= 1
      ? "grid grid-cols-1 gap-10 w-[480px]"
      : availableTypes.length === 2
      ? "grid grid-cols-2 gap-10 w-[920px]"
      : "grid grid-cols-3 gap-8 w-[980px]";

  return (
    <div className="relative h-screen w-full k-app flex flex-col overflow-hidden">
      <div className="k-nieve" aria-hidden="true" />

      {/* y 0–600: decorativo (logo, miniatura, nombre, pastilla). Nada tocable. */}
      <header className="relative h-[600px] shrink-0 flex flex-col items-center justify-center text-center px-10 select-none">
        <span className="k-logo w-[220px] mb-8" role="img" aria-label="Lamarque Repostería & Café" />
        <div className="k-card k-foto w-[200px] h-[200px] flex items-center justify-center mb-6">
          <img
            src={drinkConfig.image || "./images/placeholder.png"}
            alt=""
            className="w-full h-full object-contain"
            onError={(e) => { e.currentTarget.src = "./images/placeholder.png"; }}
          />
        </div>
        <h1 className="k-script text-k-sobrefondo mb-6" style={{ '--fs': '68px' }}>
          {tituloScript(drinkConfig.displayName)}
        </h1>
        <span
          className="inline-block rounded-full px-8 py-3 text-[28px] font-semibold"
          style={{ background: 'var(--k-paso-bg)', color: 'var(--k-paso-color)', border: 'var(--k-paso-borde)' }}
        >
          ¿Cómo lo prefieres?
        </span>
      </header>

      {/* y 600–1500: banda de alcance */}
      <main className="relative flex-[0_1_900px] min-h-0 flex items-center justify-center px-10">
        <div className={gridClassName}>
          {availableTypes.map((type) => {
            const variant = drinkConfig.variants[type.key];
            const elegido = selectedType === type.key;

            return (
              <button
                key={type.key}
                onClick={() => onSelect(type.key, variant.productId)}
                aria-pressed={elegido}
                className={`k-card relative flex flex-col items-center p-6 pb-8 min-h-[520px]
                         active:scale-[.98] active:[box-shadow:var(--k-sel-sombra)] transition-transform duration-150
                         ${elegido ? "k-sel" : ""}`}
              >
                {elegido && (
                  <span className="absolute top-4 right-4 w-16 h-16 rounded-full bg-k-primario text-k-sobreprimario flex items-center justify-center shadow-lg" aria-hidden="true">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                )}

                {/* Ícono del vaso (de la diseñadora, no se cambia) */}
                <div className="k-foto rounded-[var(--k-radio)] w-full flex-1 min-h-[300px] flex items-center justify-center">
                  <img
                    src={type.icon}
                    alt=""
                    className="w-[220px] h-[220px] object-contain"
                  />
                </div>

                <h3 className="mt-6 text-[40px] leading-tight font-extrabold text-k-tinta">
                  {type.label}
                </h3>
                <p className="mt-2 text-[26px] leading-snug font-medium text-k-tinta2">
                  {tituloScript(variant.name)}
                </p>
              </button>
            );
          })}
        </div>
      </main>

      <div className="flex-1" />

      <AtrasFlotante onClick={onClose} />

      {/* Pie: Atrás (contorno) ≠ Inicio (relleno) */}
      <footer className="h-[140px] shrink-0 k-barra flex items-center justify-center px-8">
        <div className="flex gap-8">
          <button
            onClick={onClose}
            className="w-[104px] h-[104px] rounded-full k-btn-atras shadow-lg active:scale-95 flex items-center justify-center"
            aria-label="Regresar"
            title="Regresar"
          >
            <IconoAtras />
          </button>
          {onHome && (
            <button
              onClick={onHome}
              className="w-[104px] h-[104px] rounded-full k-btn-inicio shadow-lg active:scale-95 flex items-center justify-center"
              aria-label="Inicio"
              title="Ir al inicio"
            >
              <IconoInicio />
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

  // Bebida no configurada: cerrar DESPUÉS del render (antes se llamaba onClose en pleno render)
  useEffect(() => {
    if (!drinkCfg) {
      console.error(`Bebida de temporada no configurada: ${seasonalKey}`);
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drinkCfg]);

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

  if (!drinkCfg) return null;

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 k-app flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-k-sobrefondo mx-auto"></div>
          <p className="mt-8 text-[30px] text-k-sobrefondo2">Cargando tu bebida...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 k-app">
      {/* Header indicador de bebida de temporada - USA CONFIG DINÁMICA */}
      {currentProduct && (
        <div className="absolute top-0 left-0 right-0 z-[60] h-14 bg-k-primario text-k-sobreprimario shadow-lg pointer-events-none">
          <div className="h-full flex items-center gap-4 px-6">
            {!drinkCfg.sinEtiqueta && <span className="k-badge-temporada">Temporada</span>}
            <p className="text-lg font-semibold truncate">
              {tituloScript(SEASONAL_DRINKS[seasonalKey]?.displayName)} · {DRINK_TYPES.find(t => t.key === selectedType)?.label}
            </p>
          </div>
        </div>
      )}
      
      {/* Contenido */}
      <div className={currentProduct ? "pt-14 h-full k-con-barra" : "h-full"}>
        {!currentProduct ? (
          isSingleVariant ? (
            // Una sola variante: no mostramos selector (se auto-selecciona)
            <div className="h-screen w-full flex items-center justify-center k-app">
              <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-k-sobrefondo"></div>
            </div>
          ) : (
            // Mostrar selector de tipo
            <DrinkTypeSelector
              seasonalDrink={seasonalKey}
              selectedType={selectedType}
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
