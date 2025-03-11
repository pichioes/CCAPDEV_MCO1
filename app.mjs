import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url';
import fs from 'fs';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import session from "express-session"


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express()

// Connect to MongoDB
dotenv.config();

app.use(express.json());


app.use(session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(express.static(__dirname));
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB connection error:", err));

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    description: String
});

const User = mongoose.model("users", userSchema);


const reviewSchema = new mongoose.Schema({
    User_ID: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    //Location_ID: String, optional: if you plan to add location input later
    Service_ID: String,
    Review: String,
    Date: String,
    Star_rating: Number
});
const Review = mongoose.model('review', reviewSchema);
const serviceSchema = new mongoose.Schema({
    Service_Name: { type: String, required: true }
});

const Service = mongoose.model("service", serviceSchema);



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
        req.session.userId = user;
        console.log(req.session.userId.username)
        console.log(req.session.userId._id)
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
        req.session.userId = newUser;
        res.json({ message: "Signup successful!" });
    } catch (err) {
        res.status(500).json({ message: "Server error." });
    }
});

app.get("/profile", async (req, res) => {
    if (!req.session.userId) {
        console.log("not login")
        return res.status(401).json({ message: "Not logged in" });
    }

    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        console.log("user found")
        res.json({ username: user.username, description: user.description });
    } catch (err) {
        res.status(500).json({ message: "Server error." });
    }
});

app.post("/edit-description", async (req, res) => {
    
    const description = req.body.description;

    const user = await User.findById(req.session.userId);
    console.log("editing description")
    console.log(typeof description)
    console.log(description)
    try {
        const updateUser = await User.findByIdAndUpdate(user, { description: description });

         if (!updateUser) {
            return res.status(404).json({ message: "User not found" });
        }
        console.log("user updated");
        res.json({ message: "Description updated successfully!", user: updateUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
})

app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: "Error logging out" });
        }
        res.json({ message: "Logged out successfully" });
    });
});


app.post("/addreview", async (req, res) => {
    console.log("POST /addreview route triggered with body:", req.body);
    if (!req.session.userId) {
        return res.status(401).json({ message: "You must be logged in to post a review." });
    }

    const { serviceName, review, starRating, imageUrl = "" } = req.body;
    console.log(serviceName)
    console.log(typeof serviceName)
    //if (!serviceName || !review || !starRating) {
       // return res.status(400).json({ message: "All fields except image are required." });
    //}

   // if (starRating < 1 || starRating > 5) {
   //     return res.status(400).json({ message: "Rating must be between 1 and 5 stars." });
   // }

    try {
        console.log("review attempt")
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(collections)
        const services = await Service.find(); // Fetch all documents
        console.log("All Services in Database:", services);
        const service = await Service.findOne({ Service_Name: serviceName });
        console.log(service)
        if (!service) { 
            return res.status(400).json({ message: "Invalid service name." });
        }

        const newReview = new Review({
            User_ID: req.session.userId._id,
            //Location_ID: "loc001", // default value for now
            Service_ID: service._id,
            Review: review,
            Date: new Date().toLocaleDateString('en-GB'),
            Star_rating: starRating,
            //Image_URL: imageUrl
        });
        console.log("Review object:", newReview);
        await newReview.save();
        res.json({ message: "Review submitted successfully!" });
    } catch (err) {
        console.error("Error saving review:", err);
        res.status(500).json({ message: "Server error while saving review." });
    }
});

app.listen(3000, () => {

    console.log("Server is running on port 3000");
});