import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
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
 * /users/me:
 *   get:
 *     summary: Fetch the currently authenticated user's data
 *     tags:
 *       - user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authenticated user's data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/User"
 *       401:
 *         description: User is not authorized or token is missing
 *       404:
 *         description: User not found
 */
export const fetchCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json(user);
    } catch (error) {
        console.error("Error getting current user:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * @swagger
 * /users/me:
 *   patch:
 *     summary: Update the currently authenticated user's data
 *     tags:
 *       - user
 *     security:
 *       - bearerAuth: []
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
 *       200:
 *         description: User's data updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/User"
 *       401:
 *         description: User is not authorized or token is missing
 *       404:
 *         description: User not found
 */
export const updateCurrentUser = async (req, res) => {
    try {
        const updatedData = { ...req.body };
        if (updatedData.password) {
            updatedData.password = await bcrypt.hash(updatedData.password, 12);
        }
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updatedData },
            { new: true, runValidators: true }
        );
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * @swagger
 * /users/me:
 *   delete:
 *     summary: Delete the currently authenticated user's account
 *     tags:
 *       - user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: User is not authorized or token is missing
 *       404:
 *         description: User not found
 */
export const deleteCurrentUser = async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.user.id);
        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({ message: "User removed successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
