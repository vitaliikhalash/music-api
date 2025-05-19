import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Playlist from "../models/playlist.model.js";

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

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.get("/", async (req, res) => {
    try {
        const data = await Playlist.find();
        const exportPath = path.join(__dirname, "..", "exports", "data.json");

        fs.writeFileSync(exportPath, JSON.stringify(data, null, 2));

        res.download(exportPath, "data.json", (err) => {
            if (err) {
                console.error("Download error:", err);
                res.status(500).send("Download error");
            }
        });
    } catch (err) {
        console.error("Export error:", err);
        res.status(500).send("Export failed");
    }
});

export default router;
