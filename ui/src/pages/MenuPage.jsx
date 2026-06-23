// src/pages/MenuPage.jsx - VERSIÓN CON ZOOM 125% EN CONTENIDO PRINCIPAL
import React, { useEffect, useState, useRef } from "react";
import { loadCatalog } from "../data/products";
import { preloadModifierIcons } from "../data/modifiersImages";
import CustomizePage from "./CustomizePage";
import ComboFlowOverlay from "../components/ComboFlowOverlay";
import SeasonalDrinkOverlay from "../components/SeasonalDrinkOverlay";
import FloatingCart from "../components/FloatingCart";
import PromoOverlay from "../components/PromoOverlay";
import InactivityModal from "../components/InactivityModal";
import { useCart } from "../context/CartContext";
import useDragScroll from "../hooks/useDragScroll";

// Importar configuración de temporada para el badge dinámico
import seasonalConfig from "../data/seasonal_config.json";

// Tile mejorado para postres con diseño tipo tarjeta
function ProductTile({ product, onClick, size = "default" }) {
  const { items, addItem, removeItem } = useCart();

  const sizeConfigs = {
    minipostre: {
      container: "w-[280px]",
      imageHeight: "h-[220px]",
      padding: "p-4",
      titleSize: "text-lg",
      priceSize: "text-xl"
    },
    large: {
      container: "w-[240px]",
      imageHeight: "h-[180px]",
      padding: "p-3",
      titleSize: "text-base",
      priceSize: "text-lg"
    },
    default: {
      container: "w-[180px]",
      imageHeight: "h-[140px]",
      padding: "p-3",
      titleSize: "text-sm",
      priceSize: "text-base"
    }
  };

  const config = sizeConfigs[size] || sizeConfigs.default;

  // Minipostres: agregar directo al carrito con stepper, sin abrir CustomizePage.
  // Tienen 1 sola talla y 0 modificadores, así que no requieren personalización.
  const isMinipostre = product?.category === "MINIPOSTRES" || product?.grupo === "MINIPOSTRES";

  if (isMinipostre) {
    const variant = product?.ProductsBySize?.[0] || {};
    const base = Number(variant.BasePrice ?? product.precio ?? 0);
    const pid = variant.ProductId || product.id;
    const nombre = product.displayName || product.nombre;
    const talla = product.DefaultSizeLabel || variant.label || "";

    const matchIdx = items.reduce((acc, it, i) => {
      if (it.productoId === pid) acc.push(i);
      return acc;
    }, []);
    const count = matchIdx.length;

    const buildItem = () => ({
      product,
      selectedSize: talla,
      quantity: 1,
      cantidad: 1,
      selectedModifiers: {},
      productoId: pid,
      nombre,
      foto: product.foto,
      talla,
      base,
      modificadores: [],
      totalItem: base,
    });

    const inc = (e) => { e.stopPropagation(); addItem(buildItem()); };
    const dec = (e) => {
      e.stopPropagation();
      if (matchIdx.length) removeItem(matchIdx[matchIdx.length - 1]);
    };

    return (
      <div
        onClick={inc}
        className={`${config.container} relative bg-white rounded-2xl shadow-lg hover:shadow-2xl
                  overflow-hidden transition-all duration-200 hover:scale-105 active:scale-95 flex flex-col cursor-pointer
                  ${count > 0 ? "border-2 border-[#00B7C6] ring-2 ring-[#00B7C6]/30" : "border border-gray-200"}`}
      >
        {count > 0 && (
          <div className="absolute top-2 right-2 z-10 w-9 h-9 rounded-full bg-[#00B7C6] text-white text-lg font-bold grid place-items-center shadow-lg">
            {count}
          </div>
        )}

        <div className={`${config.imageHeight} w-full overflow-hidden bg-gray-100`}>
          <img
            src={product.foto || "./images/placeholder.png"}
            onError={(e) => { e.currentTarget.src = "./images/placeholder.png"; }}
            className="w-full h-full object-cover"
            alt={product.nombre}
          />
        </div>

        <div className={`${config.padding} flex flex-col justify-between flex-1`}>
          <h3 className={`${config.titleSize} font-semibold text-gray-800 text-center leading-tight mb-2`}>
            {product.nombre}
          </h3>
          <p className={`${config.priceSize} font-bold text-[#00B7C6] text-center mb-2`}>
            ${product.precio || 0}
          </p>

          {/* Stepper -N+ por postre (compacto) */}
          <div className="flex items-center justify-center gap-2 bg-slate-100 rounded-full px-1 py-0.5 w-fit mx-auto">
            <button
              onClick={dec}
              disabled={count === 0}
              className="w-8 h-8 grid place-items-center rounded-full bg-white text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 disabled:opacity-40 text-xl font-bold transition-all"
            >
              −
            </button>
            <span className="w-6 text-center text-lg font-bold text-slate-800">{count}</span>
            <button
              onClick={inc}
              className="w-8 h-8 grid place-items-center rounded-full bg-[#00B7C6] text-white shadow-sm hover:brightness-110 active:scale-95 text-xl font-bold transition-all"
            >
              +
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => onClick(product)}
      className={`${config.container} bg-white rounded-2xl shadow-lg hover:shadow-2xl
                border border-gray-200 overflow-hidden transition-all duration-200
                hover:scale-105 active:scale-95 flex flex-col`}
    >
      <div className={`${config.imageHeight} w-full overflow-hidden bg-gray-100`}>
        <img
          src={product.foto || "./images/placeholder.png"}
          onError={(e) => { e.currentTarget.src = "./images/placeholder.png"; }}
          className="w-full h-full object-cover"
          alt={product.nombre}
        />
      </div>

      <div className={`${config.padding} flex flex-col justify-between flex-1`}>
        <h3 className={`${config.titleSize} font-semibold text-gray-800 text-center leading-tight mb-2`}>
          {product.nombre}
        </h3>
        <p className={`${config.priceSize} font-bold text-[#00B7C6] text-center`}>
          ${product.precio || 0}
        </p>
      </div>
    </button>
  );
}

