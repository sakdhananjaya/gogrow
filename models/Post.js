const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  user: String,
  crop: String,
  quantity: String,
  price: String,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', PostSchema);
