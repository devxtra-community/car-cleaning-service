"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allowRoles = void 0;
const allowRoles = (...roles) => (req, res, next) => {
    const userRole = req.user?.role;
    if (!userRole) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: no role found',
        });
    }
    if (!roles.includes(userRole)) {
        return res.status(403).json({
            success: false,
            message: `Forbidden: role '${userRole}' is not allowed`,
        });
    }
    next();
};
exports.allowRoles = allowRoles;