// Tile genérico para categorías - BADGE DINÁMICO DESDE CONFIG
function CategoryTile({ title, img, onClick, itemCount, isCombo = false, isSeasonal = false, displayPrice, description, size = "default", badge }) {
  const sizeClasses = {
    default: 'w-[180px] h-[200px]',
    large: 'w-[240px] h-[240px]',
    xlarge: 'w-[320px] h-[280px]'
  };
  
  const textSizes = {
    default: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl'
  };

  // Badge de temporada: texto por defecto; override por bebida (badge.image = logo PNG, ej. Nutella)
  const seasonalText = (badge && badge.text) || "TEMPORADA";

  return (
    <div className={`relative ${sizeClasses[size]}`}>
    <button
      onClick={onClick}
      className={`relative bg-white rounded-2xl shadow-lg hover:shadow-2xl border border-gray-200
                active:scale-95 transition-all duration-200 hover:scale-105 overflow-hidden
                w-full h-full flex flex-col`}
    >
      {/* Badge de precio para combos */}
      {isCombo && displayPrice && (
        <div className="absolute top-2 right-2 z-10 bg-red-500 text-white text-sm px-3 py-1 rounded-full font-bold">
          ${displayPrice}
        </div>
      )}
      
      <div className="flex-1 overflow-hidden bg-gray-50">
        <img
          src={img || "./images/placeholder.png"}
          onError={(e) => { e.currentTarget.src = "./images/placeholder.png"; }}
          className="w-full h-full object-cover"
          alt={title}
        />
      </div>
      
      <div className="p-3 bg-white">
        <h3 className={`${textSizes[size]} font-semibold text-gray-800 text-center leading-tight`}>
          {title}
        </h3>
        {/* Mostrar descripción para bebidas de temporada */}
        {isSeasonal && description && (
          <p className="text-xs text-slate-500 mt-1 text-center">
            {description}
          </p>
        )}
        {itemCount !== undefined && !isSeasonal && (
          <p className="text-xs text-gray-500 mt-1 text-center">
            ({itemCount} productos)
          </p>
        )}
      </div>
    </button>

    {/* Etiqueta de temporada: sobresale de la esquina. badge.image = logo PNG (ej. Nutella) */}
    {isSeasonal && (
      <div className="absolute -top-4 -right-4 z-20 pointer-events-none">
        {badge && badge.image ? (
          <img
            src={badge.image}
            alt={seasonalText}
            className="h-9 w-auto -rotate-12 drop-shadow-xl"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <span className="block bg-red-600 text-white text-[11px] leading-none font-extrabold uppercase tracking-wide px-2.5 py-1.5 rounded-md shadow-lg ring-2 ring-white -rotate-12">
            {seasonalText}
          </span>
        )}
      </div>
    )}
    </div>
  );
}

