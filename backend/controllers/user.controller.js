import userModel from '../models/user.model.js';
import { validationResult } from 'express-validator';
import * as userService from '../services/user.services.js';
import redisClient from '../services/redis.service.js';


export const createUserController = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await userService.createUser(req.body);

        const token = user.generateJWT();

        delete user._doc.password;

        res.status(201).json({ user, token });
    }

    catch (error) {
        res.status(400).send(error.message);
    }

}


export const loginUserController = async (req, res) => {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() }); // Send validation errors to the client
    }

    try {
        const { email, password } = req.body;
        
        const user = await userModel.findOne({ email }).select('+password');

        // If user doesn't exist, send 401 Unauthorized
        if (!user) {
            return res.status(401).json({
                errors: 'Invalid credentials', // Wrong username or password
            });
        }

        // Check if password is correct
        const isMatch = await user.isValidPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                errors: 'Invalid credentials', // Wrong password
            });
        }

        // Generate JWT token for user
        const token = user.generateJWT();

        // Delete password from response before sending it back
        delete user._doc.password;

        // Send successful response with user data and token
        return res.status(200).json({ user, token });

    } catch (error) {
        // If any unexpected error occurs, log it and send a 500 Internal Server Error response
        console.error(error); // Log the error for debugging purposes
        return res.status(500).json({
            errors: 'An error occurred, please try again later', // Generic error message
        });
    }
};


export const profileController = async (req, res) => {
    console.log(req.user);

    res.status(200).json({
        user: req.user
    });
}


export const logoutController = async (req, res) => {
    try { 
        const token = req.cookies.token || req.headers.authorization.split(' ')[1];

        redisClient.set(token, 'logout', 'EX', 60 * 60 * 24);

        res.status(200).send('Logged out successfully');
    } 
    
    catch (err) {
        console.log(err);
        res.status(400).send(err.message);
    }
}

export const getAllUsersController = async (req, res) => {
    try {

        const loggedInUser = await userModel.findOne({ 
            email: req.user.email
         });

        const allUsers = await userService.getAllUsers({ userId : loggedInUser._id });

        return res.status(200).json({
            users: allUsers
        });
    } catch (err) {
        console.log(err);

        res.status(400).json({ error: err.message });
    }
}