import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { connectDB } from './config/db';
import { initSocket } from './config/socket';
import authRoutes from './routes/authRoutes';
import formRoutes from './routes/formRoutes';

dotenv.config();

// Connect to Database
connectDB();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      'https://form-builder-502905.web.app',
      'https://form-builder-502905.firebaseapp.com',
      'http://localhost:5173',
      'http://localhost:3000'
    ],
    credentials: true,
  })
);
app.use(express.json());

// Initialize Socket.io
initSocket(httpServer);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/forms', formRoutes);

app.get('/', (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
