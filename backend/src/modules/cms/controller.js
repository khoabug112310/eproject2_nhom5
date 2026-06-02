// Module CMS - Controller
// Xử lý: Posts, Contact_Inquiries

const Post = require('../../models/Post');
const Contact_Inquiry = require('../../models/Contact_Inquiry');
const { POST_STATUS } = require('../../constants/enums');

// Simple Vietnamese slugify helper
const makeSlug = (str) => {
  str = str.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/[^a-z0-9 -]/g, ''); // remove invalid chars
  str = str.replace(/\s+/g, '-'); // collapse whitespace and replace by -
  str = str.replace(/-+/g, '-'); // collapse dashes
  return str + '-' + Date.now();
};

const getPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    let q = { status: POST_STATUS.PUBLISHED };
    
    // Check if admin is requesting (we will mount a separate admin endpoint or check user role if authenticated)
    if (req.user && req.user.role === 'admin') {
      q = {};
    }

    const items = await Post.find(q).sort({ publishedAt: -1, createdAt: -1 }).limit(limit).lean();
    const { success: ok } = require('../../utils/response');
    return ok(res, items, 'Lấy danh sách bài viết thành công');
  } catch (err) {
    console.error('getPosts error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Lỗi khi lấy danh sách bài viết', 500, err.message);
  }
};

const createPost = async (req, res) => {
  try {
    const { title, content, status, thumbnailURL } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Tiêu đề và nội dung là bắt buộc' });
    }

    const slug = makeSlug(title);
    const post = await Post.create({
      title,
      slug,
      content,
      thumbnailURL: thumbnailURL || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=600&auto=format&fit=crop',
      status: status || POST_STATUS.DRAFT,
      publishedAt: status === POST_STATUS.PUBLISHED ? new Date() : undefined
    });

    const { success: ok } = require('../../utils/response');
    return ok(res, post, 'Tạo bài viết thành công', 201);
  } catch (err) {
    console.error('createPost error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Lỗi khi tạo bài viết', 500, err.message);
  }
};

const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, status, thumbnailURL } = req.body;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Bài viết không tồn tại' });
    }

    if (title) {
      post.title = title;
      post.slug = makeSlug(title);
    }
    if (content) post.content = content;
    if (thumbnailURL) post.thumbnailURL = thumbnailURL;
    if (status) {
      if (post.status !== POST_STATUS.PUBLISHED && status === POST_STATUS.PUBLISHED) {
        post.publishedAt = new Date();
      }
      post.status = status;
    }

    await post.save();

    const { success: ok } = require('../../utils/response');
    return ok(res, post, 'Cập nhật bài viết thành công');
  } catch (err) {
    console.error('updatePost error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Lỗi khi cập nhật bài viết', 500, err.message);
  }
};

const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findByIdAndDelete(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Bài viết không tồn tại' });
    }
    const { success: ok } = require('../../utils/response');
    return ok(res, null, 'Xóa bài viết thành công');
  } catch (err) {
    console.error('deletePost error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Lỗi khi xóa bài viết', 500, err.message);
  }
};

const getContactInquiries = async (req, res) => {
  try {
    const list = await Contact_Inquiry.find().populate('handledBy').sort({ createdAt: -1 }).lean();
    const { success: ok } = require('../../utils/response');
    return ok(res, list, 'Lấy danh sách liên hệ thành công');
  } catch (err) {
    console.error('getContactInquiries error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Lỗi khi lấy danh sách liên hệ', 500, err.message);
  }
};

const createContactInquiry = async (req, res) => {
  try {
    const { senderName, senderPhone, senderEmail, message } = req.body;
    if (!senderName || !senderPhone || !message) {
      return res.status(400).json({ success: false, message: 'Họ tên, SĐT và Lời nhắn là bắt buộc' });
    }

    const item = await Contact_Inquiry.create({
      senderName,
      senderPhone,
      senderEmail,
      message,
      isResolved: false
    });

    const { success: ok } = require('../../utils/response');
    return ok(res, item, 'Gửi liên hệ thành công', 201);
  } catch (err) {
    console.error('createContactInquiry error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Lỗi khi gửi liên hệ', 500, err.message);
  }
};

module.exports = { getPosts, createPost, updatePost, deletePost, getContactInquiries, createContactInquiry };
