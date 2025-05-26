import mongoose from "mongoose";
import Playlist from "../models/playlist.model.js";

/**
 * @swagger
 * components:
 *   schemas:
 *     Playlist:
 *       type: object
 *       required:
 *         - userId
 *       properties:
 *         _id:
 *           type: string
 *           format: objectid
 *         userId:
 *           type: string
 *           format: objectid
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         trackIds:
 *           type: array
 *           items:
 *             type: string
 *             format: objectid
 * tags:
 *   - name: playlist
 *     description: Operations about playlist
 */

/**
 * @swagger
 * /playlists:
 *   get:
 *     summary: Fetch the currently authenticated user's playlists
 *     tags:
 *       - playlist
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authenticated user's playlists
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Playlist"
 *       401:
 *         description: User is not authorized or token is missing
 *       404:
 *         description: No playlists found
 */
export const fetchExistingPlaylists = async (req, res) => {
    try {
        const playlists = await Playlist.find({ userId: req.user.id });
        if (playlists.length === 0) {
            return res.status(404).json({ message: "No playlists found" });
        }
        return res.status(200).json(playlists);
    } catch (error) {
        console.error("Error getting playlists:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * @swagger
 * /playlists:
 *   post:
 *     summary: Create the currently authenticated user's playlist
 *     tags:
 *       - playlist
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               trackIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: objectid
 *     responses:
 *       201:
 *         description: Playlist created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Playlist"
 *       400:
 *         description: Validation failed
 *       401:
 *         description: User is not authorized or token is missing
 */
export const createNewPlaylist = async (req, res) => {
    const { title, description, trackIds } = req.body;
    try {
        const playlist = await Playlist.create({
            title,
            description,
            trackIds,
            userId: req.user.id,
        });
        return res.status(201).json(playlist);
    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            return res.status(400).json({ message: Object.values(error.errors)[0].message });
        }
        console.error("Error creating playlist:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * @swagger
 * /playlists/{id}:
 *   patch:
 *     summary: Update the currently authenticated user's playlist
 *     tags:
 *       - playlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID of the playlist to update
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               trackIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: objectid
 *     responses:
 *       200:
 *         description: Playlist updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Playlist"
 *       400:
 *         description: Validation failed
 *       401:
 *         description: User is not authorized or token is missing
 *       403:
 *         description: User does not have permission to update another user's playlist
 *       404:
 *         description: Playlist not found
 */
export const updateExistingPlaylist = async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id);
        if (!playlist) {
            return res.status(404).json({ message: "Playlist not found" });
        }
        if (playlist.userId.toString() !== req.user.id) {
            return res.status(403).json({
                message: "User does not have permission to update another user's playlist",
            });
        }
        const updatedPlaylist = await Playlist.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );
        return res.status(200).json(updatedPlaylist);
    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            return res.status(400).json({ message: Object.values(error.errors)[0].message });
        }
        console.error("Error updating playlist:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * @swagger
 * /playlists/{id}:
 *   delete:
 *     summary: Delete the currently authenticated user's playlist
 *     tags:
 *       - playlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the playlist to delete
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Playlist deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: User is not authorized or token is missing
 *       403:
 *         description: User does not have permission to delete another user's playlist
 *       404:
 *         description: Playlist not found
 */
export const deleteExistingPlaylist = async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id);
        if (!playlist) {
            return res.status(404).json({ message: "Playlist not found" });
        }
        if (playlist.userId.toString() !== req.user.id) {
            return res.status(403).json({
                message: "User does not have permission to delete another user's playlist",
            });
        }
        await Playlist.findByIdAndDelete(req.params.id);
        return res.status(200).json({ message: "Playlist deleted successfully" });
    } catch (error) {
        console.error("Error removing playlist:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
