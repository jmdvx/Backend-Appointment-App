import express, { Application, Request, Response } from "express";
import morgan from "morgan";
import cors from "cors";
import userRoutes from './routes/users';
import appointmentRoutes from './routes/appointments';
import blockedDatesRoutes from './routes/blockedDates';

import { initDb } from './database';
import { authenticateKey } from "./middleware/auth.middleware";



export const app: Application = express();

initDb()

// Configure CORS to allow requests from frontend
app.use(cors({
  origin: ['http://localhost:4200', 'http://127.0.0.1:4200'], // Angular dev server
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());


app.get("/ping", async (_req: Request, res: Response) => {
    res.json({
        message: "hello from Una",
    });
});


//app.use(authenticateKey);
app.use(morgan("tiny"));

app.use('/api/v1/users', userRoutes)

app.use('/api/v1/appointments', appointmentRoutes)

app.use('/api/v1/blocked-dates', blockedDatesRoutes)

app.get("/bananas", async (_req: Request, res: Response) => {
    res.json({
        message: "hello this is bananas",
    });
});


