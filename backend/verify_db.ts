import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const Session = mongoose.model('Session', new mongoose.Schema({}, { strict: false }));
  
  const sessions = await Session.find().sort({ createdAt: -1 }).limit(3);
  sessions.forEach((s, i) => {
    console.log(`Session ${i}: Score=${s.get('authenticityScore')}`);
    console.log(`  Report:`, s.get('analysisReport'));
  });
  process.exit(0);
}

check().catch(console.error);
