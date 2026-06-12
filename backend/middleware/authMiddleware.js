const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    // Skip auth for public routes
    const publicPaths = ['/ats/evaluate-resume', '/health', '/auth/logout'];
    if (publicPaths.some(path => req.path.startsWith(path))) {
        return next();
    }

    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ 
            success: false,
            message: "Unauthorized - No token provided" 
        });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Fetch full user data from database
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: "Unauthorized - User not found" 
            });
        }
        
        req.user = user;
        next();
    } catch (error) {
        console.log('Auth middleware error:', error);
        return res.status(401).json({ 
            success: false,
            message: 'Unauthorized - Invalid token' 
        });
    }
}

module.exports = authMiddleware;