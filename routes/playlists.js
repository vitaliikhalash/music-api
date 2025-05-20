import express from "express";
import {
    fetchExistingPlaylists,
    createNewPlaylist,
    updateExistingPlaylist,
    deleteExistingPlaylist,
} from "../controllers/playlists.controller.js";
import validateToken from "../middleware/validateTokenHandler.js";

const router = express.Router();

router.use(validateToken);
router.get("/", fetchExistingPlaylists);
router.post("/", createNewPlaylist);
router.patch("/:id", updateExistingPlaylist);
router.delete("/:id", deleteExistingPlaylist);

export default router;