function ConfirmOverlay({ orderNo, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.reload();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 grid place-items-center p-6">
      <div className="w-full max-w-[500px] bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-3xl font-bold mb-3">¡Orden lista!</h3>
        <p className="text-xl text-slate-600 mb-3">
          Tu orden ha sido procesada exitosamente
        </p>
        <div className="bg-[#E8FBFF] rounded-xl p-4 mb-6">
          <p className="text-lg">Número de orden</p>
          <p className="text-5xl font-bold text-[#00B7C6] mt-2">#{orderNo}</p>
        </div>
        <p className="text-lg text-slate-500 mb-6">
          Por favor, pase a ventanilla para recoger su pedido.
        </p>
        <button
          onClick={onClose}
          className="px-10 py-4 text-xl rounded-xl bg-[#00B7C6] text-white font-bold hover:brightness-110"
        >
          Nueva orden
        </button>
      </div>
    </div>
  );
}

export default function MenuPage() {
  const [showPromoVideo, setShowPromoVideo] = useState(true);
  const [featured, setFeatured] = useState([]);
  const [folders, setFolders] = useState([]);
  const [combos, setCombos] = useState([]);
  const [comboButtonImage, setComboButtonImage] = useState('./images/placeholder.png');
  const [openFolder, setOpenFolder] = useState(null);
  const [openSubFolder, setOpenSubFolder] = useState(null);
  const [selected, setSelected] = useState(null);
  const [activeComboFlow, setActiveComboFlow] = useState(null);
  const [activeSeasonalDrink, setActiveSeasonalDrink] = useState(null);
  const contentRef = useDragScroll();
  
  const lastActivityRef = useRef(Date.now());
  const [showInactivity, setShowInactivity] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [orderNo, setOrderNo] = useState("");

  const { items, clear, checkout, isProcessing } = useCart();

  useEffect(() => {
    const INACTIVITY_TIME = 30000;
    
    const resetActivity = () => {
      lastActivityRef.current = Date.now();   // ref: NO re-render por toque
      setShowInactivity(false);               // si ya es false, React no re-renderiza
    };

    const events = ['touchstart', 'touchmove', 'click', 'keypress'];
    events.forEach(event => {
      window.addEventListener(event, resetActivity, { passive: true });
    });

    const checkInactivity = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      if (timeSinceActivity > INACTIVITY_TIME && items.length > 0 && !showInactivity) {
        setShowInactivity(true);
      }
    }, 1000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetActivity);
      });
      clearInterval(checkInactivity);
    };
  }, [items.length, showInactivity]);

  // Polling para detectar señal de refresh desde admin
  useEffect(() => {
    let lastTimestamp = 0;
    
    const checkRefresh = setInterval(async () => {
      try {
        const res = await fetch('http://localhost:3001/api/visibility/refresh-status');
        const data = await res.json();
        if (data.ok && data.timestamp > lastTimestamp && lastTimestamp !== 0) {
          console.log('🔄 Señal de refresh recibida, recargando...');
          window.location.reload();
        }
        lastTimestamp = data.timestamp;
      } catch (e) {
        // Silenciar errores de conexión
      }
    }, 3000); // Cada 3 segundos
    
    return () => clearInterval(checkRefresh);
  }, []);

  useEffect(() => {
    loadCatalog()
      .then((catalog) => {
        const { featured, folderTiles, combos: catalogCombos } = catalog;
        setFeatured(featured || []);
        setCombos(catalogCombos || []);
        
        // Banner de combo: imagen fija del combo armable (refresher). Sin carrusel.
        if (catalogCombos && catalogCombos.length > 0 && catalogCombos[0].foto) {
          setComboButtonImage(catalogCombos[0].foto);
        }
        
        const reorganizedFolders = reorganizeBeverages(folderTiles || []);
        setFolders(reorganizedFolders);

        // Precargar iconos de mods en idle -> sin lag al abrir personalizacion
        preloadModifierIcons();
      })
      .catch((err) => {
        console.error("loadCatalog error:", err);
        alert("No se pudo cargar el menú");
      });
  }, []);

  const reorganizeBeverages = (originalFolders) => {
    const beverageFolders = [];
    const otherFolders = [];
    
    originalFolders.forEach(folder => {
      const title = folder.title?.toUpperCase() || "";
      if (title.includes("BEBIDAS")) {
        beverageFolders.push(folder);
      } else if (title === "COMBOS") {
        return;
      } else {
        otherFolders.push(folder);
      }
    });
    
    const result = [];
    
    if (beverageFolders.length > 0) {
      const friasConCafe = beverageFolders.find(f => 
        f.title?.includes("FRÍAS") && f.title?.includes("CON CAFÉ")
      );
      const friasSinCafe = beverageFolders.find(f => 
        f.title?.includes("FRÍAS") && f.title?.includes("SIN CAFÉ")
      );
      const calientesConCafe = beverageFolders.find(f => 
        f.title?.includes("CALIENTES") && f.title?.includes("CON CAFÉ")
      );
      const calientesSinCafe = beverageFolders.find(f => 
        f.title?.includes("CALIENTES") && f.title?.includes("SIN CAFÉ")
      );
      
      if (friasConCafe || friasSinCafe) {
        const bebidasFrias = {
          id: "bebidas_frias_main",
          title: "BEBIDAS FRÍAS",
          image: friasConCafe?.image || friasSinCafe?.image || "./images/bebidas-frias.jpg",
          foto: friasConCafe?.foto || friasSinCafe?.foto || "./images/bebidas-frias.jpg",
          isContainer: true,
          subCategories: []
        };
        
        if (friasConCafe) {
          bebidasFrias.subCategories.push({
            ...friasConCafe,
            title: "Con Café"
          });
        }
        if (friasSinCafe) {
          bebidasFrias.subCategories.push({
            ...friasSinCafe,
            title: "Sin Café"
          });
        }
        
        result.push(bebidasFrias);
      }
      
      if (calientesConCafe || calientesSinCafe) {
        const bebidasCalientes = {
          id: "bebidas_calientes_main",
          title: "BEBIDAS CALIENTES",
          image: calientesConCafe?.image || calientesSinCafe?.image || "./images/bebidas-calientes.jpg",
          foto: calientesConCafe?.foto || calientesSinCafe?.foto || "./images/bebidas-calientes.jpg",
          isContainer: true,
          subCategories: []
        };
        
        if (calientesConCafe) {
          bebidasCalientes.subCategories.push({
            ...calientesConCafe,
            title: "Con Café"
          });
        }
        if (calientesSinCafe) {
          bebidasCalientes.subCategories.push({
            ...calientesSinCafe,
            title: "Sin Café"
          });
        }
        
        result.push(bebidasCalientes);
      }
    }
    
    result.push(...otherFolders);
    return result;
  };

  // HANDLEPLAY CON LÓGICA DE FUSIÓN (de 3 Ríos)
  const handlePay = async (itemsDirectos = null) => {
    // 1. Detectar si vienen items nuevos desde "Enviar ahora"
    const incomingItems = Array.isArray(itemsDirectos) ? itemsDirectos : null;
    
    // 2. LÓGICA DE FUSIÓN:
    // Si hay items nuevos (incomingItems), los sumamos a los items que ya existen en el carrito.
    // Si no hay nuevos (es un click normal al botón Enviar del carrito), pasamos null.
    const itemsToCheckout = incomingItems 
      ? [...items, ...incomingItems] 
      : null;

    // Validación: Si no hay items fusionados Y el carrito está vacío, no hacemos nada.
    if (!itemsToCheckout && (!items.length || isProcessing)) return;
    
    try {
      // 3. Enviamos la lista FUSIONADA (Carrito + Nuevo) al checkout
      const resultado = await checkout(itemsToCheckout);
      
      if (resultado && (resultado.orderNumber || resultado.orden)) {
        setOrderNo(resultado.orderNumber || resultado.orden);
        setShowConfirm(true); 
        
        // Limpiamos la UI
        setSelected(null);
        setOpenFolder(null);
        setOpenSubFolder(null);
        setActiveSeasonalDrink(null);
      } else if (resultado) {
        // Fallback
        const fallbackNo = (Date.now() % 1000).toString().padStart(3, "0");
        setOrderNo(fallbackNo);
        setShowConfirm(true);
      }
    } catch (error) {
      console.error("Error en el pago:", error);
    }
  };
  
  const closeConfirm = () => {
    setShowConfirm(false);
    setOrderNo("");
    handleGoHome();
    setShowPromoVideo(true);
  };

  const handleGoHome = () => {
    setSelected(null);
    setOpenFolder(null);
    setOpenSubFolder(null);
    setActiveSeasonalDrink(null);
  };

  const handleNavigateToCategory = (categoryName) => {
    const targetFolder = folders.find(f => 
      f.title?.toUpperCase().includes(categoryName.toUpperCase()) ||
      f.category?.toUpperCase() === categoryName.toUpperCase()
    );
    
    if (targetFolder) {
      setOpenFolder(targetFolder);
      setOpenSubFolder(null);
      setSelected(null);
    }
  };

  // Detecta combos, bebidas de temporada y productos normales
  const handleProductClick = (product) => {
    if (product.isCombo) {
      setActiveComboFlow(product.flowKey || product.id);
    } else if (product.isSeasonal) {
      setActiveSeasonalDrink(product.seasonalKey || product.id);
    } else {
      setSelected(product);
    }
  };

  const getCategoryType = (folder) => {
    const title = folder?.title?.toUpperCase() || "";
    if (title.includes("MINIPOSTRES")) return "minipostres";
    if (title.includes("REPOSTERIA") || title.includes("PASTELES")) return "postres";
    if (title.includes("BEBIDAS") && folder.isContainer) return "bebidas-container";
    return "default";
  };

  // Función para obtener el video de promoción según el día de la semana
 // Cambia de retornar un string a retornar un array de videos
