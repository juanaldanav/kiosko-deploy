// src/components/ModifierStep.jsx - VERSIÓN CON ICONOS OFICIALES DE MARKETING
import React, { useState, useRef, useEffect } from "react";
import { getModifierIcon } from "../data/modifiersImages";

function formatModifierLabelForView(text = "") {
  const value = String(text || "").trim();
  if (/^AGUA MINERAL\s+\d+\s*OZ$/i.test(value)) {
    return "AGUA MINERAL";
  }
  return value;
}

function normOpt(raw = {}) {
  const id =
    raw.id ??
    raw.value ??
    raw.key ??
    raw.Nombre ??
    raw.nombre ??
    raw.label ??
    raw.name ??
    "";

  let nombre =
    raw.nombre ??
    raw.name ??
    raw.label ??
    (typeof id === "string" ? id : String(id));

  if (typeof nombre === "string" && nombre === nombre.toLowerCase()) {
    nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);
  }

  return {
    id,
    nombre,
    priceDelta: Number(raw.priceDelta ?? raw.precio_adicional ?? 0),
    basePrice: Number(raw.basePrice ?? 0),
    idsPerSize: raw.idsPerSize || raw.idsBySize || raw._raw?.idsPerSize || {},
    pricesPerSize: raw.pricesPerSize || raw.pricesBySize || raw._raw?.pricesPerSize || {},
    labelsPerSize: raw.labelsPerSize || raw._raw?.labelsPerSize || {},
    icon: raw.icon || raw.image || null,
    disabled: Boolean(raw.disabled),
    _raw: raw,
  };
}

