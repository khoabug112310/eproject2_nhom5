// Model: Post
const mongoose = require('mongoose');
const { POST_STATUS } = require('../constants/enums');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  thumbnailURL: {
    type: String,
    note: 'Ảnh bìa/Thumbnail của bài viết hiển thị trên web',
  },
  content: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(POST_STATUS),
    default: POST_STATUS.DRAFT,
  },
  publishedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
