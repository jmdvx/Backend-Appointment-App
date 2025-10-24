import { MongoClient, Db, Collection } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const connectionString: string = process.env.DB_CONN_STRING || "";
const dbName: string = process.env.DB_NAME || "appointmentAppDB";

// Configure MongoDB client with optimized settings for production
const client = new MongoClient(connectionString, {
    serverSelectionTimeoutMS: 10000, // Reduced from 30s for faster failover
    socketTimeoutMS: 30000, // Reduced from 45s
    connectTimeoutMS: 10000, // Reduced from 30s for faster startup
    maxPoolSize: 20, // Increased for better concurrency
    minPoolSize: 5, // Increased for better performance
    retryWrites: true,
    retryReads: true,
    // Performance optimizations
    maxIdleTimeMS: 30000, // Close idle connections after 30s
    waitQueueTimeoutMS: 5000, // Wait max 5s for connection from pool
    heartbeatFrequencyMS: 10000, // Check connection health every 10s
    // Compression for better network performance
    compressors: ['zlib'],
    zlibCompressionLevel: 6
});

export const collections: { users?: Collection, appointments?: Collection, blockedDates?: Collection } = {}

if (connectionString == "") {
    throw new Error("No connection string  in .env");
}



let db: Db;

export async function initDb(): Promise<void> {
    const maxRetries = 3;
    let retryCount = 0;

    console.log('🔍 Database connection details:');
    console.log('  - Connection string exists:', !!connectionString);
    console.log('  - Database name:', dbName);
    console.log('  - Environment:', process.env.NODE_ENV || 'not set');

    while (retryCount < maxRetries) {
        try {
            console.log(`🔄 Attempting database connection (attempt ${retryCount + 1}/${maxRetries})...`);
            
            await client.connect();
            db = client.db(dbName);
            
            // Test the connection
            await db.admin().ping();
            
            const usersCollection: Collection = db.collection('users')
            collections.users = usersCollection;
            const appointmentsCollection : Collection = db.collection('appointments')
            collections.appointments = appointmentsCollection;
            const blockedDatesCollection: Collection = db.collection('blocked_dates')
            collections.blockedDates = blockedDatesCollection;

            // Create indexes for better query performance
            try {
                await usersCollection.createIndex({ email: 1 }, { unique: true });
                await usersCollection.createIndex({ role: 1 });
                await appointmentsCollection.createIndex({ userId: 1 });
                await appointmentsCollection.createIndex({ date: 1 });
                await appointmentsCollection.createIndex({ status: 1 });
                await blockedDatesCollection.createIndex({ date: 1 }, { unique: true });
                console.log('📈 Database indexes created for better performance');
            } catch (indexError) {
                console.log('⚠️  Some indexes may already exist:', indexError);
            }

            console.log('✅ Connected to database successfully');
            console.log('📊 Collections initialized:', {
                users: !!collections.users,
                appointments: !!collections.appointments,
                blockedDates: !!collections.blockedDates
            });
            return; // Success, exit the function

        } catch (error) {
            retryCount++;

            if (error instanceof Error) {
                console.log(`❌ Database connection failed (attempt ${retryCount}/${maxRetries}): ${error.message}`);
                if (retryCount === maxRetries) {
                    console.log(`Error details: ${error.stack}`);
                }
            } else {
                console.log(`❌ Database connection failed (attempt ${retryCount}/${maxRetries}): ${error}`);
            }

            if (retryCount < maxRetries) {
                console.log(`⏳ Retrying in 5 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            } else {
                // Set collections to undefined to prevent null reference errors
                collections.users = undefined;
                collections.appointments = undefined;
                collections.blockedDates = undefined;

                console.log('💥 All database connection attempts failed');
                console.log('⚠️  Server will continue but database operations will fail');

                // Re-throw the error so the application can handle it appropriately
                throw error;
            }
        }
    }
}






export async function closeDb(): Promise<void> {
    await client.close();
    console.log('Database connection closed');
}


