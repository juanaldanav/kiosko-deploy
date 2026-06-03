// routes/visibility.js
import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HIDDEN_FILE = path.join(__dirname, '..', 'data', 'hidden_products.json');
const HIDDEN_SIZES_FILE = path.join(__dirname, '..', 'data', 'hidden_sizes.json');
const HIDDEN_COLORS_FILE = path.join(__dirname, '..', 'data', 'hidden_colors.json');

let refreshTimestamp = 0;

const ensureFile = () => {
  const dir = path.dirname(HIDDEN_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(HIDDEN_FILE)) {
    fs.writeFileSync(HIDDEN_FILE, JSON.stringify({ hidden: [] }, null, 2));
  }
};

const ensureSizesFile = () => {
  const dir = path.dirname(HIDDEN_SIZES_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(HIDDEN_SIZES_FILE)) {
    fs.writeFileSync(HIDDEN_SIZES_FILE, JSON.stringify({ hiddenSizes: [] }, null, 2));
  }
};

// GET /api/visibility
router.get('/visibility', (req, res) => {
  try {
    ensureFile();
    const data = JSON.parse(fs.readFileSync(HIDDEN_FILE, 'utf-8'));
    res.json({ ok: true, hidden: data.hidden || [] });
  } catch (e) {
    console.error('Error leyendo visibilidad:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/visibility
router.post('/visibility', (req, res) => {
  try {
    ensureFile();
    const { productId, visible } = req.body;
    
    if (productId === undefined) {
      return res.status(400).json({ ok: false, error: 'productId requerido' });
    }

    const data = JSON.parse(fs.readFileSync(HIDDEN_FILE, 'utf-8'));
    let hidden = data.hidden || [];

    if (visible) {
      hidden = hidden.filter(id => id !== productId);
    } else {
      if (!hidden.includes(productId)) {
        hidden.push(productId);
      }
    }

    fs.writeFileSync(HIDDEN_FILE, JSON.stringify({ hidden }, null, 2));
    console.log(`Producto ${productId} ahora ${visible ? 'VISIBLE' : 'OCULTO'}`);
    res.json({ ok: true, hidden });
  } catch (e) {
    console.error('Error actualizando visibilidad:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/visibility/bulk
router.post('/visibility/bulk', (req, res) => {
  try {
    ensureFile();
    const { hidden } = req.body;
    
    if (!Array.isArray(hidden)) {
      return res.status(400).json({ ok: false, error: 'hidden debe ser un array' });
    }

    fs.writeFileSync(HIDDEN_FILE, JSON.stringify({ hidden }, null, 2));
    console.log(`Visibilidad actualizada: ${hidden.length} productos ocultos`);
    res.json({ ok: true, hidden });
  } catch (e) {
    console.error('Error en bulk update:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ==================== TAMANOS DE PASTELES ====================
// Formato de clave: "productId:sizeLabel" (ej: "1725:Individual")

// GET /api/visibility/sizes
router.get('/visibility/sizes', (req, res) => {
  try {
    ensureSizesFile();
    const data = JSON.parse(fs.readFileSync(HIDDEN_SIZES_FILE, 'utf-8'));
    res.json({ ok: true, hiddenSizes: data.hiddenSizes || [] });
  } catch (e) {
    console.error('Error leyendo tamanos ocultos:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/visibility/sizes
// Body: { productId: number, sizeLabel: string, visible: boolean }
router.post('/visibility/sizes', (req, res) => {
  try {
    ensureSizesFile();
    const { productId, sizeLabel, visible } = req.body;
    
    if (productId === undefined || !sizeLabel) {
      return res.status(400).json({ ok: false, error: 'productId y sizeLabel requeridos' });
    }

    const sizeKey = `${productId}:${sizeLabel}`;
    const data = JSON.parse(fs.readFileSync(HIDDEN_SIZES_FILE, 'utf-8'));
    let hiddenSizes = data.hiddenSizes || [];

    if (visible) {
      hiddenSizes = hiddenSizes.filter(key => key !== sizeKey);
    } else {
      if (!hiddenSizes.includes(sizeKey)) {
        hiddenSizes.push(sizeKey);
      }
    }

    fs.writeFileSync(HIDDEN_SIZES_FILE, JSON.stringify({ hiddenSizes }, null, 2));
    console.log(`Tamano ${sizeKey} ahora ${visible ? 'VISIBLE' : 'OCULTO'}`);
    res.json({ ok: true, hiddenSizes });
  } catch (e) {
    console.error('Error actualizando tamano:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ==================== COLORES DE PASTELES ====================
// Formato de clave: "productId:colorId" (ej: "1787:ROSA")

const ensureColorsFile = () => {
  const dir = path.dirname(HIDDEN_COLORS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(HIDDEN_COLORS_FILE)) {
    fs.writeFileSync(HIDDEN_COLORS_FILE, JSON.stringify({ hiddenColors: [] }, null, 2));
  }
};

// GET /api/visibility/colors
router.get('/visibility/colors', (req, res) => {
  try {
    ensureColorsFile();
    const data = JSON.parse(fs.readFileSync(HIDDEN_COLORS_FILE, 'utf-8'));
    res.json({ ok: true, hiddenColors: data.hiddenColors || [] });
  } catch (e) {
    console.error('Error leyendo colores ocultos:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/visibility/colors
// Body: { productId: number, colorId: string, visible: boolean }
router.post('/visibility/colors', (req, res) => {
  try {
    ensureColorsFile();
    const { productId, colorId, visible } = req.body;

    if (productId === undefined || !colorId) {
      return res.status(400).json({ ok: false, error: 'productId y colorId requeridos' });
    }

    const colorKey = `${productId}:${colorId}`;
    const data = JSON.parse(fs.readFileSync(HIDDEN_COLORS_FILE, 'utf-8'));
    let hiddenColors = data.hiddenColors || [];

    if (visible) {
      hiddenColors = hiddenColors.filter(key => key !== colorKey);
    } else {
      if (!hiddenColors.includes(colorKey)) hiddenColors.push(colorKey);
    }

    fs.writeFileSync(HIDDEN_COLORS_FILE, JSON.stringify({ hiddenColors }, null, 2));
    console.log(`Color ${colorKey} ahora ${visible ? 'VISIBLE' : 'OCULTO'}`);
    res.json({ ok: true, hiddenColors });
  } catch (e) {
    console.error('Error actualizando color:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ==================== INSUMOS (MODIFICADORES POR NOMBRE) ====================
// Oculta opciones de modificadores por NOMBRE canonico (ej: "AVELLANA").
// Por nombre y no por id: el mismo insumo tiene ids distintos por tamano/producto.

const HIDDEN_INSUMOS_FILE = path.join(__dirname, '..', 'data', 'hidden_insumos.json');

const ensureInsumosFile = () => {
  const dir = path.dirname(HIDDEN_INSUMOS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(HIDDEN_INSUMOS_FILE)) {
    fs.writeFileSync(HIDDEN_INSUMOS_FILE, JSON.stringify({ hiddenInsumos: [] }, null, 2));
  }
};

// GET /api/visibility/insumos
router.get('/visibility/insumos', (req, res) => {
  try {
    ensureInsumosFile();
    const data = JSON.parse(fs.readFileSync(HIDDEN_INSUMOS_FILE, 'utf-8'));
    res.json({ ok: true, hiddenInsumos: data.hiddenInsumos || [] });
  } catch (e) {
    console.error('Error leyendo insumos ocultos:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/visibility/insumos
// Body: { name: string, visible: boolean }
router.post('/visibility/insumos', (req, res) => {
  try {
    ensureInsumosFile();
    const { name, visible } = req.body;

    if (!name) {
      return res.status(400).json({ ok: false, error: 'name requerido' });
    }

    const data = JSON.parse(fs.readFileSync(HIDDEN_INSUMOS_FILE, 'utf-8'));
    let hiddenInsumos = data.hiddenInsumos || [];

    if (visible) {
      hiddenInsumos = hiddenInsumos.filter(n => n !== name);
    } else {
      if (!hiddenInsumos.includes(name)) hiddenInsumos.push(name);
    }

    fs.writeFileSync(HIDDEN_INSUMOS_FILE, JSON.stringify({ hiddenInsumos }, null, 2));
    console.log(`Insumo "${name}" ahora ${visible ? 'VISIBLE' : 'OCULTO'}`);
    res.json({ ok: true, hiddenInsumos });
  } catch (e) {
    console.error('Error actualizando insumo:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ==================== REFRESH ====================

// POST /api/visibility/refresh
router.post('/visibility/refresh', (req, res) => {
  refreshTimestamp = Date.now();
  console.log(`Senal de refresh enviada: ${refreshTimestamp}`);
  res.json({ ok: true, timestamp: refreshTimestamp });
});

// GET /api/visibility/refresh-status
router.get('/visibility/refresh-status', (req, res) => {
  res.json({ ok: true, timestamp: refreshTimestamp });
});

export default router;
