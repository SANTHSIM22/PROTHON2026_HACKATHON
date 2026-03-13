import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/prothon');
    console.log('Connected to MongoDB');

    // Check if organization already exists
    const existingOrg = await User.findOne({ email: 'bob@gmail.com' });
    
    if (existingOrg) {
      console.log('Organization bob@gmail.com already exists');
      
      // Update role to organization if needed
      if (existingOrg.role !== 'organization') {
        existingOrg.role = 'organization';
        existingOrg.organizationEmail = 'bob@gmail.com';
        await existingOrg.save();
        console.log('Updated bob@gmail.com to organization role');
      }
    } else {
      // Create new organization user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('bob123', salt);

      const orgUser = new User({
        name: 'Organization Admin',
        email: 'bob@gmail.com',
        password: hashedPassword,
        role: 'organization',
        organizationEmail: 'bob@gmail.com'
      });

      await orgUser.save();
      console.log('Organization user bob@gmail.com created successfully with password bob123');
    }

    console.log('Database seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
