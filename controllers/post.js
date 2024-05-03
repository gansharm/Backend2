const { json } = require("express");
const Post = require("../models/Post");
const User = require("../models/User")
 exports.createPost = async (req,res) =>{
    try{
        
        const newPostData = {
            caption:req.body.caption,
            image:{
                public_id:"req.body.public_id",
                url:"req.body.url",
            },
            owner:req.user.id,
        }
        const post = await Post.create(newPostData);
        const user = await User.findById(req.user.id);
        user.posts.push(post.id);
        await user.save(); 
        res.status(201).json({
            success:true,
            post,
        })
    }catch(error){
        res.status(500).json({
            success:false,
            message:error.message
        })
    }
};

exports.deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user._id;

        // Find the post by ID
        const post = await Post.findById(postId);

        // Check if the post exists
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        // Check if the user is defined
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is missing"
            });
        }

        // Check if the user owns the post
        if (post.owner.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this post"
            });
        }

        // Delete the post
       
        await Post.deleteOne({ _id: postId });
        await User.findByIdAndUpdate(userId, { $pull: { posts: postId } });

        return res.status(200).json({
            success: true,
            message: "Post deleted successfully"
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


exports.likeAndUnlikePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user._id;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Ensure userId and post.likes are defined before accessing their properties
        if (post.likes && userId) {
            const likedIndex = post.likes.findIndex(like => like.user && like.user.toString() === userId.toString());

            if (likedIndex !== -1) {
                // User has already liked the post, so remove the like
                post.likes.splice(likedIndex, 1);
                await post.save();

                return res.status(200).json({
                    success: true,
                    message: "Post Unliked"
                });
            } else {
                // User hasn't liked the post, so add the like
                post.likes.push({ user: userId });
                await post.save();

                return res.status(200).json({
                    success: true,
                    message: "Post Liked"
                });
            }
        } else {
            return res.status(500).json({
                success: false,
                message: "Error: Unable to process the like/unlike operation"
            });
        }
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getPostOfFowllowing = async (req,res) =>{
    try {
        const user = await User.findById(req.user._id).populate("following","posts")
        res.status(200).json({
            success:true,
            following:user.following
        })
    } catch(error){
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

exports.updateCaption = async (req,res) =>{
    try {
        
        const post = await Post.findById(req.params.id);

        if(!post)
        {
            return res.status(404).json({
                success:false,
                message:"Post not found"
            })
        }

        if(post.owner.toString() != req.user._id.toString()){
            return res.status(400).json({
                success:false,
                message:"User not authorized"
            })
        }

        post.caption = req.body.caption;

        await post.save();

        res.status(200).json({success:true,message:"Post updated"})

    } catch (error) {
        res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

exports.addComment = async (req,res) =>{
    try {
        
        const post = await Post.findById(req.params.id);

        if(!post){ 
             return res.status(404).json({
                success:false,
                message:"Post not found"
             })
        }

        let commentIndex = -1;
        //Checking iof comment already exists
        post.comments.forEach((item,index)=>{
            if(item.user.toString() === req.user._id.toString()){
                commentIndex = index; 
            }
        });
        
        if(commentIndex !== -1){
            post.comments[commentIndex].comment = req.body.comment;
            await post.save();
            return res.status(200).json({
                success:true,
                message:"Comments updated"
            })
        }else{
            post.comments.push({
            user:req.user._id,
            comment:req.body.comment
        })

        await post.save();
        return res.status(200).json({
            success:true,
            message:"Comment Added"
        })
        }

    } catch (error) {
        res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

exports.deleteComment = async  (req,res) =>{
    try {
        
        const post = await Post.findById(req.params.id);

        if(!post){
            return res.status(404).json({
                success:false,
                message:"Post not found"
            })
        }

        if (post.owner.toString() === req.user._id.toString()) {
            if(req.body.commentId == undefined){
                return res.status(400).json({
                    success:false,
                    message:"Comment Id is required"
                })
            }
            post.comments.forEach((item,index)=>{
                if(item._id.toString() === req.body.commentId.toString()){
                    return post.comments.splice(index,1);
                }
            })

            await post.save();
            return res.status(200).json({success:true,message:"Selected message deleted"})
        } else {
            post.comments.forEach((item,index)=>{
                if(item.user.toString() === req.user._id.toString()){
                    return post.comments.splice(index,1);
                }
            })
 

            await post.save();
            return res.status(200).json({success:true,message:"Your message deleted"})
            
        }

    } catch (error) {
        res.status(500).json({
            success:false,
            message:error.message
        })
    }
}



