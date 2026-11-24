import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import invitationRoutes from './routes/invitationRoutes.js';
import guestRoutes from './routes/guestRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Conectar a la base de datos
connectDB();

// Middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

// Ruta de prueba / healthcheck
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'invitaciones-digitales-api' });
});


app.use('/api/invitations', invitationRoutes);
app.use('/api/guests', guestRoutes);

// Manejo centralizado de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Error interno del servidor',
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});