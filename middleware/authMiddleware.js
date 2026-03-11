import jwt from "jsonwebtoken";

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Token required" });
      }

      const token = authHeader.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // attach user info
      req.user = decoded;

      // role check
      if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ error: "Access denied" });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        error: "Invalid or expired token"
      });
    }
  };
};