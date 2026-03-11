import bcrypt, { hash } from "bcryptjs";
import jwt from "jsonwebtoken";
import RA from "../models/RA.js";
import User from "../models/User.js";
import dotenv from 'dotenv';

dotenv.config();
const generateToken = (id, role, name) => {
  return jwt.sign(
    { id, role, name },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// SIGNUP
export const signup = async (req, res, role) => {
  try {

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields required" });
    }
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Password validation
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({ error: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let account;

    if (role === "ra") {

      const existing = await RA.findOne({ email });

      if (existing) {
        return res.status(400).json({ error: "RA already exists" });
      }

      account = await RA.create({
        name,
        email,
        password: hashedPassword
      });

    } else {

      const existing = await User.findOne({ email });

      if (existing) {
        return res.status(400).json({ error: "User already exists" });
      }

      account = await User.create({
        name,
        email,
        password: hashedPassword
      });

    }

    const token = generateToken(account._id, role, account.name);

    res.status(201).json({
      message: "Signup successful",
      token,
      role
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Signup failed" });
  }
};

// LOGIN
export const login = async (req, res, role) => {

  try {

    const { email, password } = req.body;

    let account;

    if (role === "ra") {
      account = await RA.findOne({ email });
    } else {
      account = await User.findOne({ email });
    }

    if (!account) {
      return res.status(401).json({ error: "Invalid email" });
    }

    const match = await bcrypt.compare(password, account.password);

    if (!match) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = generateToken(account._id, role, account.name);

    res.json({
      message: "Login successful",
      token,
      role
    });

  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
};