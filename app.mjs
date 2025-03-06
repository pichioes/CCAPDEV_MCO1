import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url';
import fs from 'fs';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express()

// Connect to MongoDB
dotenv.config();

app.use(express.json());

app.use(express.static(__dirname));
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB connection error:", err));

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    description: String
});

const User = mongoose.model("users", userSchema);

app.get('/', (req, res) =>{
    res.sendFile(path.join(__dirname, 'login.html'));
});



app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find user in database
        const user = await User.findOne({ username });
        if (!user) {
            console.log("username does not exists");
            return res.status(401).json({ message: "Invalid username or password." });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log("password incorrect");
            return res.status(401).json({ message: "Invalid username or password." });
        }

        res.json({ message: "Login successful!" });
    } catch (err) {
        res.status(500).json({ message: "Server error." });
    }
});

// Handle signup requests
app.post('/signup', async (req, res) => {
    const { username, password, description } = req.body;

    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "Username already taken." });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create and save user
        const newUser = new User({ username, password: hashedPassword, description });
        await newUser.save();

        res.json({ message: "Signup successful!" });
    } catch (err) {
        res.status(500).json({ message: "Server error." });
    }
});

app.listen(3000, () => {

    console.log("Server is running on port 3000");
});