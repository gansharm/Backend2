const { post, use } = require('../app');
const Post = require('../models/Post');
const User = require('../models/User')
const {sendEmail} = require("../middlewares/sendEmail")
const crypto = require('crypto')

exports.register = async(req,res) =>{
    try{
        const {name,email,password} = req.body;
        let user = await User.findOne({email});
        if(user){
            return res.status(400)
            .json({
                success:false,
                message:"User already exists"
            })
        }

        user = await User.create({
            name,
            email,
            password,
            avatar:{public_id:"sample_id",url:"smapleurl"}});
             res.status(201).json({success:true,user});
    }catch(error)
    {
        res.status(500).json({
            success:false,
            messsage:error.message
        })
    }
}

exports.login = async (req,res) =>{
    try{
        
        const {email,password} = req.body;

        const user = await User.findOne({email}).select("+password");

        if(!user){
            return res.status(400)
            .json({
                success:false,
                message:"User doest not exist"
            })
        }

        const isMatch = await user.matchPassword(password);

        if(!isMatch){
            return 
            res.status(400)
            .json({
                success:false,
                message:"Incorrect password"
            });
        }
        
        const token = await user.generateToken();

        res.status(200).cookie("token",token,{expires:new Date(Date.now()+90*24*60*60*1000),
            httpOnly:true
        })
        .json({
            success:true,
            user,
            token
        })
    }catch(error)
    {
        res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}

exports.followUser = async (req,res) =>{
    try {
        const userToFollow = await User.findById(req.params.id);
        const loggedInUser = await User.findById(req.user._id);

        if(!userToFollow){
            return res.status(404).json({
                success:false,
                message:"User not found"
            })
        }

        if(loggedInUser.following.includes(userToFollow._id)){

            const indexfollowing = loggedInUser.following.indexOf(userToFollow._id);
            loggedInUser.following.splice(indexfollowing,1)

            const indexfollowers = loggedInUser.followers.indexOf(loggedInUser._id);
            userToFollow.followers.splice(indexfollowing,1)

            await loggedInUser.save();
            await userToFollow.save();

            res.status(200).json({
                success:true,
                message:"User Unfollowed"
            })

        }else
        {
            loggedInUser.following.push(userToFollow._id)
            userToFollow.followers.push(loggedInUser._id)
    
            await loggedInUser.save();
            await userToFollow.save();
    
            res.status(200).json({
                success:true,
                message:"User followed"
            })
        }
    } catch (error) {
        res.status(500).json({
            success:false,
            messsage:error.message
        })
    }
}

exports.logout = async (req,res) =>{
    try {
        res.status(200).cookie("token",null,{
            expires:new Date(Date.now()),
            httpOnly:true
        }).json({
            success:true,
            message:"Logged Out"
        })
    } catch (error) {
        res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

exports.updatePassword = async (req,res) =>{
    try {
        
        const user = await User.findById(req.user._id).select("+password  ");

        const {oldPassword, newPassword} = req.body;

        const isMatch = await user.matchPassword(oldPassword);

        if(!oldPassword || !newPassword)
        {
            return res.status(400).json({
                success:false,
                message:"Please provide old or new password"
            })
        }

        if(!isMatch){
            return res.status(400).json({
                success:false,
                message:"Incorrect Old Password"
            })
        }
        
        user.password = newPassword;

        await user.save();

        res.status(200).json({
            success:true,
            message:"Password Update"
        })
    } catch (error) {
        res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

exports.updateProfile = async (req,res) =>{
    try {
        const user = await User.findById(req.user._id);

        const {name , email} = req.body;

        if(name){
            user.name = name;
        }
        if(email){
            user.email = email;
        }

        res.status(200).json({
            success:true,
            message:"Profile Updated"
        })

        await user.save();
    } catch (error) {
        res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

exports.deleteprofile = async (req,res) =>{
    try {
        const user = await User.findById(req.user._id);
        const posts = user.posts;

        await user.deleteOne();
        for(let i = 0; i <posts.length; i++ ){
            const  post = await Post.findById(post[i]);
            await post.deleteOne();
        }

        res.status(200).cookie("token",null,{
            expires:new Date(Date.now()),
            httpOnly:true
        }) 

         
        res.status(200).json({
            success:true,
            message:"Profile Deleted"
        })
    } catch (error) {
        res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

exports.myProfile = async (req,res) =>{
    try {
        
        const user = await User.findById(req.user._id).populate("posts");

        res.status(200).json({
            success:true,
            user
        })

    } catch (error) {
        res.status(500).json({success:false,message:error.message})
    }
}

exports.getUserProfile = async (req,res) =>{
    try {
        
        const user = await User.findById(req.user._id).populate("posts");

        if(!user){
            return res.status(404).json({
                success:false,
                message:"User not found"
            })
        }

        res.status(200).json({
            success:true,
            user
        })
    } catch (error) {
        res.status(500).json({success:false,message:error.message})
    }
}

exports.getAllUser = async (req,res) =>{
    try {
        const users = await  User.find({});

        res.status(200).json({success:true,users})
    } catch (error) {
        res.status(500).json({success:false,message:error.message})
    }
}

exports.forgetPassword = async (req,res) =>{
    try {
        const user = await User.findOne({email:req.body.email});

        if(!user){
            return res.status(404).json({
                success:false,
                message:"User not found"
            })
        }

        const resetPasswordToken = user.getResetPasswordToken();
        await user.save();

        const ressetUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetPasswordToken}`;
        const message = `Reset Your Password by clicking on the link below: \n\n ${ressetUrl}`;

        try {
            await sendEmail({
                email:user.email,
                subject:"Reset Password",
                message,
            })

            res.status(200).json({
                success:true,
                message:`Email sent to ${user.email}`,
            })
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
        }

    } catch (error) {
        res.status(500).json({success:false,message:error.message})
    }
}

exports.resetPassword = async (req,res) =>{
    try {
        const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire:{ $gt:Date.now() },
        })

        if(!user){
            return res.status(401).json({
                success:false,
                message:"Token is invalid or has expired"
            })
        }

        user.password = req.body.password;

        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({
            success:true,
            message:"Password reset successfully"
        })
    } catch (error) {
        res.status(500).json({success:false,message:error.message})
    }
}