const jwt = require("jsonwebtoken");

const StatusCode = require("../utils/StatusCode");

const authCheck = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer")) {
      return res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: "Authorization token required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    req.user = decoded;

    console.log("Logged in user:", req.user);

    next();
  } catch (error) {
    return res.status(StatusCode.UNAUTHORIZED).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = authCheck;
