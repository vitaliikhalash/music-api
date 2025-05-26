import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import validateToken from "../middleware/validateTokenHandler.js";

dotenv.config({ path: "./config.env" });

describe("validateToken Middleware", () => {
    let mongoServer;
    let app;
    let accessTokenSecret;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);

        app = express();
        app.use(express.json());
        app.get("/test", validateToken, (req, res) => {
            res.status(200).json({ message: "Authorized", user: req.user });
        });

        accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || "testsecret";
        if (!accessTokenSecret) {
            throw new Error("ACCESS_TOKEN_SECRET is not defined");
        }
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should call next() and set req.user for a valid token", async () => {
        const userId = new mongoose.Types.ObjectId().toString();
        const token = jwt.sign({ user: { id: userId } }, accessTokenSecret);

        const response = await request(app)
            .get("/test")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Authorized");
        expect(response.body.user).toEqual({ id: userId });
    });

    it("should return 401 if Authorization header is missing", async () => {
        const response = await request(app).get("/test");

        expect(response.status).toBe(401);
        expect(response.body.message).toBe("User is not authorized or token is missing");
    });

    it("should return 401 if token is invalid", async () => {
        const invalidToken = "invalid.token.string";

        const response = await request(app)
            .get("/test")
            .set("Authorization", `Bearer ${invalidToken}`);

        expect(response.status).toBe(401);
        expect(response.body.message).toBe("User is not authorized");
    });
});
