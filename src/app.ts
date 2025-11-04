import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors';
import { login, register } from './controllers/auth.controller';
import { deleteFile, listFiles, uploadFile } from './controllers/file.controller';
import { errorMiddleware } from './middlewares/error.middleware';
import { authMiddleware } from './middlewares/auth.middleware';

dotenv.config();

export const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API Routes
app.post('/api/register', register);
app.post('/api/login', login);

app.post('/api/files', authMiddleware, uploadFile)
app.get('/api/files', authMiddleware, listFiles)
app.delete('/api/files/:id', authMiddleware, deleteFile)

app.use(errorMiddleware)
