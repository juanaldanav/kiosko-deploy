// pages/AdminVisibilidad.jsx
import { useState, useEffect, useMemo } from 'react';
import catalogData from '../data/catalog_app.json';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001'
  : `http://${window.location.hostname}:3001`;

export default function AdminVisibilidad() {
  const [activeTab, setActiveTab] = useState('productos');
  const [hidden, setHidden] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showOnlyHidden, setShowOnlyHidden] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hiddenSizes, setHiddenSizes] = useState([]);
  const [loadingSizes, setLoadingSizes] = useState(true);
  const [searchPastel, setSearchPastel] = useState('');
  const [hiddenColors, setHiddenColors] = useState([]);
  const [loadingColors, setLoadingColors] = useState(true);
  const [hiddenInsumos, setHiddenInsumos] = useState([]);
  const [loadingInsumos, setLoadingInsumos] = useState(true);
  const [searchInsumo, setSearchInsumo] = useState('');

  const products = catalogData.catalog || [];

  // Filtrar solo pasteles (REPOSTERIA con sizes)
  const pasteles = useMemo(() => {
    return products.filter(p => p.category === 'REPOSTERIA' && p.sizes && p.sizes.length > 0);
  }, [products]);

  // Filtrar productos con colorOptions
  const productosConColores = useMemo(() => {
    return products.filter(p => Array.isArray(p.colorOptions) && p.colorOptions.length > 0);
  }, [products]);

  // Insumos: nombres unicos de opciones de modificadores en todo el catalog
  // (por NOMBRE, no por id — el mismo insumo tiene ids distintos por tamano/producto)
  const insumos = useMemo(() => {
    const map = new Map(); // nombre -> { name, count, types }
    products.forEach(p => {
      (p.modifiers || []).forEach(m => {
        (m.options || []).forEach(o => {
          if (!o?.name) return;
          if (!map.has(o.name)) map.set(o.name, { name: o.name, count: 0, types: new Set() });
          const entry = map.get(o.name);
          entry.count += 1;
          if (m.type) entry.types.add(m.type);
        });
      });
    });
    return [...map.values()]
      .map(e => ({ ...e, types: [...e.types].sort().join(', ') }))
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
      if (data.ok) setHidden(data.hidden);
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
      if (data.ok) setHiddenColors(data.hiddenColors);
    } catch (err) {
      console.error('Error:', err);
      alert('Error actualizando color');
    }
    setSaving(false);
  };

  const toggleInsumo = async (name) => {
    const isHidden = hiddenInsumos.includes(name);
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/visibility/insumos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, visible: isHidden })
      });
      const data = await res.json();
      if (data.ok) setHiddenInsumos(data.hiddenInsumos);
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
      if (data.ok) setHiddenSizes(data.hiddenSizes);
    } catch (err) {
      console.error('Error:', err);
      alert('Error actualizando tamano');
    }
    setSaving(false);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = !search || 
        p.productName.toLowerCase().includes(search.toLowerCase()) ||
        String(p.productId).includes(search);
      const matchesCategory = !categoryFilter || p.category === categoryFilter;
      const matchesHiddenFilter = !showOnlyHidden || hidden.includes(p.productId);
      return matchesSearch && matchesCategory && matchesHiddenFilter;
    });
  }, [products, search, categoryFilter, showOnlyHidden, hidden]);

  const filteredInsumos = useMemo(() => {
    if (!searchInsumo) return insumos;
    return insumos.filter(i => i.name.toLowerCase().includes(searchInsumo.toLowerCase()));
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
      if (data.ok) setHidden(data.hidden);
    } catch (err) {
      console.error('Error:', err);
      alert('Error actualizando categoria');
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
      alert('Error al enviar senal de refresh');
      setRefreshing(false);
    }
  };

  if (loading || loadingSizes || loadingColors || loadingInsumos) {
    return <div style={styles.container}><div style={styles.loading}>Cargando...</div></div>;
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Admin - Visibilidad</h1>
        <p style={styles.subtitle}>
          {hidden.length} productos ocultos | {hiddenSizes.length} tamanos ocultos | {hiddenColors.length} colores ocultos | {hiddenInsumos.length} insumos ocultos
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
            Tamanos Pasteles
          </button>
          <button
            onClick={() => setActiveTab('colores')}
            style={{...styles.tab, ...(activeTab === 'colores' ? styles.tabActive : {})}}
          >
            Colores
          </button>
          <button
            onClick={() => setActiveTab('insumos')}
            style={{...styles.tab, ...(activeTab === 'insumos' ? styles.tabActive : {})}}
          >
            Insumos
          </button>
        </div>
      </header>

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
              <select 
                value={categoryFilter} 
                onChange={e => setCategoryFilter(e.target.value)}
                style={styles.select}
              >
                <option value="">Todas las categorias</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={showOnlyHidden}
                  onChange={e => setShowOnlyHidden(e.target.checked)}
                />
                Solo ocultos
              </label>
              <button
                onClick={handleRefreshKiosko}
                disabled={refreshing}
                style={{...styles.refreshBtn, ...(refreshing ? styles.refreshBtnActive : {})}}
              >
                {refreshing ? 'Enviado' : 'Actualizar Kiosko'}
              </button>
            </div>
            {categoryFilter && (
              <div style={styles.categoryActions}>
                <span>Categoria: <strong>{categoryFilter}</strong></span>
                <button onClick={() => toggleCategory(categoryFilter, false)} style={styles.btnHideAll} disabled={saving}>Ocultar toda</button>
                <button onClick={() => toggleCategory(categoryFilter, true)} style={styles.btnShowAll} disabled={saving}>Mostrar toda</button>
              </div>
            )}
            <div style={styles.resultsCount}>Mostrando {filteredProducts.length} productos</div>
          </div>
          <div style={styles.productListContainer}>
            <div style={styles.productList}>
              {filteredProducts.map(product => {
                const isHidden = hidden.includes(product.productId);
                return (
                  <div key={product.productId} style={{...styles.productCard, ...(isHidden ? styles.productHidden : {})}}>
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
                );
              })}
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
                {refreshing ? 'Enviado' : 'Actualizar Kiosko'}
              </button>
            </div>
            <div style={styles.resultsCount}>{filteredPasteles.length} pasteles con tamanos</div>
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
                            <span style={{fontSize: '11px', color: isHidden ? '#dc3545' : '#28a745'}}>
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
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={showOnlyHidden}
                  onChange={e => setShowOnlyHidden(e.target.checked)}
                />
                Solo ocultos
              </label>
              <button
                onClick={handleRefreshKiosko}
                disabled={refreshing}
                style={{...styles.refreshBtn, ...(refreshing ? styles.refreshBtnActive : {})}}
              >
                {refreshing ? 'Enviado' : 'Actualizar Kiosko'}
              </button>
            </div>
            <div style={styles.resultsCount}>
              {filteredInsumos.length} insumo(s) — ocultar quita la opcion de TODAS las bebidas donde aparece
            </div>
          </div>
          <div style={styles.productListContainer}>
            <div style={styles.productList}>
              {filteredInsumos
                .filter(i => !showOnlyHidden || hiddenInsumos.includes(i.name))
                .map(insumo => {
                  const isHidden = hiddenInsumos.includes(insumo.name);
                  return (
                    <div key={insumo.name} style={{...styles.productCard, ...(isHidden ? styles.productHidden : {})}}>
                      <div style={styles.productInfo}>
                        <div style={styles.productDetails}>
                          <span style={styles.productName}>{insumo.name}</span>
                          <span style={styles.productCategory}>
                            en {insumo.count} producto(s) | {insumo.types}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleInsumo(insumo.name)}
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
    </div>
  );
}

const styles = {
  container: { height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#1a1a2e', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif', overflow: 'hidden' },
  header: { textAlign: 'center', padding: '15px 20px', borderBottom: '1px solid #333', flexShrink: 0 },
  title: { fontSize: '24px', margin: '0 0 5px 0' },
  subtitle: { color: '#888', margin: '0 0 15px 0', fontSize: '14px' },
  tabs: { display: 'flex', gap: '10px', justifyContent: 'center' },
  tab: { padding: '10px 25px', backgroundColor: '#252540', color: '#888', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  tabActive: { backgroundColor: '#17a2b8', color: '#fff' },
  loading: { textAlign: 'center', padding: '50px', fontSize: '20px' },
  filtersContainer: { padding: '15px 20px', borderBottom: '1px solid #333', backgroundColor: '#1a1a2e', flexShrink: 0 },
  filters: { display: 'flex', gap: '15px', marginBottom: '10px', flexWrap: 'wrap', alignItems: 'center' },
  searchInput: { flex: '1', minWidth: '250px', padding: '12px 16px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#252540', color: '#fff', fontSize: '16px' },
  select: { padding: '12px 16px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#252540', color: '#fff', fontSize: '16px', minWidth: '200px' },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '12px 16px', backgroundColor: '#252540', borderRadius: '8px' },
  refreshBtn: { padding: '12px 20px', backgroundColor: '#17a2b8', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  refreshBtnActive: { backgroundColor: '#28a745' },
  categoryActions: { display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '10px', padding: '10px 15px', backgroundColor: '#252540', borderRadius: '8px' },
  btnHideAll: { padding: '8px 16px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  btnShowAll: { padding: '8px 16px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  resultsCount: { fontSize: '14px', color: '#888' },
  productListContainer: { flex: 1, overflow: 'auto', padding: '20px' },
  productList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  productCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: '#252540', borderRadius: '10px' },
  productHidden: { opacity: 0.5, backgroundColor: '#1e1e30' },
  productInfo: { display: 'flex', alignItems: 'center', gap: '15px' },
  productImage: { width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' },
  productDetails: { display: 'flex', flexDirection: 'column', gap: '4px' },
  productId: { fontSize: '12px', color: '#666' },
  productName: { fontSize: '16px', fontWeight: 'bold' },
  productCategory: { fontSize: '12px', color: '#888' },
  toggleBtn: { padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', flexShrink: 0 },
  toggleBtnVisible: { backgroundColor: '#dc3545', color: '#fff' },
  toggleBtnHidden: { backgroundColor: '#28a745', color: '#fff' },
  noResults: { textAlign: 'center', padding: '50px', color: '#666' },
  savingOverlay: { position: 'fixed', top: '20px', right: '20px', padding: '15px 25px', backgroundColor: '#007bff', color: '#fff', borderRadius: '8px', fontWeight: 'bold', zIndex: 1000 },
  pastelCard: { backgroundColor: '#252540', borderRadius: '12px', padding: '15px', marginBottom: '15px' },
  pastelHeader: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #333' },
  pastelImage: { width: '60px', height: '60px', objectFit: 'cover', borderRadius: '10px' },
  pastelInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  pastelName: { fontSize: '18px', fontWeight: 'bold' },
  sizesGrid: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
  sizeCard: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1a1a2e', padding: '12px 15px', borderRadius: '8px', minWidth: '150px' },
  sizeHidden: { opacity: 0.4, backgroundColor: '#151525' },
  sizeInfo: { display: 'flex', flexDirection: 'column', gap: '2px' },
  sizeLabel: { fontSize: '14px', fontWeight: 'bold' },
  sizePrice: { fontSize: '12px', color: '#17a2b8' },
  sizeToggleBtn: { width: '40px', height: '30px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' },
  sizeToggleBtnVisible: { backgroundColor: '#dc3545', color: '#fff' },
  sizeToggleBtnHidden: { backgroundColor: '#28a745', color: '#fff' },
  colorCard: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#1a1a2e', padding: '10px 15px', borderRadius: '8px', minWidth: '160px' },
  colorHidden: { opacity: 0.4, backgroundColor: '#151525' },
  colorThumb: { width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 },
};
