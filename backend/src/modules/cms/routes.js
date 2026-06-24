// Module CMS - Routes
const express = require('express');
const { authenticateToken, optionalAuthenticate } = require('../../middlewares/auth');
const { authorizeRole } = require('../../middlewares/rbac');
const { USER_ROLE } = require('../../constants/enums');
const { getPosts, createPost, updatePost, deletePost, getContactInquiries, createContactInquiry, uploadImage, resolveContactInquiry, replyContactInquiry } = require('./controller');

const router = express.Router();

// Public
router.get('/posts', optionalAuthenticate, getPosts);
router.post('/contact-inquiries', createContactInquiry);

// Admin
router.post('/posts', authenticateToken, authorizeRole(USER_ROLE.ADMIN), createPost);
router.put('/posts/:id', authenticateToken, authorizeRole(USER_ROLE.ADMIN), updatePost);
router.delete('/posts/:id', authenticateToken, authorizeRole(USER_ROLE.ADMIN), deletePost);
router.post('/upload', authenticateToken, authorizeRole(USER_ROLE.ADMIN, USER_ROLE.STAFF, USER_ROLE.PATIENT), uploadImage);
router.get('/contact-inquiries', authenticateToken, authorizeRole(USER_ROLE.ADMIN, USER_ROLE.STAFF), getContactInquiries);
router.put('/contact-inquiries/:id/resolve', authenticateToken, authorizeRole(USER_ROLE.ADMIN, USER_ROLE.STAFF), resolveContactInquiry);
router.post('/contact-inquiries/:id/reply', authenticateToken, authorizeRole(USER_ROLE.ADMIN, USER_ROLE.STAFF), replyContactInquiry);

module.exports = router;
