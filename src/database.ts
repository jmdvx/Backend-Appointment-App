import { MongoClient, Db, Collection } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const connectionString: string = process.env.DB_CONN_STRING || "";
const dbName: string = process.env.DB_NAME || "appointmentAppDB";

// Configure MongoDB client with SSL/TLS settings for Atlas compatibility
const client = new MongoClient(connectionString, {
    serverSelectionTimeoutMS: 30000, // Keep trying to send operations for 30 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    connectTimeoutMS: 30000, // Give up initial connection after 30 seconds
    maxPoolSize: 10, // Maintain up to 10 socket connections
    minPoolSize: 2, // Maintain a couple of socket connections
    retryWrites: true, // Retry writes on network errors
    retryReads: true, // Retry reads on network errors
    // Fix TLS compatibility issues with Render/Node.js 25
    tls: true,
    tlsAllowInvalidCertificates: false,
    tlsAllowInvalidHostnames: false
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


