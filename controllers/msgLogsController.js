import MessageSeenLog from "../models/MsgLogs.js"
import Message from "../models/Message.js";
import mongoose from "mongoose";
import User from "../models/User.js";

export const markAsSeen = async (req, res) => {
    const { message_id, community, sub_community, seen_at } = req.body;
    const user_id = req.user.id;
    try {

        if (!message_id || !community || !sub_community || message_type || !seen_at) {
            return res.status(400).json({ message: "message_id, community, sub_community, message_type and seen_at are required" });
        }
        if (!mongoose.Types.ObjectId.isValid(message_id)) {
            return res.status(400).json({ message: "Invalid message id" });
        }
        const message = await Message.findById(message_id);

        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }
        if (message.community !== community.toLowerCase().trim()) {
            return res.status(400).json({
                message: "Community does not match the message"
            });
        }

        // Check sub_community exists in message document
        if (!message.sub_community.includes(sub_community.trim())) {
            return res.status(400).json({
                message: "Sub community does not belong to this message"
            });
        }

        if(message.message_type!=="trade"){
            return res.status(400).json({message: "Invalid message type. Only 'trade' messages are allowed."});
        }

        // insertOne will fail silently if duplicate (because of unique index)
        const log = await MessageSeenLog.create({
            message_id,
            user_id,
            community: community.trim(),
            sub_community: sub_community.trim(),
            message_type: message.message_type,
            seen_at
        })

        // increment cached count on message
        await Message.findByIdAndUpdate(message_id, { $inc: { total_seen: 1 } });

        res.status(201).json({ message: "Marked as seen", log });
    } catch (err) {
        if (err.code === 11000) {
            // duplicate — user already saw  it, silently ignore
            return res.status(200).json({ message: "Already seen" });
        }
        res.status(500).json({ message: "Server error" });
    }
}

export const getMessageStats = async (req, res) => {

    try {
        const { messageId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return res.status(400).json({
                message: "Invalid message id"
            });
        }

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({
                message: "Message not found"
            });
        }
        const logs = await MessageSeenLog.find({ message_id: messageId })
            .populate("user_id", "name email")
            .populate("message_id", "message_content message_type community sub_community createdAt")
            .sort({ seen_at: 1 });
        if (!logs.length) {
            return res.status(404).json({
                message: "No data found for this message",
                message_info: null,
                total_seen: 0,
                seen_by: []
            });
        }
        const messageDetails = logs[0].message_id;
        res.json({
            total_seen: logs.length,
            message_info: {
                message_id: messageDetails._id,
                message_content: messageDetails.message_content,
                message_type: messageDetails.message_type,
                community: messageDetails.community,
                sub_community: messageDetails.sub_community,
                message_created_at: messageDetails.createdAt
            }, 
            seen_by: logs.map((log) => ({
                user_id: log.user_id._id,
                name: log.user_id.name,
                email: log.user_id.email,
                community: log.community,
                sub_community: log.sub_community,
                seen_at: log.seen_at,
                created_at: log.createdAt
            }))
        });

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const getUserStats = async (req, res) => {
    try {
        const { userId } = req.params;

           if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: "Invalid message id"
            });
        }

    const user = await User.findById(userId);
    if(!user){
        return res.status(401).json({data:null , success: false , message:"user does not exists"})
    }

        const logs = await MessageSeenLog.find({ user_id: userId, message_type: "trade" })
            .populate("user_id", "name email community sub_community")
            .populate("message_id", "message_content message_type community sub_community createdAt")
            .sort({ seen_at: -1 });

        if (!logs.length) {
            return res.status(404).json({
                message: "No messages seen by this user",
                user_info: null,
                total_messages_seen: 0,
                messages: []
            });
        }

        const userDetails = logs[0].user_id;

        res.json({
            total_messages_seen: logs.length,
            user_info: {             
                user_id: userDetails._id,
                name: userDetails.name,
                email: userDetails.email,
                community: userDetails.community,
                sub_community: userDetails.sub_community
            },
            messages: logs.map((log) => ({
                message_id: log.message_id._id,
                message_content: log.message_id.message_content,
                message_type: log.message_id.message_type,
                community: log.message_id.community,
                sub_community: log.message_id.sub_community,
                message_created_at: log.message_id.createdAt,
                seen_at: log.seen_at,
                created_at: log.createdAt
            }))
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};