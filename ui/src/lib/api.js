// src/lib/api.js - VERSIÓN CORREGIDA CON tamanoId
// ================== CONFIG ==================
const PUENTE = (import.meta.env.VITE_PUENTE_URL ?? "http://localhost:3001").replace(/\/+$/, "");
const IS_PROD = import.meta.env.PROD;

// ================== HELPERS ==================
const toNum = (v) => Number(v ?? 0);

/** Resuelve el ID del modificador según el tamaño seleccionado */
function resolveModifierId(option, sizeLabel) {
  if (option?.idsPerSize && option.idsPerSize[sizeLabel] !== undefined) {
    return option.idsPerSize[sizeLabel];
  }
  return option?.id ?? null;
}

/** Resuelve el precio del modificador según el tamaño */
function resolveModifierPrice(option, sizeLabel, productName = "") {
  // CASO ESPECIAL: ICED COFFEE - La esencia es gratis
  const isIcedCoffee = productName.toUpperCase().includes("ICED COFFEE");
  const isEsencia = (option?.name || "").toUpperCase().includes("ESENCIA") || 
                    (option?.nombre || "").toUpperCase().includes("ESENCIA");
  
  if (isIcedCoffee && isEsencia) {
    return 0; // Esencia gratis para Iced Coffee
  }
  
  // Precio normal
  if (option?.pricesPerSize && option.pricesPerSize[sizeLabel] !== undefined) {
    return toNum(option.pricesPerSize[sizeLabel]);
  }
  return toNum(option?.basePrice ?? option?.price ?? option?.priceDelta ?? 0);
}

/** Busca la variante del producto por tamaño */
function findSizeVariant(product, sizeLabel) {
  const variants = product?.ProductsBySize || product?.sizes || [];
  return (
    variants.find(
      (v) => String(v.label).toLowerCase() === String(sizeLabel).toLowerCase()
    ) || null
  );
}

/** Convierte un item del carrito UI al formato POS */
function toPOSItem(cartItem) {
  // Si ya viene en formato POS, lo devolvemos
  if (cartItem?.platilloId && cartItem?.precioUnitario && cartItem?.mods) {
    return {
      platilloId: cartItem.platilloId,
      cantidad: Number(cartItem.cantidad ?? 1),
      sizeLabel: cartItem.sizeLabel || "Grande",
      productName: cartItem.productName || "",
      precioUnitario: Number(cartItem.precioUnitario),
      tamanoId: cartItem.tamanoId, // 🔥 INCLUIR tamanoId si viene
      mods: Array.isArray(cartItem.mods) ? cartItem.mods : [],
    };
  }

  // Formato UI estándar: convertir
  const product = cartItem.product || cartItem;
  const sizeLabel =
    cartItem.talla ||
    cartItem.selectedSize ||
    product?.DefaultSizeLabel ||
    "Grande";
  const quantity = Number(cartItem.cantidad ?? cartItem.quantity ?? 1);

  // Buscar la variante correcta por tamaño
  const variant = findSizeVariant(product, sizeLabel);
  if (!variant) {
    console.error(`Tamaño "${sizeLabel}" no encontrado para producto:`, product);
    throw new Error(`Tamaño "${sizeLabel}" no válido`);
  }

  // IDs y precios del producto base según el tamaño
  const platilloId = variant.ProductId || variant.productId;
  const productName =
    variant.ProductName || variant.productName || product.nombre || "";
  const precioUnitario = toNum(variant.BasePrice ?? variant.basePrice);
  const tamanoId = variant.tamanoId; // 🔥 EXTRAER tamanoId del catálogo

  // Procesar modificadores
  const mods = [];

  // Los modificadores pueden venir en cartItem.modificadores (array) o cartItem.selectedModifiers (objeto)
  if (Array.isArray(cartItem.modificadores)) {
    // Formato antiguo: array de {tipo, opcion}
    for (const mod of cartItem.modificadores) {
      const option = mod.opcion;
      if (!option) continue;

      const id = resolveModifierId(option, sizeLabel);
      const price = resolveModifierPrice(option, sizeLabel, productName);
      const name = option.name || option.nombre || "";

      if (id) {
        mods.push({ id, name, price });
      }
      // sendWith: ids extra que van JUNTO a la opcion (ej. grano del EXTRA SHOT).
      // normOpt deja el objeto original en _raw, ahi vive sendWith.
      const sw = option.sendWith || (option._raw && option._raw.sendWith);
      if (Array.isArray(sw)) {
        for (const ex of sw) {
          if (ex && ex.id != null) mods.push({ id: ex.id, name: ex.name || "", price: 0 });
        }
      }
    }
  } else if (cartItem.selectedModifiers && typeof cartItem.selectedModifiers === "object") {
    // Formato nuevo: objeto {tipo: opcion}
    const selectedMods = cartItem.selectedModifiers;
    const productModifiers = product.Modifiers || product.modifiers || [];

    for (const [modType, selectedOption] of Object.entries(selectedMods)) {
      if (!selectedOption) continue;

      const modGroup = productModifiers.find((m) => m.type === modType);
      if (!modGroup) continue;

      const options = Array.isArray(selectedOption)
        ? selectedOption
        : [selectedOption];

      for (const opt of options) {
        if (!opt) continue;

        let catalogOption = null;
        // Preferir match por NOMBRE: los ids pueden colisionar
        // (ej. EXTRA SHOT CAFEINADO y DESCAFEINADO comparten id 10).
        if (opt.name) {
          catalogOption = modGroup.options.find(
            (o) => (o.name || "").toUpperCase() === opt.name.toUpperCase()
          );
        }
        if (!catalogOption && opt.id !== undefined) {
          catalogOption = modGroup.options.find((o) => o.id === opt.id);
        }

        if (catalogOption) {
          const id = resolveModifierId(catalogOption, sizeLabel);
          const price = resolveModifierPrice(catalogOption, sizeLabel, productName);
          const name = catalogOption.name || opt.name || "";

          if (id) {
            mods.push({ id, name, price });
          }
          if (Array.isArray(catalogOption.sendWith)) {
            for (const ex of catalogOption.sendWith) {
              if (ex && ex.id != null) mods.push({ id: ex.id, name: ex.name || "", price: 0 });
            }
          }
        } else if (opt.id) {
          mods.push({
            id: opt.id,
            name: opt.name || "",
            price: resolveModifierPrice(opt, sizeLabel, productName),
          });
        }
      }
    }
  }

  return {
    platilloId,
    cantidad: quantity,
    sizeLabel,
    productName,
    precioUnitario,
    tamanoId,
    mods,
  };
}

