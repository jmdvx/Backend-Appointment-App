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
const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:4200', 
      'http://127.0.0.1:4200', 
      'https://kdbeautyappointmentapp.netlify.app',
      'https://kdbeautyappointmentapp.netlify.app/'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'Accept', 'Origin', 'X-Requested-With'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

app.use(cors(corsOptions));

// Additional CORS handling for preflight requests
app.options('*', cors(corsOptions));

// Debug middleware to log CORS-related headers
app.use((req, res, next) => {
  console.log('Request Origin:', req.headers.origin);
  console.log('Request Method:', req.method);
  console.log('Request Headers:', req.headers);
  next();
});

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
            version: "1.0.0",
            environment: process.env.NODE_ENV || "development"
        });
    } catch (error) {
        res.status(503).json({
            status: "ERROR",
            timestamp: new Date().toISOString(),
            error: "Database connection failed",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
});

// Database test endpoint for debugging
app.get("/test-db", async (_req: Request, res: Response) => {
    try {
        const { collections } = await import('./database');
        
        if (!collections.users) {
            return res.status(500).json({
                error: "Database not connected",
                message: "Users collection is not available"
            });
        }
        
        // Try to count users
        const userCount = await collections.users.countDocuments();
        
        res.json({
            status: "Database connected",
            userCount: userCount,
            collections: {
                users: !!collections.users,
                appointments: !!collections.appointments,
                blockedDates: !!collections.blockedDates
            }
        });
    } catch (error) {
        res.status(500).json({
            error: "Database test failed",
            message: error instanceof Error ? error.message : "Unknown error"
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

// Root route - API information
app.get("/", async (_req: Request, res: Response) => {
    res.json({
        message: "Appointment App Backend API",
        version: "1.0.0",
        status: "Running",
        endpoints: {
            health: "/ping",
            apiHealth: "/health",
            appointments: "/api/v1/appointments",
            blockedDates: "/api/v1/blocked-dates",
            users: "/api/v1/users",
            auth: "/api/auth"
        },
        documentation: "See README.md for full API documentation"
    });
});


