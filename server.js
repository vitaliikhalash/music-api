import express from "express";
import cors from "cors";
import exports from "./routes/exports.js";
import tracks from "./routes/tracks.js";
import playlists from "./routes/playlists.js";
import users from "./routes/users.js";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import connectToDB from "./db/connection.js";

const PORT = process.env.PORT || 3000;
const app = express();

connectToDB();

app.use(cors());
app.use(express.json());

// Swagger definition
const swaggerOptions = {
    definition: {
        openapi: "3.1.0",
        info: {
            title: "music-api",
            version: "1.0.0",
        },
    },
    apis: ["./controllers/*.js", "./routes/exports.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/exports", exports);
app.use("/tracks", tracks);
app.use("/playlists", playlists);
app.use("/users", users);

// Start the Express server
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
