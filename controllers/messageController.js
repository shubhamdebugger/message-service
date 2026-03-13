import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import docClient from "../config/dynamodb.js";
import dotenv from "dotenv";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import Message from "../models/Message.js";

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

// for sending messages
export const sendMessage = async (req, res) => {
    try {
        const { community, sub_community, message_type, message_content } = req.body;
        const ra_id = req.user.id;
        const ra_name = req.user.name;

        if (!community || !sub_community || !message_type || !message_content) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (!Array.isArray(sub_community)) {
            return res.status(400).json({ error: "sub_community must be an array" });
        }

        if (message_content.trim().length === 0) {
            return res.status(400).json({ error: "message_content cannot be empty" });
        }

        if (!ALLOWED_COMMUNITIES.includes(community)) {
            return res.status(400).json({ error: "Invalid community" });
        }

        // Trim sub communities
        const trimmedSubs = sub_community.map((sub) => sub.trim());

        // Check for duplicate sub_communities
        const duplicateSubs = trimmedSubs.filter(
            (item, index) => trimmedSubs.indexOf(item) !== index
        );

        if (duplicateSubs.length > 0) {
            return res.status(400).json({
                error: "Duplicate sub_community values are not allowed"
            });
        }

        const allowedSubs = COMMUNITY_MAP[community];

        const invalidSubs = trimmedSubs.filter(
            (sub) => !allowedSubs.includes(sub)
        );

        if (invalidSubs.length > 0) {
            return res.status(400).json({
                error: `Invalid sub_community for ${community}.`
            });
        }

        if (!ALLOWED_TYPES.includes(message_type)) {
            return res.status(400).json({
                error: "message_type is invalid"
            });
        }

        const mongoMessage = await Message.create({
            ra_name,
            ra_id,
            community: community.toLowerCase(),
            sub_community: trimmedSubs,
            message_type: message_type.trim(),
            message_content,
        });

        const message_id = mongoMessage._id.toString();
        const created_at = new Date().toISOString();

        const item = {
            PK: `MESSAGE#${message_id}`,
            message_id,
            ra_name,
            ra_id,
            community: community.toLowerCase(),
            sub_community: trimmedSubs,
            message_type: message_type.trim(),
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
        return res.status(500).json({
            error: "Failed to send message"
        });
    }
};

// Get Messages
export const getMessages = async (req, res) => {
  try {

    const { community, sub_community } = req.body;

    if (!community || !sub_community) {
      return res.status(400).json({
        success: false,
        message: "community and sub_community are required"
      });
    }

    if (!ALLOWED_COMMUNITIES.includes(community)) {
      return res.status(400).json({
        success: false,
        message: `community is invalid`
      });
    }

    const allowedSubs = COMMUNITY_MAP[community];

    if (!allowedSubs.includes(sub_community)) {
      return res.status(400).json({
        success: false,
        message: `Invalid sub_community for the community`
      });
    }

    const params = {
      TableName: TABLE_NAME,
      FilterExpression: "#community = :community AND contains(sub_community, :sub)",
      ExpressionAttributeNames: {
        "#community": "community"
      },
      ExpressionAttributeValues: {
        ":community": community,
        ":sub": sub_community
      }
    };

    const result = await docClient.send(new ScanCommand(params));

    let messages = result.Items || [];

    // Sort messages by newest
    messages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (messages.length === 0) {
      return res.status(404).json({
        success: false,           
        message: "No messages found for this community and sub_community"
      });
    }

    return res.status(200).json({
      success: true,
      data: messages
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }
};