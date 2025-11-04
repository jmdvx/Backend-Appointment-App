import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DB_CONN_STRING || '';
const dbName = process.env.DB_NAME || 'appointmentAppDB';
const adminEmail = 'admin@admin.com';
const adminPassword = 'admin123456';
const adminName = 'admin';

async function resetToSingleAdmin() {
  if (!connectionString) {
    console.error('❌ DB_CONN_STRING environment variable is not set');
    process.exit(1);
  }

  console.log('🔐 Reset Database to Single Admin User');
  console.log('======================================');
  console.log(`👤 Admin Name: ${adminName}`);
  console.log(`📧 Admin Email: ${adminEmail}`);
  console.log(`🔑 Admin Password: ${adminPassword}`);
  console.log(`🔐 Admin Role: admin`);
  console.log(`🗄️  Database: ${dbName}`);
  console.log('');

  const client = new MongoClient(connectionString);

  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    const db = client.db(dbName);
    const usersCollection = db.collection('users');

    // Step 1: Delete all existing users
    console.log('');
    console.log('🗑️  Step 1: Deleting all existing users...');
    const deleteResult = await usersCollection.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} user(s)`);

    // Step 2: Create new admin user
    console.log('');
    console.log('👤 Step 2: Creating new admin user...');
    
    // Hash the password
    console.log('🔐 Hashing password...');
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
    
    if (!hashedPassword.startsWith('$2')) {
      console.error('❌ Password hashing failed - invalid hash format');
      process.exit(1);
    }
    
    console.log('✅ Password hashed successfully');

    // Create admin user
    const adminUser = {
      name: adminName,
      email: adminEmail.toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      phonenumber: '0800000000',
      dateJoined: new Date(),
      lastUpdated: new Date(),
      isBanned: false
    };

    console.log('💾 Inserting admin user into database...');
    const insertResult = await usersCollection.insertOne(adminUser);

    if (!insertResult.insertedId) {
      console.error('❌ Failed to create admin user');
      process.exit(1);
    }

    console.log(`✅ Admin user created successfully with ID: ${insertResult.insertedId}`);

    // Step 3: Verify the user was created correctly
    console.log('');
    console.log('🔍 Step 3: Verifying admin user...');
    const verifyUser = await usersCollection.findOne({ email: adminEmail.toLowerCase() });

    if (!verifyUser) {
      console.error('❌ Verification failed - admin user not found');
      process.exit(1);
    }

    // Verify password hash
    const isValidHash = verifyUser.password && 
                       verifyUser.password.startsWith('$2') && 
                       verifyUser.password.length === 60;
    
    if (!isValidHash) {
      console.error('❌ Verification failed - invalid password hash');
      process.exit(1);
    }

    // Test password
    console.log('🔐 Testing password verification...');
    const passwordTest = await bcrypt.compare(adminPassword, verifyUser.password);
    
    if (!passwordTest) {
      console.error('❌ Password verification test FAILED');
      process.exit(1);
    }

    console.log('✅ Password verification test PASSED');
    console.log('✅ Admin user verified successfully');

    // Step 4: Verify only one user exists
    console.log('');
    console.log('🔍 Step 4: Verifying database state...');
    const userCount = await usersCollection.countDocuments();
    
    if (userCount !== 1) {
      console.error(`❌ Verification failed - expected 1 user, found ${userCount}`);
      process.exit(1);
    }

    console.log(`✅ Database contains exactly ${userCount} user(s)`);

    // Summary
    console.log('');
    console.log('======================================');
    console.log('✅ DATABASE RESET COMPLETE!');
    console.log('======================================');
    console.log('');
    console.log('📝 Admin Login Credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role: admin`);
    console.log('');
    console.log('✅ All other users have been removed');
    console.log('✅ Only the admin user exists in the database');

  } catch (error) {
    console.error('❌ Error resetting database:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    await client.close();
    console.log('');
    console.log('🔌 Database connection closed');
  }
}

// Run the script
resetToSingleAdmin()
  .then(() => {
    console.log('');
    console.log('🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });

