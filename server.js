const express = require('express');
const app = express();
const path = require('path');
const multer = require('multer');
const mongoose = require('mongoose');
const fs = require('fs');
const bcrypt = require('bcrypt');

// Models
const Post = require('./models/Post');
const User = require('./models/User');
const Message = require('./models/Message');

const PORT = process.env.PORT || 3000;

// ✅ Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/gogrow', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB error:", err));

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve static files
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Multer storage for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

/* ========== USER ROUTES ========== */

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: 'Username already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, username, email, password: hashedPassword });
    await newUser.save();
    res.json({ message: 'Registration successful' });
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    res.json({ message: 'Login successful' });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Forgot password
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { resetInput } = req.body;
    const user = await User.findOne({
      $or: [{ username: resetInput }, { email: resetInput }]
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ message: `Password reset link sent to email (dummy). Contact admin.` });
  } catch (err) {
    console.error("❌ Forgot Password error:", err);
    res.status(500).json({ error: 'Failed to process password reset' });
  }
});

/* ========== POST ROUTES ========== */

// Create post
app.post('/api/post', upload.single('image'), async (req, res) => {
  try {
    const { user, crop, quantity, price } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
    const post = new Post({ user, crop, quantity, price, imageUrl, timestamp: new Date().toLocaleString() });
    await post.save();
    res.json({ message: 'Post submitted successfully!' });
  } catch (err) {
    console.error("❌ Failed to save post:", err);
    res.status(500).json({ error: 'Failed to save post' });
  }
});

// Get all posts
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ _id: -1 });
    res.json(posts);
  } catch (err) {
    console.error("❌ Failed to fetch posts:", err);
    res.status(500).json({ error: 'Failed to load posts' });
  }
});

// Delete post
app.delete('/api/post/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPost = await Post.findByIdAndDelete(id);
    if (!deletedPost) return res.status(404).json({ error: 'Post not found' });

    res.json({ message: 'Post deleted successfully.' });
  } catch (err) {
    console.error("❌ Failed to delete post:", err);
    res.status(500).json({ error: 'Failed to delete post.' });
  }
});

/* ========== CHAT ROUTES ========== */

// Send a chat message (✅ timestamp added here!)
app.post('/chat/send', async (req, res) => {
  try {
    const { sender, receiver, message } = req.body;
    const newMessage = new Message({ sender, receiver, message, timestamp: new Date() });
    await newMessage.save();
    res.json({ success: true, message: 'Message sent successfully' });
  } catch (err) {
    console.error("❌ Send message error:", err);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

// Get chat between two users
app.get('/chat/:sender/:receiver', async (req, res) => {
  try {
    const { sender, receiver } = req.params;
    const messages = await Message.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender }
      ]
    }).sort({ timestamp: 1 }); // oldest first
    res.json(messages);
  } catch (err) {
    console.error("❌ Fetch chat error:", err);
    res.status(500).json({ success: false, message: 'Failed to fetch chat' });
  }
});

// Get all chats related to a user (✅ sort latest first)
app.get('/chat/all/:user', async (req, res) => {
  try {
    const { user } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: user },
        { receiver: user }
      ]
    }).sort({ timestamp: -1 }); // latest first
    res.json(messages);
  } catch (err) {
    console.error("❌ Fetch user chats error:", err);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

/* ========== SERVER START ========== */
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
