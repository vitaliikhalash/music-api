import mongoose from "mongoose";
import Track from "../models/track.model.js";

/**
 * @swagger
 * components:
 *   schemas:
 *     Track:
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
 *         genre:
 *           type: string
 * tags:
 *   - name: track
 *     description: Operations about track
 */

/**
 * @swagger
 * /tracks:
 *   get:
 *     summary: Fetch all tracks
 *     tags:
 *       - track
 *     responses:
 *       200:
 *         description: A list of tracks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Track"
 *       404:
 *         description: No tracks found
 */
export const fetchAllTracks = async (req, res) => {
    try {
        const tracks = await Track.find();
        if (tracks.length > 0) {
            return res.status(200).json(tracks);
        }
        return res.status(404).json({ message: "No tracks found" });
    } catch (error) {
        console.error("Error fetching tracks:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * @swagger
 * /tracks/{id}:
 *   get:
 *     summary: Fetch a specific track by ID
 *     tags:
 *       - track
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the track to fetch
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A specific track
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Track"
 *       400:
 *         description: Invalid ID supplied
 *       404:
 *         description: Track not found
 */
export const fetchTrackById = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid ID supplied" });
    }
    try {
        const track = await Track.findById(id);
        if (track) {
            return res.status(200).json(track);
        }
        return res.status(404).json({ message: "Track not found" });
    } catch (error) {
        console.error("Error fetching track:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * @swagger
 * /tracks:
 *   post:
 *     summary: Create a new track
 *     tags:
 *       - track
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
 *               genre:
 *                 type: string
 *               userId:
 *                 type: string
 *                 format: objectid
 *     responses:
 *       201:
 *         description: Track created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Track"
 *       400:
 *         description: Invalid ID supplied
 */
export const createNewTrack = async (req, res) => {
    try {
        if (req.body._id && !mongoose.Types.ObjectId.isValid(req.body._id)) {
            return res.status(400).json({ message: "Invalid ID supplied" });
        }
        const newTrack = await Track.create(req.body);
        return res.status(201).json(newTrack);
    } catch (error) {
        console.error("Error creating track:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * @swagger
 * /tracks/{id}:
 *   patch:
 *     summary: Update an existing track
 *     tags:
 *       - track
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the track to update
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
 *               genre:
 *                 type: string
 *               userId:
 *                 type: string
 *                 format: objectid
 *     responses:
 *       200:
 *         description: Track updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Track"
 *       400:
 *         description: Invalid ID supplied
 *       404:
 *         description: Track not found
 */
export const updateExistingTrack = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid ID supplied" });
    }
    try {
        const updatedTrack = await Track.findByIdAndUpdate(
            id,
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (updatedTrack) {
            return res.status(200).json(updatedTrack)
        };
        return res.status(404).json({ message: "Track not found" });
    } catch (error) {
        console.error("Error updating track:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * @swagger
 * /tracks/{id}:
 *   delete:
 *     summary: Delete a track
 *     tags:
 *       - track
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the track to delete
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Track deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid ID supplied
 *       404:
 *         description: Track not found
 */
export const deleteExistingTrack = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid ID supplied" });
    }
    try {
        const deleted = await Track.findByIdAndDelete(id);
        if (deleted) {
            return res.status(200).json({ message: "Track deleted successfully" });
        }
        return res.status(404).json({ message: "Track not found" });
    } catch (error) {
        console.error("Error deleting track:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
