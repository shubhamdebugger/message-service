import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import docClient from "../config/dynamodb.js";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();
const TABLE_NAME = process.env.DYNAMODB_TABLE;

const ALLOWED_COMMUNITIES = ["Nifty", "Swing", "Equity", "Commodity"];
const ALLOWED_TYPES = ["trade", "promotion", "feedback", "follow-up", "flaunt"];
const COMMUNITY_MAP = {
    Nifty: ["NF1", "NF2", "NF3", "NP1"],
    Equity: ["EF1", "EF2", "EF3", "EP1"],
    Commodity: ["CF1", "CF2", "CF3", "CP1"],
    Swing: ["STF1", "STF2", "STF3", "STP1"]
};

export const sendMessage = async (req, res) => {
    try {
        const { ra_name, ra_id, message_id, community, sub_community, message_type, message_content } = req.body;

        if (!ra_name || !ra_id || !community || !sub_community || !message_type || !message_content || !message_id) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        
        if (!mongoose.Types.ObjectId.isValid(message_id)) {
            return res.status(400).json({ error: "message_id must be a valid ObjectId" });
        }

        if (!mongoose.Types.ObjectId.isValid(ra_id)) {
            return res.status(400).json({ error: "ra_id must be a valid ObjectId" });
        }

        if (!Array.isArray(sub_community)) {
            return res.status(400).json({ error: "sub_community must be an array" });
        }

        if (message_content.trim().length === 0) {
            return res.status(400).json({ error: "message_content cannot be empty" });
        }

        if (!ALLOWED_COMMUNITIES.includes(community)) {
            return res.status(400).json({ error: `community must be one of: ${ALLOWED_COMMUNITIES.join(", ")}` });
        }

        const allowedSubs = COMMUNITY_MAP[community];

        const invalidSubs = sub_community.filter(
            (sub) => !allowedSubs.includes(sub)
        );

        if (invalidSubs.length > 0) {
            return res.status(400).json({
                error: `Invalid sub_community for ${community}. Allowed: ${allowedSubs.join(", ")}`
            });
        }

        if (!ALLOWED_TYPES.includes(message_type)) {
            return res.status(400).json({ error: `message_type must be one of: ${ALLOWED_TYPES.join(", ")}` });
        }

        const id = uuidv4();
        const created_at = new Date().toISOString();

        const PK = message_id;

        const item = {
            PK,
            id,
            message_id,
            ra_name,
            ra_id,
            community,
            sub_community,
            message_type,
            message_content,
            created_at,
        };
        console.log("Item to be inserted:", item);
        await docClient.send(
            new PutCommand({
                TableName: TABLE_NAME,
                Item: item,
            })
        );

        return res.status(201).json({
            message: "Message sent successfully",
            data: item,
        });
    } catch (error) {
        console.error("Error sending message:", error);
        return res.status(500).json({ error: "Failed to send message" });
    }
};
