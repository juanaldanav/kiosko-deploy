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
import AtrasFlotante from "../components/AtrasFlotante";
import FlechasScroll from "../components/FlechasScroll";

// Great Vibes en MAYÚSCULAS no se lee: "BEBIDAS FRÍAS" -> "Bebidas Frías"
const tituloScript = (t = "") => t.toLowerCase().replace(/(^|[\s/(-])(\S)/g, (_, a, c) => a + c.toUpperCase());

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
      titleSize: "text-base",
      priceSize: "text-xl"
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
        className={`${config.container} k-card relative overflow-hidden transition-all duration-200 flex flex-col
                  ${count > 0 ? "k-sel" : ""}`}
      >
        {count > 0 && (
          <div className="absolute top-2 right-2 z-10 w-9 h-9 rounded-full bg-k-primario text-k-sobreprimario text-lg font-bold grid place-items-center shadow-lg">
            {count}
          </div>
        )}

        <div
          onClick={inc}
          className={`${config.imageHeight} k-foto w-full overflow-hidden cursor-pointer active:scale-95 transition-transform`}
        >
          <img
            src={product.foto || "./images/placeholder.png"}
            onError={(e) => { e.currentTarget.src = "./images/placeholder.png"; }}
            className="w-full h-full object-cover"
            alt={product.nombre}
          />
        </div>

        <div className={`${config.padding} flex flex-col justify-between flex-1`}>
          <div onClick={inc} className="cursor-pointer flex flex-col flex-1">
            <h3 className={`${config.titleSize} font-semibold text-k-tinta text-center leading-tight mb-2 uppercase min-h-[3.75em] grid place-items-center`}>
              {product.nombre}
            </h3>
            <p className={`${config.priceSize} font-bold text-k-acento text-center mb-2 mt-auto`}>
              ${product.precio || 0}
            </p>
          </div>

          {/* Stepper -N+ por postre (compacto) */}
          <div className="flex items-center justify-center gap-3 bg-k-superficie2 rounded-full px-3 py-2 w-fit mx-auto">
            <button
              onClick={dec}
              disabled={count === 0}
              className="shrink-0 w-11 h-11 grid place-items-center rounded-full bg-k-superficie text-k-primario border-2 border-k-acento active:scale-95 disabled:opacity-40 text-2xl font-bold transition-all leading-none"
            >
              −
            </button>
            <span className="w-8 text-center text-xl font-bold text-k-tinta">{count}</span>
            <button
              onClick={inc}
              className="shrink-0 w-11 h-11 grid place-items-center rounded-full bg-k-primario text-k-sobreprimario shadow-sm active:scale-95 text-2xl font-bold transition-all leading-none"
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
      className={`${config.container} k-card overflow-hidden transition-all duration-200
                active:scale-95 flex flex-col`}
    >
      <div className={`${config.imageHeight} k-foto w-full overflow-hidden`}>
        <img
          src={product.foto || "./images/placeholder.png"}
          onError={(e) => { e.currentTarget.src = "./images/placeholder.png"; }}
          className="w-full h-full object-cover"
          alt={product.nombre}
        />
      </div>

      <div className={`${config.padding} flex flex-col justify-between flex-1`}>
        <h3 className={`${config.titleSize} font-semibold text-k-tinta text-center leading-tight mb-2 uppercase min-h-[3.75em] grid place-items-center`}>
          {product.nombre}
        </h3>
        <p className={`${config.priceSize} font-bold text-k-acento text-center mt-auto`}>
          ${product.precio || 0}
        </p>
      </div>
    </button>
  );
}

