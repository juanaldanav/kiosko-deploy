// tailwind.config.js
export default {
  content: ["./index.html","./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: { k: ["var(--k-f-sans)"] },
      colors: {
        mint: "#8EE1EC",
        mintStrong: "#67CDD9",
        brand: "#2A97A8",
        ink: "#1f2937",
        bgkiosk: "#EFF8FA",
        // tema de temporada: valores en src/styles/tema.css
        k: {
          fondo: "var(--k-fondo)", superficie: "var(--k-superficie)", superficie2: "var(--k-superficie-2)",
          tinta: "var(--k-tinta)", tinta2: "var(--k-tinta-2)", sobrefondo: "var(--k-sobre-fondo)", sobrefondo2: "var(--k-sobre-fondo-2)",
          acento: "var(--k-acento)", borde: "var(--k-borde)", primario: "var(--k-primario)", primario2: "var(--k-primario-2)",
          sobreprimario: "var(--k-sobre-primario)", barra: "var(--k-barra)", sel: "var(--k-sel)", selsuave: "var(--k-sel-suave)",
          badge: "var(--k-badge)", info: "var(--k-info)", sobreinfo: "var(--k-sobre-info)",
          flota: "var(--k-flota)", sobreflota: "var(--k-sobre-flota)", foto: "var(--k-foto)",
        },
      },
      borderRadius:{ rnd: "14px" },
      boxShadow:{ soft: "0 8px 30px rgba(0,0,0,.08)" },
      keyframes:{ pop:{ "0%":{transform:"scale(.98)",opacity:"0"}, "100%":{transform:"scale(1)",opacity:"1"} } },
      animation:{ pop:"pop .18s ease-out" }
    }
  },
  plugins: [],
}
