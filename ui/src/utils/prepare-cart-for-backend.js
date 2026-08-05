// utils/prepare-cart-for-backend.js
// VERSIÃ“N PRODUCCIÃ“N
// - IDs por tamaÃ±o (idsPerSize / pricesPerSize) respetados
// - Soporte para 'coldFoam' (u otros grupos) solo si existen en el producto
// - Defaults "SIN ..." solo si el grupo existe y la opciÃ³n estÃ¡ en catÃ¡logo
// - Maneja selecciÃ³n simple o mÃºltiple (userSelected puede ser objeto o array)
// - Sin ejemplos ni pruebas: listo para integrarse con la UI

/**
 * Busca una opciÃ³n por nombre dentro de un grupo (case-insensitive).
 */
function findOptionByName(modGroup, name) {
  if (!modGroup?.options || !name) return null;
  const needle = String(name).trim().toUpperCase();
  return modGroup.options.find(o => (o.name || '').toUpperCase() === needle) || null;
}

/**
 * Materializa una opciÃ³n para el tamaÃ±o dado en { id, name, price }.
 * - Soporta idsPerSize / pricesPerSize
 * - Respeta labelsPerSize como 'name' cuando exista; si no, usa option.name
 */
function materializeOptionForSize(option, sizeLabel) {
  if (!option) return null;

  // ID por tamaÃ±o
  let id;
  if (option.idsPerSize && option.idsPerSize[sizeLabel] !== undefined) {
    id = option.idsPerSize[sizeLabel];
  } else if (option.idsBySize && option.idsBySize[sizeLabel] !== undefined) {
    id = option.idsBySize[sizeLabel];
  } else if (option.id !== undefined) {
    id = option.id; // genÃ©rico
  } else {
    id = undefined;
  }

  // Precio por tamaÃ±o
  let price = 0;
  if (option.pricesPerSize && option.pricesPerSize[sizeLabel] !== undefined) {
    price = option.pricesPerSize[sizeLabel];
  } else if (option.pricesBySize && option.pricesBySize[sizeLabel] !== undefined) {
    price = option.pricesBySize[sizeLabel];
  } else if (option.basePrice !== undefined) {
    price = option.basePrice;
  } else if (option.price !== undefined) {
    price = option.price;
  }

  // Etiqueta por tamaÃ±o (si existe), si no, el name general
  const name =
    (option.labelsPerSize && option.labelsPerSize[sizeLabel]) ||
    option.name ||
    '';

  if (id === undefined) return null;
  // sendWith: ids extra que se mandan JUNTO con esta opcion (ej. EXTRA SHOT + su grano).
  const sendWith = Array.isArray(option.sendWith) ? option.sendWith : null;
  return { id, name, price: Number(price) || 0, sendWith };
}

/**
 * Obtiene el grupo de modificadores por tipo.
 * Soporta tanto product.Modifiers como product.modifiers
 */
function getGroupByType(product, type) {
  const modifiers = product?.Modifiers || product?.modifiers || [];
  return modifiers.find(m => m.type === type) || null;
}

/**
 * Lee el tipo de selecciÃ³n del grupo: 'single' | 'multiple' (default 'single')
 */
function getGroupSelectionType(group) {
  const t = (group?.selection || 'single').toLowerCase();
  return t === 'multiple' ? 'multiple' : 'single';
}

/**
 * Selecciona UNA opciÃ³n (single) con validaciÃ³n por tamaÃ±o.
 * Prioridad: userSelected -> defaultName -> primera opciÃ³n vÃ¡lida para el tamaÃ±o.
 */
