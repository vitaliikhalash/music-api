import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "../models/user.model.js";
import {
  registerUser,
  loginUser,
  fetchCurrentUser,
  updateCurrentUser,
  deleteCurrentUser,
} from "../controllers/users.controller.js";
import validateToken from "../middleware/validateTokenHandler.js";

dotenv.config({ path: "./config.env" });

describe("Users Controller", () => {
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
    app.post("/users/register", registerUser);
    app.post("/users/login", loginUser);
    app.use(validateToken);
    app.get("/users/me", fetchCurrentUser);
    app.patch("/users/me", updateCurrentUser);
    app.delete("/users/me", deleteCurrentUser);

    accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || "testsecret";
    if (!accessTokenSecret) {
      throw new Error("ACCESS_TOKEN_SECRET is not defined");
    }
    userId = new mongoose.Types.ObjectId().toString();
    token = jwt.sign({ user: { id: userId } }, accessTokenSecret, { expiresIn: "10m" });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await User.deleteMany({});
    jest.restoreAllMocks();
  });

  describe("POST /users/register", () => {
    it("should register a new user with valid data", async () => {
      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "ValidPassword123!",
        phoneNumber: "+1234567890",
        birthDate: "1990-01-01",
        gender: "male",
      };

      const response = await request(app)
        .post("/users/register")
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("_id");
      expect(response.body.email).toBe(userData.email);

      const userInDb = await User.findById(response.body._id);
      expect(userInDb).toBeTruthy();
      expect(userInDb.username).toBe(userData.username);
      expect(await bcrypt.compare(userData.password, userInDb.passwordHash)).toBe(true);
      expect(userInDb.phoneNumber).toBe(userData.phoneNumber);
      expect(userInDb.birthDate.toISOString().split("T")[0]).toBe(userData.birthDate);
      expect(userInDb.gender).toBe(userData.gender);
    });

    it("should return 400 if required fields are missing", async () => {
      const userData = {
        username: "testuser",
        email: "test@example.com",
      };

      const response = await request(app)
        .post("/users/register")
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("All fields are mandatory");
    });

    it("should return 409 if username is already taken", async () => {
      await User.create({
        username: "testuser",
        email: "other@example.com",
        password: "ValidPassword123!",
      });

      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "ValidPassword123!",
      };

      const response = await request(app)
        .post("/users/register")
        .send(userData);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe("Username already taken");
    });

    it("should return 409 if email is already in use", async () => {
      await User.create({
        username: "otheruser",
        email: "test@example.com",
        password: "ValidPassword123!",
      });

      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "ValidPassword123!",
      };

      const response = await request(app)
        .post("/users/register")
        .send(userData);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe("Email already in use");
    });

    it("should return 500 if password hashing fails", async () => {
      jest.spyOn(console, "error").mockImplementation(() => { });
      jest.spyOn(bcrypt, "hash").mockImplementationOnce(() => {
        throw new Error("Hashing error");
      });

      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "ValidPassword123!",
      };

      const response = await request(app)
        .post("/users/register")
        .send(userData);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Internal server error");
    });

    it("should return 400 if password is too short", async () => {
      jest.spyOn(console, "error").mockImplementation(() => { });

      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "short",
      };

      const response = await request(app)
        .post("/users/register")
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Password must be at least 8 characters long");
    });

    it("should return 400 if password is too long", async () => {
      jest.spyOn(console, "error").mockImplementation(() => { });

      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "a".repeat(31),
      };

      const response = await request(app)
        .post("/users/register")
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Password must be at most 30 characters long");
    });

    it("should return 400 if birthDate is in the future", async () => {
      jest.spyOn(console, "error").mockImplementation(() => { });

      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "ValidPassword123!",
        birthDate: "2026-01-01",
      };

      const response = await request(app)
        .post("/users/register")
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid birthdate");
    });

    it("should return 400 if birthDate is too old", async () => {
      jest.spyOn(console, "error").mockImplementation(() => { });

      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "ValidPassword123!",
        birthDate: "1800-01-01",
      };

      const response = await request(app)
        .post("/users/register")
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid birthdate");
    });
  });

  describe("POST /users/login", () => {
    beforeEach(async () => {
      const user = new User({
        username: "testuser",
        email: "test@example.com",
        password: "ValidPassword123!",
      });
      await user.save();
    });

    it("should login a user with valid credentials", async () => {
      const loginData = {
        email: "test@example.com",
        password: "ValidPassword123!",
      };

      const response = await request(app)
        .post("/users/login")
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("accessToken");
      const decoded = jwt.verify(response.body.accessToken, accessTokenSecret);
      expect(decoded.user.email).toBe(loginData.email);
      expect(decoded.user.username).toBe("testuser");
    });

    it("should return 400 if required fields are missing", async () => {
      const loginData = {
        email: "test@example.com",
      };

      const response = await request(app)
        .post("/users/login")
        .send(loginData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("All fields are mandatory");
    });

    it("should return 401 if email is incorrect", async () => {
      const loginData = {
        email: "wrong@example.com",
        password: "ValidPassword123!",
      };

      const response = await request(app)
        .post("/users/login")
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid credentials");
    });

    it("should return 500 if database error occurs during login", async () => {
      jest.spyOn(console, "error").mockImplementation(() => { });

      jest.spyOn(User, "findOne").mockImplementationOnce(() => {
        throw new Error("Database error");
      });

      const loginData = {
        email: "test@example.com",
        password: "ValidPassword123!",
      };

      const response = await request(app)
        .post("/users/login")
        .send(loginData);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Internal server error");
    });
  });

  describe("GET /users/me", () => {
    beforeEach(async () => {
      const user = new User({
        _id: userId,
        username: "testuser",
        email: "test@example.com",
        password: "ValidPassword123!",
        birthDate: "1990-01-01",
      });
      await user.save();
    });

    it("should fetch current user data for an authorized user", async () => {
      const response = await request(app)
        .get("/users/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.username).toBe("testuser");
      expect(response.body.email).toBe("test@example.com");
      expect(response.body.birthDate).toBe("1990-01-01");
      expect(response.body).not.toHaveProperty("passwordHash");
    });

    it("should return 404 if user does not exist", async () => {
      await User.deleteMany({});

      const response = await request(app)
        .get("/users/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("User not found");
    });

    it("should return 500 if database error occurs during fetch", async () => {
      jest.spyOn(console, "error").mockImplementation(() => { });

      jest.spyOn(User, "findById").mockImplementationOnce(() => {
        throw new Error("Database error");
      });

      const response = await request(app)
        .get("/users/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Internal server error");
    });
  });

  describe("PATCH /users/me", () => {
    beforeEach(async () => {
      const user = new User({
        _id: userId,
        username: "testuser",
        email: "test@example.com",
        password: "ValidPassword123!",
      });
      await user.save();
    });

    it("should update username without changing password for an authorized user", async () => {
      const updateData = {
        username: "updateduser",
      };

      const response = await request(app)
        .patch("/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.username).toBe(updateData.username);
      expect(response.body.email).toBe("test@example.com");
      expect(response.body).not.toHaveProperty("passwordHash");

      const userInDb = await User.findById(userId);
      expect(userInDb.username).toBe(updateData.username);
      expect(await bcrypt.compare("ValidPassword123!", userInDb.passwordHash)).toBe(true);
    });

    it("should update password for an authorized user", async () => {
      const updateData = {
        password: "NewPassword123!",
      };

      const response = await request(app)
        .patch("/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).not.toHaveProperty("passwordHash");

      const userInDb = await User.findById(userId);
      expect(await bcrypt.compare(updateData.password, userInDb.passwordHash)).toBe(true);
    });

    it("should return 400 if password is empty", async () => {
      jest.spyOn(console, "error").mockImplementation(() => { });

      const updateData = {
        password: "",
      };

      const response = await request(app)
        .patch("/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Password is required");
    });

    it("should retrieve password via getter after setting", async () => {
      const user = await User.findById(userId);
      user.password = "TestPassword123!";
      expect(user.password).toBe("TestPassword123!");
    });

    it("should return 404 if user does not exist", async () => {
      await User.deleteMany({});

      const response = await request(app)
        .patch("/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ username: "updateduser" });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("User not found");
    });

    it("should return 500 if database error occurs during update", async () => {
      jest.spyOn(console, "error").mockImplementation(() => { });

      jest.spyOn(User, "findById").mockImplementationOnce(() => {
        throw new Error("Database error");
      });

      const updateData = {
        username: "updateduser",
      };

      const response = await request(app)
        .patch("/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Internal server error");
    });
  });

  describe("DELETE /users/me", () => {
    beforeEach(async () => {
      const user = new User({
        _id: userId,
        username: "testuser",
        email: "test@example.com",
        password: "ValidPassword123!",
      });
      await user.save();
    });

    it("should delete current user for an authorized user", async () => {
      const response = await request(app)
        .delete("/users/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("User removed successfully");

      const userInDb = await User.findById(userId);
      expect(userInDb).toBeNull();
    });

    it("should return 404 if user does not exist", async () => {
      await User.deleteMany({});

      const response = await request(app)
        .delete("/users/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("User not found");
    });

    it("should return 500 if database error occurs during deletion", async () => {
      jest.spyOn(console, "error").mockImplementation(() => { });

      jest.spyOn(User, "findByIdAndDelete").mockImplementationOnce(() => {
        throw new Error("Database error");
      });

      const response = await request(app)
        .delete("/users/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Internal server error");
    });
  });
});
