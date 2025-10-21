import { MongoClient, Db, Collection } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const connectionString: string = process.env.DB_CONN_STRING || "";
const dbName: string = process.env.DB_NAME || "appointmentAppDB";
const client = new MongoClient(connectionString);

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

        console.log('connected to database')

    }

    catch (error) {
        if (error instanceof Error) {
            console.log(`issue with db connection ${error.message}`);
        } else {
            console.log(`error with ${error}`);
        }

    }

}






export async function closeDb(): Promise<void> {
    await client.close();
    console.log('Database connection closed');
}


