// Module CMS - Routes
const express = require('express');
const { authenticateToken, optionalAuthenticate } = require('../../middlewares/auth');
const { authorizeRole } = require('../../middlewares/rbac');
const { USER_ROLE } = require('../../constants/enums');
const { 
  getPosts, 
  createPost, 
  updatePost, 
  deletePost, 
  getContactInquiries, 
  createContactInquiry, 
  uploadImage,
  resolveContactInquiry,
  getChatHistory,
  getChatSessions,
  deleteChatMessage,
  deleteChatSession,
  replyContactInquiry
} = require('./controller');

const router = express.Router();

// Public
router.get('/posts', optionalAuthenticate, getPosts);
router.post('/contact-inquiries', createContactInquiry);
router.get('/chat/history', getChatHistory);

// Admin / Staff
router.post('/posts', authenticateToken, authorizeRole(USER_ROLE.ADMIN), createPost);
router.put('/posts/:id', authenticateToken, authorizeRole(USER_ROLE.ADMIN), updatePost);
router.delete('/posts/:id', authenticateToken, authorizeRole(USER_ROLE.ADMIN), deletePost);
router.post('/upload', authenticateToken, authorizeRole(USER_ROLE.ADMIN, USER_ROLE.STAFF, USER_ROLE.PATIENT), uploadImage);
router.get('/contact-inquiries', authenticateToken, authorizeRole(USER_ROLE.ADMIN, USER_ROLE.STAFF), getContactInquiries);
router.put('/contact-inquiries/:id/resolve', authenticateToken, authorizeRole(USER_ROLE.ADMIN, USER_ROLE.STAFF), resolveContactInquiry);
router.get('/chat/sessions', authenticateToken, authorizeRole(USER_ROLE.ADMIN, USER_ROLE.STAFF), getChatSessions);
router.delete('/chat/message/:id', authenticateToken, authorizeRole(USER_ROLE.ADMIN, USER_ROLE.STAFF), deleteChatMessage);
router.delete('/chat/session', authenticateToken, authorizeRole(USER_ROLE.ADMIN, USER_ROLE.STAFF), deleteChatSession);
router.post('/contact-inquiries/:id/reply', authenticateToken, authorizeRole(USER_ROLE.ADMIN, USER_ROLE.STAFF), replyContactInquiry);

module.exports = router;
