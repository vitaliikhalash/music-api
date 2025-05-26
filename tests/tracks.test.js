import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Track from "../models/track.model.js";
import {
  fetchExistingTracks,
  createNewTrack,
  updateExistingTrack,
  deleteExistingTrack,
} from "../controllers/tracks.controller.js";
import validateToken from "../middleware/validateTokenHandler.js";

dotenv.config({ path: "./config.env" });

describe("Tracks Controller", () => {
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
    app.get("/tracks", fetchExistingTracks);
    app.post("/tracks", createNewTrack);
    app.patch("/tracks/:id", updateExistingTrack);
    app.delete("/tracks/:id", deleteExistingTrack);

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
    await Track.deleteMany({});
    jest.restoreAllMocks();
  });

  describe("POST /tracks", () => {
    it("should create a new track for an authorized user", async () => {
      const trackData = {
        title: "My Track",
        description: "Nice song",
        genre: "Pop"
      };

      const response = await request(app)
        .post("/tracks")
        .set("Authorization", `Bearer ${token}`)
        .send(trackData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("_id");
      expect(response.body.title).toBe(trackData.title);
      expect(response.body.userId).toBe(userId);
    });

    it("should return 500 if creation fails", async () => {
      jest.spyOn(Track, "create").mockImplementationOnce(() => {
        throw new Error("DB error");
      });

      const response = await request(app)
        .post("/tracks")
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Fail" });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Internal server error");
    });
  });

  describe("GET /tracks", () => {
    it("should return 404 if no tracks exist", async () => {
      const response = await request(app)
        .get("/tracks")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("No tracks found");
    });

    it("should return tracks for the authorized user", async () => {
      await Track.create({ title: "Test", userId, genre: "Jazz" });

      const response = await request(app)
        .get("/tracks")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe("Test");
    });

    it("should return 500 if fetch fails", async () => {
      jest.spyOn(Track, "find").mockImplementationOnce(() => {
        throw new Error("Error");
      });

      const response = await request(app)
        .get("/tracks")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Internal server error");
    });

    it("should filter by title", async () => {
      const track = await Track.create({
        title: "Relaxing Jazz",
        description: "Smooth and chill",
        genre: "Jazz",
        tags: ["chill"],
        userId,
      });

      const res = await request(app)
        .get("/tracks?title=Relaxing Jazz")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe(track.title);
    });

    it("should filter by description", async () => {
      const track = await Track.create({
        title: "Morning Rock",
        description: "Energetic vibes",
        genre: "Rock",
        tags: ["morning"],
        userId,
      });

      const res = await request(app)
        .get("/tracks?description=Energetic vibes")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe(track.title);
    });

    it("should filter by genre", async () => {
      const track = await Track.create({
        title: "Chill Beats",
        description: "Relaxing",
        genre: "Electronic",
        tags: ["calm"],
        userId,
      });

      const res = await request(app)
        .get("/tracks?genre=Electronic")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe(track.title);
    });

    it("should filter by single tag", async () => {
      const track = await Track.create({
        title: "Tag Test",
        description: "Tag filtering",
        genre: "Any",
        tags: ["focus"],
        userId,
      });

      const res = await request(app)
        .get("/tracks?tags=focus")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe(track.title);
    });

    it("should filter by multiple tags", async () => {
      const track = await Track.create({
        title: "Multi Tag Track",
        description: "Tagged with chill and evening",
        genre: "Jazz",
        tags: ["chill", "evening"],
        userId,
      });

      const res = await request(app)
        .get("/tracks?tags=chill,evening")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe(track.title);
    });

    it("should filter by createdAt", async () => {
      const track = await Track.create({
        title: "CreatedAt Track",
        description: "Has createdAt",
        genre: "Pop",
        tags: [],
        userId,
        createdAt: new Date("2024-01-01"),
      });

      const res = await request(app)
        .get("/tracks?createdAt=2024-01-01")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe(track.title);
    });

    it("should filter by updatedAt", async () => {
      const track = await Track.create({
        title: "UpdatedAt Track",
        description: "Has updatedAt",
        genre: "Pop",
        tags: [],
        userId,
        updatedAt: new Date("2024-02-02"),
      });

      const res = await request(app)
        .get("/tracks?updatedAt=2024-02-02")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe(track.title);
    });

  });

  describe("PATCH /tracks/:id", () => {
    let trackId;

    beforeEach(async () => {
      const track = await Track.create({
        title: "Old",
        description: "Old desc",
        genre: "Rock",
        userId
      });
      trackId = track._id.toString();
    });

    it("should update track", async () => {
      const response = await request(app)
        .patch(`/tracks/${trackId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "New Title" });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe("New Title");
    });

    it("should return 404 if track not found", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .patch(`/tracks/${fakeId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Doesn't matter" });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Track not found");
    });

    it("should return 403 if user not owner", async () => {
      const otherUser = new mongoose.Types.ObjectId();
      const otherToken = jwt.sign({ user: { id: otherUser } }, accessTokenSecret);

      const response = await request(app)
        .patch(`/tracks/${trackId}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({ title: "Hack" });

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/permission/);
    });

    it("should return 500 on error", async () => {
      jest.spyOn(Track, "findById").mockImplementationOnce(() => {
        throw new Error("DB Error");
      });

      const response = await request(app)
        .patch(`/tracks/${trackId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Whatever" });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Internal server error");
    });
  });

  describe("DELETE /tracks/:id", () => {
    let trackId;

    beforeEach(async () => {
      const track = await Track.create({
        title: "To delete",
        userId,
        genre: "Pop"
      });
      trackId = track._id.toString();
    });

    it("should delete track", async () => {
      const response = await request(app)
        .delete(`/tracks/${trackId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Track deleted successfully");

      const deleted = await Track.findById(trackId);
      expect(deleted).toBeNull();
    });

    it("should return 403 if user not owner", async () => {
      const otherUser = new mongoose.Types.ObjectId();
      const otherToken = jwt.sign({ user: { id: otherUser } }, accessTokenSecret);

      const response = await request(app)
        .delete(`/tracks/${trackId}`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
    });

    it("should return 404 if track not found", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/tracks/${fakeId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it("should return 500 on DB error", async () => {
      jest.spyOn(Track, "findById").mockImplementationOnce(() => {
        throw new Error("DB error");
      });

      const response = await request(app)
        .delete(`/tracks/${trackId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
    });
  });
});