// Función para determinar el tamaño óptimo según la cantidad de opciones y tipo de modificador
function getOptimalLayout(optionCount, groupType = "") {
  const typeU = (groupType || "").toUpperCase();
  
  // 🕯️ LAYOUT ESPECIAL PARA VELAS - COMPACTO SIN SCROLL (MÁS PEQUEÑO PARA EVITAR CORTES)
  if (typeU.includes("FORMA") || typeU.includes("VELA") || typeU.includes("MARKELAN") || typeU.includes("NUMERO")) {
    if (optionCount <= 4) {
      return {
        columns: 2,
        tileWidth: "w-[360px]",      // Reducido más
        tileHeight: "h-[260px]",     // Reducido más
        iconSize: "w-44 h-44",       // 176px
        textSize: "text-lg",
        priceSize: "text-base",
        gap: "gap-6"                 // Buena separación
      };
    } else if (optionCount <= 6) {
      return {
        columns: 2,
        tileWidth: "w-[340px]",      // Reducido más
        tileHeight: "h-[240px]",     // Reducido más
        iconSize: "w-40 h-40",       // 160px
        textSize: "text-base",
        priceSize: "text-sm",
        gap: "gap-5"
      };
    } else if (optionCount <= 10) {
      // VELA DE CERA (10 números) - MÁS COMPACTO
      return {
        columns: 2,
        tileWidth: "w-[320px]",      // Reducido de 340px
        tileHeight: "h-[220px]",     // Reducido de 240px
        iconSize: "w-36 h-36",       // 144px - Compacto pero visible
        textSize: "text-base",
        priceSize: "text-sm",
        gap: "gap-6"                 // Buena separación
      };
    } else {
      // VELA MARKELAN (12 opciones) - MÁS COMPACTO
      return {
        columns: 3,
        tileWidth: "w-[280px]",      // Reducido de 300px
        tileHeight: "h-[200px]",     // Reducido de 220px
        iconSize: "w-32 h-32",       // 128px - Compacto pero visible
        textSize: "text-sm",
        priceSize: "text-xs",
        gap: "gap-5"                 // Buena separación
      };
    }
  }
  
  //  LAYOUTS ESPECIALES PARA LECHE, COLD FOAM, VASO Y AZÚCAR (ICONOS GRANDES, CONTENEDORES COMPACTOS)
  const isSpecialCategory = 
    typeU.includes("LECHE") || 
    typeU.includes("MILK") ||
    typeU.includes("AZUCAR") ||
    (typeU.includes("COLD") && typeU.includes("FOAM")) ||
    typeU.includes("VASO") ||
    typeU.includes("TERMO");
  
  if (isSpecialCategory) {
    if (optionCount <= 2) {
      return {
        columns: 2,
        tileWidth: "w-[380px]",      
        tileHeight: "h-[320px]",     // ⬆ MÁS ALTURA para que quepa todo
        iconSize: "w-48 h-48",       //  Icono grande (192px)
        textSize: "text-lg",
        priceSize: "text-base",
        gap: "gap-3"
      };
    } else if (optionCount <= 4) {
      return {
        columns: 2,
        tileWidth: "w-[360px]",      
        tileHeight: "h-[300px]",     // ⬆ MÁS ALTURA
        iconSize: "w-44 h-44",       //  Icono grande (176px)
        textSize: "text-base",
        priceSize: "text-sm",
        gap: "gap-3"
      };
    } else if (optionCount <= 6) {
      return {
        columns: 3,
        tileWidth: "w-[300px]",      
        tileHeight: "h-[280px]",     // ⬆ MÁS ALTURA
        iconSize: "w-40 h-40",       //  Icono grande (160px)
        textSize: "text-base",
        priceSize: "text-sm",
        gap: "gap-3"
      };
    } else {
      return {
        columns: 3,
        tileWidth: "w-[280px]",      
        tileHeight: "h-[260px]",     // ⬆️ MÁS ALTURA
        iconSize: "w-36 h-36",       // 🔥 Icono grande (144px)
        textSize: "text-sm",
        priceSize: "text-xs",
        gap: "gap-3"
      };
    }
  }
  
  // LAYOUTS NORMALES para otros modificadores
  if (optionCount <= 2) {
    return {
      columns: 2,
      tileWidth: "w-[400px]",
      tileHeight: "h-[260px]",
      iconSize: "w-48 h-48",
      textSize: "text-xl",
      priceSize: "text-lg",
      gap: "gap-1"
    };
  } else if (optionCount <= 4) {
    return {
      columns: 2,
      tileWidth: "w-[360px]",
      tileHeight: "h-[240px]",
      iconSize: "w-40 h-40",
      textSize: "text-lg",
      priceSize: "text-base",
      gap: "gap-1"
    };
  } else if (optionCount <= 6) {
    return {
      columns: 3,
      tileWidth: "w-[300px]",
      tileHeight: "h-[200px]",
      iconSize: "w-32 h-32",
      textSize: "text-base",
      priceSize: "text-sm",
      gap: "gap-1"
    };
  } else if (optionCount <= 9) {
    return {
      columns: 3,
      tileWidth: "w-[260px]",
      tileHeight: "h-[180px]",
      iconSize: "w-28 h-28",
      textSize: "text-sm",
      priceSize: "text-xs",
      gap: "gap-1"
    };
  } else {
    return {
      columns: 4,
      tileWidth: "w-[200px]",
      tileHeight: "h-[140px]",
      iconSize: "w-20 h-20",
      textSize: "text-xs",
      priceSize: "text-xs",
      gap: "gap-1"
    };
  }
}

