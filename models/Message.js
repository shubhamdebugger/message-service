import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    ra_name: {
      type: String,
      trim: true
    },

    ra_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RA",
      required: true
    },

    community: {
      type: String,
      required: true,
      enum: ["nifty", "equity", "swing", "commodity"]
    },
    sub_community: [
      {
        type: String,
        trim: true
      }
    ],

    message_type: {
      type: String,
      enum: ["trade", "follow-up", "feedback", "promotion", "flaunt"],
      required: true
    },
   
    message_content: {
      type: String,
      required: true,
      trim: true
    },
     total_seen:  { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);