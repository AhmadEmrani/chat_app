const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  chatPartners: [{ type: String }], // لیست userId کاربرانی که با آن‌ها چت کرده
});

module.exports = mongoose.model('User', userSchema);