require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./models/User');
const Message = require('./models/Message');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);

// تنظیم CORS برای Socket.IO
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// فعال کردن CORS برای Express
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// میدلور توکن برای HTTP
const authenticateToken = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication failed. Please login again." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired! Please login again." });
    }
    res.status(401).json({ message: "Invalid token" });
  }
};

// اتصال به MongoDB
mongoose.connect('mongodb://localhost:27017/chat-app')
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('MongoDB connection error:', error));

// API برای افزودن کاربر جدید (با احراز هویت)
app.post('/api/users', authenticateToken, async (req, res) => {
  try {
    const { userId, username } = req.body;
    if (!userId || !username) {
      return res.status(400).json({ error: 'userId و username الزامی هستند' });
    }

    const existingUser = await User.findOne({ userId });
    if (existingUser) {
      return res.status(400).json({ error: 'userId قبلاً وجود دارد' });
    }

    const newUser = new User({
      userId,
      username,
      chatPartners: [],
    });
    await newUser.save();

    res.status(201).json({ message: 'کاربر با موفقیت اضافه شد', user: newUser });
  } catch (error) {
    res.status(500).json({ error: 'خطا در سرور', details: error.message });
  }
});

// میدلور احراز هویت برای Socket.IO
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;
  console.log('Received token:', token);
  if (!token) {
    socket.emit('error', 'Authentication error: No token provided');
    return next(new Error('Authentication error: No token provided'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    if (!decoded.id) {
      throw new Error('Token does not contain id');
    }
    socket.user = decoded;
    console.log('Authenticated user:', decoded);
    next();
  } catch (err) {
    const errorMsg = err.name === 'TokenExpiredError' ? 'Token expired! Please login again.' : `Invalid token: ${err.message}`;
    console.error('Authentication error:', err.message);
    socket.emit('error', errorMsg);
    return next(new Error(`Authentication error: ${errorMsg}`));
  }
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.user);

  if (!socket.user || !socket.user.id) {
    console.log('Invalid user data, disconnecting:', socket.user);
    socket.emit('error', 'Authentication failed: Invalid user data');
    return socket.disconnect(true);
  }

  socket.on('join', async ({ receiverId }) => {
    const senderId = socket.user.id.toString(); // تبدیل id به string
    if (!receiverId) {
      return socket.emit('error', 'receiverId الزامی است');
    }

    const room = [senderId, receiverId].sort().join('_');
    socket.join(room);

    await User.findOneAndUpdate(
      { userId: senderId },
      { userId: senderId, username: `User_${senderId}`, $addToSet: { chatPartners: receiverId } },
      { upsert: true }
    );
    await User.findOneAndUpdate(
      { userId: receiverId },
      { userId: receiverId, username: `User_${receiverId}`, $addToSet: { chatPartners: senderId } },
      { upsert: true }
    );

    const user = await User.findOne({ userId: senderId });
    socket.emit('chatPartners', user.chatPartners);

    const messages = await Message.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    }).sort({ timestamp: 1 });
    socket.emit('loadMessages', messages);
  });

  socket.on('sendMessage', async ({ receiverId, message }) => {
    const senderId = socket.user.id.toString(); // تبدیل id به string
    if (!receiverId || !message) {
      return socket.emit('error', 'receiverId و message الزامی هستند');
    }

    const room = [senderId, receiverId].sort().join('_');
    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      message,
    });
    await newMessage.save();

    io.to(room).emit('receiveMessage', newMessage);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.user);
  });
});

server.listen(3000, () => console.log('Server running on port 3000'));