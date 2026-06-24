// Module CMS - Controller
// Handles: Posts, Contact_Inquiries

const Post = require('../../models/Post');
const Contact_Inquiry = require('../../models/Contact_Inquiry');
const Staff = require('../../models/Staff');
const ChatMessage = require('../../models/ChatMessage');
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
    return ok(res, items, 'Article list loaded successfully');
  } catch (err) {
    console.error('getPosts error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error loading the article list', 500, err.message);
  }
};

const createPost = async (req, res) => {
  try {
    const { title, content, status, thumbnailURL } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
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
    return ok(res, post, 'Article created successfully', 201);
  } catch (err) {
    console.error('createPost error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error creating the article', 500, err.message);
  }
};

const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, status, thumbnailURL } = req.body;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Article not found' });
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
    return ok(res, post, 'Article updated successfully');
  } catch (err) {
    console.error('updatePost error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error updating the article', 500, err.message);
  }
};

const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findByIdAndDelete(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }
    const { success: ok } = require('../../utils/response');
    return ok(res, null, 'Article deleted successfully');
  } catch (err) {
    console.error('deletePost error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error deleting the article', 500, err.message);
  }
};

const getContactInquiries = async (req, res) => {
  try {
    const list = await Contact_Inquiry.find().populate('handledBy').sort({ createdAt: -1 }).lean();
    const { success: ok } = require('../../utils/response');
    return ok(res, list, 'Contact list loaded successfully');
  } catch (err) {
    console.error('getContactInquiries error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error loading the contact list', 500, err.message);
  }
};

const createContactInquiry = async (req, res) => {
  try {
    const { senderName, senderPhone, senderEmail, message } = req.body;
    if (!senderName || !senderPhone || !message) {
      return res.status(400).json({ success: false, message: 'Name, phone number, and message are required' });
    }

    const item = await Contact_Inquiry.create({
      senderName: String(senderName).trim(),
      senderPhone: String(senderPhone).trim(),
      senderEmail: senderEmail ? String(senderEmail).trim() : undefined,
      message: String(message).trim(),
      isResolved: false
    });

    const { success: ok } = require('../../utils/response');
    return ok(res, item, 'Your message was sent successfully', 201);
  } catch (err) {
    console.error('createContactInquiry error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error sending your message', 500, err.message);
  }
};

const fs = require('fs');
const path = require('path');

const uploadImage = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ success: false, message: 'base64 image data is required' });
    
    const matches = image.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, message: 'Invalid image format' });
    }
    
    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `img_${Date.now()}.${ext}`;
    const uploadDir = path.join(__dirname, '../../../uploads');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(uploadDir, filename), buffer);
    
    const config = require('../../config/env');
    const imageUrl = `http://localhost:${config.PORT}/uploads/${filename}`;
    
    const { success: ok } = require('../../utils/response');
    return ok(res, { url: imageUrl }, 'Image uploaded successfully');
  } catch (err) {
    console.error('uploadImage error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error uploading the image', 500, err.message);
  }
};

const resolveContactInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const inquiry = await Contact_Inquiry.findById(id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    const staff = await Staff.findOne({ userId: req.user.id });
    inquiry.isResolved = true;
    if (staff) {
      inquiry.handledBy = staff._id;
    }
    await inquiry.save();

    const populatedInquiry = await Contact_Inquiry.findById(id).populate('handledBy');

    const { success: ok } = require('../../utils/response');
    return ok(res, populatedInquiry, 'Inquiry marked as resolved');
  } catch (err) {
    console.error('resolveContactInquiry error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error resolving inquiry', 500, err.message);
  }
};
const getChatHistory = async (req, res) => {
  try {
    const { sessionId, userId } = req.query;
    if (!sessionId && !userId) {
      return res.status(400).json({ success: false, message: 'sessionId or userId is required' });
    }

    const conditions = [];
    if (sessionId) conditions.push({ guestSessionId: sessionId });
    if (userId) conditions.push({ senderId: userId });

    const messages = await ChatMessage.find({ $or: conditions })
      .sort({ createdAt: 1 })
      .lean();

    const { success: ok } = require('../../utils/response');
    return ok(res, messages, 'Chat history loaded successfully');
  } catch (err) {
    console.error('getChatHistory error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error loading chat history', 500, err.message);
  }
};

const getChatSessions = async (req, res) => {
  try {
    // Find active chat rooms grouped by guestSessionId or senderId
    const sessions = await ChatMessage.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $ne: ["$guestSessionId", null] },
              { type: "guest", id: "$guestSessionId" },
              { type: "user", id: "$senderId" }
            ]
          },
          lastMessage: { $last: "$messageText" },
          lastTimestamp: { $last: "$createdAt" },
          senderName: { $last: "$senderName" },
          senderType: { $last: "$senderType" }
        }
      },
      {
        $sort: { lastTimestamp: -1 }
      }
    ]);

    const mapped = sessions
      .filter(s => s._id && s._id.id)
      .map(s => ({
        roomType: s._id.type,
        roomId: s._id.id,
        roomName: s._id.type === 'guest' ? `Guest #${String(s._id.id).substring(0, 6)}` : s.senderName,
        lastMessage: s.lastMessage,
        lastTimestamp: s.lastTimestamp,
        senderName: s.senderName,
        senderType: s.senderType
      }));

    const { success: ok } = require('../../utils/response');
    return ok(res, mapped, 'Chat sessions loaded successfully');
  } catch (err) {
    console.error('getChatSessions error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error loading chat sessions', 500, err.message);
  }
};

module.exports = {
  getPosts,
  createPost,
  updatePost,
  deletePost,
  getContactInquiries,
  createContactInquiry,
  uploadImage,
  resolveContactInquiry,
  getChatHistory,
  getChatSessions
};
