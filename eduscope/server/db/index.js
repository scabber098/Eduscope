// === FILE: server/db/index.js (MongoDB via Mongoose) ===
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const University = require('../models/University');
const Department = require('../models/Department');
const User = require('../models/User');
const Lecture = require('../models/Lecture');
const Session = require('../models/Session');
const Poll = require('../models/Poll');
const SessionParticipant = require('../models/SessionParticipant');
const Response = require('../models/Response');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/eduscope';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

async function connectDB() {
  const maskedUri = MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
  console.log('[db] Attempting MongoDB connection to:', maskedUri);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
      });

      console.log('[db] ✅ MongoDB connected successfully (attempt ' + attempt + ')');
      console.log('[db]    Host:', mongoose.connection.host);
      console.log('[db]    Database:', mongoose.connection.name);
      console.log('[db]    ReadyState:', mongoose.connection.readyState);

      // Monitor connection events
      mongoose.connection.on('error', (err) => {
        console.error('[db] ❌ MongoDB runtime error:', err.message);
      });
      mongoose.connection.on('disconnected', () => {
        console.warn('[db] ⚠️  MongoDB disconnected');
      });
      mongoose.connection.on('reconnected', () => {
        console.log('[db] ✅ MongoDB reconnected');
      });

      await seed();
      return; // success
    } catch (err) {
      console.error('[db] ❌ Connection attempt ' + attempt + '/' + MAX_RETRIES + ' failed:', err.message);
      if (attempt < MAX_RETRIES) {
        console.log('[db]    Retrying in ' + (RETRY_DELAY_MS / 1000) + 's...');
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      } else {
        console.error('[db] ❌ All connection attempts exhausted.');
        console.error('[db] 💡 Troubleshooting:');
        console.error('[db]    1. Verify MONGO_URI in server/.env');
        console.error('[db]    2. Whitelist your IP in MongoDB Atlas → Network Access');
        console.error('[db]    3. Check Atlas cluster is active (not paused)');
        console.error('[db]    4. Ensure username/password are correct');
        process.exit(1);
      }
    }
  }
}

async function seed() {
  try {
    const uniCount = await University.countDocuments();
    if (uniCount > 0) {
      console.log('[db] Seed data already exists — skipping.');
      return;
    }

    console.log('[db] Seeding initial data...');
    const now = Date.now();
    const unis = await University.insertMany([
      { name: 'Lovely Professional University', short_name: 'LPU', city: 'Phagwara', active: true, created_at: now },
      { name: 'Punjab Technical University', short_name: 'PTU', city: 'Kapurthala', active: true, created_at: now },
      { name: 'Chandigarh University', short_name: 'CU', city: 'Mohali', active: true, created_at: now },
    ]);

    const depts = await Department.insertMany([
      { university_id: unis[0]._id, name: 'Computer Science & Engineering', created_at: now },
      { university_id: unis[0]._id, name: 'Mechanical Engineering', created_at: now },
      { university_id: unis[0]._id, name: 'Business Administration', created_at: now },
      { university_id: unis[0]._id, name: 'Physics', created_at: now },
      { university_id: unis[1]._id, name: 'Computer Science & Engineering', created_at: now },
      { university_id: unis[1]._id, name: 'Civil Engineering', created_at: now },
      { university_id: unis[2]._id, name: 'Computer Science & Engineering', created_at: now },
      { university_id: unis[2]._id, name: 'Electronics & Communication', created_at: now },
    ]);
    console.log('[db] ✅ Universities & departments seeded.');

    const hashedPw = bcrypt.hashSync('password123', 10);
    const lpu = unis[0];
    const cse = depts[0];

    const faculty = await User.create({
      name: 'Dr. Eleanor Hale', email: 'faculty@pollcast.edu',
      password: hashedPw, role: 'faculty',
      university_id: lpu._id, department_id: cse._id, created_at: now,
    });
    console.log('[db] ✅ Faculty user created:', faculty.email);


    const lectureNames = ['Thermodynamics — Lecture 4', 'Organic Chemistry — Chapter 3', 'Linear Algebra — Eigenvalues'];
    for (let i = 0; i < lectureNames.length; i++) {
      await Lecture.create({ name: lectureNames[i], faculty_id: faculty._id, archived: false, created_at: now - i * 86400000 });
    }
    console.log('[db] ✅ Lectures seeded:', lectureNames.length);

    console.log('[db] ✅ Seed complete. Demo: faculty@pollcast.edu / password123');
  } catch (err) {
    console.error('[db] ❌ Seed error:', err.message);
    // Don't crash on seed failure — DB is connected, app can still work
  }
}

module.exports = { connectDB, mongoose };
