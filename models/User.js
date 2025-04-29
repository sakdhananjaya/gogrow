

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  username: { type: String, required: true, unique: true },
  email: String,
  password: String
});

module.exports = mongoose.model('User', userSchema);

