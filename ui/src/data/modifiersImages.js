// src/data/modifiersImages.js - VERSIÓN CON ICONOS OFICIALES DE MARKETING
// Sistema inteligente de mapeo de iconos usando expresiones regulares

// ==================== NORMALIZACIÓN ====================
function norm(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

// ==================== RUTAS DE ICONOS OFICIALES ====================
// Estructura: ./images/mods/[CATEGORÍA]/[NOMBRE].png

const ICON_PATHS = {
  // ADEREZO
  ADEREZO: {
    CHIMICHURRI: "./images/mods/ICONOS KIOSKO/ADEREZO/CHIMICHURRI.png",
    RANCH: "./images/mods/ICONOS KIOSKO/ADEREZO/RANCH.png",
    SIN_ADEREZO: "./images/mods/ICONOS KIOSKO/ADEREZO/SIN ADEREZO.png",
  },

  // AGUA
  AGUA: {
    MINERAL: "./images/mods/ICONOS KIOSKO/AGUA/AGUA MINERAL.png",
    NATURAL: "./images/mods/ICONOS KIOSKO/AGUA/AGUA NATURAL.png",
  },

  // BOMBÓN
  BOMBON: {
    CON_BOMBON: "./images/mods/ICONOS KIOSKO/BOMBON/BOMBON.png",
    SIN_BOMBON: "./images/mods/ICONOS KIOSKO/BOMBON/SIN BOMBON.png",
  },

  // COLD FOAM
  COLD_FOAM: {
    CHAI: "./images/mods/ICONOS KIOSKO/COLD FOAM/COLD FOAM CHAI.png",
    FRESA: "./images/mods/ICONOS KIOSKO/COLD FOAM/COLD FOAM FRESA.png",
    LECHE: "./images/mods/ICONOS KIOSKO/COLD FOAM/COLD FOAM LECHE.png",
    MANGO: "./images/mods/ICONOS KIOSKO/COLD FOAM/COLD FOAM MANGO.png",
    MATCHA: "./images/mods/ICONOS KIOSKO/COLD FOAM/COLD FOAM MATCHA.png",
    TARO: "./images/mods/ICONOS KIOSKO/COLD FOAM/COLD FOAM TARO.png",
    VAINILLA: "./images/mods/ICONOS KIOSKO/COLD FOAM/COLD FOAM VAINILLA.png",
    SIN_EXTRAS: "./images/mods/ICONOS KIOSKO/COLD FOAM/SIN COLD FOAM.png",
  },

  // CREMA BATIDA
  CREMA_BATIDA: {
    CON_CREMA: "./images/mods/ICONOS KIOSKO/CREMA BATIDA/CREMA BATIDA.png",
    SIN_CREMA: "./images/mods/ICONOS KIOSKO/CREMA BATIDA/SIN CREMA BATIDA.png",
  },

  // DECORADO
  DECORADO: {
    CAJETA: "./images/mods/ICONOS KIOSKO/DECORADO/CAJETA.png",
    CARAMELO: "./images/mods/ICONOS KIOSKO/DECORADO/CARAMELO.png",
    MOKA_BLANCO: "./images/mods/ICONOS KIOSKO/DECORADO/MOKA BLANCO.png",
    MOKA: "./images/mods/ICONOS KIOSKO/DECORADO/MOKA.png",
    SIN_DECORAR: "./images/mods/ICONOS KIOSKO/DECORADO/SIN DECORAR.png",
  },

  // GRANO
  GRANO: {
    DESCAFEINADO: "./images/mods/ICONOS KIOSKO/GRANO/DESCAFEINADO.png",
    REGULAR: "./images/mods/ICONOS KIOSKO/GRANO/GRANO REGULAR.png",
  },

  // LECHE
  LECHE: {
    AVENA: "./images/mods/ICONOS KIOSKO/LECHE/LECHE  AVENA.png",
    ALMENDRA: "./images/mods/ICONOS KIOSKO/LECHE/LECHE ALMENDRA.png",
    COCO: "./images/mods/ICONOS KIOSKO/LECHE/LECHE COCO.png",
    DESLACTOSADA: "./images/mods/ICONOS KIOSKO/LECHE/LECHE DESLACTOSADA.png",
    ENTERA: "./images/mods/ICONOS KIOSKO/LECHE/LECHE ENTERA.png",
    SOYA: "./images/mods/ICONOS KIOSKO/LECHE/LECHE SOYA.png",
    PROTEINA: "./images/mods/ICONOS KIOSKO/LECHE/PROTEINA.png",
  },

  // SABORES Y ESENCIAS
  SABOR: {
    AVELLANA: "./images/mods/ICONOS KIOSKO/SABORES_ESENCIAS/AVELLANA.png",
    CAJETA_SEVILLANA: "./images/mods/ICONOS KIOSKO/SABORES_ESENCIAS/CAJETA SEVILLANA.png",
    CARAMELO: "./images/mods/ICONOS KIOSKO/SABORES_ESENCIAS/CARAMELO.png",
    ENDULZANTE_REGULAR: "./images/mods/ICONOS KIOSKO/SABORES_ESENCIAS/ENDULZANTE REGULAR.png",
    HONEY: "./images/mods/ICONOS KIOSKO/SABORES_ESENCIAS/HONEY.png",
    MOKA_BLANCO: "./images/mods/ICONOS KIOSKO/SABORES_ESENCIAS/MOKA BLANCO.png",
    MOKA: "./images/mods/ICONOS KIOSKO/SABORES_ESENCIAS/MOKA.png",
    SIN_ESENCIA: "./images/mods/ICONOS KIOSKO/SABORES_ESENCIAS/SIN ESENCIA.png",
    VAINILLA: "./images/mods/ICONOS KIOSKO/SABORES_ESENCIAS/VAINILLA.png",
    VANILLA_SUGAR_FREE: "./images/mods/ICONOS KIOSKO/SABORES_ESENCIAS/VANILLA SUGAR FREE.png",
  },

  // TÉ
  TE: {
    DURAZNO_JENGIBRE: "./images/mods/ICONOS KIOSKO/TE/TE DURAZNO JENGIBRE.png",
    LIMON_JENGIBRE: "./images/mods/ICONOS KIOSKO/TE/TE LIMON JENGIBRE.png",
    MANZANILLA_MENTA: "./images/mods/ICONOS KIOSKO/TE/TE MANZANILLA MENTA.png",
    MANZANILLA: "./images/mods/ICONOS KIOSKO/TE/TE MANZANILLA.png",
    MATCHA_VERDE: "./images/mods/ICONOS KIOSKO/TE/TE MATCHA VERDE.png",
    NEGRO: "./images/mods/ICONOS KIOSKO/TE/TE NEGRO.png",
    PEPPERMINT: "./images/mods/ICONOS KIOSKO/TE/TE PEPPERMINT.png",
    SWEET_DREAMS: "./images/mods/ICONOS KIOSKO/TE/TE SWEET DREAMS.png",
    VERDE_CLASICO: "./images/mods/ICONOS KIOSKO/TE/TE VERDE CLASICO.png",
  },

  // VASO
  VASO: {
    ICED_COFFEE: "./images/mods/ICONOS KIOSKO/VASO/ICED COFFE VASO.png",
    CALIENTE: "./images/mods/ICONOS KIOSKO/VASO/VASO BEBIDA CALIENTE.png",
    FRAPPE: "./images/mods/ICONOS KIOSKO/VASO/VASO FRAPPE.png",
  },

  // VASO/TERMO
  VASO_TERMO: {
    TERMO: "./images/mods/ICONOS KIOSKO/VASO_TERMO/TERMO_REFIL.png",
    VASO: "./images/mods/ICONOS KIOSKO/VASO_TERMO/VASO.png",
  },

  // VELAS MARKELAN
  FORMA_MARKELAN: {
    CORAZON: "./images/MARKELAN/Corazón.jpg",
    ESTRELLA: "./images/MARKELAN/estrella.jpg",
    NUM_0: "./images/MARKELAN/0.jpg",
    NUM_1: "./images/MARKELAN/1.jpg",
    NUM_2: "./images/MARKELAN/2.jpg",
    NUM_3: "./images/MARKELAN/3.jpg",
    NUM_4: "./images/MARKELAN/4.jpg",
    NUM_5: "./images/MARKELAN/5.jpg",
    NUM_6: "./images/MARKELAN/6.jpg",
    NUM_7: "./images/MARKELAN/7.jpg",
    NUM_8: "./images/MARKELAN/8.jpg",
    NUM_9: "./images/MARKELAN/9.jpg",
  },

  // VELA DE CERA (solo números - no tiene corazón ni estrella)
  FORMA_VELA_CERA: {
    NUM_0: "./images/VELA CERA/0.jpg",
    NUM_1: "./images/VELA CERA/1.jpg",
    NUM_2: "./images/VELA CERA/2.jpg",
    NUM_3: "./images/VELA CERA/3.jpg",
    NUM_4: "./images/VELA CERA/4.jpg",
    NUM_5: "./images/VELA CERA/5.jpg",
    NUM_6: "./images/VELA CERA/6.jpg",
    NUM_7: "./images/VELA CERA/7.jpg",
    NUM_8: "./images/VELA CERA/8.jpg",
    NUM_9: "./images/VELA CERA/9.jpg",
  },

  // AZÚCAR
  AZUCAR: {
    STEVIA: "./images/mods/ICONOS KIOSKO/AZUCAR/STEVIA.png",
    SPLENDA: "./images/mods/ICONOS KIOSKO/AZUCAR/SPLENDA.png",
    MASCABADO: "./images/mods/ICONOS KIOSKO/AZUCAR/MASCABADO.png",
  },

  // ICONOS DE NAVEGACIÓN
  HOME: {
    HOME: "./images/mods/ICONOS KIOSKO/ICONOS HOME/HOME.png",
    INICIO: "./images/mods/ICONOS KIOSKO/ICONOS HOME/INICIO.png",
    RETROCEDER: "./images/mods/ICONOS KIOSKO/ICONOS HOME/RETROCEDER.png",
  },
};

// ==================== DETECCIÓN DE CATEGORÍAS DE BEBIDAS ====================

// Bebidas tipo Frappé
const FRAPPE_NAMES = new Set([
  "AFFOGATO",
  "BERRY SHAKE",
  "CACAO MILK",
  "MANGO SHAKE",
].map(norm));

// Bebidas tipo "A las rocas" (frías con café)
const ROCAS_NAMES = new Set([
  "AGAVATE",
  "AMERICANO LIMON",
  "COLD BREW",
  "COLD BREW LIMON",
  "ICED CARAMEL MACCHIATO",
  "ICED COFFE",
  "ICED COFFEE",
  "ICED DIRTY CHAI",
  "ICED DIRTY MATCHA",
  "OATMILK COLD BREW",
  "VANILLA ICED",
  "COCO PINK",
  "ICED CHAI",
  "ICED MATCHA",
  "ICED TARO",
  "ICED VAINILLA",
  "REFRHESER FRESA LIMON",
  "REFRESHER FRESA LIMON",
  "REFRESHER MANGO LIMON",
  "REFRESHER UVOLA",
].map(norm));

function isFrappe(product) {
  const nameU = norm(
    product?.displayName || product?.ProductName || product?.productName
  );
  if (FRAPPE_NAMES.has(nameU)) return true;
  return /FRAPP?E|FRAPPUCCINO/.test(nameU);
}

function isRocas(product) {
  const nameU = norm(
    product?.displayName || product?.ProductName || product?.productName
  );
  const catU = norm(
    product?.category || product?.grupo || product?.realData?.GroupName
  );
  if (ROCAS_NAMES.has(nameU)) return true;

  // Bebidas frías que NO son frappé => rocas
  if (catU.includes("FRIAS") || catU.includes("FRÍAS")) {
    if (!isFrappe(product)) return true;
  }
  if (/\bICED\b|\bCOLD\s*BREW\b|\bA LAS ROCAS\b/.test(nameU)) return true;
  return false;
}

function isHot(product) {
  const catU = norm(
    product?.category || product?.grupo || product?.realData?.GroupName
  );
  return catU.includes("CALIENTES");
}

// ==================== MATCHERS PARA VELAS ====================

/**
 * Detecta el icono correcto para VELAS MARKELAN
 * Soporta: corazón, estrella, números 0-9
 */
function matchMarkelanForma(optionName) {
  const n = norm(optionName);
  
  if (n.includes("CORAZON") || n.includes("HEART")) {
    console.log(`🔥 MARKELAN detectada: "${optionName}" → CORAZON → ${ICON_PATHS.FORMA_MARKELAN.CORAZON}`);
    return ICON_PATHS.FORMA_MARKELAN.CORAZON;
  }
  if (n.includes("ESTRELLA") || n.includes("STAR")) {
    console.log(`🔥 MARKELAN detectada: "${optionName}" → ESTRELLA → ${ICON_PATHS.FORMA_MARKELAN.ESTRELLA}`);
    return ICON_PATHS.FORMA_MARKELAN.ESTRELLA;
  }
  
  // Detectar números: "NUMERO 5", "NUM 5", "5"
  const numMatch = n.match(/NUM(?:ERO)?\s*([0-9])|^([0-9])$/);
  if (numMatch) {
    const digit = numMatch[1] || numMatch[2];
    const path = ICON_PATHS.FORMA_MARKELAN[`NUM_${digit}`];
    console.log(`🔥 MARKELAN detectada: "${optionName}" → Número ${digit} → ${path}`);
    return path || null;
  }
  
  console.log(`⚠️ MARKELAN: No se detectó forma válida en "${optionName}"`);
  return null;
}

/**
 * Detecta el icono correcto para VELAS DE CERA
 * Soporta: solo números 0-9 (no tiene corazón ni estrella)
 */
function matchVelaCeraForma(optionName) {
  const n = norm(optionName);
  
  // VELA CERA solo tiene números, no formas
  // Detectar números: "NUMERO 5", "NUM 5", "5"
  const numMatch = n.match(/NUM(?:ERO)?\s*([0-9])|^([0-9])$/);
  if (numMatch) {
    const digit = numMatch[1] || numMatch[2];
    const path = ICON_PATHS.FORMA_VELA_CERA[`NUM_${digit}`];
    console.log(`🕯️ VELA CERA detectada: "${optionName}" → Número ${digit} → ${path}`);
    return path || null;
  }
  
  console.log(`⚠️ VELA CERA: No se detectó número en "${optionName}"`);
  return null;
}

// ==================== MATCHER INTELIGENTE DE ICONOS ====================

/**
 * Determina el icono correcto para una opción de modificador
 * usando expresiones regulares y contexto del producto
 */
function matchIcon(optionName, groupType, product) {
  const optU = norm(optionName);
  const typeU = norm(groupType);

  // ============ BOMBÓN (caso especial para chocolate) ============
  const productNameU = norm(
    product?.displayName || product?.ProductName || product?.productName
  );
  if (productNameU.includes("CHOCOLATE") && (typeU.includes("BOMBON") || optU.includes("BOMBON"))) {
    if (optU.includes("CON") || optU === "BOMBON") {
      return ICON_PATHS.BOMBON.CON_BOMBON;
    }
    if (optU.includes("SIN")) {
      return ICON_PATHS.BOMBON.SIN_BOMBON;
    }
  }

  // ============ EXTRAS / EXTRA SHOT ============
  if (typeU.includes("EXTRA") || optU.includes("EXTRA SHOT")) {
    if (optU.includes("DESCAFE") || optU.includes("DECAF")) {
      return ICON_PATHS.GRANO.DESCAFEINADO;
    }
    if (optU.includes("SHOT")) {
      return ICON_PATHS.GRANO.REGULAR; // cafeinado
    }
    if (optU.includes("SIN")) {
      return null; // SIN EXTRAS: boton solo texto
    }
  }

  // ============ VASO / TERMO ============
  if (typeU.includes("VASO")) {
    // Termo o Refil
    if (/TERMO|REFIL/.test(optU)) {
      return ICON_PATHS.VASO_TERMO.TERMO;
    }
    
    // Vaso según tipo de bebida
    if (isFrappe(product)) {
      return ICON_PATHS.VASO.FRAPPE;
    }
    if (isRocas(product)) {
      return ICON_PATHS.VASO.ICED_COFFEE;
    }
    if (isHot(product)) {
      return ICON_PATHS.VASO.CALIENTE;
    }
    
    // Vaso por defecto
    return ICON_PATHS.VASO_TERMO.VASO;
  }

  // ============ VELAS MARKELAN ============
  if (typeU.includes("FORMA") || typeU.includes("MARKELAN") || typeU.includes("VELA")) {
    // Si menciona "MARKELAN" en el nombre del producto o en la opción
    const productNameU = norm(
      product?.displayName || product?.ProductName || product?.productName
    );
    
    console.log(`🔍 Detectando VELAS:`, {
      productName: productNameU,
      optionName: optU,
      groupType: typeU
    });
    
    if (productNameU.includes("MARKELAN") || optU.includes("MARKELAN")) {
      console.log(`✅ Entrando a matchMarkelanForma para: "${optionName}"`);
      const icon = matchMarkelanForma(optionName);
      if (icon) return icon;
    }
  }

  // ============ VELA DE CERA ============
  if (typeU.includes("FORMA") || typeU.includes("VELA") || typeU.includes("CERA") || typeU.includes("NUMERO")) {
    const productNameU = norm(
      product?.displayName || product?.ProductName || product?.productName
    );
    
    // Si menciona "VELA" y NO es Markelan, asumir Vela de Cera
    if ((productNameU.includes("VELA") && !productNameU.includes("MARKELAN")) || 
        optU.includes("CERA") || 
        (typeU.includes("FORMA") && !optU.includes("MARKELAN"))) {
      console.log(`✅ Entrando a matchVelaCeraForma para: "${optionName}"`);
      const icon = matchVelaCeraForma(optionName);
      if (icon) return icon;
    }
  }

  // ============ AGUA / BASE ============
  // Detectar "Base" (usado en Refreshers) y opciones que contengan "AGUA"
  if (typeU.includes("BASE") || typeU.includes("AGUA") || optU.includes("AGUA") || optU.includes("WATER")) {
    if (optU.includes("MINERAL")) {
      return ICON_PATHS.AGUA.MINERAL;
    }
    if (optU.includes("NATURAL") || optU.includes("REGULAR")) {
      return ICON_PATHS.AGUA.NATURAL;
    }
  }

  // ============ LECHE ============
  if (typeU.includes("LECHE") || optU.includes("LECHE")) {
    if (optU.includes("AVENA") || optU.includes("OAT")) {
      return ICON_PATHS.LECHE.AVENA;
    }
    if (optU.includes("ALMENDRA") || optU.includes("ALMOND")) {
      return ICON_PATHS.LECHE.ALMENDRA;
    }
    if (optU.includes("COCO") || optU.includes("COCONUT")) {
      return ICON_PATHS.LECHE.COCO;
    }
    if (optU.includes("DESLACTOSADA") || optU.includes("LACTOSE FREE")) {
      return ICON_PATHS.LECHE.DESLACTOSADA;
    }
    if (optU.includes("SOYA") || optU.includes("SOY")) {
      return ICON_PATHS.LECHE.SOYA;
    }
    if (optU.includes("ENTERA") || optU.includes("WHOLE")) {
      return ICON_PATHS.LECHE.ENTERA;
    }
    if (optU.includes("PROTEINA") || optU.includes("PROTEIN")) {
      return ICON_PATHS.LECHE.PROTEINA;
    }
  }

  // ============ GRANO ============
  if (typeU.includes("GRANO") || typeU.includes("BEAN")) {
    if (optU.includes("DESCAFE") || optU.includes("DECAF")) {
      return ICON_PATHS.GRANO.DESCAFEINADO;
    }
    // Solo devolver GRANO REGULAR si NO menciona AGUA
    if (!optU.includes("AGUA") && !optU.includes("WATER")) {
      return ICON_PATHS.GRANO.REGULAR;
    }
  }

  // ============ COLD FOAM ============
  if (typeU.includes("COLD") && typeU.includes("FOAM")) {
    if (optU.includes("SIN") || optU.includes("WITHOUT")) {
      return ICON_PATHS.COLD_FOAM.SIN_EXTRAS;
    }
    if (optU.includes("CHAI")) {
      return ICON_PATHS.COLD_FOAM.CHAI;
    }
    if (optU.includes("FRESA") || optU.includes("STRAWBERRY")) {
      return ICON_PATHS.COLD_FOAM.FRESA;
    }
    if (optU.includes("MANGO")) {
      return ICON_PATHS.COLD_FOAM.MANGO;
    }
    if (optU.includes("MATCHA")) {
      return ICON_PATHS.COLD_FOAM.MATCHA;
    }
    if (optU.includes("TARO")) {
      return ICON_PATHS.COLD_FOAM.TARO;
    }
    if (optU.includes("VAINILLA") || optU.includes("VANILLA")) {
      return ICON_PATHS.COLD_FOAM.VAINILLA;
    }
    if (optU.includes("LECHE") || optU.includes("MILK")) {
      return ICON_PATHS.COLD_FOAM.LECHE;
    }
  }

  // ============ SABOR / ESENCIA ============
  if (typeU.includes("SABOR") || typeU.includes("ESENCIA")) {
    if (optU.includes("SIN")) {
      return ICON_PATHS.SABOR.SIN_ESENCIA;
    }
    if (optU.includes("AVELLANA") || optU.includes("HAZELNUT")) {
      return ICON_PATHS.SABOR.AVELLANA;
    }
    if (optU.includes("CAJETA") && optU.includes("SEVILLANA")) {
      return ICON_PATHS.SABOR.CAJETA_SEVILLANA;
    }
    if (optU.includes("CARAMELO")) {
      return ICON_PATHS.SABOR.CARAMELO;
    }
    if (optU.includes("ENDULZANTE") || optU.includes("REGULAR") && !optU.includes("SUGAR FREE")) {
      return ICON_PATHS.SABOR.ENDULZANTE_REGULAR;
    }
    if (optU.includes("HONEY") || optU.includes("MIEL")) {
      return ICON_PATHS.SABOR.HONEY;
    }
    if (optU.includes("MOKA") && optU.includes("BLANCO")) {
      return ICON_PATHS.SABOR.MOKA_BLANCO;
    }
    if (optU.includes("MOKA") || optU.includes("MOCHA")) {
      return ICON_PATHS.SABOR.MOKA;
    }
    if (optU.includes("VAINILLA") || optU.includes("VANILLA")) {
      if (optU.includes("SUGAR FREE") || optU.includes("SIN AZUCAR")) {
        return ICON_PATHS.SABOR.VANILLA_SUGAR_FREE;
      }
      return ICON_PATHS.SABOR.VAINILLA;
    }
  }

  // ============ DECORADO ============
  if (typeU.includes("DECORADO")) {
    if (optU.includes("SIN")) {
      return ICON_PATHS.DECORADO.SIN_DECORAR;
    }
    if (optU.includes("CAJETA")) {
      return ICON_PATHS.DECORADO.CAJETA;
    }
    if (optU.includes("CARAMELO")) {
      return ICON_PATHS.DECORADO.CARAMELO;
    }
    if (optU.includes("MOKA") && optU.includes("BLANCO")) {
      return ICON_PATHS.DECORADO.MOKA_BLANCO;
    }
    if (optU.includes("MOKA")) {
      return ICON_PATHS.DECORADO.MOKA;
    }
  }

  // ============ CREMA BATIDA ============
  if (typeU.includes("CREMA") || optU.includes("CREMA")) {
    if (optU.includes("SIN")) {
      return ICON_PATHS.CREMA_BATIDA.SIN_CREMA;
    }
    return ICON_PATHS.CREMA_BATIDA.CON_CREMA;
  }

  // ============ TÉ ============
  if (typeU.includes("TE") || optU.includes("TE")) {
    if (optU.includes("DURAZNO") && optU.includes("JENGIBRE")) {
      return ICON_PATHS.TE.DURAZNO_JENGIBRE;
    }
    if (optU.includes("LIMON") && optU.includes("JENGIBRE")) {
      return ICON_PATHS.TE.LIMON_JENGIBRE;
    }
    if (optU.includes("MANZANILLA") && optU.includes("MENTA")) {
      return ICON_PATHS.TE.MANZANILLA_MENTA;
    }
    if (optU.includes("MANZANILLA")) {
      return ICON_PATHS.TE.MANZANILLA;
    }
    if (optU.includes("MATCHA")) {
      return ICON_PATHS.TE.MATCHA_VERDE;
    }
    if (optU.includes("NEGRO") || optU.includes("BLACK")) {
      return ICON_PATHS.TE.NEGRO;
    }
    if (optU.includes("PEPPERMINT") || optU.includes("MENTA")) {
      return ICON_PATHS.TE.PEPPERMINT;
    }
    if (optU.includes("SWEET DREAMS") || optU.includes("SUENOS")) {
      return ICON_PATHS.TE.SWEET_DREAMS;
    }
    if (optU.includes("VERDE") && optU.includes("CLASICO")) {
      return ICON_PATHS.TE.VERDE_CLASICO;
    }
  }

  // ============ ADEREZO ============
  if (typeU.includes("ADEREZO")) {
    if (optU.includes("SIN")) {
      return ICON_PATHS.ADEREZO.SIN_ADEREZO;
    }
    if (optU.includes("CHIMICHURRI")) {
      return ICON_PATHS.ADEREZO.CHIMICHURRI;
    }
    if (optU.includes("RANCH")) {
      return ICON_PATHS.ADEREZO.RANCH;
    }
  }

  // ============ AZÚCAR ============
  if (typeU.includes("AZUCAR") || typeU.includes("AZÚCAR") || typeU.includes("SUGAR")) {
    if (optU.includes("STEVIA")) {
      return ICON_PATHS.AZUCAR.STEVIA;
    }
    if (optU.includes("SPLENDA")) {
      return ICON_PATHS.AZUCAR.SPLENDA;
    }
    if (optU.includes("MASCABADO")) {
      return ICON_PATHS.AZUCAR.MASCABADO;
    }
    // SIN EXTRAS no tiene icono, devolver null
    return null;
  }

  // ============ FALLBACK ============
  return "./images/mods/placeholder.png";
}

// ==================== FUNCIÓN PRINCIPAL EXPORTADA ====================

/**
 * Obtiene el icono oficial correcto para un modificador
 * @param {Object} group - Grupo de modificador (tipo, titulo, etc)
 * @param {Object} product - Producto actual (para contexto)
 * @param {string} optionName - Nombre de la opción
 * @returns {string} Ruta del icono
 */
export function getModifierIcon(group, product, optionName) {
  const type = String(group?.type || group?.tipo || "").toLowerCase();
  const title = String(group?.title || group?.titulo || "");
  
  // Usar el matcher inteligente
  return matchIcon(optionName, type || title, product);
}

// ==================== FUNCIONES AUXILIARES EXPORTADAS ====================

/**
 * Obtiene icono para navegación (home, back, etc)
 */
export function getNavigationIcon(type) {
  const typeU = norm(type);
  if (typeU.includes("HOME") || typeU.includes("INICIO")) {
    return ICON_PATHS.HOME.HOME;
  }
  if (typeU.includes("RETROCEDER") || typeU.includes("BACK")) {
    return ICON_PATHS.HOME.RETROCEDER;
  }
  return ICON_PATHS.HOME.INICIO;
}

/**
 * Verifica si un producto es de tipo específico
 */
export function getProductType(product) {
  return {
    isFrappe: isFrappe(product),
    isRocas: isRocas(product),
    isHot: isHot(product),
  };
}

// ==================== EXPORTS DE UTILIDAD ====================
export {
  ICON_PATHS,
  norm,
  isFrappe,
  isRocas,
  isHot,
  matchMarkelanForma,
  matchVelaCeraForma
};

// ==================== PRELOAD DE ICONOS ====================
// Precarga (warm cache) todos los iconos de modificadores para que al llegar al
// paso de mods ya esten decodificados y aparezcan al instante (sin el lag de 0.5-1s).
let _iconsPreloaded = false;
export function preloadModifierIcons() {
  if (_iconsPreloaded || typeof window === "undefined") return;
  _iconsPreloaded = true;
  const urls = [];
  const walk = (obj) => {
    for (const k in obj) {
      const v = obj[k];
      if (typeof v === "string") { if (v && !v.includes("placeholder")) urls.push(v); }
      else if (v && typeof v === "object") walk(v);
    }
  };
  walk(ICON_PATHS);
  const run = () => { urls.forEach((u) => { const img = new Image(); img.decoding = "async"; img.src = u; }); };
  // Diferido para no competir con el render inicial del menu
  if (window.requestIdleCallback) window.requestIdleCallback(run, { timeout: 3000 });
  else setTimeout(run, 1200);
}