const User = require('../models/User');
const bcrypt = require('bcrypt');  // Fixed spelling
const jwt = require('jsonwebtoken');

const authCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

const RegisterUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Please fill all the fields' 
            });
        }
        
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ 
                success: false,
                message: 'User already exists' 
            });
        }
        
        const hashPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email,
            password: hashPassword
        });
        
        // Generate token for auto-login after signup
        const token = jwt.sign(
            { id: user._id, email: user.email }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );
        
        // Set cookie
        res.cookie('token', token, authCookieOptions);
        
        user.password = undefined;
        
        res.status(201).json({ 
            success: true,
            message: 'User created successfully', 
            user 
        });
    } catch (error) {
        console.log("Error during Registration: ", error);
        res.status(500).json({ 
            success: false,
            message: 'Internal Server error' 
        });
    }
}

const LoginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Please fill all the fields' 
            });
        }
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password' 
            });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password' 
            });
        }
        
        const token = jwt.sign(
            { id: user._id, email: user.email }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );
        
        res.cookie('token', token, authCookieOptions);
        
        user.password = undefined;
        
        res.status(200).json({ 
            success: true,
            message: 'User logged in successfully', 
            user 
        });
    } catch (error) {
        console.log("Error during login: ", error);
        res.status(500).json({ 
            success: false,
            message: 'Internal Server error' 
        });
    }
}

const logOut = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        });
        res.clearCookie('jankoti_auth', {
            path: '/'
        });
        res.status(200).json({ 
            success: true,
            message: 'Logged out successfully' 
        });
    } catch (error) {
        console.log("Error during logout: ", error);
        res.status(500).json({ 
            success: false,
            message: 'Error during logout' 
        });
    }
}

const getMe = async (req, res) => {
    try {
        res.status(200).json({ 
            success: true,
            user: req.user 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error fetching user' 
        });
    }
}

module.exports = { RegisterUser, LoginUser, logOut, getMe };
