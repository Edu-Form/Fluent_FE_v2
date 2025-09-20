
// fluent/scripts/seed-test-student.js

require('dotenv').config({ path: './fluent/.env' });
const { MongoClient } = require('mongodb');

async function seedDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not defined in the .env file');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  console.log('Connecting to the database...');

  try {
    await client.connect();
    console.log('Connected successfully.');

    const db = client.db('school_management');
    const billingCollection = db.collection('billing');
    const studentsCollection = db.collection('students');

    const studentName = 'test_student';

    // 1. Seed the 'billing' collection
    const existingBilling = await billingCollection.findOne({ student_name: studentName });
    if (existingBilling) {
      console.log(`Billing record for '${studentName}' already exists.`);
    } else {
      const newBillingEntry = {
        student_name: studentName,
        step: 'initial',
        date: new Date().toISOString(),
        paymentNotes: 'Initial record for testing.',
        paymentHistory: '',
      };
      await billingCollection.insertOne(newBillingEntry);
      console.log(`Successfully created billing record for '${studentName}'.`);
    }

    // 2. Seed the 'students' collection
    const existingStudent = await studentsCollection.findOne({ name: studentName });
    if (existingStudent) {
      console.log(`Student record for '${studentName}' already exists.`);
    } else {
      const newStudentEntry = {
        name: studentName,
        teacher: 'test_teacher', // Add some default data
        credits: 10,
        paymentHistory: '',
      };
      await studentsCollection.insertOne(newStudentEntry);
      console.log(`Successfully created student record for '${studentName}'.`);
    }

  } catch (error) {
    console.error('Failed to seed database:', error);
  } finally {
    await client.close();
    console.log('Database connection closed.');
  }
}

seedDatabase();
