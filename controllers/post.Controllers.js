import Post from "../models/post.model.js"
import uploadOnCloudinary from "../config/cloudinary.js"
import { io, userSocketMap } from "../index.js";
import Notification from "../models/notification.model.js";
export const createPost=async (req,res)=>{
    try {
        let {description}=req.body
        let newPost;
    if(req.file){
        let image=await uploadOnCloudinary(req.file.path)
         newPost=await Post.create({
            author:req.userId,
            description,
            image
        })
    }else{
        newPost=await Post.create({
            author:req.userId,
            description
        })
    }

    const populatedPost = await Post.findById(newPost._id)
        .populate("author", "firstName lastName profileImage headline userName")
        .populate("comment.user", "firstName lastName profileImage headline");

    io.emit("postCreated", populatedPost);

    return res.status(201).json(populatedPost);

    } catch (error) {
        return res.status(201).json(`create post error ${error}`)
    }
}


export const getPost=async (req,res)=>{
    try {
        const post=await Post.find()
        .populate("author","firstName lastName profileImage headline userName")
        .populate("comment.user","firstName lastName profileImage headline")
        .sort({createdAt:-1})
        return res.status(200).json(post)
    } catch (error) {
        return res.status(500).json({message:"getPost error"})
    }
}

export const like =async (req,res)=>{
    try {
        let postId=req.params.id
        let userId=req.userId
        let post=await Post.findById(postId)
        if(!post){
            return res.status(400).json({message:"post not found"})
        }
        if(post.like.includes(userId)){
          post.like=post.like.filter((id)=>id!=userId)
        }else{
            post.like.push(userId)
            if(post.author!=userId){
                let notification=await Notification.create({
                    receiver:post.author,
                    type:"like",
                    relatedUser:userId,
                    relatedPost:postId
                })
                const populatedNotif = await Notification.findById(notification._id)
                    .populate("relatedUser","firstName lastName profileImage")
                    .populate("relatedPost","image description")
                let receiverSocketId=userSocketMap.get(post.author.toString());
                if(receiverSocketId){
                    io.to(receiverSocketId).emit("newNotification", populatedNotif);
                }
            }
           
        }
        await post.save()
      io.emit("likeUpdated",{postId,likes:post.like})
       

     return  res.status(200).json(post)

    } catch (error) {
      return res.status(500).json({message:`like error ${error}`})  
    }
}

export const deleteComment = async (req, res) => {
    try {
        let { postId, commentId } = req.params;
        let userId = req.userId;

        let post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Only author of post can delete the comment
        if (post.author.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Only the author of the post can delete comments" });
        }

        post = await Post.findByIdAndUpdate(
            postId,
            { $pull: { comment: { _id: commentId } } },
            { new: true }
        ).populate("comment.user","firstName lastName profileImage headline");

        // Broadcast comment deletion
        io.emit("commentDeleted", { postId, comm: post.comment });
        return res.status(200).json(post);
    } catch (error) {
        return res.status(500).json({ message: `Delete comment error ${error}` });
    }
};

export const toggleComments = async (req, res) => {
    try {
        let postId = req.params.id;
        let userId = req.userId;

        let post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Only author of post can toggle comments
        if (post.author.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Only the author can toggle comments" });
        }

        post.commentsDisabled = !post.commentsDisabled;
        await post.save();

        // Broadcast comment toggle
        io.emit("commentsToggled", { postId, commentsDisabled: post.commentsDisabled });
        return res.status(200).json({ commentsDisabled: post.commentsDisabled });
    } catch (error) {
        return res.status(500).json({ message: `Toggle comments error ${error}` });
    }
};

export const comment=async (req,res)=>{
    try {
        let postId=req.params.id
        let userId=req.userId
        let {content}=req.body

        let postObj=await Post.findById(postId);
        if(postObj && postObj.commentsDisabled) {
            return res.status(403).json({message:"Comments are disabled for this post"});
        }

        let post=await Post.findByIdAndUpdate(postId,{
            $push:{comment:{content,user:userId}}
        },{new:true})
        .populate("comment.user","firstName lastName profileImage headline")
        if(post.author!=userId){
        let notification=await Notification.create({
            receiver:post.author,
            type:"comment",
            relatedUser:userId,
            relatedPost:postId,
            commentText: content
        })
        const populatedNotif = await Notification.findById(notification._id)
            .populate("relatedUser","firstName lastName profileImage")
            .populate("relatedPost","image description")
        let receiverSocketId=userSocketMap.get(post.author.toString());
        if(receiverSocketId){
            io.to(receiverSocketId).emit("newNotification", populatedNotif);
        }
    }
        io.emit("commentAdded",{postId,comm:post.comment})
        return res.status(200).json(post)

    } catch (error) {
        return res.status(500).json({message:`comment error ${error}`})  
    }
}

export const deletePost = async (req, res) => {
    try {
        let postId = req.params.id;
        let userId = req.userId;

        let post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        if (post.author != userId) {
            return res.status(403).json({ message: "Unauthorized to delete this post" });
        }

        await Post.findByIdAndDelete(postId);
        io.emit("postDeleted", { postId });

        return res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: `Delete post error ${error}` });
    }
}