function pickOne({ product, group, sizeLabel, userSelected, defaultName }) {
  if (!group) return null;

  // 1) SelecciÃ³n del usuario (objeto completo o por nombre/id)
  if (userSelected) {
    // Si es objeto con idsPerSize
    if (userSelected.idsPerSize || userSelected.idsBySize) {
      const mat = materializeOptionForSize(userSelected, sizeLabel);
      if (mat) return mat;
    }
    // Si viene como {name} o {id}
    let catalogOption = null;
    if (userSelected.name) {
      catalogOption = findOptionByName(group, userSelected.name);
    } else if (userSelected.id !== undefined) {
      catalogOption = (group.options || []).find(o => o.id === userSelected.id) || null;
    }
    if (catalogOption) {
      const mat = materializeOptionForSize(catalogOption, sizeLabel);
      if (mat) return mat;
    }
  }

  // 2) Default por nombre (ej. "SIN EXTRAS", "SIN DECORAR", "SIN ESENCIA")
  if (defaultName) {
    const def = findOptionByName(group, defaultName);
    if (def) {
      // Si tiene idsPerSize, validar que exista para el tamaÃ±o
      if (!def.idsPerSize || def.idsPerSize[sizeLabel] !== undefined) {
        const mat = materializeOptionForSize(def, sizeLabel);
        if (mat) return mat;
      }
    }
  }

  // 3) Primera opciÃ³n disponible para este tamaÃ±o
  for (const option of group.options || []) {
    if (option.idsPerSize) {
      if (option.idsPerSize[sizeLabel] !== undefined) {
        return materializeOptionForSize(option, sizeLabel);
      }
    } else {
      // Sin restricciÃ³n de tamaÃ±o
      return materializeOptionForSize(option, sizeLabel);
    }
  }

  return null;
}

/**
 * Selecciona VARIAS opciones (multiple) con validaciÃ³n por tamaÃ±o.
 * - userSelected puede ser array de objetos ({name}/{id} o opciÃ³n completa)
 * - Si no hay userSelected y quieres incluir default, intenta incluirlo como Ãºnica opciÃ³n
 */
function pickMany({ product, group, sizeLabel, userSelected, defaultName }) {
  if (!group) return [];

  const out = [];
  const pushIfOk = (opt) => { if (opt) out.push(opt); };

  // 1) SelecciÃ³n del usuario (array u objeto)
  if (Array.isArray(userSelected)) {
    for (const sel of userSelected) {
      if (sel?.idsPerSize || sel?.idsBySize) {
        pushIfOk(materializeOptionForSize(sel, sizeLabel));
      } else if (sel?.name) {
        pushIfOk(materializeOptionForSize(findOptionByName(group, sel.name), sizeLabel));
      } else if (sel?.id !== undefined) {
        const found = (group.options || []).find(o => o.id === sel.id) || null;
        pushIfOk(materializeOptionForSize(found, sizeLabel));
      }
    }
    if (out.length) return out;
  } else if (userSelected) {
    // Objeto simple â†’ tratar como single
    const one = pickOne({ product, group, sizeLabel, userSelected, defaultName });
    if (one) return [one];
  }

  // 2) Default por nombre como Ãºnica opciÃ³n (si existe)
  if (defaultName) {
    const def = findOptionByName(group, defaultName);
    if (def && (!def.idsPerSize || def.idsPerSize[sizeLabel] !== undefined)) {
      const mat = materializeOptionForSize(def, sizeLabel);
      if (mat) return [mat];
    }
  }

  // 3) Dejar en blanco si el usuario no escogiÃ³ (no forzamos opciones mÃºltiples arbitrarias)
  return [];
}

/**
 * Obtiene la variante del producto segÃºn el tamaÃ±o.
 * Soporta product.ProductsBySize y product.sizes
 */
function getSizeVariant(product, sizeLabel) {
  const variants = product?.ProductsBySize || product?.sizes || [];
  return variants.find(v => v.label === sizeLabel) || null;
}

/**
 * Prepara 1 Ã­tem del carrito con IDs correctos (platillo base + mods).
 */
