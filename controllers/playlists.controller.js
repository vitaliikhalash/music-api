import mongoose from "mongoose";
import Playlist from "../models/playlist.model.js";

/**
 * @swagger
 * components:
 *   schemas:
 *     Playlist:
 *       type: object
 *       required:
 *         - title
 *         - trackIds
 *         - userId
 *       properties:
 *         _id:
 *           type: string
 *           format: objectid
 *         title:
 *           type: string
 *         trackIds:
 *           type: array
 *           items:
 *             type: string
 *             format: objectid
 *         userId:
 *           type: string
 *           format: objectid
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * tags:
 *   - name: "playlist"
 *     description: "Operations about playlist"
 */

/**
 * @swagger
 * /playlists:
 *   get:
 *     summary: Get all playlists
 *     tags:
 *       - playlist
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: A list of playlists
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Playlist'
 *       404:
 *         description: No playlists found
 */
export const fetchAllPlaylists = async (req, res) => {
    try {
        const playlists = await Playlist.find();
        if (playlists.length > 0) {
            return res.status(200).json(playlists);
        }
        return res.status(404).json({ message: 'No playlists found' });
    } catch (error) {
        console.error('Error getting playlists:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * @swagger
 * /playlists/{id}:
 *   get:
 *     summary: Get a specific playlist by ID
 *     tags:
 *       - playlist
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the playlist to retrieve
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A specific playlist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Playlist'
 *       400:
 *         description: Invalid ID supplied
 *       404:
 *         description: Playlist not found
 */
export const fetchPlaylistById = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid ID supplied' });
    }
    try {
        const playlist = await Playlist.findById(id).exec();
        if (playlist) {
            return res.status(200).json(playlist);
        }
        return res.status(404).json({ message: 'Playlist not found' });
    } catch (error) {
        console.error('Error fetching playlist by ID:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * @swagger
 * /playlists:
 *   post:
 *     summary: Create a new playlist
 *     tags:
 *       - playlist
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Playlist'
 *     responses:
 *       201:
 *         description: Playlist created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Playlist'
 */
export const createNewPlaylist = async (req, res) => {
    const playlistData = req.body;
    try {
        const playlist = await Playlist.create(playlistData);
        return res.status(201).json(playlist);
    } catch (error) {
        console.error('Error adding playlist:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * @swagger
 * /playlists/{id}:
 *   patch:
 *     summary: Update an existing playlist
 *     tags:
 *       - playlist
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
 *             $ref: '#/components/schemas/Playlist'
 *     responses:
 *       200:
 *         description: Playlist updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Playlist'
 *       400:
 *         description: Invalid ID supplied
 *       404:
 *         description: Playlist not found
 */
export const updateExistingPlaylist = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid ID supplied' });
    }
    try {
        const updatedPlaylist = await Playlist.findByIdAndUpdate(
            id,
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (updatedPlaylist) {
            return res.status(200).json(updatedPlaylist);
        }
        return res.status(404).json({ message: 'Playlist not found' });
    } catch (error) {
        console.error('Error updating playlist:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * @swagger
 * /playlists/{id}:
 *   delete:
 *     summary: Remove a playlist by ID
 *     tags:
 *       - playlist
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the playlist to delete
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Playlist removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Playlist removed successfully
 *       400:
 *         description: Invalid ID supplied
 *       404:
 *         description: Playlist not found
 */
export const deleteExistingPlaylist = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid ID supplied' });
    }
    try {
        const result = await Playlist.findByIdAndDelete(id);
        if (result) {
            return res.status(200).json({ message: 'Playlist removed successfully' });
        }
        return res.status(404).json({ message: 'Playlist not found' });
    } catch (error) {
        console.error('Error removing playlist:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
