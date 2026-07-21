// order.js - VERSIÓN CORREGIDA: TamañoId correcto para inventario en la nube
import { Router } from 'express';
import { getPool, sql, getFechaOperacionPOS } from '../dateHelper.js';

const router = Router();

const STATUS_ACTIVO = 4;

//  NUEVA FUNCIÓN: Mapear sizeLabel de pasteles a TamañoId de la tabla
const obtenerTamanoIdPasteles = (sizeLabel) => {
  // Tabla de tamaños de la BD:
  // 11 = INDIVIDUAL
  // 12 = CHICO
  // 13 = MEDIANO
  // 14 = GRANDE
  const PASTELES_MAP = {
    'Individual': 11,
    'Chico': 12,
    'Mediano': 13,
    'Grande': 14
  };
  
  return PASTELES_MAP[sizeLabel] || 12; // Default: CHICO
};

// 🔥 NUEVA FUNCIÓN: Mapear sizeLabel de pasteles a índice de precio
const obtenerIndicePrecioPastel = (sizeLabel) => {
  // Mapeo sizeLabel → Precio1-5
  const PRECIO_MAP = {
    'Chico': 1,      // Precio1
    'Mediano': 4,    // Precio4  (para P. COCO y otros)
    'Individual': 3, // Precio3
    'Grande': 5      // Precio5
  };
  
  return PRECIO_MAP[sizeLabel] || 1; // Default: Precio1
};

// 🔥 FUNCIÓN CORREGIDA: Obtener TamañoId según tabla de tamaños
const obtenerTamanoId = (item) => {
  const platilloId = Number(item.platilloId);
  
  // ========================================================================
  // PASTELES DE REPOSTERÍA (1725-1731): USAR sizeLabel, NO el tamanoId del catálogo
  // El catálogo tiene índices de precio (1, 3, 4), no TamañoId de la tabla (11-14)
  // ========================================================================
  if ((platilloId >= 1725 && platilloId <= 1731) || platilloId === 1787 || platilloId === 1800 || platilloId === 1817) {
    const sizeLabel = item.sizeLabel || 'Chico';
    return obtenerTamanoIdPasteles(sizeLabel); // Devuelve 11, 12, 13, o 14
  }

  // ========================================================================
  // RESTO DE PRODUCTOS: Calcular tamanoId automáticamente
  // ========================================================================
  const productName = (item.productName || '').toUpperCase();
  const sizeLabelRaw = item.sizeLabel || '';
  const sizeLabel = sizeLabelRaw.trim();

  // COPITAS (Minipostres): TamañoId = 17
  if (platilloId >= 85 && platilloId <= 86) return 17;
  if (platilloId === 499) return 17;
  if (platilloId === 2179) return 17;
  if (platilloId === 2273) return 17;

  // ADICIONALES: TamañoId = 18
  if (platilloId === 472) return 18;
  if (platilloId >= 1895 && platilloId <= 1896) return 18;
  if (platilloId === 2195) return 18;

  // MINIPOSTRES (M.* y otros): TamañoId = 17
  if (platilloId === 1732) return 17;
  if (platilloId >= 1734 && platilloId <= 1735) return 17;
  if (platilloId >= 1738 && platilloId <= 1740) return 17;
  if (platilloId === 1742) return 17;
  if (platilloId === 1744) return 17;
  if (platilloId === 1747) return 17;
  if (platilloId === 1751) return 17;
  if (platilloId >= 1755 && platilloId <= 1756) return 17;
  if (platilloId >= 1758 && platilloId <= 1760) return 17;

  // ROLES (PANADERIA): TamañoId = 18
  if (platilloId >= 1766 && platilloId <= 1768) return 18;

  // GALLETAS (incluye cajas): TamañoId = 18
  if (platilloId >= 1770 && platilloId <= 1776) return 18;

  // REBANADAS: TamañoId = 18
  if (platilloId >= 1870 && platilloId <= 1875) return 18;

  // VELAS: TamañoId = 18
  if (platilloId >= 1895 && platilloId <= 1896) return 18;

  // ALIMENTOS SALADOS (Sandwiches/Baguettes): TamañoId = 18
  if (platilloId >= 1899 && platilloId <= 1901) return 18;

  // MINIPOSTRES (continuación): TamañoId = 17
  if (platilloId === 1983) return 17;
  if (platilloId === 2147) return 17;
  if (platilloId >= 2148 && platilloId <= 2149) return 18;
  if (platilloId === 2163) return 17;
  if (platilloId >= 2176 && platilloId <= 2179) return 17;
  if (platilloId === 2180) return 18;
  if (platilloId === 2186) return 17;
  if (platilloId === 2195) return 18;
  if (platilloId === 2342) return 18;

  // Validaciones por nombre (fallback)
  if (productName.startsWith('M.')) return 17;
  if (productName.startsWith('R.')) return 18;
  if (productName.includes('COPITA') || productName.includes('VASITO')) return 17;

  // Regla bebidas frías "Grande" (en tu BD son 16 oz)
  const esBebidaFria = (() => {
    const n = productName;
    return n.includes('ICED') || n.includes('COLD BREW') || n.includes('A LAS ROCAS')
        || n.includes('FRAPPE') || n.includes('FRAPPUCCINO') || n.includes('REFRESHER')
        || n.includes('SHAKE') || n.includes('CHOCOLATE A LAS ROCAS');
  })();
  if (esBebidaFria && sizeLabel.toUpperCase() === 'GRANDE') {
    return 16;
  }

  // Mapeo genérico por sizeLabel (bebidas principalmente)
  const TAMANO_MAP = {
    'Individual': 11,
    'Chico': 12,
    'Mediano': 15,     // 12 oz bebidas
    'Mediana': 15,     // 12 oz bebidas
    'Grande': 16,      // 16 oz bebidas
    '12 oz': 15,
    '12oz': 15,
    '16 oz': 16,
    '16oz': 16,
    'XL': 19,
    'XXL': 19,
    '20 oz': 19,
    '20oz': 19,
    'Único': 18,
    'único': 18,
    'Unico': 18,
    ' ': 18,
    '': 18
  };

  const tamanoMapeado = TAMANO_MAP[sizeLabel];
  if (tamanoMapeado !== undefined) return tamanoMapeado;

  if (!sizeLabel || sizeLabel.trim() === '') return 18;
  return 16;
};