/** Calcula el total estimado */
function estimateTotal(itemsPOS = []) {
  return itemsPOS.reduce((sum, it) => {
    const base = toNum(it.precioUnitario);
    const modsTotal = Array.isArray(it.mods)
      ? it.mods.reduce((s, m) => s + toNum(m.price || 0), 0)
      : 0;
    const itemTotal = (base + modsTotal) * Number(it.cantidad || 1);
    return sum + itemTotal;
  }, 0);
}

// ================== API PÚBLICA ==================
/** Envía una orden al puente KIOSKO-PUENTE */
export async function enviarOrdenAPuente(orden) {
  try {
    // Convertir items del formato UI al formato POS
    const itemsPOS = [];
    const errors = [];

    for (let i = 0; i < orden.items.length; i++) {
      try {
        const posItem = toPOSItem(orden.items[i]);
        itemsPOS.push(posItem);
      } catch (err) {
        console.error(`Error procesando item ${i}:`, err);
        errors.push(`Item ${i + 1}: ${err.message}`);
      }
    }

    if (itemsPOS.length === 0) {
      throw new Error(
        errors.length > 0
          ? `No se pudo procesar ningún item: ${errors.join(", ")}`
          : "El carrito está vacío"
      );
    }

    // ========== CASO ESPECIAL: ICED COFFEE CON ESENCIA ==========
    // Para Iced Coffee con esencia, mantener el precio en $60
    // agregando la esencia como modificador gratuito
    const itemsConCasoEspecial = [];
    
    for (const item of itemsPOS) {
      const isIcedCoffee = (item.productName || "").toUpperCase().includes("ICED COFFEE");
      
      if (isIcedCoffee) {
        // Verificar si tiene esencia
        const esenciaMod = item.mods.find(m => 
          (m.name || "").toUpperCase().includes("ESENCIA")
        );
        
        if (esenciaMod) {
          // Mantener precio base en 60 y esencia en 0
          itemsConCasoEspecial.push({
            ...item,
            precioUnitario: 60, // Precio fijo
            mods: item.mods.map(m => {
              if ((m.name || "").toUpperCase().includes("ESENCIA")) {
                return { ...m, price: 0 }; // Esencia gratis
              }
              return m;
            })
          });
        } else {
          itemsConCasoEspecial.push(item);
        }
      } else {
        itemsConCasoEspecial.push(item);
      }
    }
    
    // NO SEPARAR MODIFICADORES - El backend los maneja correctamente
    // Los modificadores se envían junto con el producto principal
    // Esto permite que el KDS los muestre agrupados y el POS aplique promociones correctamente
    const itemsFinales = itemsConCasoEspecial;

    // Calcular total con modificadores incluidos
    const total = estimateTotal(itemsFinales);

    // Payload final - Configuración del kiosko
    const payload = {
      idTerminal: Number(orden.idTerminal ?? 1),
      idUsuario: Number(orden.idUsuario ?? 9),
      mesa: String(orden.mesa ?? "-1"),
      personas: Number(orden.personas ?? 1),
      tipoOrden: Number(orden.tipoOrden ?? 1),
      carrito: {
        items: itemsFinales,
        total,
      },
    };

    if (import.meta.env.DEV) {
      console.group("🚀 Enviando orden KIOSKO al puente");
      console.log("Terminal:", payload.idTerminal);
      console.log("Usuario:", payload.idUsuario);
      console.log("Mesa:", payload.mesa);
      console.log("Items originales:", orden.items);
      console.log("Items procesados (con tamanoId):", itemsFinales);
      console.log("Total calculado:", total);
      console.log("Payload completo:", payload);
      console.groupEnd();
    }

    // POST al puente
    const response = await fetch(`${PUENTE}/api/order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorMsg = responseData?.error || `Error HTTP ${response.status}`;
      console.error("❌ Error del puente:", responseData);
      throw new Error(errorMsg);
    }

    if (!responseData.ok) {
      const errorMsg = responseData?.error || "Error procesando la orden";
      console.error("❌ Respuesta no OK del puente:", responseData);
      throw new Error(errorMsg);
    }

    if (import.meta.env.DEV) {
      console.log("✅ Orden KIOSKO enviada exitosamente:", responseData);
      console.log("   tamanoId correctamente pasado desde catálogo");
      console.log("   Los modificadores se mantuvieron agrupados con sus productos");
      console.log("   El KDS mostrará todo correctamente agrupado");
    }

    return responseData;
  } catch (error) {
    console.error("❌ Error enviando orden:", error);
    throw error;
  }
}

/** Verifica que el puente esté disponible */
export async function verificarPuente() {
  try {
    const response = await fetch(`${PUENTE}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch (error) {
    console.error("Error verificando puente:", error);
    return false;
  }
}

// Exportar helpers para debug
export const debug = {
  toPOSItem,
  estimateTotal,
  PUENTE,
};