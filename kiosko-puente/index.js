import express from 'express';
import cors from 'cors';
import orderRouter from './routes/order.js';
import visibilityRouter from './routes/visibility.js';

const app = express();

// === MODIFICACIÓN: Permitir acceso desde cualquier IP en la red ===
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ping de salud
app.get('/health', (_req, res) => res.json({ ok: true }));

// Rutas
app.use('/api', orderRouter);
app.use('/api', visibilityRouter);

const PORT = process.env.PORT || 3001;

// Escuchar en 0.0.0.0 es vital para recibir conexiones externas.
// Maneja el reinicio de nodemon: cierre elegante (libera el puerto al instante)
// y reintento si el puerto aun esta ocupado, para NO crashear con EADDRINUSE.
function start() {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`KIOSKO-PUENTE listo en puerto ${PORT}`);
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.log(`Puerto ${PORT} ocupado (reinicio); reintentando en 1s...`);
      setTimeout(() => { try { server.close(); } catch {} start(); }, 1000);
    } else {
      throw err;
    }
  });

  // Al recibir la senal de reinicio/cierre, cerrar el server para liberar el puerto YA.
  const shutdown = () => { try { server.close(() => process.exit(0)); } catch { process.exit(0); } };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start();