// pages/AdminVisibilidad.jsx
import { useState, useEffect, useMemo, useRef} from 'react';
import catalogData from '../data/catalog_app.json';
import { getModifierIcon } from '../data/modifiersImages';

// Clave canonica de insumo: sin acentos, mayusculas, sin puntuacion en bordes.
// Unifica variantes como ".AVENA" / "AVENA" (mismo insumo, ids distintos por tamano).
function canonInsumo(s = '') {
  return String(s)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[^A-Z0-9]+|[^A-Z0-9]+$/g, '');
}

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001'
  : `http://${window.location.hostname}:3001`;

export default function AdminVisibilidad() {
  const [activeTab, setActiveTab] = useState('productos');
  const [hidden, setHidden] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoAvisado, setAutoAvisado] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  // 'todos' | 'visibles' | 'ocultos' — antes era un checkbox "Solo ocultos",
  // que no dejaba ver la lista de los visibles por si sola.
  const [verFiltro, setVerFiltro] = useState('todos');
  const [refreshing, setRefreshing] = useState(false);
  const [hiddenSizes, setHiddenSizes] = useState([]);
  const [loadingSizes, setLoadingSizes] = useState(true);
  const [searchPastel, setSearchPastel] = useState('');
  const [hiddenColors, setHiddenColors] = useState([]);
  const [loadingColors, setLoadingColors] = useState(true);
  const [hiddenInsumos, setHiddenInsumos] = useState([]);
  const [loadingInsumos, setLoadingInsumos] = useState(true);
  const [searchInsumo, setSearchInsumo] = useState('');
  // Tema: eleccion de la sucursal, guardada en el navegador del kiosko. No va al
  // servidor a proposito — cada pantalla esta en una sala distinta y decide sola.
  const [tema, setTema] = useState(() => {
    try { return localStorage.getItem('adminTema') === 'oscuro' ? 'oscuro' : 'claro'; }
    catch { return 'claro'; }
  });

  useEffect(() => {
    const raiz = document.documentElement;
    raiz.setAttribute('data-tema', tema);
    try { localStorage.setItem('adminTema', tema); } catch {}
    // Al salir del admin se quita: el menu del kiosko no usa estas variables.
    return () => raiz.removeAttribute('data-tema');
  }, [tema]);

  const products = catalogData.catalog || [];

  // Solo REPOSTERIA: esta pestana es de TAMANOS de pastel y asi la tiene ubicada
  // operacion. El pan de muerto gestiona SABORES, no tamanos, y se controla desde
  // su propia tarjeta en Productos (misma lista hidden_sizes, quedan sincronizados).
  const pasteles = useMemo(() => {
    return products.filter(p => p.category === 'REPOSTERIA' && Array.isArray(p.sizes) && p.sizes.length > 0);
  }, [products]);

  // Filtrar productos con colorOptions
  const productosConColores = useMemo(() => {
    return products.filter(p => Array.isArray(p.colorOptions) && p.colorOptions.length > 0);
  }, [products]);

  // Insumos: nombres unicos de opciones de modificadores en todo el catalog,
  // agrupados por clave canonica (".AVENA" y "AVENA" = un solo insumo).
  // Por NOMBRE, no por id — el mismo insumo tiene ids distintos por tamano/producto.
  const insumos = useMemo(() => {
    const map = new Map(); // canonKey -> { key, name, count, types, variants, icon }
    products.forEach(p => {
      (p.modifiers || []).forEach(m => {
        (m.options || []).forEach(o => {
          if (!o?.name) return;
          const key = canonInsumo(o.name);
          if (!key) return;
          if (!map.has(key)) {
            map.set(key, { key, name: o.name, count: 0, types: new Set(), variants: new Set(), icon: null });
          }
          const entry = map.get(key);
          entry.count += 1;
          entry.variants.add(o.name);
          if (m.type) entry.types.add(m.type);
          // Nombre a mostrar: preferir variante limpia (sin punto/asterisco inicial)
          if (/^[^A-Z0-9]/i.test(entry.name) && /^[A-Z0-9]/i.test(o.name)) entry.name = o.name;
          if (!entry.icon) {
            try { entry.icon = getModifierIcon(m, p, o.name); } catch { /* sin icono */ }
          }
        });
      });
    });
    return [...map.values()]
      .map(e => ({
        ...e,
        types: [...e.types].sort().join(', '),
        variants: [...e.variants].sort(),
        icon: e.icon ? e.icon.replace(/^\.\//, '/') : null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);
  
  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category))];
    return cats.sort();
  }, [products]);

  useEffect(() => {
    fetch(`${API_URL}/api/visibility`)
      .then(r => r.json())
      .then(data => {
        if (data.ok) setHidden(data.hidden || []);
      })
      .catch(err => console.error('Error cargando visibilidad:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/visibility/sizes`)
      .then(r => r.json())
      .then(data => {
        if (data.ok) setHiddenSizes(data.hiddenSizes || []);
      })
      .catch(err => console.error('Error cargando tamanos:', err))
      .finally(() => setLoadingSizes(false));
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/visibility/colors`)
      .then(r => r.json())
      .then(data => {
        if (data.ok) setHiddenColors(data.hiddenColors || []);
      })
      .catch(err => console.error('Error cargando colores:', err))
      .finally(() => setLoadingColors(false));
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/visibility/insumos`)
      .then(r => r.json())
      .then(data => {
        if (data.ok) setHiddenInsumos(data.hiddenInsumos || []);
      })
      .catch(err => console.error('Error cargando insumos:', err))
      .finally(() => setLoadingInsumos(false));
  }, []);

  // Auto-refresh: al apagar o prender algo, el kiosko tiene que enterarse solo.
  // Con espera de 2s para que apagar 10 productos seguidos mande UNA senal y no
  // diez. El boton manual sigue ahi por si se quiere forzar.
  const refreshTimer = useRef(null);
  const programarRefresh = () => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      fetch(`${API_URL}/api/visibility/refresh`, { method: 'POST' })
        .then(() => {
          setAutoAvisado(true);
          setTimeout(() => setAutoAvisado(false), 2000);
        })
        .catch(err => console.error('Error en refresh automatico:', err));
    }, 2000);
  };
  useEffect(() => () => { if (refreshTimer.current) clearTimeout(refreshTimer.current); }, []);

  const toggleProduct = async (productId) => {
    const isHidden = hidden.includes(productId);
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/visibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, visible: isHidden })
      });
      const data = await res.json();
      if (data.ok) { setHidden(data.hidden); programarRefresh(); }
    } catch (err) {
      console.error('Error:', err);
      alert('Error actualizando visibilidad');
    }
    setSaving(false);
  };

  const toggleColor = async (productId, colorId) => {
    const colorKey = `${productId}:${colorId}`;
    const isHidden = hiddenColors.includes(colorKey);
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/visibility/colors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, colorId, visible: isHidden })
      });
      const data = await res.json();
      if (data.ok) { setHiddenColors(data.hiddenColors); programarRefresh(); }
    } catch (err) {
      console.error('Error:', err);
      alert('Error actualizando color');
    }
    setSaving(false);
  };

  const toggleInsumo = async (insumo) => {
    // Ocultar guarda el nombre limpio; mostrar quita el nombre tal como quedo guardado
    const stored = hiddenInsumos.find(n => canonInsumo(n) === insumo.key);
    const isHidden = Boolean(stored);
    const name = isHidden ? stored : insumo.name;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/visibility/insumos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, visible: isHidden })
      });
      const data = await res.json();
      if (data.ok) { setHiddenInsumos(data.hiddenInsumos); programarRefresh(); }
    } catch (err) {
      console.error('Error:', err);
      alert('Error actualizando insumo');
    }
    setSaving(false);
  };

  const toggleSize = async (productId, sizeLabel) => {
    const sizeKey = `${productId}:${sizeLabel}`;
    const isHidden = hiddenSizes.includes(sizeKey);
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/visibility/sizes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, sizeLabel, visible: isHidden })
      });
      const data = await res.json();
      if (data.ok) { setHiddenSizes(data.hiddenSizes); programarRefresh(); }
    } catch (err) {
      console.error('Error:', err);
      alert('Error actualizando tamaño');
    }
    setSaving(false);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const q = search.toLowerCase();
      // Busca tambien por variante y por el id de cada una: escribir "nutella"
      // o "2343" tiene que encontrar la tarjeta de PAN DE MUERTO.
      const matchesSearch = !search ||
        p.productName.toLowerCase().includes(q) ||
        String(p.productId).includes(search) ||
        (p.sizes || []).some(sz =>
          String(sz.label || '').toLowerCase().includes(q) ||
          String(sz.productId || '').includes(search));
      const matchesCategory = !categoryFilter || p.category === categoryFilter;
      const estaOculto = hidden.includes(p.productId);
      const matchesHiddenFilter =
        verFiltro === 'todos' || (verFiltro === 'ocultos' ? estaOculto : !estaOculto);
      return matchesSearch && matchesCategory && matchesHiddenFilter;
    // Ordenado por categoria: la alternancia de tono de abajo solo sirve si los
    // productos de una misma categoria van juntos.
    }).sort((a, b) => (a.category || '').localeCompare(b.category || ''));
  }, [products, search, categoryFilter, verFiltro, hidden]);

  const hiddenInsumosCanon = useMemo(
    () => new Set(hiddenInsumos.map(n => canonInsumo(n))),
    [hiddenInsumos]
  );

  const filteredInsumos = useMemo(() => {
    if (!searchInsumo) return insumos;
    const q = searchInsumo.toLowerCase();
    return insumos.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.variants.some(v => v.toLowerCase().includes(q))
    );
  }, [insumos, searchInsumo]);

  const filteredPasteles = useMemo(() => {
    if (!searchPastel) return pasteles;
    return pasteles.filter(p => 
      p.productName.toLowerCase().includes(searchPastel.toLowerCase()) ||
      String(p.productId).includes(searchPastel)
    );
  }, [pasteles, searchPastel]);

  const toggleCategory = async (category, makeVisible) => {
    const categoryProducts = products.filter(p => p.category === category);
    const productIds = categoryProducts.map(p => p.productId);
    
    let newHidden = makeVisible 
      ? hidden.filter(id => !productIds.includes(id))
      : [...new Set([...hidden, ...productIds])];
    
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/visibility/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hidden: newHidden })
      });
      const data = await res.json();
      if (data.ok) { setHidden(data.hidden); programarRefresh(); }
    } catch (err) {
      console.error('Error:', err);
      alert('Error actualizando categoría');
    }
    setSaving(false);
  };

  const handleRefreshKiosko = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${API_URL}/api/visibility/refresh`, { method: 'POST' });
      const data = await res.json();
      if (data.ok) setTimeout(() => setRefreshing(false), 1500);
    } catch (err) {
      console.error('Error enviando refresh:', err);
      alert('Error al enviar señal de refresh');
      setRefreshing(false);
    }
  };

  if (loading || loadingSizes || loadingColors || loadingInsumos) {
    return <div style={styles.container}><style>{TEMA_CSS}</style><div style={styles.loading}>Cargando...</div></div>;
  }

  return (
    <div style={styles.container}>
      <style>{TEMA_CSS}</style>
      <header style={styles.header}>
        <h1 style={styles.title}>Admin - Visibilidad</h1>
        <p style={styles.subtitle}>
          {hidden.length} productos ocultos | {hiddenSizes.length} tamaños ocultos | {hiddenInsumos.length} insumos ocultos
        </p>
        <div style={styles.tabs}>
          <button
            onClick={() => setActiveTab('productos')}
            style={{...styles.tab, ...(activeTab === 'productos' ? styles.tabActive : {})}}
          >
            Productos
          </button>
          <button
            onClick={() => setActiveTab('tamanos')}
            style={{...styles.tab, ...(activeTab === 'tamanos' ? styles.tabActive : {})}}
          >
            Tamaños
          </button>
          {/* Colores (Confetti): oculto a peticion de operacion 29-sep-2026.
              El endpoint /api/visibility/colors y el estado siguen vivos; para
              reactivarlo, descomentar este boton y el bloque de abajo. */}
          {/*
          <button
            onClick={() => setActiveTab('colores')}
            style={{...styles.tab, ...(activeTab === 'colores' ? styles.tabActive : {})}}
          >
            Colores
          </button>
          */}
          <button
            onClick={() => setActiveTab('insumos')}
            style={{...styles.tab, ...(activeTab === 'insumos' ? styles.tabActive : {})}}
          >
            Insumos
          </button>
        </div>
        <button
            onClick={() => setTema(t => (t === 'oscuro' ? 'claro' : 'oscuro'))}
            style={{...styles.temaSwitch, ...(tema === 'oscuro' ? styles.temaSwitchOn : {})}}
            role="switch"
            aria-checked={tema === 'oscuro'}
            aria-label="Modo oscuro"
            title={tema === 'oscuro' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            <span style={{...styles.temaBola, ...(tema === 'oscuro' ? styles.temaBolaOn : {})}}>
              {tema === 'oscuro' ? <IconoLuna /> : <IconoSol />}
            </span>
        </button>
      </header>
      <div style={styles.regla} />

      {activeTab === 'productos' && (
        <>
          <div style={styles.filtersContainer}>
            <div style={styles.filters}>
              <input
                type="text"
                placeholder="Buscar por nombre o ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={styles.searchInput}
              />
              <button
                onClick={handleRefreshKiosko}
                disabled={refreshing}
                style={{...styles.refreshBtn, ...(refreshing ? styles.refreshBtnActive : {})}}
              >
                {refreshing ? <><Spinner /> Enviando...</> : 'Actualizar Kiosko'}
              </button>
            </div>
            <div style={styles.chips}>
              {['', ...categories].map((cat, i) => (
                <button
                  key={cat || 'todas'}
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    ...styles.chip,
                    ...(i === categories.length ? styles.chipUltimo : {}),
                    ...(categoryFilter === cat ? styles.chipActivo : {}),
                  }}
                >
                  {cat || 'Todas'}
                </button>
              ))}
            </div>
            <div style={styles.categoryActions}>
              <button
                onClick={() => setVerFiltro(verFiltro === 'ocultos' ? 'todos' : 'ocultos')}
                style={{...styles.btnHideAll, ...(verFiltro === 'ocultos' ? styles.btnHideAllOn : {})}}
              >
                Ver ocultos
              </button>
              <button
                onClick={() => setVerFiltro(verFiltro === 'visibles' ? 'todos' : 'visibles')}
                style={{...styles.btnShowAll, ...(verFiltro === 'visibles' ? styles.btnShowAllOn : {})}}
              >
                Ver visibles
              </button>
            </div>
            <div style={styles.resultsCount}>Mostrando {filteredProducts.length} productos</div>
          </div>
          <div style={styles.productListContainer}>
            <div style={styles.productList}>
              {(() => { let cat = null, par = false; return filteredProducts.map(product => {
                const isHidden = hidden.includes(product.productId);
                // Cada vez que cambia la categoria se alterna el tono, para que dos
                // categorias seguidas no se lean como una sola lista corrida.
                if (product.category !== cat) { cat = product.category; par = !par; }
                const banda = par ? styles.bandaA : styles.bandaB;
                // Variantes (tamanos de pastel / sabores de pan) para controlarlas
                // desde la misma tarjeta, sin ir a otra pestana.
                const tieneVariantes = Array.isArray(product.sizes) && product.sizes.length > 1 &&
                  ['REPOSTERIA','PANADERIA'].includes((product.category || '').toUpperCase());
                return (
                  <div key={product.productId} style={{...styles.productCardWrap, ...banda, ...(isHidden ? styles.productHidden : {})}}>
                  <div style={styles.productCard}>
                    <div style={styles.productInfo}>
                      {product.image && <img src={product.image} alt={product.productName} style={styles.productImage} onError={e => e.target.style.display = 'none'}/>}
                      <div style={styles.productDetails}>
                        <span style={styles.productId}>#{product.productId}</span>
                        <span style={styles.productName}>{product.productName}</span>
                        <span style={styles.productCategory}>{product.category}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleProduct(product.productId)}
                      disabled={saving}
                      style={{...styles.toggleBtn, ...(isHidden ? styles.toggleBtnHidden : styles.toggleBtnVisible)}}
                    >
                      {isHidden ? 'Mostrar' : 'Ocultar'}
                    </button>
                  </div>

                  {tieneVariantes && (
                    <div style={styles.variantes}>
                      <span style={styles.variantesEt}>
                        {(product.category || '').toUpperCase() === 'PANADERIA' ? 'Sabores' : 'Tamaños'}
                      </span>
                      {product.sizes.map(sz => {
                        const szOculto = hiddenSizes.includes(`${product.productId}:${sz.label}`);
                        return (
                          <button
                            key={sz.label}
                            onClick={() => toggleSize(product.productId, sz.label)}
                            disabled={saving}
                            title={szOculto ? 'Apagado — clic para prender' : 'Activo — clic para apagar'}
                            style={{...styles.variante, ...(szOculto ? styles.varianteOff : {})}}
                          >
                            {sz.label} · ${sz.basePrice}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  </div>
                );
              }); })()}
            </div>
            {filteredProducts.length === 0 && <div style={styles.noResults}>No se encontraron productos</div>}
          </div>
        </>
      )}

      {activeTab === 'tamanos' && (
        <>
          <div style={styles.filtersContainer}>
            <div style={styles.filters}>
              <input
                type="text"
                placeholder="Buscar pastel..."
                value={searchPastel}
                onChange={e => setSearchPastel(e.target.value)}
                style={styles.searchInput}
              />
              <button
                onClick={handleRefreshKiosko}
                disabled={refreshing}
                style={{...styles.refreshBtn, ...(refreshing ? styles.refreshBtnActive : {})}}
              >
                {refreshing ? <><Spinner /> Enviando...</> : 'Actualizar Kiosko'}
              </button>
            </div>
            <div style={styles.resultsCount}>{filteredPasteles.length} pasteles con tamaños</div>
          </div>
          <div style={styles.productListContainer}>
            <div style={styles.productList}>
              {filteredPasteles.map(pastel => (
                <div key={pastel.productId} style={styles.pastelCard}>
                  <div style={styles.pastelHeader}>
                    {pastel.image && <img src={pastel.image} alt={pastel.productName} style={styles.pastelImage} onError={e => e.target.style.display = 'none'}/>}
                    <div style={styles.pastelInfo}>
                      <span style={styles.productId}>#{pastel.productId}</span>
                      <span style={styles.pastelName}>{pastel.productName}</span>
                    </div>
                  </div>
                  <div style={styles.sizesGrid}>
                    {pastel.sizes.map(size => {
                      const sizeKey = `${pastel.productId}:${size.label}`;
                      const isHidden = hiddenSizes.includes(sizeKey);
                      return (
                        <div key={size.label} style={{...styles.sizeCard, ...(isHidden ? styles.sizeHidden : {})}}>
                          <div style={styles.sizeInfo}>
                            <span style={styles.sizeLabel}>{size.label}</span>
                            <span style={styles.sizePrice}>${size.basePrice}</span>
                          </div>
                          <button
                            onClick={() => toggleSize(pastel.productId, size.label)}
                            disabled={saving}
                            style={{...styles.sizeToggleBtn, ...(isHidden ? styles.sizeToggleBtnHidden : styles.sizeToggleBtnVisible)}}
                          >
                            {isHidden ? 'ON' : 'OFF'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {filteredPasteles.length === 0 && <div style={styles.noResults}>No se encontraron pasteles</div>}
          </div>
        </>
      )}

      {/* Bloque de Colores (Confetti) oculto 29-sep-2026 — ver nota en la pestaña.
      {activeTab === 'colores' && (
              <>
                <div style={styles.filtersContainer}>
                  <div style={styles.filters}>
                    <button
                      onClick={handleRefreshKiosko}
                      disabled={refreshing}
                      style={{...styles.refreshBtn, ...(refreshing ? styles.refreshBtnActive : {})}}
                    >
                      {refreshing ? 'Enviado' : 'Actualizar Kiosko'}
                    </button>
                  </div>
                  <div style={styles.resultsCount}>{productosConColores.length} producto(s) con colores</div>
                </div>
                <div style={styles.productListContainer}>
                  <div style={styles.productList}>
                    {productosConColores.map(producto => (
                      <div key={producto.productId} style={styles.pastelCard}>
                        <div style={styles.pastelHeader}>
                          {producto.image && (
                            <img src={producto.image} alt={producto.productName} style={styles.pastelImage} onError={e => e.target.style.display = 'none'} />
                          )}
                          <div style={styles.pastelInfo}>
                            <span style={styles.productId}>#{producto.productId}</span>
                            <span style={styles.pastelName}>{producto.productName}</span>
                          </div>
                        </div>
                        <div style={styles.sizesGrid}>
                          {producto.colorOptions.map(color => {
                            const colorKey = `${producto.productId}:${color.id}`;
                            const isHidden = hiddenColors.includes(colorKey);
                            return (
                              <div key={color.id} style={{...styles.colorCard, ...(isHidden ? styles.colorHidden : {})}}>
                                {color.image && (
                                  <img src={color.image} alt={color.label} style={styles.colorThumb} onError={e => e.target.style.display = 'none'} />
                                )}
                                <div style={styles.sizeInfo}>
                                  <span style={styles.sizeLabel}>{color.label}</span>
                                  <span style={{fontSize: '11px', color: isHidden ? C.alertaTinta : C.tealTinta}}>
                                    {isHidden ? 'OCULTO' : 'VISIBLE'}
                                  </span>
                                </div>
                                <button
                                  onClick={() => toggleColor(producto.productId, color.id)}
                                  disabled={saving}
                                  style={{...styles.sizeToggleBtn, ...(isHidden ? styles.sizeToggleBtnHidden : styles.sizeToggleBtnVisible)}}
                                >
                                  {isHidden ? 'ON' : 'OFF'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  {productosConColores.length === 0 && (
                    <div style={styles.noResults}>No hay productos con colores configurados</div>
                  )}
                </div>
              </>
            )}
      */}

      {activeTab === 'insumos' && (
        <>
          <div style={styles.filtersContainer}>
            <div style={styles.filters}>
              <input
                type="text"
                placeholder="Buscar insumo (ej: AVELLANA, MOKA BLANCO, AVENA)..."
                value={searchInsumo}
                onChange={e => setSearchInsumo(e.target.value)}
                style={styles.searchInput}
              />
              <button
                onClick={handleRefreshKiosko}
                disabled={refreshing}
                style={{...styles.refreshBtn, ...(refreshing ? styles.refreshBtnActive : {})}}
              >
                {refreshing ? <><Spinner /> Enviando...</> : 'Actualizar Kiosko'}
              </button>
            </div>
            <div style={styles.categoryActions}>
              <button
                onClick={() => setVerFiltro(verFiltro === 'ocultos' ? 'todos' : 'ocultos')}
                style={{...styles.btnHideAll, ...(verFiltro === 'ocultos' ? styles.btnHideAllOn : {})}}
              >
                Ver ocultos
              </button>
              <button
                onClick={() => setVerFiltro(verFiltro === 'visibles' ? 'todos' : 'visibles')}
                style={{...styles.btnShowAll, ...(verFiltro === 'visibles' ? styles.btnShowAllOn : {})}}
              >
                Ver visibles
              </button>
            </div>
            <div style={styles.resultsCount}>
              {filteredInsumos.length} insumo(s) — ocultar quita la opcion de TODAS las bebidas donde aparece
            </div>
          </div>
          <div style={styles.productListContainer}>
            <div style={styles.productList}>
              {filteredInsumos
                .filter(i => verFiltro === 'todos' ||
                  (verFiltro === 'ocultos' ? hiddenInsumosCanon.has(i.key) : !hiddenInsumosCanon.has(i.key)))
                .map(insumo => {
                  const isHidden = hiddenInsumosCanon.has(insumo.key);
                  return (
                    <div key={insumo.key} style={{...styles.productCard, ...(isHidden ? styles.productHidden : {})}}>
                      <div style={styles.insumoInfo}>
                        {insumo.icon && (
                          <img src={insumo.icon} alt={insumo.name} style={styles.insumoImage} onError={e => e.target.style.display = 'none'}/>
                        )}
                        <div style={styles.productDetails}>
                          <span style={styles.insumoName}>{insumo.name}</span>
                          <span style={styles.productCategory}>
                            en {insumo.count} producto(s) | {insumo.types}
                            {insumo.variants.length > 1 ? ` | unifica: ${insumo.variants.join(' + ')}` : ''}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleInsumo(insumo)}
                        disabled={saving}
                        style={{...styles.toggleBtn, ...(isHidden ? styles.toggleBtnHidden : styles.toggleBtnVisible)}}
                      >
                        {isHidden ? 'Mostrar' : 'Ocultar'}
                      </button>
                    </div>
                  );
                })}
            </div>
            {filteredInsumos.length === 0 && <div style={styles.noResults}>No se encontraron insumos</div>}
          </div>
        </>
      )}

      {saving && <div style={styles.savingOverlay}>Guardando...</div>}
      {!saving && autoAvisado && <div style={styles.avisoAuto}>Kiosko actualizado</div>}
    </div>
  );
}

// Identidad JAVA, la misma de data.lamarque.mx/produccion/v2:
// papel blanco, navy y teal, linea fina, sin relleno. Nada de cajas con sombra
// ni fondos de color: la jerarquia la dan la regla y la tipografia.
// Los valores viven en TEMA_CSS (abajo). Aqui solo quedan los nombres de rol:
// asi el tema se cambia con un atributo en <html> y nada tiene que re-renderizar.
const C = {
  navy: 'var(--tinta)', teal: 'var(--teal)', mid: 'var(--mid)', suave: 'var(--suave)',
  rule: 'var(--rule)', rule2: 'var(--rule2)', alerta: 'var(--alerta)', ambar: 'var(--ambar)',
  fondo: 'var(--papel)', nada: 'var(--nada)',
  // En claro estos tres valen igual que su hermano de arriba; en oscuro NO pueden.
  // Un relleno solido y un texto no se pintan del mismo color sobre fondo oscuro:
  // si se unifican, el boton activo queda con letra blanca sobre fondo claro.
  solido: 'var(--solido)', tealTinta: 'var(--teal-tinta)', alertaTinta: 'var(--alerta-tinta)',
};

// Un solo lugar para los dos temas. El claro es exactamente la identidad JAVA que
// ya estaba; el oscuro conserva navy de fondo y teal de acento, sin inventar marca.
const TEMA_CSS = `
:root{
  color-scheme:light;
  --tinta:#1E2A4A; --solido:#1E2A4A;
  --teal:#159DAE;  --teal-tinta:#159DAE;
  --mid:#25324E;   --suave:#465270;
  --rule:#DADDE2;  --rule2:#EDEFF3;
  --alerta:#B23A2E; --alerta-tinta:#B23A2E; --ambar:#B07A16;
  --papel:#FFFFFF; --nada:#8A93A6;
  --app:#F4F6F9; --chip:#F4F6F9; --banda-b:#F7F9FC; --oculto:#FAFBFC; --insumo:#F7F9FB;
  --variantes:rgba(0,0,0,.015);
  --s1:0 1px 2px rgba(30,42,74,.08);
  --s2:0 1px 3px rgba(30,42,74,.07),0 1px 2px rgba(30,42,74,.04);
  --s3:0 1px 2px rgba(30,42,74,.05);
  --s-teal:0 2px 5px rgba(21,157,174,.35);
  --s-aviso:0 2px 10px rgba(30,42,74,.3);
}
[data-tema="oscuro"]{
  color-scheme:dark;
  --tinta:#E7ECF5; --solido:#2E3C60;
  /* Sin teales inventados: el relleno usa --teal-dark de la guia (el hover) y el
     texto usa el teal de marca tal cual, que sobre este navy da 5.1:1. */
  --teal:#0F7C8B;  --teal-tinta:#159DAE;
  --mid:#AEB9CF;   --suave:#8B98B3;
  --rule:#2D3A5B;  --rule2:#24304E;
  /* Rojo puro (R>G=B), no salmon: la guia prohibe naranjas. */
  --alerta:#A8372B; --alerta-tinta:#E86B6B; --ambar:#D9A441;
  --papel:#151E35; --nada:#6C7791;
  --app:#0D1425; --chip:#1E2842; --banda-b:#18213A; --oculto:#111A2E;
  /* El plato de los iconos NO se oscurece: son PNG de trazo oscuro con fondo
     transparente y sobre navy desaparecen. Misma regla que el logo en la guia. */
  --insumo:#EEF2F6;
  --variantes:rgba(255,255,255,.03);
  --s1:0 1px 2px rgba(0,0,0,.45);
  --s2:0 1px 3px rgba(0,0,0,.5),0 1px 2px rgba(0,0,0,.35);
  --s3:0 1px 2px rgba(0,0,0,.4);
  --s-teal:0 2px 5px rgba(15,124,139,.45);
  --s-aviso:0 2px 10px rgba(0,0,0,.6);
}
body{background:var(--app)}
`;
const LETRA = "'Carlito', Calibri, Candara, system-ui, sans-serif";
const MONO  = "Consolas, 'Courier New', monospace";
// Etiqueta de seccion: 12.5px, versalita, tracking abierto.
const ET = { fontSize: '12.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.13em' };

// Spinner del boton "Actualizar Kiosko": la senal de refresh no siempre la toma
// el kiosko al instante, asi que el boton tiene que decir que esta trabajando.
function Spinner() {
  return (
    <>
      <style>{`@keyframes girar { to { transform: rotate(360deg) } }`}</style>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={styles.spinner} aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity=".3" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </>
  );
}

// Sol y luna del switch de tema: trazo, no relleno, como el resto del panel.
// Heredan el color de la bola, asi no hay que repintarlos al cambiar de tema.
const IconoSol = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.2v2.1M12 19.7v2.1M4.1 4.1l1.5 1.5M18.4 18.4l1.5 1.5M2.2 12h2.1M19.7 12h2.1M4.1 19.9l1.5-1.5M18.4 5.6l1.5-1.5" />
  </svg>
);
const IconoLuna = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.5 14.3A8.6 8.6 0 0 1 9.7 3.5a8.6 8.6 0 1 0 10.8 10.8Z" />
  </svg>
);

const styles = {
  container: { height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--app)', color: C.navy, fontFamily: LETRA, fontSize: '16.5px', lineHeight: 1.5, overflow: 'hidden', WebkitFontSmoothing: 'antialiased' },

  // Cabecera: titulo + regla teal, como la barra de produccion/v2.
  header: { position: 'relative', padding: '16px clamp(16px,3vw,32px) 0', background: C.fondo, flexShrink: 0 },
  title: { fontSize: '30px', fontWeight: 700, margin: 0, letterSpacing: '.004em', color: C.navy },
  subtitle: { fontSize: '15px', color: C.mid, margin: '4px 0 16px' },
  tabs: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
  tab: { font: 'inherit', background: 'none', border: 0, cursor: 'pointer', color: C.mid, fontSize: '15px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', padding: '0 0 8px', borderBottom: '2px solid transparent' },
  tabActive: { color: C.navy, borderBottomColor: C.tealTinta },
  // Va pegado a la derecha para que no se lea como una pestana mas.
  // Medidas: 54 - 2 de borde - 6 de padding = 46 de carril; bola de 22 -> recorre 24.
  temaSwitch: { boxSizing: 'border-box', position: 'absolute', top: '16px', right: 'clamp(16px,3vw,32px)', width: '54px', height: '30px', padding: '3px', border: `1px solid ${C.rule}`, borderRadius: '999px', background: 'var(--chip)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', transition: 'background .18s, border-color .18s' },
  temaSwitchOn: { background: C.teal, borderColor: C.teal },
  temaBola: { boxSizing: 'border-box', width: '22px', height: '22px', borderRadius: '50%', background: '#fff', color: C.suave, display: 'grid', placeItems: 'center', boxShadow: 'var(--s1)', transform: 'translateX(0)', transition: 'transform .18s ease, color .18s' },
  temaBolaOn: { transform: 'translateX(24px)', color: C.teal },
  // La regla va como elemento propio DEBAJO de las pestanas, igual que .regla en
  // produccion/v2. Si el tab activo la dibujara con margen negativo, la linea se
  // partiria al cambiar de pestana.
  regla: { borderBottom: `2px solid ${C.tealTinta}`, flexShrink: 0 },

  // Categorias como pestanas seleccionables (patron .dias de produccion/v2):
  // botones pegados, borde compartido, el activo en teal solido.
  chips: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' },
  // Sin borde: la definicion la da el fondo y una sombra corta, como un papel
  // encima de otro. El activo se levanta un poco mas.
  chip: { font: 'inherit', fontSize: '14px', fontWeight: 700, color: C.mid, background: 'var(--chip)', border: 'none', padding: '7px 14px', cursor: 'pointer', whiteSpace: 'nowrap', borderRadius: '6px', boxShadow: 'var(--s1)', transition: 'all .15s' },
  chipUltimo: {},
  chipActivo: { color: '#fff', background: C.teal, boxShadow: 'var(--s-teal)' },

  loading: { textAlign: 'center', padding: '56px', fontSize: '15px', color: C.mid },

  filtersContainer: { padding: '16px clamp(16px,3vw,32px)', background: C.fondo, borderBottom: `1px solid ${C.rule}`, flexShrink: 0 },
  filters: { display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap', alignItems: 'center' },
  searchInput: { flex: '1', minWidth: '250px', font: 'inherit', fontSize: '14.5px', padding: '7px 10px', border: `1px solid ${C.rule}`, background: C.fondo, color: C.navy, borderRadius: 0 },
  select: { font: 'inherit', fontSize: '14px', padding: '7px 10px', border: `1px solid ${C.rule}`, background: C.fondo, color: C.navy, minWidth: '200px', borderRadius: 0 },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', padding: '7px 10px', border: `1px solid ${C.rule}`, fontSize: '14px', color: C.mid },
  spinner: { animation: 'girar .8s linear infinite', flexShrink: 0 },
  // Ver todos / visibles / ocultos: botones pegados, el activo en teal.
  verGrupo: { display: 'flex', borderRadius: '6px', overflow: 'hidden', boxShadow: 'var(--s1)' },
  verBtn: { font: 'inherit', fontSize: '13px', fontWeight: 700, color: C.mid, background: 'var(--chip)', border: 'none', padding: '8px 14px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s' },
  verBtnActivo: { color: '#fff', background: C.solido },
  verBtnVisibles: { color: '#fff', background: C.teal },
  verBtnOcultos: { color: '#fff', background: C.alerta },
  refreshBtn: { font: 'inherit', fontSize: '13px', fontWeight: 700, border: `1px solid ${C.teal}`, background: C.teal, color: '#fff', padding: '6px 14px', cursor: 'pointer', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '7px', minWidth: '148px', justifyContent: 'center', boxShadow: 'var(--s1)' },
  refreshBtnActive: { background: 'none', color: C.tealTinta },

  categoryActions: { display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px', paddingBottom: '10px', borderBottom: `1px solid ${C.rule2}` },
  btnHideAll: { font: 'inherit', fontSize: '13px', fontWeight: 700, border: `1px solid ${C.alertaTinta}`, background: 'none', color: C.alertaTinta, padding: '4px 12px', cursor: 'pointer', borderRadius: 0 },
  btnHideAllOn: { background: C.alerta, color: '#fff' },
  btnShowAllOn: { background: C.teal, color: '#fff' },
  btnShowAll: { font: 'inherit', fontSize: '13px', fontWeight: 700, border: `1px solid ${C.tealTinta}`, background: 'none', color: C.tealTinta, padding: '4px 12px', cursor: 'pointer', borderRadius: 0 },
  resultsCount: { ...ET, color: C.mid, marginLeft: 'auto' },

  productListContainer: { flex: 1, overflow: 'auto', padding: '18px clamp(16px,3vw,32px) 48px' },
  productList: { display: 'flex', flexDirection: 'column', gap: '10px' },

  // Una fila, no una tarjeta: regla fina abajo y nada mas.
  // La tarjeta envuelve la fila principal y, si aplica, la fila de variantes.
  productCardWrap: { border: `1px solid ${C.rule}`, borderRadius: '8px', boxShadow: 'var(--s2)', overflow: 'hidden' },
  variantes: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '7px', padding: '10px 18px 12px', borderTop: `1px solid ${C.rule2}`, background: 'var(--variantes)' },
  variantesEt: { ...ET, fontSize: '11.5px', color: C.suave, marginRight: '4px' },
  variante: { font: 'inherit', fontSize: '13.5px', fontWeight: 700, color: '#fff', background: C.teal, border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', whiteSpace: 'nowrap' },
  varianteOff: { background: C.rule2, color: C.nada, textDecoration: 'line-through' },
  productCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', padding: '13px 18px' },
  // Bandas por categoria: blanco y un gris apenas perceptible. La diferencia
  // tiene que notarse sin gritar; si contrastan mucho, marean mas que ayudar.
  bandaA: { background: C.fondo },
  bandaB: { background: 'var(--banda-b)' },
  productHidden: { color: C.nada, background: 'var(--oculto)', boxShadow: 'none' },
  productInfo: { display: 'flex', alignItems: 'center', gap: '13px', minWidth: 0 },
  productImage: { width: '58px', height: '58px', objectFit: 'cover', border: `1px solid ${C.rule}`, borderRadius: '6px', flexShrink: 0 },
  productDetails: { display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 },
  productId: { fontFamily: MONO, fontSize: '13px', color: C.nada },
  productName: { fontSize: '16px', fontWeight: 700, color: 'inherit' },
  productCategory: { fontSize: '14px', color: C.mid },

  // Insumos/modificadores: el icono es un dibujo con trazo fino, a 42px no se
  // distingue (habia que poner el navegador al 110%). Aqui va al doble, con
  // fondo claro para que el PNG con transparencia no se pierda.
  insumoImage: { width: '84px', height: '84px', objectFit: 'contain', padding: '5px', background: 'var(--insumo)', border: `1px solid ${C.rule}`, borderRadius: '8px', flexShrink: 0 },
  insumoName: { fontSize: '17px', fontWeight: 700, color: 'inherit' },
  insumoInfo: { display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 },

  toggleBtn: { font: 'inherit', fontSize: '14px', fontWeight: 700, padding: '8px 20px', cursor: 'pointer', flexShrink: 0, borderRadius: '6px', letterSpacing: '.05em', textTransform: 'uppercase' },
  toggleBtnVisible: { border: `1px solid ${C.alertaTinta}`, background: 'none', color: C.alertaTinta },
  toggleBtnHidden: { border: `1px solid ${C.teal}`, background: C.teal, color: '#fff' },

  noResults: { textAlign: 'center', padding: '56px', color: C.nada, fontSize: '15px' },
  avisoAuto: { position: 'fixed', bottom: '18px', right: '18px', padding: '8px 16px', background: C.solido, color: '#fff', fontWeight: 700, fontSize: '13px', letterSpacing: '.05em', textTransform: 'uppercase', borderRadius: '6px', zIndex: 1000, boxShadow: 'var(--s-aviso)' },
  savingOverlay: { position: 'fixed', top: '16px', right: '16px', padding: '8px 16px', background: C.teal, color: '#fff', fontWeight: 700, fontSize: '13px', letterSpacing: '.05em', textTransform: 'uppercase', zIndex: 1000 },

  // Pastel: encabezado de seccion con su regla, como <section><header> en v2.
  pastelCard: { marginBottom: '18px', background: C.fondo, border: `1px solid ${C.rule}`, borderRadius: '10px', padding: '16px 18px 18px', boxShadow: 'var(--s2)' },
  pastelHeader: { display: 'flex', alignItems: 'center', gap: '13px', paddingBottom: '11px', borderBottom: `1px solid ${C.rule}`, marginBottom: '14px' },
  pastelImage: { width: '72px', height: '72px', objectFit: 'cover', border: `1px solid ${C.rule}`, borderRadius: '6px' },
  pastelInfo: { display: 'flex', flexDirection: 'column', gap: '2px' },
  pastelName: { ...ET, fontSize: '16px', color: C.navy },

  // Tamanos: rejilla de una linea separada por el fondo, como .sem
  sizesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,238px))', gap: '12px', justifyContent: 'start' },
  sizeCard: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', background: C.fondo, padding: '14px 16px', border: `1px solid ${C.rule}`, borderTop: `3px solid ${C.tealTinta}`, borderRadius: '6px', boxShadow: 'var(--s3)' },
  sizeHidden: { borderTopColor: C.alertaTinta, color: C.nada, background: 'var(--oculto)', boxShadow: 'none' },
  sizeInfo: { display: 'flex', flexDirection: 'column', gap: '1px' },
  sizeLabel: { fontSize: '17px', fontWeight: 700, color: 'inherit' },
  sizePrice: { fontSize: '15px', color: C.mid, fontVariantNumeric: 'tabular-nums' },
  sizeToggleBtn: { font: 'inherit', width: '46px', height: '34px', cursor: 'pointer', fontSize: '14px', fontWeight: 700, borderRadius: '5px', flexShrink: 0 },
  sizeToggleBtnVisible: { border: `1px solid ${C.alertaTinta}`, background: 'none', color: C.alertaTinta },
  sizeToggleBtnHidden: { border: `1px solid ${C.teal}`, background: C.teal, color: '#fff' },

  colorCard: { display: 'flex', alignItems: 'center', gap: '10px', background: C.fondo, padding: '10px 12px', border: `1px solid ${C.rule}`, borderTop: `3px solid ${C.tealTinta}`, borderRadius: '6px', boxShadow: 'var(--s3)' },
  colorHidden: { borderTopColor: C.alertaTinta, color: C.nada },
  colorThumb: { width: '42px', height: '42px', objectFit: 'cover', flexShrink: 0, border: `1px solid ${C.rule}` },
};
