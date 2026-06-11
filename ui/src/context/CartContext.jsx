// src/context/CartContext.jsx - CON SEPARACIÓN DE MINIPOSTRES
import { createContext, useContext, useMemo, useState } from "react";
import { enviarOrdenAPuente } from "../lib/api.js";

const CartContext = createContext(null);

// Obtener ID de sucursal del .env
const BRANCH_ID = Number(import.meta.env.VITE_SUCURSAL_ID ?? 0) || null;

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const total = useMemo(
    () => items.reduce((s, it) => s + Number(it.totalItem || 0), 0),
    [items]
  );

  // Función mejorada para agregar items
  const addItem = (item) => {
    // Detectar si es minipostre
    const isMinipostre = (item.product?.category === "MINIPOSTRES" || 
                         item.product?.grupo === "MINIPOSTRES" ||
                         (item.nombre && item.nombre.toUpperCase().includes("M.")));
    
    // Si es minipostre y tiene cantidad > 1, separar en items individuales
    if (isMinipostre && item.quantity > 1) {
      const cantidad = item.quantity;
      const precioUnitario = item.totalItem / cantidad;
      
      // Crear items individuales
      for (let i = 0; i < cantidad; i++) {
        const itemIndividual = {
          ...item,
          quantity: 1,
          cantidad: 1,
          totalItem: precioUnitario,
          _uniqueId: `${item.productoId || item.id}_${Date.now()}_${i}`,
          _isSeparated: true
        };
        setItems(prev => [...prev, itemIndividual]);
      }
    } else {
      // Para otros productos, agregar normalmente
      setItems(prev => [...prev, {
        ...item,
        _uniqueId: `${item.productoId || item.id}_${Date.now()}`
      }]);
    }
  };

  const removeItem = (idx) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  // Elimina varios items por _uniqueId en una sola actualización (para borrar un grupo del carrito)
  const removeByUniqueIds = (ids) => {
    const set = new Set(Array.isArray(ids) ? ids : [ids]);
    setItems((prev) => prev.filter((it) => !set.has(it._uniqueId)));
  };

  const duplicateItem = (idx) => {
    const it = items[idx];
    if (!it) return;
    
    // Si es minipostre, duplicar como item individual
    const isMinipostre = it.nombre && it.nombre.toUpperCase().includes("M.");
    
    if (isMinipostre) {
      const copy = { 
        ...it, 
        quantity: 1,
        cantidad: 1,
        _uniqueId: `${it.productoId || it.id}_${Date.now()}_dup`,
        _isDuplicated: true
      };
      const arr = [...items];
      arr.splice(idx + 1, 0, copy);
      setItems(arr);
    } else {
      // Para otros productos, duplicar normal
      const copy = { 
        ...it, 
        _uniqueId: `${it.productoId || it.id}_${Date.now()}_dup`,
        _isDuplicated: true 
      };
      const arr = [...items];
      arr.splice(idx + 1, 0, copy);
      setItems(arr);
    }
  };

  const clear = () => setItems([]);


  // MODIFICADO: Acepta itemsDirectos para "Enviar Ahora"
  const checkout = async (itemsDirectos = null) => {
    if (isProcessing) return;
    
    // Si nos pasan items directos, usamos esos. Si no, usamos los del estado (carrito normal)
    const itemsAProcesar = itemsDirectos || items;

    if (itemsAProcesar.length === 0) {
      alert("El carrito está vacío");
      return;
    }

    setIsProcessing(true);
    try {
      // Usamos itemsAProcesar en lugar de items
      const itemsParaBackend = itemsAProcesar.map(item => ({
        ...item,
        quantity: item._isSeparated ? 1 : (item.quantity || 1),
        cantidad: item._isSeparated ? 1 : (item.cantidad || 1)
      }));

      const orden = {
        items: itemsParaBackend,
        total: itemsDirectos 
          ? itemsAProcesar.reduce((s, it) => s + Number(it.totalItem || 0), 0) // Calcular total si es directo
          : total,
        timestamp: new Date().toISOString(),
        cliente: "Kiosko",
        ...(BRANCH_ID ? { sucursal_id: BRANCH_ID } : {}),
      };

      if (import.meta.env.DEV) {
        console.log("[CartContext] checkout → orden:", orden);
      }

      const resultado = await enviarOrdenAPuente(orden);

      if (resultado && resultado.ok) {
        setItems([]); // Limpiamos el carrito al terminar
        return resultado;
      } else {
        alert("Error procesando el pedido. Por favor intenta nuevamente.");
        return resultado;
      }
    } catch (err) {
      console.error("[CartContext] Error:", err);
      alert("Error de conexión. Verifica el puente y tu red e intenta de nuevo.");
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };


  // Helpers de depuración (solo en dev)
  if (import.meta.env.DEV) {
    window._cart = items;
    window._checkout = checkout;
  }

  return (
    <CartContext.Provider
      value={{
        items,
        total,
        isProcessing,
        addItem,
        removeItem,
        removeByUniqueIds,
        duplicateItem,
        clear,
        checkout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);