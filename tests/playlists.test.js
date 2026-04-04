import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Playlist from "../models/playlist.model.js";
import {
  fetchExistingPlaylists,
  createNewPlaylist,
  updateExistingPlaylist,
  deleteExistingPlaylist,
} from "../controllers/playlists.controller.js";
import validateToken from "../middleware/validateTokenHandler.js";

dotenv.config({ path: "./config.env" });

describe("Playlists Controller", () => {
  let mongoServer;
  let app;
  let userId;
  let token;
  let accessTokenSecret;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    app = express();
    app.use(express.json());
    app.use(validateToken);
    app.get("/playlists", fetchExistingPlaylists);
    app.post("/playlists", createNewPlaylist);
    app.patch("/playlists/:id", updateExistingPlaylist);
    app.delete("/playlists/:id", deleteExistingPlaylist);

    accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || "testsecret";
    if (!accessTokenSecret) {
      throw new Error("ACCESS_TOKEN_SECRET is not defined");
    }
    userId = new mongoose.Types.ObjectId().toString();
    token = jwt.sign({ user: { id: userId } }, accessTokenSecret);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await Playlist.deleteMany({});
    jest.restoreAllMocks();
  });

  describe("POST /playlists", () => {
    it("should create a new playlist for an authorized user", async () => {
      const playlistData = {
        title: "Test Playlist",
        description: "This is a test playlist",
        trackIds: [new mongoose.Types.ObjectId().toString()],
      };

      const response = await request(app)
        .post("/playlists")
        .set("Authorization", `Bearer ${token}`)
        .send(playlistData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("_id");
      expect(response.body.title).toBe(playlistData.title);
      expect(response.body.description).toBe(playlistData.description);
      expect(response.body.userId).toBe(userId);
      expect(response.body.trackIds).toEqual(playlistData.trackIds);

      const playlistInDb = await Playlist.findById(response.body._id);
      expect(playlistInDb).toBeTruthy();
      expect(playlistInDb.title).toBe(playlistData.title);
    });

    it("should return 500 if database error occurs during creation", async () => {
      jest.spyOn(Playlist, "create").mockImplementationOnce(() => {
        throw new Error("Database error");
      });

      const playlistData = {
        title: "Test Playlist",
        description: "This is a test playlist",
      };

      const response = await request(app)
        .post("/playlists")
        .set("Authorization", `Bearer ${token}`)
        .send(playlistData);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Internal server error");
    });

  });

  describe("GET /playlists", () => {
    it("should return 404 if no playlists exist", async () => {
      const response = await request(app)
        .get("/playlists")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("No playlists found");
    });

    it("should return 500 if database error occurs during fetch", async () => {
      jest.spyOn(Playlist, "find").mockImplementationOnce(() => {
        throw new Error("Database error");
      });

      const response = await request(app)
        .get("/playlists")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Internal server error");
    });

    it("should filter playlists by title", async () => {
      await Playlist.create([
        { title: "Rock Playlist", userId, trackIds: [] },
        { title: "Jazz Playlist", userId, trackIds: [] },
      ]);

      const response = await request(app)
        .get("/playlists?title=Rock")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe("Rock Playlist");
    });

    it("should filter playlists by description", async () => {
      await Playlist.create([
        { title: "Playlist 1", description: "Awesome rock music", userId, trackIds: [] },
        { title: "Playlist 2", description: "Smooth jazz", userId, trackIds: [] },
      ]);

      const response = await request(app)
        .get("/playlists?description=rock")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].description).toBe("Awesome rock music");
    });

    it("should filter playlists by tags", async () => {
      await Playlist.create([
        { title: "Playlist 1", tags: ["rock", "pop"], userId, trackIds: [] },
        { title: "Playlist 2", tags: ["jazz", "blues"], userId, trackIds: [] },
      ]);

      const response = await request(app)
        .get("/playlists?tags=rock,pop")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].tags).toEqual(expect.arrayContaining(["rock", "pop"]));
    });

    it("should filter playlists by createdAt", async () => {
      const oldDate = new Date("2023-01-01");
      const recentDate = new Date("2025-01-01");
      await Playlist.create([
        { title: "Old Playlist", userId, trackIds: [], createdAt: oldDate },
        { title: "Recent Playlist", userId, trackIds: [], createdAt: recentDate },
      ]);

      const response = await request(app)
        .get("/playlists?createdAt=2024-01-01")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe("Recent Playlist");
    });

    it("should filter playlists by updatedAt", async () => {
      const oldDate = new Date("2023-01-01T00:00:00Z");
      const recentDate = new Date("2025-01-01T00:00:00Z");
      await Playlist.create([
        { title: "Old Playlist", userId, trackIds: [], updatedAt: oldDate, createdAt: oldDate },
        { title: "Recent Playlist", userId, trackIds: [], updatedAt: recentDate, createdAt: recentDate },
      ]);

      const response = await request(app)
        .get("/playlists?updatedAt=2024-01-01")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe("Recent Playlist");
    });
  });

  describe("PATCH /playlists/:id", () => {
    let playlistId;

    beforeEach(async () => {
      const playlist = await Playlist.create({
        title: "Original Playlist",
        description: "Original description",
        userId,
        trackIds: [],
      });
      playlistId = playlist._id.toString();
    });

    it("should update a playlist for an authorized user", async () => {
      const updateData = {
        title: "Updated Playlist",
        description: "Updated description",
        trackIds: [new mongoose.Types.ObjectId().toString()],
      };

      const response = await request(app)
        .patch(`/playlists/${playlistId}`)
        .set("Authorization", `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe(updateData.title);
      expect(response.body.description).toBe(updateData.description);
      expect(response.body.trackIds).toEqual(updateData.trackIds);

      const playlistInDb = await Playlist.findById(playlistId);
      expect(playlistInDb.title).toBe(updateData.title);
    });

    it("should return 404 if playlist does not exist", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const updateData = { title: "Updated Playlist" };

      const response = await request(app)
        .patch(`/playlists/${nonExistentId}`)
        .set("Authorization", `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Playlist not found");
    });

    it("should return 403 if user is not the owner", async () => {
      const otherUserId = new mongoose.Types.ObjectId().toString();
      const otherUserToken = jwt.sign({ user: { id: otherUserId } }, accessTokenSecret);

      const response = await request(app)
        .patch(`/playlists/${playlistId}`)
        .set("Authorization", `Bearer ${otherUserToken}`)
        .send({ title: "Updated Playlist" });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        "User does not have permission to update another user's playlist"
      );
    });

    it("should return 500 if database error occurs during update", async () => {
      jest.spyOn(Playlist, "findById").mockImplementationOnce(() => {
        throw new Error("Database error");
      });

      const response = await request(app)
        .patch(`/playlists/${playlistId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Updated Playlist" });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Internal server error");
    });
  });

  describe("DELETE /playlists/:id", () => {
    let playlistId;

    beforeEach(async () => {
      const playlist = await Playlist.create({
        title: "Playlist to Delete",
        userId,
        trackIds: [],
      });
      playlistId = playlist._id.toString();
    });

    it("should delete a playlist for an authorized user", async () => {
      const response = await request(app)
        .delete(`/playlists/${playlistId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Playlist deleted successfully");

      const playlistInDb = await Playlist.findById(playlistId);
      expect(playlistInDb).toBeNull();
    });

    it("should return 404 if playlist does not exist", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const response = await request(app)
        .delete(`/playlists/${nonExistentId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Playlist not found");
    });

    it("should return 403 if user is not the owner", async () => {
      const otherUserId = new mongoose.Types.ObjectId().toString();
      const otherUserToken = jwt.sign({ user: { id: otherUserId } }, accessTokenSecret);

      const response = await request(app)
        .delete(`/playlists/${playlistId}`)
        .set("Authorization", `Bearer ${otherUserToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        "User does not have permission to delete another user's playlist"
      );
    });

    it("should return 500 if database error occurs during deletion", async () => {
      jest.spyOn(Playlist, "findById").mockImplementationOnce(() => {
        throw new Error("Database error");
      });

      const response = await request(app)
        .delete(`/playlists/${playlistId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Internal server error");
    });
  });
});
