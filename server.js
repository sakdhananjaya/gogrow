const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const User = require('./models/User');
const Post = require('./models/Post'); // ✅ Include Post model

const app = express();
const PORT = 3000;

// ✅ MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/gogrow', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // ✅ Serve HTML/CSS/JS files from public/

// ✅ Register endpoint
app.post('/api/register', async (req, res) => {
  const { name, username, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  try {
    const user = new User({ name, username, email, password: hashed });
    await user.save();
    res.status(200).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ✅ Login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (user && await bcrypt.compare(password, user.password)) {
    res.status(200).json({ message: 'Login successful' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// ✅ Create Post endpoint
app.post('/api/post', async (req, res) => {
  const { user, crop, quantity, price } = req.body;
  try {
    const post = new Post({ user, crop, quantity, price });
    await post.save();
    res.status(200).json({ message: 'Post created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// ✅ Get All Posts endpoint
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
