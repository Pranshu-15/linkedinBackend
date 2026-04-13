import Notification from "../models/notification.model.js"

export const getNotifications=async (req,res)=>{
    try {
        
    let notification=await Notification.find({receiver:req.userId})
    .populate("relatedUser","firstName lastName profileImage")
    .populate("relatedPost","image description")
    return res.status(200).json(notification)
    } catch (error) {
        return res.status(500).json({message:`get notification error ${error}`})
    }
}

export const checkUnread = async (req, res) => {
    try {
        let hasUnread = await Notification.exists({ receiver: req.userId, read: false });
        return res.status(200).json({ unread: !!hasUnread });
    } catch (error) {
        return res.status(500).json({message:`check unread error ${error}`})
    }
}

export const markAsRead = async (req, res) => {
    try {
        await Notification.updateMany({ receiver: req.userId, read: false }, { read: true });
        return res.status(200).json({ message: "Notifications marked as read" });
    } catch (error) {
        return res.status(500).json({message:`mark as read error ${error}`})
    }
}

export const deleteNotification=async (req,res)=>{
    try {
        let {id}=req.params
   await Notification.findOneAndDelete({
    _id:id,
    receiver:req.userId
   })
    return res.status(200).json({message:" notification deleted successfully"})
    } catch (error) {
        return res.status(500).json({message:`delete notification error ${error}`})
    }
}
export const clearAllNotification=async (req,res)=>{
    try {
   await Notification.deleteMany({
    receiver:req.userId
   })
    return res.status(200).json({message:" notification deleted successfully"})
    } catch (error) {
        return res.status(500).json({message:`delete all notification error ${error}`})
    }
}