function prepareItem(product, selectedSize, quantity = 1, selectedModifiers = {}) {
  const sizeLabel =
    selectedSize || product.DefaultSizeLabel || product.defaultSize || 'Grande';

  const variant = getSizeVariant(product, sizeLabel);
  if (!variant) {
    throw new Error(`TamaÃ±o "${sizeLabel}" no encontrado para ${product?.ProductName || product?.productName || 'producto'}`);
  }

  const mods = [];
  let modsTotal = 0;

  // Config de grupos y defaults.
  // includeDefaultIfPresent: si true, incluir el default si el grupo existe y no hay selecciÃ³n del usuario.
  const modTypes = [
    { type: 'vaso',     defaultName: null,            includeDefaultIfPresent: false },
    { type: 'grano',    defaultName: null,            includeDefaultIfPresent: false },
    { type: 'sabor',    defaultName: 'SIN ESENCIA',   includeDefaultIfPresent: true  },
    { type: 'leche',    defaultName: null,            includeDefaultIfPresent: false },
    { type: 'coldFoam', defaultName: 'SIN EXTRAS',    includeDefaultIfPresent: true  },
    { type: 'decorado', defaultName: 'SIN DECORAR',   includeDefaultIfPresent: true  },
    { type: 'extras',   defaultName: 'SIN EXTRAS',    includeDefaultIfPresent: true  },
    { type: 'extrashot',defaultName: 'SIN EXTRAS',    includeDefaultIfPresent: true  },
  ];

  for (const cfg of modTypes) {
    const group = getGroupByType(product, cfg.type);
    if (!group) continue; // Este producto no tiene ese grupo â†’ no se envÃ­a

    const selectionType = getGroupSelectionType(group);
    const userProvided = selectedModifiers[cfg.type];

    // Procesar solo si:
    // - el grupo es requerido
    // - el usuario seleccionÃ³ algo
    // - o se permite incluir el default si estÃ¡ presente
    const mustProcess = group.required || (userProvided !== undefined && userProvided !== null) || cfg.includeDefaultIfPresent;
    if (!mustProcess) continue;

    if (selectionType === 'multiple') {
      const many = pickMany({
        product,
        group,
        sizeLabel,
        userSelected: userProvided,
        defaultName: cfg.defaultName
      });
      for (const m of many) {
        mods.push({ id: m.id, name: m.name, price: m.price });
        modsTotal += m.price || 0;
        if (Array.isArray(m.sendWith)) {
          for (const ex of m.sendWith) mods.push({ id: ex.id, name: ex.name, price: 0 });
        }
      }
    } else {
      const one = pickOne({
        product,
        group,
        sizeLabel,
        userSelected: userProvided,
        defaultName: cfg.defaultName
      });
      if (one) {
        mods.push({ id: one.id, name: one.name, price: one.price });
        modsTotal += one.price || 0;
        if (Array.isArray(one.sendWith)) {
          for (const ex of one.sendWith) mods.push({ id: ex.id, name: ex.name, price: 0 });
        }
      }
    }
  }

  // Datos finales del Ã­tem
  const platilloId = variant.ProductId || variant.productId;
  const productName = variant.ProductName || variant.productName;
  const basePrice = Number(variant.BasePrice || variant.basePrice || 0);

  return {
    platilloId,
    cantidad: quantity,
    sizeLabel,
    productName,
    precioUnitario: basePrice,
    mods,
    // Totales auxiliares (no se envÃ­an)
    _totals: {
      unit: basePrice,
      modsTotal,
      itemTotal: (basePrice + modsTotal) * quantity
    }
  };
}

/**
 * Prepara el carrito completo para el backend (puente â†’ POS).
 * Devuelve { items, total } donde items ya es el payload que envÃ­as.
 */
export function prepareCartForBackend(cartItems) {
  const items = [];
  let total = 0;

  for (const entry of cartItems || []) {
    try {
      const prepared = prepareItem(
        entry.product,
        entry.selectedSize,
        entry.quantity,
        entry.selectedModifiers
      );

      const colorLabel = entry.selectedColor || entry.colorLabel || undefined;
      items.push({
        platilloId: prepared.platilloId,
        cantidad: prepared.cantidad,
        sizeLabel: prepared.sizeLabel,
        productName: prepared.productName,
        precioUnitario: prepared.precioUnitario,
        mods: prepared.mods,
        ...(colorLabel ? { colorLabel } : {})
      });

      total += prepared._totals.itemTotal;
    } catch (e) {
      // ProducciÃ³n: log discreto
      console.error('Error preparando item:', e?.message || e);
    }
  }

  return { items, total };
}

/**
 * (Opcional) Enviar orden al backend del puente
 * Cambia la URL si tu puente corre en otra direcciÃ³n.
 */
export async function sendOrderToBackend(cartItems) {
  const carrito = prepareCartForBackend(cartItems);
  if (!carrito.items.length) {
    throw new Error('No hay items vÃ¡lidos en el carrito');
  }

  const res = await fetch('http://localhost:3001/api/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ carrito })
  });

  if (!res.ok) {
    let err = 'Error al enviar orden';
    try {
      const j = await res.json();
      if (j?.error) err = j.error;
    } catch {}
    throw new Error(err);
  }

  return res.json();
}