// Tile genérico para categorías - BADGE DINÁMICO DESDE CONFIG
function CategoryTile({ title, img, onClick, itemCount, isCombo = false, isSeasonal = false, displayPrice, description, size = "default", badge, sinEtiqueta = false }) {
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
      className={`relative k-card active:scale-95 transition-all duration-200 overflow-hidden
                w-full h-full flex flex-col`}
    >
      {/* Badge de precio para combos */}
      {isCombo && displayPrice && (
        <div className="absolute top-2 right-2 z-10 bg-k-badge text-white text-sm px-3 py-1 rounded-full font-bold">
          ${displayPrice}
        </div>
      )}
      
      <div className="flex-1 min-h-0 overflow-hidden k-foto">
        <img
          src={img || "./images/placeholder.png"}
          onError={(e) => { e.currentTarget.src = "./images/placeholder.png"; }}
          className="w-full h-full object-cover"
          alt={title}
        />
      </div>
      
      <div className="p-3">
        <h3 className={`${textSizes[size]} font-semibold text-k-tinta text-center leading-tight uppercase`}>
          {title}
        </h3>
        {/* Mostrar descripción para bebidas de temporada */}
        {isSeasonal && description && (
          <p className="text-xs text-k-tinta2 mt-1 text-center">
            {description}
          </p>
        )}
        {itemCount !== undefined && !isSeasonal && (
          <p className="text-xs text-k-tinta2 mt-1 text-center">
            ({itemCount} productos)
          </p>
        )}
      </div>
    </button>

    {/* Etiqueta de temporada: sobresale de la esquina. badge.image = logo PNG (ej. Nutella) */}
    {((isSeasonal && !sinEtiqueta) || badge) && (
      <div className="absolute -top-3 -left-2 z-20 pointer-events-none">
        {badge && badge.image ? (
          <img
            src={badge.image}
            alt={seasonalText}
            className="h-9 w-auto -rotate-12 drop-shadow-xl"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <span className="k-badge-temporada -rotate-3">
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
    // 7 s: la animacion termina a los ~2.5 s y el numero tiene que alcanzar a leerse.
    const timer = setTimeout(() => {
      window.location.reload();
    }, 7000);

    return () => clearTimeout(timer);
  }, []);

  const mensaje = "Pasa a ventanilla por tu pedido".split(" ");

  return (
    <div className="orden-lista" role="status">
      <div className="k-nieve" aria-hidden="true" />
      <div className="circulo">
        <i className="k-destello d1" aria-hidden="true" />
        <i className="k-destello d2" aria-hidden="true" />
        <i className="k-destello d3" aria-hidden="true" />
        <svg width="140" height="140" viewBox="0 0 52 52" fill="none" aria-hidden="true">
          <path className="check" d="M12 27l10 10 19-21" stroke="var(--k-exito-check)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="k-script">¡Orden lista!</h2>
      <div className="numero">
        <small>Número de orden</small>
        <strong>#{orderNo}</strong>
      </div>
      <p>
        {mensaje.map((w, i) => (
          <span key={i} style={{ "--i": i }}>{w}&nbsp;</span>
        ))}
      </p>
      <button onClick={onClose}>Nueva orden</button>
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
  const [hayMasAbajo, setHayMasAbajo] = useState(false);
  
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
    // null = todavia no se leyo el puente. OJO: 0 es un valor VALIDO
    // (refreshTimestamp arranca en 0 cada vez que el puente levanta, y
    // nodemon lo reinicia en cada deploy). Usar 0 como centinela se comia
    // la PRIMERA senal de refresh del dia: la sucursal apagaba un producto
    // en el admin y el kiosko seguia mostrandolo hasta el siguiente apagado.
    let lastTimestamp = null;
    
    const checkRefresh = setInterval(async () => {
      try {
        const res = await fetch('http://localhost:3001/api/visibility/refresh-status');
        const data = await res.json();
        if (data.ok && lastTimestamp !== null && data.timestamp > lastTimestamp) {
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
        
        // Banner de combo: imagen ALEATORIA entre las variantes (rota en cada carga). Solo visual,
        // no afecta el flujo del combo (ComboFlowOverlay arma alimento + bebida).
        const BANNER_COMBO_IMAGES = [
          './images/camb.jpg', './images/camc.jpg', './images/ciamb.jpg', './images/ciamc.jpg',
          './images/cbmic.jpg', './images/ccmic.jpg', './images/lmb.jpg', './images/lmc.jpg',
          './images/cbiar.jpg', './images/biml.jpg', './images/cbiic.jpg', './images/refresher_combo.png'
        ];
        if (catalogCombos && catalogCombos.length > 0) {
          setComboButtonImage(BANNER_COMBO_IMAGES[Math.floor(Math.random() * BANNER_COMBO_IMAGES.length)]);
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
    "./videos/NAVIDAD.mp4",
    "./videos/HORAFELIZ.mp4",
    "./videos/PASTEL_VAINILLA.mp4",
    "./videos/CUMPLEANERO.mp4",
  ];

  // Todos los videos del día (usados completos en finde)
  const allDailyVideos = [
    "./videos/KIOSKO_REFRESHER.mp4",
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
      dailyVideos = ["./videos/KIOSKO_REFRESHER.mp4"];
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

  // Al cambiar de vista: lista arriba y aviso "desliza" solo si de verdad hay más abajo
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    el.scrollTop = 0;
    const revisa = () => setHayMasAbajo(el.scrollHeight - el.scrollTop - el.clientHeight > 8);
    const raf = requestAnimationFrame(revisa);
    el.addEventListener('scroll', revisa, { passive: true });
    return () => { cancelAnimationFrame(raf); el.removeEventListener('scroll', revisa); };
  }, [openFolder, openSubFolder, contentRef]);

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

  // Qué bebida de temporada está en cada tercio de la foto del encabezado (izq, centro, der)
  const FOTO_TEMPORADA_ORDEN = ["PISTACHE", "SPANISH LATTE", "CARAMELO SALADO"];
  const FOTO_TEMPORADA_NOMBRE = ["Pistacchio Latte", "Spanish Latte", "Caramelo Salado"]; // como dice el video
  const FOTO_TEMPORADA_CENTRO = [19.6, 50.6, 81.9]; // % del ancho donde está el centro de cada vaso en la foto
  const fotoTemporada = featured.some(p => p.isSeasonal)
    ? FOTO_TEMPORADA_ORDEN.map(n => featured.find(p => p.isSeasonal && p.nombre?.toUpperCase() === n) || null)
    : [];

  const tituloCarpeta = openSubFolder
    ? `${openFolder.title} - ${openSubFolder.title}`
    : openFolder?.title;
  const conteoCarpeta = (openSubFolder || openFolder)?.isContainer
    ? null
    : (openSubFolder || openFolder)?.items?.length;

  return (
    <div className="min-h-screen k-app text-ink">
      {/* CONTENEDOR CON ZOOM 125% - SOLO CONTENIDO PRINCIPAL
          Medidas en px de esta caja (x1.25 = px reales de la pantalla 1080x1920):
          encabezado 480 (=600) | banda de alcance 720 (=900, y 600-1500) | pie 336 (=420) */}
      <div 
        style={{
          transform: 'scale(1.25)',
          transformOrigin: 'top center',
          width: '80%', // 100% / 1.25 = 80%
          margin: '0 auto'
        }}
      >
        <div className="flex flex-col h-[80vh]" style={{ height: '80vh' }}> {/* 100vh / 1.25 = 80vh */}
          {/* Encabezado decorativo (y 0-600 real): no lleva nada tocable, el cliente de auto no alcanza */}
          <header className={`relative h-[480px] shrink-0 flex flex-col items-center text-center px-6 select-none ${openFolder ? "justify-center" : "justify-start pt-9"}`}>
            <div className="k-nieve" aria-hidden="true" />
            {!openFolder ? (
              <>
                <span className="k-logo w-[260px] relative" role="img" aria-label="Lamarque Repostería & Café" />
                {fotoTemporada.length > 0 && (
                  <>
                    <p className="relative mt-3 flex items-center gap-2 text-[15px] font-bold uppercase tracking-[.14em] text-k-sobrefondo2">
                      <i className="k-destello text-[12px]" aria-hidden="true" />
                      De temporada · toca la tuya para pedirla
                      <i className="k-destello text-[12px]" aria-hidden="true" />
                    </p>
                    {/* Foto real de las bebidas de temporada (cuadro del video NAVIDAD). Cambiarla cada temporada
                        junto con FOTO_TEMPORADA_ORDEN (qué bebida está en cada tercio de la foto). */}
                    <div className="absolute left-0 right-0 bottom-0 h-[340px]">
                      <img
                        src="./images/tema/bebidas-temporada.jpg"
                        alt=""
                        aria-hidden="true"
                        onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                        style={{
                          objectPosition: '50% 15%',
                          WebkitMaskImage: 'linear-gradient(180deg, transparent 0, #000 22%, #000 70%, transparent 100%)',
                          maskImage: 'linear-gradient(180deg, transparent 0, #000 22%, #000 70%, transparent 100%)'
                        }}
                      />
                      <div className="absolute inset-0">
                        {fotoTemporada.map((p, i) => p ? (
                          <button
                            key={p.id}
                            onClick={() => handleProductClick(p)}
                            className="absolute top-0 bottom-0 flex items-end justify-center pb-4 active:scale-95 transition-transform"
                            style={{ left: `${FOTO_TEMPORADA_CENTRO[i] - 16}%`, width: '32%' }}
                            aria-label={`Pedir ${p.nombre}`}
                          >
                            <span
                              className="k-script whitespace-nowrap rounded-xl h-[50px] px-5 inline-flex items-center justify-center shadow-lg"
                              style={{
                                '--fs': '34px',
                                lineHeight: 1,
                                paddingTop: '4px', // Great Vibes carga la letra hacia arriba: compensa el centro óptico
                                color: '#E4C9A0',
                                background: 'rgba(62, 13, 14, .55)',
                                textShadow: '0 1px 2px rgba(0,0,0,.35)'
                              }}
                            >
                              {FOTO_TEMPORADA_NOMBRE[i]}
                            </span>
                          </button>
                        ) : <span key={i} />)}
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <span className="k-logo w-[200px] mb-8" role="img" aria-label="Lamarque Repostería & Café" />
                <h2 className="k-script text-k-sobrefondo px-4" style={{ '--fs': openSubFolder ? '60px' : '72px' }}>
                  {tituloScript(tituloCarpeta)}
                </h2>
                {conteoCarpeta ? (
                  <p className="mt-4 flex items-center gap-4 text-lg font-medium text-k-sobrefondo2">
                    <span className="w-20 h-px bg-current opacity-60" />
                    {conteoCarpeta} productos
                    <span className="w-20 h-px bg-current opacity-60" />
                  </p>
                ) : null}
              </>
            )}
          </header>

          {/* Banda de alcance (y 600-1500 real): todo lo tocable vive aqui, con scroll propio */}
          <div 
            ref={contentRef}
            className="h-[720px] shrink-0 overflow-y-auto"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'smooth',
              overscrollBehavior: 'contain'
            }}
          >
            {/* Vista principal */}
            {!openFolder && !openSubFolder && (
              <div className="w-full space-y-8 pt-3 pb-8">
                {/* Botón de Combos (un combo no es "oferta especial": sin título de sección) */}
                {combos.length > 0 && (
                  <div className="flex justify-center px-4">
                    <button
                      onClick={() => handleProductClick(combos[0])}
                      className="relative k-card w-full max-w-[820px] h-[170px] overflow-hidden flex active:scale-95 transition-transform duration-200 text-left"
                    >
                      <div
                        className="w-[42%] h-full shrink-0"
                        style={{
                          backgroundImage: `url(${comboButtonImage})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      />
                      <div className="flex-1 h-full bg-k-primario text-k-sobreprimario flex flex-col items-center justify-center gap-2">
                        <h3 className="text-4xl font-extrabold tracking-[.08em] flex items-center gap-3">
                          <i className="k-destello text-xl opacity-70" aria-hidden="true" />
                          COMBOS
                          <i className="k-destello text-xl opacity-70" aria-hidden="true" />
                        </h3>
                        <p className="text-lg font-semibold opacity-90">COMBO ALIMENTO + BEBIDA</p>
                      </div>
                    </button>
                  </div>
                )}

                {/* Populares / De temporada - TÍTULO DINÁMICO */}
                {featured.length > 0 && (
                  <div>
                    <h2 className="k-script text-k-sobrefondo mb-4 px-4" style={{ '--fs': '56px' }}>{getSectionTitle()}</h2>
                    <div className="flex flex-wrap justify-center gap-5 pt-2">
                      {featured.slice(0, 16).map((p) => (
                        <CategoryTile 
                          key={p.id} 
                          title={p.nombre} 
                          img={p.foto} 
                          onClick={() => handleProductClick(p)}
                          isSeasonal={p.isSeasonal}
                          badge={p.badge}
                          sinEtiqueta={p.sinEtiqueta}
                          description={p.description}
                          size="default"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Explorar */}
                <div>
                  <h2 className="k-script text-k-sobrefondo mb-4 px-4" style={{ '--fs': '56px' }}>Explorar</h2>
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
            )}

            {/* Vista de carpeta abierta (el título va en el encabezado decorativo) */}
            {openFolder && !openSubFolder && (
              <div className={`min-h-full flex flex-col px-6 py-4 ${openFolder.isContainer ? "justify-center" : ""}`}>
                {openFolder.isContainer && openFolder.subCategories ? (
                  <div className="flex flex-wrap justify-center gap-8">
                    {openFolder.subCategories.map((sub) => (
                      <CategoryTile 
                        key={sub.id || sub.title} 
                        title={sub.title} 
                        img={sub.image || sub.foto}
                        itemCount={sub.items?.length}
                        onClick={() => setOpenSubFolder(sub)}
                        size="large"
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
              <div className="px-6 py-4">
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
            <FlechasScroll target={contentRef} />
          </div>

          {/* Pie decorativo bajo la banda */}
          <div className="flex-1 min-h-0 flex items-center justify-center select-none" aria-hidden="true">
            {showNavFooter ? null : (
              <p className="k-script text-k-sobrefondo" style={{ '--fs': '64px' }}>Hoy es un buen día.</p>
            )}
          </div>

          {/* FOOTER ESTÁTICO CON BOTONES DE NAVEGACIÓN: Atrás = contorno, Inicio = relleno */}
          {showNavFooter && (
            <div className="h-[136px] shrink-0 k-barra flex items-center justify-center px-8">
              <div className="flex gap-8">
                <button
                  onClick={() => {
                    if (openSubFolder) {
                      setOpenSubFolder(null);
                    } else if (openFolder) {
                      setOpenFolder(null);
                    }
                  }}
                  className="w-[104px] h-[104px] rounded-full k-btn-atras shadow-lg active:scale-95 flex items-center justify-center"
                  title="Volver"
                  aria-label="Volver"
                >
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                </button>

                <button
                  onClick={handleGoHome}
                  className="w-[104px] h-[104px] rounded-full k-btn-inicio shadow-lg active:scale-95 flex items-center justify-center"
                  title="Inicio"
                  aria-label="Inicio"
                >
                  <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

      {/* Atrás flotante a media altura (fuera del zoom: el transform movería el "fixed") */}
      {showNavFooter && !isAnyFlowOverlayOpen && !showPromoVideo && (
        <AtrasFlotante onClick={() => (openSubFolder ? setOpenSubFolder(null) : setOpenFolder(null))} />
      )}

      {/* Carrito Flotante - SIN ZOOM */}
      {!isAnyFlowOverlayOpen && <FloatingCart onPay={handlePay} ocultarPestana={showInactivity} />}
    </div>
  );
}
