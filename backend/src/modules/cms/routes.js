// Module CMS - Routes
const express = require('express');
const { authenticateToken } = require('../../middlewares/auth');
const { authorizeRole } = require('../../middlewares/rbac');
const { USER_ROLE } = require('../../constants/enums');
const { getPosts, createPost, updatePost, deletePost, getContactInquiries, createContactInquiry } = require('./controller');

const router = express.Router();

// Public
router.get('/posts', getPosts);
router.post('/contact-inquiries', createContactInquiry);

// Admin
router.post('/posts', authenticateToken, authorizeRole(USER_ROLE.ADMIN), createPost);
router.put('/posts/:id', authenticateToken, authorizeRole(USER_ROLE.ADMIN), updatePost);
router.delete('/posts/:id', authenticateToken, authorizeRole(USER_ROLE.ADMIN), deletePost);
router.get('/contact-inquiries', authenticateToken, authorizeRole(USER_ROLE.ADMIN, USER_ROLE.STAFF), getContactInquiries);

module.exports = router;
