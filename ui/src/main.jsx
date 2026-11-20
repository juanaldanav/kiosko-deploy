// src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import "./styles/touch-scroll.css"; // ✅ IMPORTAR ESTILOS DE SCROLL TÁCTIL
import "./styles/tema.css"; // tokens de temporada (data-tema en index.html)
import { CartProvider } from "./context/CartContext.jsx";

const Router = import.meta.env.PROD ? HashRouter : BrowserRouter;

// Modo vitrina (?vitrina): kiosko 1080x1920 escalado para enseñarlo en un monitor normal. Ver styles/tema.css
if (new URLSearchParams(window.location.search).has("vitrina")) {
  const ajusta = () => document.documentElement.style.setProperty("--k-vitrina", Math.min(window.innerHeight / 1920, window.innerWidth / 1080));
  document.documentElement.classList.add("k-vitrina");
  ajusta();
  window.addEventListener("resize", ajusta);
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Router>
      <CartProvider>
        <App />
      </CartProvider>
    </Router>
  </StrictMode>
);