const getPromoVideoSources = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  // Videos fijos que van SIEMPRE primero
  const fixedVideos = [
   "./videos/matchapostre.mp4",
    "./videos/TEMPORADA_JUNIO.mp4",
    "./videos/HORAFELIZ.mp4",
    "./videos/NUTELLA.mp4",
    
  ];

  // Todos los videos del día (usados completos en finde)
  const allDailyVideos = [
    "./videos/COMBO.mp4",
    "./videos/MARTES.mp4",
    "./videos/MIERCOLES.mp4",
    "./videos/JUEVES.mp4",
    "./videos/COPITAS.mp4",
  ];

  // Video(s) del día
  let dailyVideos;
  switch(dayOfWeek) {
    case 0: // Domingo
    case 6: // Sábado
      dailyVideos = allDailyVideos;
      break;
    case 1: // Lunes
      dailyVideos = ["./videos/COMBO.mp4"];
      break;
    case 2: // Martes
      dailyVideos = ["./videos/MARTES.mp4"];
      break;
    case 3: // Miércoles
      dailyVideos = ["./videos/MIERCOLES.mp4"];
      break;
    case 4: // Jueves
      dailyVideos = ["./videos/JUEVES.mp4"];
      break;
    case 5: // Viernes
      dailyVideos = ["./videos/COPITAS.mp4"];
      break;
  }

  return [...fixedVideos, ...dailyVideos];
};

  const showNavFooter = openFolder || openSubFolder;
  const isAnyFlowOverlayOpen = Boolean(selected || activeComboFlow || activeSeasonalDrink || showConfirm);

  // Determinar el título de la sección de populares/temporada
  const getSectionTitle = () => {
    const hasSeasonalDrinks = seasonalConfig.enabled && 
                             seasonalConfig.drinks && 
                             seasonalConfig.drinks.length > 0;
    
    if (hasSeasonalDrinks) {
      const seasonalTitle = seasonalConfig.sectionTitle || "De Temporada";
      return `Populares/${seasonalTitle}`;
    }
    return "Populares";
  };

  return (
    <div className="min-h-screen bg-[#EAF7FA] text-ink">
      {/* CONTENEDOR CON ZOOM 125% - SOLO CONTENIDO PRINCIPAL */}
      <div 
        style={{
          transform: 'scale(1.25)',
          transformOrigin: 'top center',
          width: '80%', // 100% / 1.25 = 80%
          margin: '0 auto'
        }}
      >
        <div className="flex flex-col h-[80vh]" style={{ height: '80vh' }}> {/* 100vh / 1.25 = 80vh */}
          {/* Área de contenido scrolleable con DRAG-TO-SCROLL */}
          <div 
            ref={contentRef}
            className="flex-1 overflow-y-auto"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'smooth',
              overscrollBehavior: 'contain'
            }}
          >
            {/* Vista principal */}
            {!openFolder && !openSubFolder && (
              <div className="min-h-full flex flex-col">
                <div className="w-full space-y-8 my-auto py-8">
                {/* Botón de Combos */}
                {combos.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-700 mb-4">Ofertas Especiales</h2>
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleProductClick(combos[0])}
                        className="relative rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 overflow-hidden w-[900px] h-[200px]"
                        style={{
                          backgroundImage: `url(${comboButtonImage})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20" />
                        <div className="relative h-full flex items-center justify-center">
                          <div className="text-center">
                            <h3 className="text-3xl font-bold text-white drop-shadow-lg">COMBOS</h3>
                            <p className="text-white/90 text-lg mt-2 drop-shadow-md">COMBO ALIMENTO + BEBIDA</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Populares / De temporada - TÍTULO DINÁMICO */}
                {featured.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-700 mb-4">{getSectionTitle()}</h2>
                    <div className="flex flex-wrap justify-center gap-5">
                      {featured.slice(0, 16).map((p) => (
                        <CategoryTile 
                          key={p.id} 
                          title={p.nombre} 
                          img={p.foto} 
                          onClick={() => handleProductClick(p)}
                          isSeasonal={p.isSeasonal}
                          badge={p.badge}
                          description={p.description}
                          size="default"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Explorar */}
                <div>
                  <h2 className="text-2xl font-bold text-slate-700 mb-4">Explorar</h2>
                  <div className="flex flex-wrap justify-center gap-5">
                    {folders.map((f) => (
                      <CategoryTile 
                        key={f.id || f.title} 
                        title={f.title} 
                        img={f.image || f.foto} 
                        itemCount={f.totalItems || f.items?.length}
                        onClick={() => setOpenFolder(f)}
                        size="default"
                      />
                    ))}
                  </div>
                </div>
                </div>
              </div>
            )}

            {/* Vista de carpeta abierta */}
            {openFolder && !openSubFolder && (
              <div className="min-h-[calc(80vh-200px)] flex flex-col justify-center px-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold">{openFolder.title}</h2>
                </div>

                {openFolder.isContainer && openFolder.subCategories ? (
                  <div className="flex flex-wrap justify-center gap-8">
                    {openFolder.subCategories.map((sub) => (
                      <CategoryTile 
                        key={sub.id || sub.title} 
                        title={sub.title} 
                        img={sub.image || sub.foto}
                        itemCount={sub.items?.length}
                        onClick={() => setOpenSubFolder(sub)}
                        size="default"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap justify-center gap-6">
                    {openFolder.items.map((p) => (
                      <ProductTile 
                        key={p.id}
                        product={p}
                        onClick={handleProductClick}
                        size="default"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Vista de subcarpeta */}
            {openSubFolder && (
              <div className="min-h-[calc(80vh-200px)] flex flex-col justify-center px-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold">{openFolder.title} - {openSubFolder.title}</h2>
                </div>

                <div className="flex flex-wrap justify-center gap-6">
                  {openSubFolder.items.map((p) => (
                    <ProductTile 
                      key={p.id}
                      product={p}
                      onClick={handleProductClick}
                      size="default"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* FOOTER ESTÁTICO CON BOTONES DE NAVEGACIÓN */}
          {showNavFooter && (
            <div className="h-[120px] bg-white/95 backdrop-blur-sm border-t-2 border-gray-200 flex items-center justify-center px-8">
              <div className="flex gap-6">
                <button
                  onClick={() => {
                    if (openSubFolder) {
                      setOpenSubFolder(null);
                    } else if (openFolder) {
                      setOpenFolder(null);
                    }
                  }}
                  className="w-32 h-32 rounded-full bg-[#67CDD9] text-white shadow-xl hover:brightness-110 active:scale-95 flex items-center justify-center"
                  title="Volver"
                >
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                </button>

                <button
                  onClick={handleGoHome}
                  className="w-32 h-32 rounded-full bg-[#00B7C6] text-white shadow-xl hover:brightness-110 active:scale-95 flex items-center justify-center"
                  title="Inicio"
                >
                  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9.5L12 3l9 6.5"></path>
                    <path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10"></path>
                    <path d="M9 21v-6h6v6"></path>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* OVERLAYS - SIN ZOOM, TAMAÑO NORMAL 100% */}
      {/* Overlay de producto normal (excluye combos y temporada) */}
      {selected && !selected.isCombo && !selected.isSeasonal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50">
          <div className="absolute inset-0">
            <CustomizePage 
              producto={selected} 
              onClose={() => setSelected(null)}
              onGoHome={handleGoHome}
              onNavigateToCategory={handleNavigateToCategory}
              onPay={handlePay}
            />
          </div>
        </div>
      )}

      {/* Overlay de combos */}
      {activeComboFlow && (
        <ComboFlowOverlay
          flowKey={activeComboFlow}
          onClose={() => setActiveComboFlow(null)}
          onComplete={() => {
            setActiveComboFlow(null);
            handleGoHome();
          }}
        />
      )}

      {/* Overlay de bebidas de temporada */}
      {activeSeasonalDrink && (
        <SeasonalDrinkOverlay
          seasonalKey={activeSeasonalDrink}
          onClose={() => setActiveSeasonalDrink(null)}
          onGoHome={handleGoHome}
          onNavigateToCategory={handleNavigateToCategory}
          onPay={handlePay}
        />
      )}

      {showConfirm && <ConfirmOverlay orderNo={orderNo} onClose={closeConfirm} />}

     {showPromoVideo && (
  <PromoOverlay 
    onStart={() => setShowPromoVideo(false)}
    videoSources={getPromoVideoSources()}  
  />
)}
      
      <InactivityModal
        isOpen={showInactivity}
        onContinue={() => {
          setShowInactivity(false);
          lastActivityRef.current = Date.now();
        }}
        onExit={() => {
          clear();
          setShowInactivity(false);
          handleGoHome();
          setShowPromoVideo(true);
        }}
        timeoutSeconds={30}
      />

      {/* Carrito Flotante - SIN ZOOM */}
      {!isAnyFlowOverlayOpen && <FloatingCart onPay={handlePay} />}
    </div>
  );
}