// 🔥 FUNCIÓN MODIFICADA: Obtener precio según índice (para pasteles usa sizeLabel)
const obtenerPrecioSegunTamano = (platilloData, item, platilloId) => {
  // Para PASTELES: usar el sizeLabel para obtener el índice de precio correcto
  if ((platilloId >= 1725 && platilloId <= 1731) || platilloId === 1787 || platilloId === 1800 || platilloId === 1817) {
    const sizeLabel = item.sizeLabel || 'Chico';
    const indicePrecio = obtenerIndicePrecioPastel(sizeLabel);

    const preciosMap = {
      1: platilloData.Precio1,
      2: platilloData.Precio2,
      3: platilloData.Precio3,
      4: platilloData.Precio4,
      5: platilloData.Precio5
    };

    const precio = preciosMap[indicePrecio];

    if (!precio || precio === 0) {
      return Number(platilloData.Precio1 || 0);
    }

    return Number(precio || 0);
  }

  // Para OTROS PRODUCTOS: usar Precio1
  return Number(platilloData.Precio1 || 0);
};

router.post('/order', async (req, res) => {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    const {
      idTerminal =1,
      idUsuario = 9,
      mesa = '-1',
      personas = 1,
      tipoOrden = 1,
      carrito = { items: [], total: 0 },
    } = req.body || {};

    const items = Array.isArray(carrito?.items) ? carrito.items : [];
    if (!items.length) {
      return res.status(400).json({ ok: false, error: 'Carrito vacío' });
    }

    await transaction.begin();
    const { fechaOp, nowSql } = await getFechaOperacionPOS();

    console.log('\n📋 Nueva orden KIOSKO:');
    console.log('   Usuario:', idUsuario);
    console.log('   Mesa:', mesa);
    console.log('   Items:', items.length);

    console.log('\n🔍 Validando precios...');
    
    const itemsConPreciosReales = [];
    let totalLista = 0;
    
    const todosLosIds = new Set();
    items.forEach(item => {
      todosLosIds.add(Number(item.platilloId));
      if (Array.isArray(item.mods)) {
        item.mods.forEach(mod => todosLosIds.add(Number(mod.id)));
      }
    });

    // Query para obtener TODOS los precios
    const platillosQuery = `
      SELECT Id_Platillo, Nombre, Precio1, Precio2, Precio3, Precio4, Precio5, ConIva, Id_Grupo
      FROM Platillo WITH (NOLOCK)
      WHERE Id_Platillo IN (${Array.from(todosLosIds).join(',')})
    `;
    const platillosResult = await new sql.Request(transaction).query(platillosQuery);
    const platillosMap = new Map();
    platillosResult.recordset.forEach(p => {
      platillosMap.set(p.Id_Platillo, {
        Precio1: Number(p.Precio1 || 0),
        Precio2: Number(p.Precio2 || 0),
        Precio3: Number(p.Precio3 || 0),
        Precio4: Number(p.Precio4 || 0),
        Precio5: Number(p.Precio5 || 0),
        conIva: p.ConIva,
        nombre: p.Nombre,
        grupoId: p.Id_Grupo
      });
    });

    for (const item of items) {
      const platilloId = Number(item.platilloId);
      const cantidad = Number(item.cantidad || 1);
      
      const platilloData = platillosMap.get(platilloId);
      if (!platilloData) {
        throw new Error(`Producto ${platilloId} no encontrado en BD`);
      }
      
      // 🔥 OBTENER TAMANOID CORRECTO (11-19 según tabla)
      const tamanoId = obtenerTamanoId(item);
      
      // 🔥 OBTENER PRECIO CORRECTO (usando índice de precio para pasteles)
      const precioBasePuro = obtenerPrecioSegunTamano(platilloData, item, platilloId);
      
      console.log(`   🔍 ${item.productName} (ID: ${platilloId}, sizeLabel: ${item.sizeLabel})`);
      console.log(`      TamañoId para inventario: ${tamanoId}`);
      console.log(`      Precios BD: P1=${platilloData.Precio1}, P2=${platilloData.Precio2}, P3=${platilloData.Precio3}, P4=${platilloData.Precio4}`);
      console.log(`      Precio seleccionado: $${precioBasePuro}`);
      
      const modsConPreciosReales = [];
      let precioMods = 0;
      
      if (Array.isArray(item.mods)) {
        for (const mod of item.mods) {
          const modId = Number(mod.id);
          const modData = platillosMap.get(modId);
          
          if (!modData) {
            throw new Error(`Modificador ${modId} no encontrado en BD`);
          }
          
          const modPrecioReal = modData.Precio1;
          const modConIva = modData.conIva;
          
          modsConPreciosReales.push({
            ...mod,
            priceReal: modPrecioReal,
            conIva: modConIva
          });
          
          precioMods += modPrecioReal;
        }
      }
      
      const precioCompleto = precioBasePuro + precioMods;
      const precioTotalItem = precioCompleto * cantidad;
      
      itemsConPreciosReales.push({
        ...item,
        precioBasePuro: precioBasePuro,
        precioMods: precioMods,
        precioCompleto: precioCompleto,
        precioTotalItem: precioTotalItem,
        tamanoId: tamanoId,
        mods: modsConPreciosReales
      });
      
      totalLista += precioTotalItem;
      
      console.log(`   📦 ${item.productName}: $${precioCompleto.toFixed(2)} (TamañoId: ${tamanoId})`);
    }
    
    console.log(`   ✅ Total calculado: $${totalLista.toFixed(2)}`);

    console.log('\n1️⃣ Creando orden...');
    
    await new sql.Request(transaction)
      .input('Orden', sql.Float, 0)
      .input('Mesa', sql.VarChar(50), String(mesa))
      .input('Id_Usuario_Mesero', sql.Int, idUsuario)
      .input('Id_Usuario_CajeroAbrio', sql.Int, 0)
      .input('Personas', sql.SmallInt, personas)
      .input('Descuento', sql.Float, 0)
      .input('Id_Cliente', sql.Float, 0)
      .input('Impuesto', sql.Float, 16)
      .input('Id_Terminal', sql.SmallInt, idTerminal)
      .input('HoraAbrir', sql.DateTime, nowSql)
      .input('Impresa', sql.Bit, 0)
      .input('Id_Usuario_Repartidor', sql.Int, 0)
      .input('Servicio', sql.Float, 0)
      .input('Tiempo_entrega', sql.SmallInt, 0)
      .input('Tiempo_salida', sql.DateTime, null)
      .input('Billete', sql.Float, 0)
      .input('ImpuestoAdicional', sql.Float, 0)
      .input('Status', sql.Int, STATUS_ACTIVO)
      .input('Id_TerminalTemporal', sql.Int, 0)
      .input('HoraImpresion', sql.DateTime, nowSql)
      .input('NumeroTarjeta', sql.VarChar(100), '')
      .input('Cambio', sql.Float, 0)
      .input('Torre', sql.VarChar(100), '')
      .input('Total', sql.Float, totalLista)
      .input('Id_Hotel', sql.Float, 0)
      .input('Id_SucursalDestino', sql.Float, 0)
      .input('SubTotal', sql.Float, totalLista)
      .input('NumeroEnvio', sql.Float, 0)
      .input('IdTipoOrden', sql.TinyInt, tipoOrden)
      .input('fechaoperacion', sql.DateTime, fechaOp)
      .input('CambiosDeMesa', sql.Int, 0)
      .input('IVACobrado', sql.Decimal(18,6), 0)
      .input('IEPS', sql.Decimal(18,6), 0)
      .input('FormaDomicilio', sql.VarChar(100), '')
      .input('MarcaId', sql.Int, 0)
      .execute('spInsOrdenPendiente');

    const ordSel = await new sql.Request(transaction).query(`
      SELECT TOP 1 Orden 
      FROM OrdenPendiente WITH (NOLOCK)
      WHERE Id_Terminal = ${idTerminal} 
        AND Id_Usuario_Mesero = ${idUsuario}
        AND CAST(fechaoperacion AS DATE) = CAST(GETDATE() AS DATE)
      ORDER BY Orden DESC
    `);

    const ORDEN = ordSel.recordset?.[0]?.Orden;
    if (!ORDEN) throw new Error('No se pudo recuperar el número de orden');

    console.log(`   ✅ Orden #${ORDEN} creada`);

    console.log('\n2️⃣ Insertando comandas...');
    
    for (const item of itemsConPreciosReales) {
      const platilloId = Number(item.platilloId);
      const cantidad = Number(item.cantidad || 1);
      const sizeLabel = item.sizeLabel || '';
      const tamanoId = item.tamanoId;
      
      // 🔥 CALCULAR TAMANO (índice de precio para inventario en la nube)
      // Pasteles: usa índice de precio (1, 3, 4, etc.)
      // Otros productos: siempre 1
      const tamano = ((platilloId >= 1725 && platilloId <= 1731) || platilloId === 1787 || platilloId === 1800 || platilloId === 1817)
        ? obtenerIndicePrecioPastel(sizeLabel)
        : 1;
      
      let descripcion = item.productName;
      const modNames = [];
      if (Array.isArray(item.mods)) {
        for (const mod of item.mods) {
          modNames.push(mod.name);
        }
      }
      if (sizeLabel && sizeLabel.trim() !== '') {
        descripcion += `, ${sizeLabel}`;
      }
      if (modNames.length > 0) {
        descripcion += `, ${modNames.join(', ')}`;
      }
      if (item.colorLabel) {
        descripcion += ` - ${item.colorLabel}`;
      }

      const punitario = item.precioCompleto / 1.16;
      const subtotal = item.precioCompleto * cantidad;

      const platilloResult = await new sql.Request(transaction)
        .input('Orden', sql.Int, ORDEN)
        .input('Id_Platillo', sql.Int, platilloId)
        .input('Cantidad', sql.Decimal(18,4), cantidad)
        .input('Punitario', sql.Decimal(18,4), punitario)
        .input('SubTotal', sql.Decimal(18,4), subtotal)
        .input('Id_CdeC', sql.Int, 1)
        .input('Id_Comanda', sql.Int, 0)
        .input('Silla', sql.Int, 1)
        .input('Descripcion', sql.NVarChar(300), descripcion)
        .input('Hora', sql.DateTime, nowSql)
        .input('ConIva', sql.Bit, 1)
        .input('Poriginal', sql.Decimal(18,4), subtotal)
        .input('Impresa', sql.Bit, 0)
        .input('Modificador', sql.Bit, 0)
        .input('Registro', sql.Int, 0)
        .input('DxU', sql.Bit, 0)
        .input('Descuento', sql.Decimal(18,4), 0)
        .input('Cortesia', sql.Bit, 0)
        .input('Tamano', sql.Int, tamano)  // 🔥 Usa índice para pasteles, 1 para otros
        .input('Borrar', sql.Bit, 0)
        .input('Id_Terminal', sql.Int, idTerminal)
        .input('NumeroTarjeta', sql.NVarChar(50), '')
        .input('IncluirTarjeta', sql.Bit, 0)
        .input('Tiempo', sql.Int, 0)
        .input('TamanoOrden', sql.Int, 0)
        .input('Id_SucursalDestino', sql.Int, 0)
        .input('SubTotalSinIva', sql.Decimal(18,4), punitario * cantidad)
        .input('FechaOperacion', sql.DateTime, fechaOp)
        .input('IdDuranteCaptura', sql.Int, -1)
        .input('TienePromo', sql.Bit, 0)
        .input('PorcentajePromo', sql.Decimal(18,4), 0)
        .input('IEPS', sql.Decimal(18,4), 0)
        .input('IVACobrado', sql.Decimal(18,4), 0)
        .input('CodigoBarras', sql.NVarChar(50), '')
        .input('Id_Usuario_Mesero', sql.Int, idUsuario)
        .input('TamanoId', sql.Int, tamanoId)  // 🔥 TAMANOID CORRECTO (11-14 para pasteles)
        .input('ComisionVendedor', sql.Decimal(18,4), 0)
        .input('IEPSPct', sql.Decimal(18,4), 0)
        .execute('spInsComanda');

      const idConsecutivo = platilloResult.recordset?.[0]?.Id_Consecutivo;
      
      console.log(`   ✓ ${item.productName} x${cantidad}`);
      console.log(`     TamañoId: ${tamanoId}, Tamano: ${tamano}`);
      console.log(`     Punitario: $${punitario.toFixed(2)}, SubTotal: $${subtotal.toFixed(2)}`);

      if (Array.isArray(item.mods) && item.mods.length > 0) {
        let idDuranteCaptura = -2;
        
        for (const mod of item.mods) {
          const modId = Number(mod.id);
          const modConIva = mod.conIva !== undefined ? mod.conIva : 1;
          
          await new sql.Request(transaction)
            .input('Orden', sql.Int, ORDEN)
            .input('Id_Platillo', sql.Int, modId)
            .input('Cantidad', sql.Decimal(18,4), cantidad)
            .input('Punitario', sql.Decimal(18,4), 0)
            .input('SubTotal', sql.Decimal(18,4), 0)
            .input('Id_CdeC', sql.Int, 1)
            .input('Id_Comanda', sql.Int, 0)
            .input('Silla', sql.Int, 1)
            .input('Descripcion', sql.NVarChar(300), mod.name)
            .input('Hora', sql.DateTime, nowSql)
            .input('ConIva', sql.Bit, modConIva)
            .input('Poriginal', sql.Decimal(18,4), 0)
            .input('Impresa', sql.Bit, 0)
            .input('Modificador', sql.Bit, 1)
            .input('Registro', sql.Int, idConsecutivo || 0)
            .input('DxU', sql.Bit, 0)
            .input('Descuento', sql.Decimal(18,4), 0)
            .input('Cortesia', sql.Bit, 0)
            .input('Tamano', sql.Int, 1)
            .input('Borrar', sql.Bit, 0)
            .input('Id_Terminal', sql.Int, idTerminal)
            .input('NumeroTarjeta', sql.NVarChar(50), '')
            .input('IncluirTarjeta', sql.Bit, 0)
            .input('Tiempo', sql.Int, 0)
            .input('TamanoOrden', sql.Int, 0)
            .input('Id_SucursalDestino', sql.Int, 0)
            .input('SubTotalSinIva', sql.Decimal(18,4), 0)
            .input('FechaOperacion', sql.DateTime, fechaOp)
            .input('IdDuranteCaptura', sql.Int, idDuranteCaptura)
            .input('TienePromo', sql.Bit, 0)
            .input('PorcentajePromo', sql.Decimal(18,4), 0)
            .input('IEPS', sql.Decimal(18,4), 0)
            .input('IVACobrado', sql.Decimal(18,4), 0)
            .input('CodigoBarras', sql.NVarChar(50), '')
            .input('Id_Usuario_Mesero', sql.Int, idUsuario)
            .input('TamanoId', sql.Int, tamanoId)
            .input('ComisionVendedor', sql.Decimal(18,4), 0)
            .input('IEPSPct', sql.Decimal(18,4), 0)
            .execute('spInsComanda');
          
          console.log(`     + ${mod.name} (M=1, R=${idConsecutivo}) - $0.00`);
          idDuranteCaptura--;
        }
      }
    }

    console.log('\n3️⃣ Calculando totales...');
    
    const totalesQuery = await new sql.Request(transaction)
      .input('OrdenNum', sql.Int, ORDEN)
      .input('FechaOp', sql.DateTime, fechaOp)
      .query(`
        SELECT 
          ISNULL(SUM(CASE WHEN Modificador = 0 THEN SubTotal ELSE 0 END), 0) as TotalFinal,
          ISNULL(SUM(CASE WHEN Modificador = 0 THEN SubTotalSinIva ELSE 0 END), 0) as SubtotalSinIvaFinal,
          ISNULL(SUM(CASE WHEN Modificador = 0 THEN IVACobrado ELSE 0 END), 0) as IVAFinal,
          ISNULL(SUM(CASE WHEN Modificador = 0 THEN IEPS ELSE 0 END), 0) as IEPSFinal,
          ISNULL(SUM(CASE WHEN Modificador = 0 THEN Descuento ELSE 0 END), 0) as DescuentoTotal
        FROM Comanda WITH (NOLOCK)
        WHERE Orden = @OrdenNum
          AND CAST(FechaOperacion AS DATE) = CAST(@FechaOp AS DATE)
      `);
    
    const totales = totalesQuery.recordset[0];
    const totalFinal = totales.TotalFinal || totalLista;
    
    console.log(`   💰 Total: $${totalFinal.toFixed(2)}`);
    
    await new sql.Request(transaction)
      .input('Orden', sql.Int, ORDEN)
      .input('Mesa', sql.VarChar(50), String(mesa))
      .input('Id_Usuario_Mesero', sql.Int, idUsuario)
      .input('Id_Usuario_CajeroAbrio', sql.Int, 0)
      .input('Personas', sql.SmallInt, personas)
      .input('Descuento', sql.Float, totales.DescuentoTotal || 0)
      .input('Id_Cliente', sql.Float, 0)
      .input('Impuesto', sql.Float, 16)
      .input('Id_Terminal', sql.SmallInt, idTerminal)
      .input('HoraAbrir', sql.DateTime, nowSql)
      .input('Impresa', sql.Bit, 0)
      .input('Id_Usuario_Repartidor', sql.Int, 0)
      .input('Servicio', sql.Float, 0)
      .input('Tiempo_entrega', sql.SmallInt, 0)
      .input('Tiempo_salida', sql.DateTime, null)
      .input('Billete', sql.Float, 0)
      .input('ImpuestoAdicional', sql.Float, 0)
      .input('Status', sql.Int, STATUS_ACTIVO)
      .input('Id_TerminalTemporal', sql.Int, 0)
      .input('HoraImpresion', sql.DateTime, nowSql)
      .input('NumeroTarjeta', sql.VarChar(100), '')
      .input('Cambio', sql.Float, 0)
      .input('Torre', sql.VarChar(100), '')
      .input('Total', sql.Float, totalFinal)
      .input('Id_Hotel', sql.Float, 0)
      .input('Id_SucursalDestino', sql.Float, 0)
      .input('SubTotal', sql.Float, totalFinal)
      .input('NumeroEnvio', sql.Float, 0)
      .input('IdTipoOrden', sql.TinyInt, tipoOrden)
      .input('fechaoperacion', sql.DateTime, fechaOp)
      .input('CambiosDeMesa', sql.Int, 0)
      .input('IVACobrado', sql.Decimal(18,6), totales.IVAFinal)
      .input('IEPS', sql.Decimal(18,6), totales.IEPSFinal)
      .input('FormaDomicilio', sql.VarChar(100), '')
      .input('MarcaId', sql.Int, 0)
      .execute('spUpdOrdenPendiente');
    
    console.log('   ✅ Orden actualizada');

    console.log('\n4️⃣ Enviando al KDS...');
    try {
      await new sql.Request(transaction)
        .input('Orden', sql.Int, ORDEN)
        .input('fechaoperacion', sql.DateTime, fechaOp)
        .execute('kds_InsComandaProduccion');
      console.log('   ✅ Visible en KDS');
    } catch (kdsError) {
      console.log('   ⚠️ KDS no disponible:', kdsError.message);
    }

    await transaction.commit();
    
    console.log(`\n✨ Orden #${ORDEN} completada exitosamente\n`);

    res.json({
      ok: true,
      orden: ORDEN,
      total: totalFinal,
      mensaje: `Orden #${ORDEN} creada - Total: $${totalFinal.toFixed(2)}`
    });

  } catch (e) {
    console.error('❌ Error:', e);
    if (transaction._aborted === false) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Error en rollback:', rollbackError);
      }
    }
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;