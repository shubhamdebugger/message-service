import mongoose from "mongoose";

const msgLogsSchema = new mongoose.Schema({
    message_id:   { type: mongoose.Schema.Types.ObjectId, ref: "Message", required: true },
    user_id:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    community: { type: String, required: true },
    sub_community:  {
        type: String,
        trim: true
      },
      message_type: {
      type: String,
      enum: ["trade", "follow-up", "feedback", "promotion", "flaunt"],
      required: true
    },
    seen_at: { type: Date, required: true}
  },{timestamps:true});
  
  // IMPORTANT: prevent duplicate seen logs for same user + message
  msgLogsSchema.index({ message_id: 1, user_id: 1 }, { unique: true });

 export default mongoose.model("MsgLogs", msgLogsSchema);