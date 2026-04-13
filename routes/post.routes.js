import express from "express"
import isAuth from "../middlewares/isAuth.js"
import upload from "../middlewares/multer.js"
import { comment, createPost, getPost, like, deletePost, deleteComment, toggleComments } from "../controllers/post.Controllers.js"
const postRouter=express.Router()

postRouter.post("/create",isAuth,upload.single("image"),createPost)
postRouter.get("/getpost",isAuth,getPost)
postRouter.get("/like/:id",isAuth,like)
postRouter.post("/comment/:id",isAuth,comment)
postRouter.delete("/comment/:postId/:commentId",isAuth,deleteComment)
postRouter.put("/toggle-comments/:id",isAuth,toggleComments)
postRouter.delete("/delete/:id",isAuth,deletePost)


export default postRouter