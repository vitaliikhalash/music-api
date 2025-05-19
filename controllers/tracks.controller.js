const mongoose = require("mongoose");
const Track = require("../models/track.model");

/**
 * @swagger
 * components:
 *   schemas:
 *     Track:
 *       type: object
 *       required:
 *         - title
 *         - author
 *         - duration
 *         - genre
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB ObjectId (24 hex characters)
 *           example: "000000000000000000000001"
 *         title:
 *           type: string
 *         author:
 *           type: string
 *         duration:
 *           type: number
 *         genre:
 *           type: string
 *         likes:
 *           type: number
 * tags:
 *   - name: "track"
 *     description: "Operations about tracks"
 */

/**
 * @swagger
 * /tracks:
 *   get:
 *     summary: Get all tracks
 *     tags: [track]
 *     responses:
 *       200:
 *         description: A list of tracks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Track'
 *       404:
 *         description: No tracks found
 */
const fetchAllTracks = async (req, res) => {
  try {
    const tracks = await Track.find();
    if (tracks.length > 0) return res.status(200).json(tracks);
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
 *     summary: Get a specific track by ID
 *     tags: [track]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the track to retrieve (24-character hex string)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A single track
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Track'
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Track not found
 */
const fetchTrackById = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ message: "Invalid ID" });

  try {
    const track = await Track.findById(id);
    if (track) return res.status(200).json(track);
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
 *     tags: [track]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Track'
 *     responses:
 *       201:
 *         description: Track created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Track'
 *       400:
 *         description: Invalid _id format
 *       500:
 *         description: Internal server error
 */
const createNewTrack = async (req, res) => {
  try {
    if (req.body._id && !mongoose.Types.ObjectId.isValid(req.body._id)) {
      return res.status(400).json({ message: "Invalid _id format" });
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
 *     tags: [track]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the track to update (24-character hex string)
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Track'
 *     responses:
 *       200:
 *         description: Track updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Track'
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Track not found
 */
const updateExistingTrack = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ message: "Invalid ID" });

  try {
    const updatedTrack = await Track.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (updatedTrack) return res.status(200).json(updatedTrack);
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
 *     summary: Delete a track by ID
 *     tags: [track]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the track to delete (24-character hex string)
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
 *                   example: Track deleted successfully
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Track not found
 */
const deleteExistingTrack = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ message: "Invalid ID" });

  try {
    const deleted = await Track.findByIdAndDelete(id);
    if (deleted)
      return res.status(200).json({ message: "Track deleted successfully" });
    return res.status(404).json({ message: "Track not found" });
  } catch (error) {
    console.error("Error deleting track:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  fetchAllTracks,
  fetchTrackById,
  createNewTrack,
  updateExistingTrack,
  deleteExistingTrack,
};
