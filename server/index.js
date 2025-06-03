const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const User = require('./models/User');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// برای مدیریت body درخواست‌های JSON
app.use(express.json());

// اتصال به MongoDB
mongoose.connect('mongodb://localhost:27017/chat-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'));

// ارائه فایل‌های کلاینت
app.use(express.static('../client'));

// API برای افزودن کاربر جدید
app.post('/api/users', async (req, res) => {
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

// مدیریت اتصال سوکت
io.on('connection', (socket) => {
  console.log('New client connected');

  // تنظیم Room برای چت خصوصی
  socket.on('join', async ({ senderId, receiverId }) => {
    const room = [senderId, receiverId].sort().join('_'); // Room منحصر به فرد برای هر جفت کاربر
    socket.join(room);

    // ثبت یا به‌روزرسانی کاربران
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

    // ارسال لیست شرکای چت به کاربر
    const user = await User.findOne({ userId: senderId });
    socket.emit('chatPartners', user.chatPartners);

    // بارگذاری پیام‌های قبلی
    const messages = await Message.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    }).sort({ timestamp: 1 });
    socket.emit('loadMessages', messages);
  });

  // مدیریت ارسال پیام
  socket.on('sendMessage', async ({ senderId, receiverId, message }) => {
    const room = [senderId, receiverId].sort().join('_');
    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      message,
    });
    await newMessage.save();

    // ارسال پیام به Room
    io.to(room).emit('receiveMessage', newMessage);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(3000, () => console.log('Server running on port 3000'));