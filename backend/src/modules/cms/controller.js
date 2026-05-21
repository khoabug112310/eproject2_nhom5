// Module CMS - Controller
// Xử lý: Posts, Contact_Inquiries

const Post = require('../../models/Post');
const { POST_STATUS } = require('../../constants/enums');

const getPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const items = await Post.find({ status: POST_STATUS.PUBLISHED }).sort({ publishedAt: -1 }).limit(limit).lean();
    const { success: ok } = require('../../utils/response');
    return ok(res, items, 'Lấy danh sách bài viết thành công');
  } catch (err) {
    console.error('getPosts error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Lỗi khi lấy danh sách bài viết', 500, err.message);
  }
};

const createPost = (req, res) => {
  // TODO: Tạo bài viết (chỉ admin)
  res.json({ message: 'Create post' });
};

const updatePost = (req, res) => {
  // TODO: Cập nhật bài viết
  res.json({ message: 'Update post' });
};

const deletePost = (req, res) => {
  // TODO: Xóa bài viết
  res.json({ message: 'Delete post' });
};

const getContactInquiries = (req, res) => {
  // TODO: Lấy danh sách liên hệ
  res.json({ message: 'Get contact inquiries' });
};

const createContactInquiry = (req, res) => {
  // TODO: Khách hàng gửi liên hệ
  res.json({ message: 'Create contact inquiry' });
};

module.exports = { getPosts, createPost, updatePost, deletePost, getContactInquiries, createContactInquiry };
