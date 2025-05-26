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
 *         tags:
 *           type: array
 *           items:
 *             type: string
 * tags:
 *   - name: track
 *     description: Operations about track
 */

/**
 * @swagger
 * /tracks:
 *   get:
 *     summary: Fetch the currently authenticated user's tracks with optional filters
 *     tags:
 *       - track
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Filter by title
 *       - in: query
 *         name: description
 *         schema:
 *           type: string
 *         description: Filter by description
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Filter by genre
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Filter by tags (comma-separated)
 *       - in: query
 *         name: createdAt
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by creation date
 *       - in: query
 *         name: updatedAt
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by update date
 *     responses:
 *       200:
 *         description: Authenticated user's tracks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Track"
 *       401:
 *         description: User is not authorized or token is missing
 *       404:
 *         description: No tracks found
 */
export const fetchExistingTracks = async (req, res) => {
    try {
        const { title, description, genre, tags, createdAt, updatedAt } = req.query;
        const filter = { userId: req.user.id };

        if (title) filter.title = { $regex: title, $options: "i" };
        if (description) filter.description = { $regex: description, $options: "i" };
        if (genre) filter.genre = { $regex: genre, $options: "i" };
        if (tags) {
            let tagsArray = Array.isArray(tags) ? tags : tags.split(",");
            tagsArray = tagsArray.map(tag => tag.trim()).filter(Boolean);
            if (tagsArray.length > 0) filter.tags = { $all: tagsArray };
        }
        if (createdAt) filter.createdAt = { $gte: new Date(createdAt) };
        if (updatedAt) filter.updatedAt = { $gte: new Date(updatedAt) };

        const tracks = await Track.find(filter);
        if (tracks.length === 0) {
            return res.status(404).json({ message: "No tracks found" });
        }
        return res.status(200).json(tracks);
    } catch (error) {
        console.error("Error fetching tracks:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * @swagger
 * /tracks:
 *   post:
 *     summary: Create the currently authenticated user's track
 *     tags:
 *       - track
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
 *               genre:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Track created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Track"
 *       400:
 *         description: Validation failed
 *       401:
 *         description: User is not authorized or token is missing
 */
export const createNewTrack = async (req, res) => {
    const { title, description, genre, tags } = req.body;
    try {
        const track = await Track.create({
            title,
            description,
            genre,
            tags,
            userId: req.user.id,
        });
        return res.status(201).json(track);
    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            return res.status(400).json({ message: Object.values(error.errors)[0].message });
        }
        console.error("Error creating track:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * @swagger
 * /tracks/{id}:
 *   patch:
 *     summary: Update the currently authenticated user's track
 *     tags:
 *       - track
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *               genre:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Track updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Track"
 *       400:
 *         description: Validation failed
 *       401:
 *         description: User is not authorized or token is missing
 *       403:
 *         description: User does not have permission to update another user's track
 *       404:
 *         description: Track not found
 */
export const updateExistingTrack = async (req, res) => {
    try {
        const track = await Track.findById(req.params.id);
        if (!track) {
            return res.status(404).json({ message: "Track not found" });
        }
        if (track.userId.toString() !== req.user.id) {
            return res.status(403).json({
                message: "User does not have permission to update another user's track",
            });
        }
        const updatedTrack = await Track.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );
        return res.status(200).json(updatedTrack);
    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            return res.status(400).json({ message: Object.values(error.errors)[0].message });
        }
        console.error("Error updating track:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * @swagger
 * /tracks/{id}:
 *   delete:
 *     summary: Delete the currently authenticated user's track
 *     tags:
 *       - track
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: User is not authorized or token is missing
 *       403:
 *         description: User does not have permission to delete another user's track
 *       404:
 *         description: Track not found
 */
export const deleteExistingTrack = async (req, res) => {
    try {
        const track = await Track.findById(req.params.id);
        if (!track) {
            return res.status(404).json({ message: "Track not found" });
        }
        if (track.userId.toString() !== req.user.id) {
            return res.status(403).json({
                message: "User does not have permission to delete another user's track",
            });
        }
        await Track.findByIdAndDelete(req.params.id);
        return res.status(200).json({ message: "Track deleted successfully" });
    } catch (error) {
        console.error("Error deleting track:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
