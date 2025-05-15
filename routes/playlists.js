import express from "express";
import {
    fetchAllPlaylists,
    fetchPlaylistById,
    createNewPlaylist,
    updateExistingPlaylist,
    deleteExistingPlaylist,
} from "../controllers/playlists.controller.js";

const router = express.Router();

router.get("/", fetchAllPlaylists);
router.get("/:id", fetchPlaylistById);
router.post("/", createNewPlaylist);
router.patch("/:id", updateExistingPlaylist);
router.delete("/:id", deleteExistingPlaylist);

export default router;
