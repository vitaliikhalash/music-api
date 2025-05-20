import express from "express";
import Playlist from "../models/playlist.model.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: "export"
 *     description: "Operation to export data"
 */

/**
 * @swagger
 * /exports:
 *   get:
 *     summary: Export all data to a JSON file
 *     tags:
 *       - export
 *     responses:
 *       200:
 *         description: Successful download of the JSON file
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 */

router.get("/", async (req, res) => {
    try {
        const playlists = await Playlist.find({ userId: req.user.id });
        const jsonData = JSON.stringify(playlists, null, 2);
        res.setHeader("Content-Disposition", `attachment; filename=data_${req.user.id}.json`);
        res.setHeader("Content-Type", "application/octet-stream");
        res.send(jsonData);
    } catch (err) {
        console.error("Export error:", err);
        res.status(500).send("Export failed");
    }
});

export default router;
