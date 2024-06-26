const express = require('express');
const { createPost, likeAndUnlikePost, deletePost, getPostOfFowllowing, updateCaption, addComment, deleteComment } = require('../controllers/post');
const { isAuthenticated } = require('../middlewares/auth');
  
const router = express.Router();

 
router.route("/post/upload").post( isAuthenticated ,createPost);

router.route("/post/:id")
.get( isAuthenticated ,likeAndUnlikePost)
.put(isAuthenticated,updateCaption)
.delete(isAuthenticated,deletePost);

router.route("/posts").get(isAuthenticated,getPostOfFowllowing)
router.route("/post/comment/:id").put(isAuthenticated,addComment).delete(isAuthenticated,deleteComment)
module.exports = router;