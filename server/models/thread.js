const mongoose = require('mongoose');

const threadSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true }, // スレッドの内容を追加
  coordinates: {
    type: {
      lng: Number,
      lat: Number
    },
    required: true
  },
  responses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Response' }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Thread', threadSchema);