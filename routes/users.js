import express from "express";
import {
    registerUser,
    loginUser,
    fetchCurrentUser,
    updateCurrentUser,
    deleteCurrentUser,
} from "../controllers/users.controller.js";
import validateToken from "../middleware/validateTokenHandler.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", validateToken, fetchCurrentUser);
router.patch("/me", validateToken, updateCurrentUser);
router.delete("/me", validateToken, deleteCurrentUser);

export default router;
