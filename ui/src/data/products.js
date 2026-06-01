// src/data/products.js - VERSION UNIFICADA: COMBOS, ROTACION DE IMAGENES, BEBIDAS DE TEMPORADA Y VISIBILIDAD
// ACTUALIZADO: Bebidas de temporada ahora se leen de seasonal_config.json
let _CACHE = null;
let _HIDDEN_PRODUCTS = [];
let _HIDDEN_SIZES = []; // Tamanos ocultos (formato "productId:sizeLabel")
let _HIDDEN_COLORS = []; // Colores ocultos (formato "productId:colorId")

// === DETECCIÓN AUTOMÁTICA DE IP ===
// Si entras como localhost, usa localhost. Si entras por IP (192.168...), usa esa IP.
const hostname = window.location.hostname;
const API_URL = hostname === 'localhost' 
  ? 'http://localhost:3001' 
  : `http://${hostname}:3001`;

const PLACEHOLDER_IMG = "./images/placeholder.png";
const toNum = (v) => Number(v ?? 0);
const clean = (s = "") => String(s).replace(/\s{2,}/g, " ").trim();

// Normaliza claves: sin acentos, mayúsculas, espacios compactados
function normKey(s = "") {
  return String(s)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

// ID seguro para rutas/keys (sin acentos, minúsculas, snake_case)
function slugifyId(s = "") {
  return normKey(s)
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

// ========================================
// FUNCIONES DE VISIBILIDAD
// ========================================
async function fetchHiddenProducts() {
  try {
    const res = await fetch(`${API_URL}/api/visibility`);
    const data = await res.json();
    if (data.ok) {
      _HIDDEN_PRODUCTS = data.hidden || [];
    }
  } catch (err) {
    console.warn('⚠️ No se pudo cargar lista de productos ocultos:', err.message);
    _HIDDEN_PRODUCTS = [];
  }
  return _HIDDEN_PRODUCTS;
}

function isProductHidden(productId) {
  return _HIDDEN_PRODUCTS.includes(Number(productId));
}



// ========================================
// FUNCIONES DE VISIBILIDAD - TAMANOS (SOLO REPOSTERIA)
// ========================================
async function fetchHiddenSizes() {
  try {
    const res = await fetch(`${API_URL}/api/visibility/sizes`);
    const data = await res.json();
    if (data.ok) {
      _HIDDEN_SIZES = data.hiddenSizes || [];
    }
  } catch (err) {
    // Silenciar error - no afecta funcionamiento normal
    _HIDDEN_SIZES = [];
  }
  return _HIDDEN_SIZES;
}

function isSizeHidden(productId, sizeLabel) {
  const sizeKey = `${productId}:${sizeLabel}`;
  return _HIDDEN_SIZES.includes(sizeKey);
}

// ========================================
// FUNCIONES DE VISIBILIDAD - COLORES
// ========================================
async function fetchHiddenColors() {
  try {
    const res = await fetch(`${API_URL}/api/visibility/colors`);
    const data = await res.json();
    if (data.ok) _HIDDEN_COLORS = data.hiddenColors || [];
  } catch {
    _HIDDEN_COLORS = [];
  }
  return _HIDDEN_COLORS;
}

function isColorHidden(productId, colorId) {
  return _HIDDEN_COLORS.includes(`${productId}:${colorId}`);
}

// ========================================
// BEBIDAS DE TEMPORADA - AHORA DINÁMICO DESDE JSON
// ========================================
import seasonalConfig from "./seasonal_config.json";

// Construir definiciones desde la configuración JSON
const SEASONAL_DRINK_DEFINITIONS = seasonalConfig.enabled && seasonalConfig.drinks
  ? seasonalConfig.drinks.map(drink => ({
      seasonalKey: drink.seasonalKey,
      productName: drink.name,
      displayName: drink.displayName,
      image: drink.image,
      isSeasonal: true,
      description: drink.description,
      badge: drink.badge
    }))
  : [];

// Productos populares regulares (sin seasonal hardcodeado)
const POPULAR = [
  "M. MATCHA FRUTOS ROJOS",
  "ICED COFFEE",
  "FRAPPUCCINO",
  "VANILLA ICED",
  "LATTE",
  "COLD BREW LIMON",
  "ICED CHAI"
];

// Definición de combos disponibles
const COMBO_DEFINITIONS = [
  { 
    flowKey: "combo_americano_baguette", 
    productName: "COMBO AMERICANO + BAGUETTE",
    image: "./images/camb.jpg",
    displayPrice: 139
  },
  { 
    flowKey: "combo_americano_croissant", 
    productName: "COMBO AMERICANO + CROISSANT",
    image: "./images/camc.jpg",
    displayPrice: 139
  },
  { 
    flowKey: "combo_iced_americano_baguette", 
    productName: "COMBO ICED AMERICANO + BAGUETTE",
    image: "./images/ciamb.jpg",
    displayPrice: 139 
  },
  { 
    flowKey: "combo_iced_americano_croissant", 
    productName: "COMBO ICED AMERICANO + CROISSANT",
    image: "./images/ciamc.jpg",
    displayPrice: 139
  },
  { 
    flowKey: "combo_iced_coffee_baguette", 
    productName: "COMBO ICED COFFEE + BAGUETTE",
    image: "./images/cbmic.jpg",
    displayPrice: 139
  },
  { 
    flowKey: "combo_iced_coffee_croissant", 
    productName: "COMBO ICED COFFEE + CROISSANT",
    image: "./images/ccmic.jpg",
    displayPrice: 139
  },
  { 
    flowKey: "combo_latte_baguette",
    productName: "COMBO LATTE + BAGUETTE",
    image: "./images/lmb.jpg",
    displayPrice: 139
  },
  { 
    flowKey: "combo_latte_croissant",
    productName: "COMBO LATTE + CROISSANT",
    image: "./images/lmc.jpg",
    displayPrice: 139
  },
  { 
    flowKey: "combo_italiano_americano_rocks", 
    productName: "COMBO BAGUETTE ITALIANO + ICED AMERICANO",
    image: "./images/cbiar.jpg",
    displayPrice: 139
  },
  { 
    flowKey: "combo_italiano_latte",
    productName: "COMBO BAGUETTE ITALIANO + LATTE",
    image: "./images/biml.jpg",
    displayPrice: 139
  },
  { 
    flowKey: "combo_italiano_iced_coffee", 
    productName: "COMBO BAGUETTE ITALIANO + ICED COFFEE",
    image: "./images/cbiic.jpg",
    displayPrice: 139
  }
];

// Reglas de dependencia para mostrar combos.
// Cada grupo interno representa alternativas: al menos una debe estar visible.
const COMBO_REQUIRED_PRODUCT_GROUPS = {
  combo_americano_baguette: [[1899, 1900]],
  combo_americano_croissant: [[1901]],
  combo_iced_americano_baguette: [[1899, 1900]],
  combo_iced_americano_croissant: [[1901]],
  combo_iced_coffee_baguette: [[1899, 1900]],
  combo_iced_coffee_croissant: [[1901]],
  combo_latte_baguette: [[1899, 1900]],
  combo_latte_croissant: [[1901]],
  combo_italiano_americano_rocks: [[2342]],
  combo_italiano_latte: [[2342]],
  combo_italiano_iced_coffee: [[2342]],
};

function isComboAvailable(flowKey) {
  const requiredGroups = COMBO_REQUIRED_PRODUCT_GROUPS[flowKey] || [];
  if (!requiredGroups.length) return true;

  return requiredGroups.every((group) => {
    if (!Array.isArray(group) || !group.length) return true;
    return group.some((productId) => !isProductHidden(productId));
  });
}

// Portadas fijas por familia (URLs Wansoft)
const GROUP_COVERS = {
  "BEBIDAS CALIENTES CON CAFÉ":
    "https://www.wansoft.net/Wansoft.Web/Uploads/eCommerceImages/Thumbnail/2024/11/27/73605e22-7757-404e-999e-c12673329f5b.jpg",
  "BEBIDAS CALIENTES SIN CAFÉ":
    "https://www.wansoft.net/Wansoft.Web/Uploads/eCommerceImages/Thumbnail/2024/11/27/b4786c7a-c065-47e3-840b-9800850a5404.jpg",
  "BEBIDAS FRÍAS CON CAFÉ":
    "https://www.wansoft.net/Wansoft.Web/Uploads/eCommerceImages/Thumbnail/2024/11/27/2999e2a6-7dcf-411d-8655-6bc8b3412c5c.jpg",
  "BEBIDAS FRÍAS SIN CAFÉ":
    "https://www.wansoft.net/Wansoft.Web/Uploads/eCommerceImages/Thumbnail/2024/11/27/2977e1fe-4a7f-422b-9c38-68cdc4abf859.jpg",
  "COMBOS":
    "https://www.wansoft.net/Wansoft.Web/Uploads/eCommerceImages/Thumbnail/2024/11/27/combos-cover.jpg",
  "MINIPOSTRES":
    "https://www.wansoft.net/Wansoft.Web/Uploads/eCommerceImages/Thumbnail/2024/11/27/c796c360-a70f-4f2a-9997-7dd6d0340ee7.jpg"
};

const GROUP_COVERS_NORM = Object.fromEntries(
  Object.entries(GROUP_COVERS).map(([k, v]) => [normKey(k), v])
);

function processImageUrl(url) {
  if (!url || url.trim() === "") {
    return PLACEHOLDER_IMG;
  }
  const trimmedUrl = url.trim();
  if (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")) {
    return trimmedUrl;
  }
  if (trimmedUrl.startsWith("./images/")) {
    return `.${trimmedUrl}`;
  }
  return trimmedUrl;
}

function pickDefaultSizeLabel(p) {
  return p?.defaultSize || "Grande";
}

function basePriceOf(p, label) {
  const sizes = p?.sizes || [];
  const size = sizes.find(
    (x) => String(x.label).toLowerCase() === String(label).toLowerCase()
  );
  if (size) return toNum(size.basePrice);
  if (sizes.length) return Math.min(...sizes.map((x) => toNum(x.basePrice ?? 0)));
  return 0;
}

function computeVariantsWithDelta(p, defaultLabel, productId) {
  const sizes = p?.sizes || [];
  const defaultPrice = basePriceOf(p, defaultLabel);
  const category = p?.category || "";
  
  // Solo aplicar disabled a REPOSTERIA (pasteles 1725-1731)
  const isReposteria = category.toUpperCase() === "REPOSTERIA";
  const numProductId = Number(productId);
  const isPastel = isReposteria && numProductId >= 1725 && numProductId <= 1731;

  return sizes.map((size) => ({
    label: size.label,
    ozLabel: size.ozLabel,
    ProductId: size.productId,
    ProductName: size.productName,
    BasePrice: size.basePrice,
    tamanoId: size.tamanoId,
    image: processImageUrl(size?.image),
    priceDelta: Math.max(0, toNum(size.basePrice) - defaultPrice),
    // Solo marcar disabled si es pastel Y el tamano esta oculto
    disabled: isPastel ? isSizeHidden(numProductId, size.label) : false,
  }));
}

function normModOption(opt = {}) {
  const priceDefault = toNum(opt?.basePrice ?? 0);
  return {
    id: opt?.id ?? null,
    name: opt?.name ?? "",
    priceDelta: priceDefault,
    idsPerSize: opt?.idsPerSize || {},
    pricesPerSize: opt?.pricesPerSize || {},
    icon: opt?.icon || null,
    _raw: opt,
  };
}

function normModGroup(m = {}) {
  const options = Array.isArray(m?.options) ? m.options : [];
  return {
    tipo: m?.type ?? "otros",
    titulo: m?.title ?? "",
    level: Number(m?.level ?? 0),
    required: Boolean(m?.required ?? false),
    opciones: options.map((o) => normModOption(o)),
    type: m?.type,
    title: m?.title,
    options: m?.options || [],
  };
}

function mapProduct(p) {
  const name = clean(p?.productName || "");
  const foto = processImageUrl(p?.image);
  const groupTitle = p?.category || "";

  const defaultLabel = pickDefaultSizeLabel(p);
  const defaultBase = basePriceOf(p, defaultLabel);
  const variants = computeVariantsWithDelta(p, defaultLabel, p?.productId);

  const modifiers = Array.isArray(p?.modifiers)
    ? p.modifiers
        .slice()
        .sort((a, b) => Number(a?.level ?? 0) - Number(b?.level ?? 0))
        .map((g) => normModGroup(g))
    : [];

  const Modifiers =
    p?.modifiers?.map((m) => ({
      ...m,
      type: m.type,
      title: m.title,
      level: m.level,
      required: m.required,
      options:
        m.options?.map((opt) => ({
          ...opt,
          id: opt.id,
          name: opt.name,
          basePrice: opt.basePrice,
          idsPerSize: opt.idsPerSize || {},
          pricesPerSize: opt.pricesPerSize || {},
        })) || [],
    })) || [];

  const rawColors = Array.isArray(p?.colorOptions) ? p.colorOptions : null;
  const colorOptions = rawColors
    ? rawColors.map(c => ({ ...c, disabled: isColorHidden(String(p?.productId ?? ''), c.id) }))
    : null;

  return {
    id: String(p?.productId ?? ""),
    nombre: name,
    displayName: name,
    foto,
    precio: defaultBase,
    grupo: groupTitle,
    modifiers,
    Modifiers,
    DefaultSizeLabel: defaultLabel,
    defaultSize: defaultLabel,
    ProductsBySize: variants,
    sizes: p?.sizes || [],
    category: groupTitle,
    colorOptions,
  };
}

// Función para asignar portadas con rotación aleatoria
function assignCoversToGroups(folders) {
  folders.forEach((folder) => {
    const key = normKey(folder.title || "");
    let chosenImage = GROUP_COVERS_NORM[key] || PLACEHOLDER_IMG;

    // Si no hay portada fija, elegir aleatoriamente de los items
    if (chosenImage === PLACEHOLDER_IMG && folder.items?.length > 0) {
      const uniqueImages = [...new Set(
        folder.items
          .map((p) => p.foto)
          .filter((img) => img && img !== PLACEHOLDER_IMG)
      )];

      if (uniqueImages.length > 0) {
        const randomIndex = Math.floor(Math.random() * uniqueImages.length);
        chosenImage = uniqueImages[randomIndex];

        if (import.meta.env.DEV) {
          console.log(`📸 ${folder.title}: ${uniqueImages.length} imágenes disponibles, eligió índice ${randomIndex}`);
        }
      }
    }

    folder.image = chosenImage;
    folder.foto = chosenImage;
  });
}

// === CARGA DE CATÁLOGO: import del JSON en src/data ===
async function fetchCatalogJSON() {
  try {
    const mod = await import("./catalog_app.json");
    return mod.default ?? mod;
  } catch (error) {
    if (!import.meta.env.PROD) {
      const res = await fetch("/data/catalog_app.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    }
    throw error;
  }
}

export async function loadCatalog() {
  // Cargar productos ocultos, tamanos ocultos y colores ocultos
  await fetchHiddenProducts();
  await fetchHiddenSizes();
  await fetchHiddenColors();
  
  const data = await fetchCatalogJSON();
  const products = Array.isArray(data) ? data : data?.catalog || [];

  if (import.meta.env.DEV) {
    console.log(`🔄 Cargando catálogo con ${products.length} productos`);
    console.log(`👁️ Productos ocultos: ${_HIDDEN_PRODUCTS.length}`);
    console.log(`🎄 Bebidas de temporada: ${SEASONAL_DRINK_DEFINITIONS.length} (enabled: ${seasonalConfig.enabled})`);
  }

  // Filtrar productos ocultos desde el inicio
  // Si es REPOSTERIA y todos sus tamaños están ocultos, ocultar el producto completo
  const visibleProducts = products.filter(p => {
    if (isProductHidden(p.productId)) return false;
    if (p.category === 'REPOSTERIA' && Array.isArray(p.sizes) && p.sizes.length > 0) {
      const allHidden = p.sizes.every(s => isSizeHidden(p.productId, s.label));
      if (allHidden) return false;
    }
    if (Array.isArray(p.colorOptions) && p.colorOptions.length > 0) {
      const allColorsHidden = p.colorOptions.every(c => isColorHidden(p.productId, c.id));
      if (allColorsHidden) return false;
    }
    return true;
  });

  // Mapas para agrupar
  const groupsMap = new Map();
  const parentGroups = new Map();

  visibleProducts.forEach((p) => {
    const category = p.category || "Sin categoría";
    const parentCategory = p.parentCategory || null;

    if (parentCategory) {
      if (!parentGroups.has(parentCategory)) {
        parentGroups.set(parentCategory, new Map());
      }
      const subGroups = parentGroups.get(parentCategory);
      const subCategoryName = p.subcategory || category;

      if (!subGroups.has(subCategoryName)) {
        subGroups.set(subCategoryName, {
          id: slugifyId(subCategoryName),
          title: subCategoryName,
          originalCategory: category,
          image: PLACEHOLDER_IMG,
          foto: PLACEHOLDER_IMG,
          items: [],
        });
      }
      const mappedProduct = mapProduct(p);
      subGroups.get(subCategoryName).items.push(mappedProduct);
    } else {
      if (!groupsMap.has(category)) {
        groupsMap.set(category, {
          id: category.toLowerCase().replace(/\s+/g, "_"),
          title: category,
          image: PLACEHOLDER_IMG,
          foto: PLACEHOLDER_IMG,
          items: [],
        });
      }
      const mappedProduct = mapProduct(p);
      groupsMap.get(category).items.push(mappedProduct);
    }
  });

  // Construir la estructura final
  const folderTiles = [];

  // AGREGAR CARPETA DE COMBOS AL INICIO
  const combosFolder = {
    id: "combos",
    title: "COMBOS",
    image: GROUP_COVERS.COMBOS || PLACEHOLDER_IMG,
    foto: GROUP_COVERS.COMBOS || PLACEHOLDER_IMG,
    isCombo: true,
    items: COMBO_DEFINITIONS
      .filter((combo) => isComboAvailable(combo.flowKey))
      .map(combo => ({
        ...combo,
        id: combo.flowKey,
        nombre: combo.productName,
        displayName: combo.productName,
        foto: processImageUrl(combo.image),
        precio: combo.price,
        displayPrice: combo.displayPrice,
        grupo: "COMBOS",
        isCombo: true
      }))
  };
  folderTiles.push(combosFolder);

  // Agregar contenedores padres (con subcategorías)
  for (const [parentName, subGroups] of parentGroups.entries()) {
    const subCategories = Array.from(subGroups.values());
    const flatten = subCategories.flatMap((s) => s.items);

    const parentFolder = {
      id: slugifyId(parentName),
      title: parentName,
      image: PLACEHOLDER_IMG,
      foto: PLACEHOLDER_IMG,
      isContainer: true,
      subCategories,
      items: flatten,
      totalItems: flatten.length,
    };

    folderTiles.push(parentFolder);
  }

  // Agregar categorías independientes (solo si tienen items visibles)
  for (const folder of groupsMap.values()) {
    if (folder.items.length > 0) {
      folderTiles.push(folder);
    }
  }

  // Asignar portadas con rotación aleatoria
  assignCoversToGroups(folderTiles);
  folderTiles.forEach((f) => {
    if (f.subCategories) assignCoversToGroups(f.subCategories);
  });

  // Alias foto -> image
  folderTiles.forEach((f) => {
    if (!f.foto) f.foto = f.image || PLACEHOLDER_IMG;
    if (f.subCategories) {
      f.subCategories.forEach((sub) => {
        if (!sub.foto) sub.foto = sub.image || PLACEHOLDER_IMG;
      });
    }
  });

  // Recolectar todos para "featured"
  const all = [];
  folderTiles.forEach((f) => {
    if (f.subCategories) {
      f.subCategories.forEach((sub) => all.push(...sub.items));
    } else if (!f.isCombo) {
      all.push(...f.items);
    }
  });

  // ========================================
  // POPULARES - CON BEBIDAS DE TEMPORADA (DINÁMICO)
  // ========================================
  const featured = [];

  // 1. Primero agregar bebidas de temporada SI están habilitadas
  if (seasonalConfig.enabled && SEASONAL_DRINK_DEFINITIONS.length > 0) {
    for (const seasonal of SEASONAL_DRINK_DEFINITIONS) {
      if (!isProductHidden(seasonal.seasonalKey)) {
        featured.push({
          id: seasonal.seasonalKey,
          nombre: seasonal.displayName,
          displayName: seasonal.displayName,
          foto: processImageUrl(seasonal.image),
          precio: seasonal.displayPrice,
          grupo: "BEBIDAS DE TEMPORADA",
          description: seasonal.description,
          isSeasonal: true,
          seasonalKey: seasonal.seasonalKey,
          badge: seasonal.badge
        });
      }
    }
  }

  // 2. Luego agregar productos regulares de POPULAR
  for (const want of POPULAR) {
    const hit = all.find((p) => p.displayName?.toUpperCase() === want.toUpperCase());
    if (hit && !isProductHidden(hit.id)) featured.push(hit);
  }

  // 3. Rellenar hasta 8 si hace falta
  if (featured.length < 12) {
    for (const f of folderTiles) {
      if (f.isCombo) continue;
      const itemsToCheck = f.subCategories ? f.subCategories.flatMap((s) => s.items) : f.items;
      for (const it of itemsToCheck) {
        if (!featured.find((x) => x.id === it.id) && !isProductHidden(it.id)) {
          featured.push(it);
          if (featured.length >= 12) break;
        }
      }
      if (featured.length >= 12) break;
    }
  }

  _CACHE = { featured, folderTiles, combos: combosFolder.items };
  return _CACHE;
}

export async function getProductById(id) {
  const cat = _CACHE || (await loadCatalog());
  for (const f of cat.folderTiles) {
    if (f.subCategories) {
      for (const sub of f.subCategories) {
        const hit = sub.items.find((p) => String(p.id) === String(id));
        if (hit) return hit;
      }
    } else {
      const hit = f.items.find((p) => String(p.id) === String(id));
      if (hit) return hit;
    }
  }
  return null;
}

export function getCatalogStructure() {
  const cat = _CACHE || loadCatalog();
  if (!cat.folderTiles) return [];
  return cat.folderTiles.map((f) => ({
    id: f.id,
    title: f.title,
    isContainer: f.isContainer || false,
    isCombo: f.isCombo || false,
    image: f.foto,
    subCategories: f.subCategories
      ? f.subCategories.map((s) => ({
          id: s.id,
          title: s.title,
          itemCount: s.items.length,
          image: s.foto,
        }))
      : null,
    itemCount: f.totalItems || f.items.length,
    totalItems: f.totalItems || f.items.length,
  }));
}

// Función para refrescar el catálogo
export async function refreshCatalog() {
  _CACHE = null;
  return loadCatalog();
}

// Obtener lista de productos ocultos actual
export function getHiddenProducts() {
  return [..._HIDDEN_PRODUCTS];
}

export function debugProduct(productId) {
  const product = getProductById(productId);
  if (!product) {
    console.error(`Producto ${productId} no encontrado`);
    return;
  }
  console.log("=== PRODUCTO ===");
  console.log("Nombre:", product.displayName);
  console.log("Imagen:", product.foto);
  console.log(
    "Tamaños disponibles:",
    product.ProductsBySize?.map((s) => `${s.label} (ID: ${s.ProductId}, $${s.BasePrice})`)
  );
  console.log("\n=== MODIFICADORES ===");
  product.Modifiers?.forEach((mod) => {
    console.log(`\n${mod.type} (${mod.title}):`);
    mod.options?.forEach((opt) => {
      console.log(`  - ${opt.name}`);
      if (opt.idsPerSize) {
        Object.entries(opt.idsPerSize).forEach(([size, id]) => {
          const price = opt.pricesPerSize?.[size] ?? 0;
          console.log(`    ${size}: ID=${id}, $${price}`);
        });
      }
    });
  });
}

// Exportar configuración de bebidas de temporada para uso en otros componentes
export { SEASONAL_DRINK_DEFINITIONS, seasonalConfig };
