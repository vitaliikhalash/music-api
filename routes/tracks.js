import express from "express";
import {
    fetchAllTracks,
    fetchTrackById,
    createNewTrack,
    updateExistingTrack,
    deleteExistingTrack
} from "../controllers/tracks.controller.js";

const router = express.Router();

router.get("/", fetchAllTracks);
router.get("/:id", fetchTrackById);
router.post("/", createNewTrack);
router.patch("/:id", updateExistingTrack);
router.delete("/:id", deleteExistingTrack);

export default router;