function OptTile({ tipo, opt, onClick, product, group, layout }) {
  const o = normOpt(opt);
  const displayName = formatModifierLabelForView(o.nombre);

  // Skeleton mientras el icono decodifica/pinta (evita el flash en blanco)
  const imgRef = useRef(null);
  const [iconLoaded, setIconLoaded] = useState(false);

  // 🎯 USAR EL SISTEMA INTELIGENTE DE ICONOS
  const iconSrc = getModifierIcon(group, product, o.nombre);
  const hasRealIcon = iconSrc && iconSrc !== "./images/placeholder.png" && iconSrc !== "./images/mods/placeholder.png";
  const isLecheProteina = String(o.nombre || "").toUpperCase().includes("LECHE PROTEINA");

  // Si la imagen ya estaba en cache (complete), marcarla cargada de una
  useEffect(() => {
    setIconLoaded(false);
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIconLoaded(true);
    }
  }, [iconSrc]);

  const handle = () => {
    if (o.disabled) return;
    onClick?.(o);
  };

  return (
    <button
      onClick={handle}
      disabled={o.disabled}
      className={`
        ${layout.tileWidth} ${layout.tileHeight}
        rounded-2xl bg-white shadow-lg border-2 border-slate-200
        flex flex-col items-center p-4
        ${!hasRealIcon ? "justify-center gap-2" : "justify-between"}
        overflow-hidden
        active:scale-95 transition-all
        ${o.disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-xl hover:border-[#00B7C6] hover:scale-105"}
      `}
    >
      {/* Icono con skeleton mientras carga */}
      {hasRealIcon && (
        <div className={`flex-shrink-0 relative ${layout.iconSize}`}>
          {!iconLoaded && (
            <div className="absolute inset-0 rounded-xl bg-slate-200 animate-pulse" />
          )}
          <img
            ref={imgRef}
            src={iconSrc}
            onLoad={() => setIconLoaded(true)}
            onError={(e) => {
              e.currentTarget.src = "./images/placeholder.png";
              setIconLoaded(true);
            }}
            alt={displayName}
            className={`${layout.iconSize} object-contain transition-opacity duration-200 ${iconLoaded ? "opacity-100" : "opacity-0"}`}
            style={{ imageRendering: 'auto', WebkitImageRendering: '-webkit-optimize-contrast' }}
          />
        </div>
      )}
      
      {/* Texto */}
      <div className={`text-slate-700 font-bold ${layout.textSize} text-center leading-snug px-2 flex-shrink-0`}
        style={{ WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale', textRendering: 'geometricPrecision' }}>
        {displayName.split("\n")[0]}
      </div>
      
      {/* Precio */}
      {o.priceDelta > 0 && (
        <div className={`${layout.priceSize} text-slate-500 font-medium flex-shrink-0`}>
          +${o.priceDelta}
        </div>
      )}
    </button>
  );
}

function SizeTile({ opt, onClick, layout }) {
  const o = normOpt(opt);
  const sizeLabel = o.nombre || String(o.id || "");

  const handle = () => {
    if (o.disabled) return;
    onClick?.(sizeLabel, opt);
  };

  return (
    <button
      onClick={handle}
      disabled={o.disabled}
      className={`
        ${layout.tileWidth} ${layout.tileHeight}
        rounded-2xl bg-white shadow-lg border-2 border-slate-200
        flex flex-col items-center justify-center ${layout.gap}
        overflow-hidden
        active:scale-95 transition-all
        ${o.disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-xl hover:border-[#00B7C6] hover:scale-105"}
      `}
    >
      <div className="text-slate-700 font-bold text-3xl flex-shrink-0">
        {sizeLabel}
      </div>
      {o.basePrice > 0 && (
        <div className="text-[#00B7C6] font-bold text-2xl flex-shrink-0">
          ${o.basePrice}
        </div>
      )}
    </button>
  );
}

export default function ModifierStep({ grupo, onPick, product, sizeLabel }) {
  if (!grupo) return null;

  const tipo = (grupo.tipo || grupo.type || "").toString();
  const titulo = grupo.titulo || grupo.title || "Elige una opción";

  const rawOptions = Array.isArray(grupo.opciones)
    ? grupo.opciones
    : Array.isArray(grupo.options)
    ? grupo.options
    : [];

  const isSize = tipo.toLowerCase() === "size";

  const _sizeLabel =
    sizeLabel ||
    product?.DefaultSizeLabel ||
    product?.defaultSize ||
    "Grande";

  const visibleOptions = (Array.isArray(rawOptions) ? rawOptions : []).filter(
    (o) => {
      const ids = o?.idsPerSize || (o?._raw && o._raw.idsPerSize) || null;
      if (!ids || Object.keys(ids).length === 0) return true;
      return ids[_sizeLabel] != null;
    }
  );

  // 🔥 Obtener el layout óptimo basado en la cantidad de opciones Y el tipo de grupo
  const layout = getOptimalLayout(visibleOptions.length, tipo || titulo);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-8 pb-32">
      <h2 className="text-3xl font-bold text-slate-700 mb-8 text-center">
        <span className="bg-[#BFF0F7] px-8 py-4 rounded-full">{titulo}</span>
      </h2>

      <div
        className={`grid ${layout.gap}`}
        style={{
          gridTemplateColumns: `repeat(${layout.columns}, minmax(0, max-content))`,
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        {visibleOptions.map((opt, idx) => {
          const k = `${tipo}_${String(normOpt(opt).id || idx)}_${idx}`;

          if (isSize) {
            return <SizeTile key={k} opt={opt} onClick={(o) => onPick?.(o)} layout={layout} />;
          }

          return (
            <OptTile
              key={k}
              tipo={tipo}
              opt={opt}
              product={product}
              group={grupo}
              onClick={(o) => onPick?.(o)}
              layout={layout}
            />
          );
        })}
      </div>
    </div>
  );
}
