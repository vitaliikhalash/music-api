import express from "express";
import {
    fetchExistingTracks,
    createNewTrack,
    updateExistingTrack,
    deleteExistingTrack,
} from "../controllers/tracks.controller.js";
import validateToken from "../middleware/validateTokenHandler.js";

const router = express.Router();

router.use(validateToken);
router.get("/:id", fetchExistingTracks);
router.post("/", createNewTrack);
router.patch("/:id", updateExistingTrack);
router.delete("/:id", deleteExistingTrack);

export default router;
