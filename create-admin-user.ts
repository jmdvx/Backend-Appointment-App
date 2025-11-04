import { MongoClient, Collection, ObjectId } from "mongodb";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

const connectionString: string = process.env.DB_CONN_STRING || "mongodb://localhost:27017";
const dbName: string = process.env.DB_NAME || "appointmentAppDB";

const ADMIN_NAME: string = "Katie";
const ADMIN_EMAIL: string = "katie@katieappointments.com";
const ADMIN_PASSWORD_PLAIN: string = "katie123456";
const ADMIN_ROLE: string = "admin";
const SALT_ROUNDS: number = 12;

async function createAdminUser() {
    console.log("🔐 Create Admin User Script");
    console.log("===========================");
    console.log(`👤 Admin Name: ${ADMIN_NAME}`);
    console.log(`📧 Admin Email: ${ADMIN_EMAIL}`);
    console.log(`🔑 Admin Password: ${ADMIN_PASSWORD_PLAIN}`);
    console.log(`🔐 Admin Role: ${ADMIN_ROLE}`);
    console.log(`🗄️  Database: ${dbName}`);
    console.log("\n🔄 Connecting to database...");

    const client = new MongoClient(connectionString);
    try {
        await client.connect();
        const db = client.db(dbName);
        const usersCollection: Collection = db.collection("users");
        console.log("✅ Connected to database");

        // Check if user already exists
        console.log(`\n🔍 Checking if user with email ${ADMIN_EMAIL} exists...`);
        let existingUser = await usersCollection.findOne({ email: ADMIN_EMAIL });

        // Hash the password
        console.log("🔐 Hashing password...");
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD_PLAIN, SALT_ROUNDS);
        console.log("✅ Password hashed successfully");

        if (existingUser) {
            // Update existing user
            console.log(`\n👤 User found. Updating existing user with ID: ${existingUser._id}`);
            await usersCollection.updateOne(
                { _id: existingUser._id },
                { 
                    $set: { 
                        name: ADMIN_NAME,
                        password: hashedPassword,
                        role: ADMIN_ROLE,
                        lastUpdated: new Date()
                    } 
                }
            );
            console.log("✅ User updated successfully");
        } else {
            // Create new user
            console.log("\n👤 Creating new admin user...");
            const newAdminUser = {
                name: ADMIN_NAME,
                email: ADMIN_EMAIL,
                password: hashedPassword,
                role: ADMIN_ROLE,
                dateJoined: new Date(),
                lastUpdated: new Date(),
                phonenumber: "0871234567", // Default phone number
                isBanned: false,
                preferences: {
                    favoriteServices: [],
                    preferredTimes: [],
                    allergies: '',
                    specialRequests: ''
                }
            };

            console.log("💾 Inserting admin user into database...");
            const insertResult = await usersCollection.insertOne(newAdminUser);
            console.log(`✅ Admin user created successfully with ID: ${insertResult.insertedId}`);
        }

        // Verify the user and password
        console.log("\n🔍 Verifying user and password...");
        const user = await usersCollection.findOne({ email: ADMIN_EMAIL });
        if (user && user.password) {
            console.log("🔐 Testing password verification...");
            const isMatch = await bcrypt.compare(ADMIN_PASSWORD_PLAIN, user.password);
            if (isMatch) {
                console.log("✅ Password verification test PASSED");
            } else {
                console.log("❌ Password verification test FAILED - Hash mismatch");
            }
            
            console.log("\n✅ User Details:");
            console.log(`   Name: ${user.name}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   ID: ${user._id}`);
        } else {
            console.log("❌ Could not retrieve user or password hash for verification.");
        }

        console.log("\n======================================");
        console.log("✅ ADMIN USER SETUP COMPLETE!");
        console.log("======================================");

        console.log("\n📝 Admin Login Credentials:");
        console.log(`   Email: ${ADMIN_EMAIL}`);
        console.log(`   Password: ${ADMIN_PASSWORD_PLAIN}`);
        console.log(`   Role: ${ADMIN_ROLE}`);

    } catch (error) {
        console.error("💥 Error during admin user creation:", error);
        process.exit(1);
    } finally {
        await client.close();
        console.log("\n🔌 Database connection closed");
        console.log("\n🎉 Script completed successfully!");
    }
}

createAdminUser();

