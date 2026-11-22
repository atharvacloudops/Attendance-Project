/**
 * Seed Script – Creates demo admin, teacher, and student accounts
 * Run: node backend/utils/seed.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User.model');
const Student = require('../models/Student.model');

const SEED_USERS = [
  {
    name: 'Admin User',
    email: 'admin@demo.com',
    password: 'admin123',
    role: 'admin',
  },
  {
    name: 'Prof. Ravi Kumar',
    email: 'teacher@demo.com',
    password: 'teacher123',
    role: 'teacher',
  },
  {
    name: 'Arjun Sharma',
    email: 'student@demo.com',
    password: 'student123',
    role: 'student',
    studentData: {
      rollNumber: 'CS2024001',
      department: 'Computer Science',
      semester: 4,
      division: 'A',
    },
  },
  {
    name: 'Priya Patel',
    email: 'priya@demo.com',
    password: 'student123',
    role: 'student',
    studentData: {
      rollNumber: 'CS2024002',
      department: 'Computer Science',
      semester: 4,
      division: 'A',
    },
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing seed data
    await User.deleteMany({ email: { $in: SEED_USERS.map((u) => u.email) } });
    const existingRolls = SEED_USERS.filter((u) => u.studentData).map((u) => u.studentData.rollNumber);
    await Student.deleteMany({ rollNumber: { $in: existingRolls } });

    for (const userData of SEED_USERS) {
      const { studentData, ...userFields } = userData;
      const user = await User.create(userFields);
      console.log(`✅ Created ${user.role}: ${user.email}`);

      if (user.role === 'student' && studentData) {
        await Student.create({ userId: user._id, ...studentData });
        console.log(`   └─ Student profile: ${studentData.rollNumber}`);
      }
    }

    console.log('\n🎉 Seeding complete!\n');
    console.log('Demo accounts:');
    console.log('  Admin   → admin@demo.com   / admin123');
    console.log('  Teacher → teacher@demo.com / teacher123');
    console.log('  Student → student@demo.com / student123\n');
  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();
