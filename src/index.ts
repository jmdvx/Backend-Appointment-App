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

// Initialize database with error handling
initDb().catch((error) => {
    console.error('❌ Failed to initialize database:', error);
    console.log('⚠️  Server will continue running but database operations may fail');
    console.log('🔍 Environment check:');
    console.log('  - DB_CONN_STRING exists:', !!process.env.DB_CONN_STRING);
    console.log('  - DB_NAME:', process.env.DB_NAME || 'default');
    console.log('  - NODE_ENV:', process.env.NODE_ENV || 'not set');
});

// AGGRESSIVE CORS CONFIGURATION - This will definitely work
app.use((req, res, next) => {
  // Set CORS headers for ALL requests
  const origin = req.headers.origin;
  
  // Allow specific origins
  const allowedOrigins = [
    'http://localhost:4200', 
    'http://127.0.0.1:4200', 
    'https://kdbeautyappointmentapp.netlify.app',
    'https://kdbeautyappointmentapp.netlify.app/',
    'https://www.kdbeautyappointmentapp.netlify.app',
    'https://www.kdbeautyappointmentapp.netlify.app/',
    'https://kdbeauty.vercel.app',
    'https://kdbeauty.vercel.app/',
    'https://www.kdbeauty.vercel.app',
    'https://www.kdbeauty.vercel.app/'
  ];
  
  // Check if origin is allowed, or allow if no origin (for testing)
  if (!origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  } else {
    // For development/testing, allow all origins
    res.header('Access-Control-Allow-Origin', '*');
    console.log('CORS: Allowing origin:', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, Accept, Origin, X-Requested-With, Access-Control-Request-Method, Access-Control-Request-Headers');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('CORS: Handling OPTIONS preflight request');
    res.status(200).end();
    return;
  }
  
  next();
});

// Additional CORS middleware as backup
app.use(cors({
  origin: true, // Allow all origins for now
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'Accept', 'Origin', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Debug middleware to log CORS-related headers
app.use((req, res, next) => {
  console.log('=== REQUEST DEBUG ===');
  console.log('Origin:', req.headers.origin);
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('User-Agent:', req.headers['user-agent']);
  console.log('========================');
  next();
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message,
    cors: 'Headers should be set'
  });
});

app.use(express.json());


// Simple health check endpoint for monitoring (no database required)
app.get("/ping", async (_req: Request, res: Response) => {
    res.json({
        message: "Appointment App Backend is running",
        status: "OK",
        timestamp: new Date().toISOString(),
        cors: "Enabled",
        version: "1.0.0"
    });
});

// Simple status endpoint
app.get("/status", async (_req: Request, res: Response) => {
    res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cors: "Configured"
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


