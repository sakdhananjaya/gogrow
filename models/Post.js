

// models/Post.js
const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  user: String,
  crop: String,
  quantity: String,
  price: String,
  imageUrl: String,
  timestamp: String
});

module.exports = mongoose.model('Post', PostSchema);

