import { MongoClient, Db, Collection } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const connectionString: string = process.env.DB_CONN_STRING || "";
const dbName: string = process.env.DB_NAME || "appointmentAppDB";

// Configure MongoDB client with SSL/TLS settings for Atlas compatibility
const client = new MongoClient(connectionString, {
    tls: true,
    tlsAllowInvalidCertificates: true, // Allow invalid certificates for development
    tlsAllowInvalidHostnames: true, // Allow invalid hostnames for development
    serverSelectionTimeoutMS: 10000, // Keep trying to send operations for 10 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
    maxPoolSize: 10, // Maintain up to 10 socket connections
    minPoolSize: 2, // Maintain a couple of socket connections
});

export const collections: { users?: Collection, appointments?: Collection, blockedDates?: Collection } = {}

if (connectionString == "") {
    throw new Error("No connection string  in .env");
}



let db: Db;

export async function initDb(): Promise<void> {

    try {
        await client.connect();
        db = client.db(dbName);
        const usersCollection: Collection = db.collection('users')
        collections.users = usersCollection;
        const appointmentsCollection : Collection = db.collection('appointments')
        collections.appointments = appointmentsCollection;
        const blockedDatesCollection: Collection = db.collection('blocked_dates')
        collections.blockedDates = blockedDatesCollection;

        console.log('✅ Connected to database successfully')

    }

    catch (error) {
        if (error instanceof Error) {
            console.log(`❌ Database connection failed: ${error.message}`);
            console.log(`Error details: ${error.stack}`);
        } else {
            console.log(`❌ Database connection failed: ${error}`);
        }
        
        // Set collections to undefined to prevent null reference errors
        collections.users = undefined;
        collections.appointments = undefined;
        collections.blockedDates = undefined;
        
        // Re-throw the error so the application can handle it appropriately
        throw error;
    }

}






export async function closeDb(): Promise<void> {
    await client.close();
    console.log('Database connection closed');
}


