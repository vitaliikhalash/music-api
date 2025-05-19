import express from "express";
import {
    fetchExistingTracks,
    createNewTrack,
    updateExistingTrack,
    deleteExistingTrack,
} from "../controllers/tracks.controller.js";

const router = express.Router();

router.get("/:id", fetchExistingTracks);
router.post("/", createNewTrack);
router.patch("/:id", updateExistingTrack);
router.delete("/:id", deleteExistingTrack);

export default router;
