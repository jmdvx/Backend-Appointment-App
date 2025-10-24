import express, { Application, Request, Response } from "express";
import morgan from "morgan";
import cors from "cors";
import userRoutes from './routes/users';
import appointmentRoutes from './routes/appointments';
import blockedDatesRoutes from './routes/blockedDates';
import clientRoutes from './routes/clients';
import adminRoutes from './routes/admin';
import emailRoutes from './routes/email';
import authRoutes from './routes/auth';

import { initDb } from './database';
import { authenticateKey } from "./middleware/auth.middleware";



export const app: Application = express();

initDb()

// Configure CORS to allow requests from frontend
app.use(cors({
  origin: ['http://localhost:4200', 'http://127.0.0.1:4200'], // Angular dev server
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'] // Add x-user-id header
}));

app.use(express.json());


// Health check endpoint for monitoring
app.get("/ping", async (_req: Request, res: Response) => {
    res.json({
        message: "Appointment App Backend is running",
        status: "OK",
        timestamp: new Date().toISOString()
    });
});

// Health check endpoint for production monitoring
app.get("/health", async (_req: Request, res: Response) => {
    try {
        // Check database connection
        const dbStatus = await checkDatabaseHealth();
        
        res.json({
            status: "OK",
            timestamp: new Date().toISOString(),
            database: dbStatus,
            version: "1.0.0"
        });
    } catch (error) {
        res.status(503).json({
            status: "ERROR",
            timestamp: new Date().toISOString(),
            error: "Database connection failed"
        });
    }
});

// Database health check function
async function checkDatabaseHealth() {
    try {
        const { collections } = await import('./database');
        if (collections.users) {
            await collections.users.findOne({});
            return "connected";
        }
        return "disconnected";
    } catch (error) {
        return "error";
    }
}


//app.use(authenticateKey);
app.use(morgan("tiny"));

app.use('/api/v1/users', userRoutes)

app.use('/api/v1/appointments', appointmentRoutes)

app.use('/api/v1/blocked-dates', blockedDatesRoutes)

app.use('/api/v1/clients', clientRoutes)

// Admin routes - protected with authentication and admin role
app.use('/api/v1/admin', adminRoutes)

// Email routes - protected with authentication
app.use('/api/v1/email', emailRoutes)

// Auth routes for frontend compatibility
app.use('/api/auth', authRoutes)

app.get("/bananas", async (_req: Request, res: Response) => {
    res.json({
        message: "hello this is bananas",
    });
});


