const StatusCode = require("../utils/StatusCode");

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(StatusCode.FORBIDDEN).json({
        success: false,
        message: `Role (${req.user.role}) is not allowed`,
      });
    }
    next();
  };
};

module.exports = authorizeRoles;
