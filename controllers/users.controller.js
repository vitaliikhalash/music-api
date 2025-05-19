import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/user.model.js";

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         _id:
 *           type: string
 *           format: objectid
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         password:
 *           type: string
 *         phoneNumber:
 *           type: string
 *           example: 1234567890
 *         birthDate:
 *           type: string
 *           format: date
 *         gender:
 *           type: string
 *           enum:
 *             - male
 *             - female
 *             - other
 *             - prefer not to say
 * tags:
 *   - name: user
 *     description: Operations about user
 */

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Register new user into the system
 *     tags:
 *       - user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *                 example: 1234567890
 *               birthDate:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum:
 *                   - male
 *                   - female
 *                   - other
 *                   - prefer not to say
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 email:
 *                   type: string
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email or username already taken
 */
export const registerUser = async (req, res) => {
    const { username, email, password, phoneNumber, birthDate, gender } = req.body;
    try {
        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are mandatory" });
        }
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(409).json({ message: "Username already taken" });
        } else if (existingEmail) {
            return res.status(409).json({ message: "Email already in use" });
        }
        const user = await User.create({
            username,
            email,
            password,
            phoneNumber,
            birthDate,
            gender,
        });
        if (user) {
            return res.status(201).json({ _id: user.id, email: user.email });
        }
    } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Log user into the system
 *     tags:
 *       - user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *       400:
 *         description: All fields are mandatory
 *       401:
 *         description: Invalid credentials
 */
export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ message: "All fields are mandatory" });
        }
        const user = await User.findOne({ email });
        if (user && (await bcrypt.compare(password, user.password))) {
            const accessToken = jwt.sign(
                {
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                    },
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: "10m" }
            );
            return res.status(200).json({ accessToken });
        } else {
            return res.status(401).json({ message: "Invalid credentials" });
        }
    } catch (error) {
        console.error("Error logging user in:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags:
 *       - user
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       404:
 *         description: No users found
 */
export const fetchAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        if (users.length > 0) {
            return res.status(200).json(users);
        }
        return res.status(404).json({ message: 'No users found' });
    } catch (error) {
        console.error('Error getting users:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a specific user by ID
 *     tags:
 *       - user
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the user to retrieve
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A specific user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid ID supplied
 *       404:
 *         description: User not found
 */
export const fetchUserById = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid ID supplied' });
    }
    try {
        const user = await User.findById(id).exec();
        if (user) {
            return res.status(200).json(user);
        }
        return res.status(404).json({ message: 'User not found' });
    } catch (error) {
        console.error('Error getting user by ID:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags:
 *       - user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
export const createNewUser = async (req, res) => {
    const userData = req.body;
    try {
        const user = await User.create(userData);
        return res.status(201).json(user);
    } catch (error) {
        console.error('Error adding user:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Update an existing user
 *     tags:
 *       - user
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID of the user to update
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid ID supplied
 *       404:
 *         description: User not found
 */
export const updateExistingUser = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid ID supplied' });
    }
    try {
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (updatedUser) {
            return res.status(200).json(updatedUser);
        }
        return res.status(404).json({ message: 'User not found' });
    } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Remove a user by ID
 *     tags:
 *       - user
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the user to delete
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User removed successfully
 *       400:
 *         description: Invalid ID supplied
 *       404:
 *         description: User not found
 */
export const deleteExistingUser = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid ID supplied' });
    }
    try {
        const result = await User.findOneAndDelete({ _id: id });
        if (result) {
            return res.status(200).json({ message: 'User removed successfully' });
        }
        return res.status(404).json({ message: 'User not found' });
    } catch (error) {
        console.error('Error removing user:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
