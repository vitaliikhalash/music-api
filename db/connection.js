import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.ATLAS_URI || "";

async function connectToDb() {
    try {
        await mongoose.connect(uri);
        console.log("Successfully connected to MongoDB!");
    } catch (err) {
        console.error("Error connecting to MongoDB:", err);
    }
}

mongoose.connection.on('error', (err) => {
    console.error("MongoDB runtime connection error:", err);
});

export default connectToDb;
