const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/vi-notes')
  .then(async () => {
    // Schema
    const sessionSchema = new mongoose.Schema({
      content: String,
      delays: [Number],
      analysisReport: Object
    }, { strict: false });
    
    // Check if the collection exists, model
    const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);
    
    const docs = await Session.find().sort({ createdAt: -1 }).limit(1);
    console.log(JSON.stringify(docs, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
