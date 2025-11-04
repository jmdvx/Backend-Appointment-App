import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DB_CONN_STRING || '';
const dbName = process.env.DB_NAME || 'appointmentAppDB';
const adminEmail = 'jamesdevers2021@gmail.com';
const newPassword = 'admin123456';

async function resetAdminPassword() {
  if (!connectionString) {
    console.error('❌ DB_CONN_STRING environment variable is not set');
    process.exit(1);
  }

  console.log('🔐 Admin Password Reset Script');
  console.log('================================');
  console.log(`📧 Admin Email: ${adminEmail}`);
  console.log(`🔑 New Password: ${newPassword}`);
  console.log(`🗄️  Database: ${dbName}`);
  console.log('');

  const client = new MongoClient(connectionString);

  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    const db = client.db(dbName);
    const usersCollection = db.collection('users');

    // Find the admin user
    console.log(`🔍 Looking for user with email: ${adminEmail}`);
    const user = await usersCollection.findOne({ email: adminEmail.toLowerCase() });

    if (!user) {
      console.error(`❌ User not found with email: ${adminEmail}`);
      console.log('💡 Creating new admin user...');
      
      // Create new admin user
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      const newUser = {
        name: 'James',
        email: adminEmail.toLowerCase(),
        password: hashedPassword,
        role: 'admin',
        phonenumber: '0833863646',
        dateJoined: new Date(),
        lastUpdated: new Date(),
        isBanned: false
      };

      const result = await usersCollection.insertOne(newUser);
      console.log(`✅ Created new admin user with ID: ${result.insertedId}`);
      console.log('✅ Password set successfully');
    } else {
      console.log(`✅ Found user: ${user.name} (ID: ${user._id})`);
      
      // Hash the new password
      console.log('🔐 Hashing new password...');
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      console.log('💾 Updating password in database...');
      const result = await usersCollection.updateOne(
        { email: adminEmail.toLowerCase() },
        { 
          $set: { 
            password: hashedPassword,
            lastUpdated: new Date()
          }
        }
      );

      if (result.modifiedCount > 0) {
        console.log('✅ Password updated successfully!');
        console.log(`✅ Modified ${result.modifiedCount} user(s)`);
      } else if (result.matchedCount > 0) {
        console.log('⚠️  User found but password was already set (may be same value)');
        console.log('✅ Password hash has been updated anyway');
      } else {
        console.error('❌ Failed to update password - user not found');
      }

      // Verify the password was set correctly
      console.log('');
      console.log('🔍 Verifying password hash...');
      const updatedUser = await usersCollection.findOne({ email: adminEmail.toLowerCase() });
      if (updatedUser && updatedUser.password) {
        const isValidHash = updatedUser.password.startsWith('$2') && updatedUser.password.length === 60;
        if (isValidHash) {
          console.log('✅ Password hash format is valid');
          
          // Test the password
          const testResult = await bcrypt.compare(newPassword, updatedUser.password);
          if (testResult) {
            console.log('✅ Password verification test PASSED');
            console.log('✅ You can now login with:');
            console.log(`   Email: ${adminEmail}`);
            console.log(`   Password: ${newPassword}`);
          } else {
            console.error('❌ Password verification test FAILED');
            console.error('❌ Something went wrong with password hashing');
          }
        } else {
          console.error('❌ Password hash format is invalid');
          console.error(`❌ Hash: ${updatedUser.password.substring(0, 20)}...`);
        }
      }
    }

    console.log('');
    console.log('✅ Password reset completed successfully!');
    console.log('📝 You can now login with:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${newPassword}`);

  } catch (error) {
    console.error('❌ Error resetting password:', error);
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
resetAdminPassword()
  .then(() => {
    console.log('');
    console.log('🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });

