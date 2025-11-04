import { app, initializeDatabase } from './index';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

// Function to find an available port
async function findAvailablePort(startPort: number): Promise<number> {
    const net = require('net');
    
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        
        server.listen(startPort, () => {
            const port = server.address()?.port;
            server.close(() => {
                resolve(port || startPort);
            });
        });
        
        server.on('error', (err: any) => {
            if (err.code === 'EADDRINUSE') {
                // Try next port
                findAvailablePort(startPort + 1).then(resolve).catch(reject);
            } else {
                reject(err);
            }
        });
    });
}

// Start server with port conflict handling
async function startServer() {
    try {
        // CRITICAL: Wait for database connection before starting server
        console.log('🔄 Initializing database connection...');
        await initializeDatabase();
        console.log('✅ Database connected successfully, starting server...');
        
        const availablePort = await findAvailablePort(Number(PORT));
        
        const server = app.listen(availablePort, () => {
            console.log(`🚀 Server is running on port ${availablePort}`);
            console.log(`📡 API endpoints available at: http://localhost:${availablePort}/api`);
            console.log(`🔗 Auth endpoints: http://localhost:${availablePort}/api/auth`);
        });

        // Graceful shutdown handling
        process.on('SIGTERM', () => {
            console.log('🛑 SIGTERM received, shutting down gracefully...');
            server.close(() => {
                console.log('✅ Server closed');
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            console.log('🛑 SIGINT received, shutting down gracefully...');
            server.close(() => {
                console.log('✅ Server closed');
                process.exit(0);
            });
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('💥 Uncaught Exception:', error);
            server.close(() => {
                process.exit(1);
            });
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
            server.close(() => {
                process.exit(1);
            });
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
            console.error('Stack trace:', error.stack);
        }
        console.error('💥 Server cannot start without database connection. Exiting...');
        process.exit(1);
    }
}

startServer();