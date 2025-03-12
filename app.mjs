import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url';
import fs from 'fs';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import session from "express-session"
import multer from 'multer'; // Add multer for file upload

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

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload only images.'), false);
        }
    }
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB connection error:", err));


const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    description: String,
    profilePicture: String // Path to the profile picture
});

const User = mongoose.model("users", userSchema);

const profilePictureUpload = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB limit for profile pictures
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload only images.'), false);
        }
    }
}).single('profilePicture');

const reviewSchema = new mongoose.Schema({
    User_ID: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    Service_ID: { type: mongoose.Schema.Types.ObjectId, ref: "services" },
    Title: String, // Added Title field
    Review: String,
    Date: String,
    Star_rating: Number,
    Image_path: String, // Added field for image path
    likes: Number,
    dislikes: Number,
    likedBy: [String],
    dislikedBy: [String]
});
const Review = mongoose.model('reviews', reviewSchema);

const serviceSchema = new mongoose.Schema({
    Service_Name: { type: String, required: true }
});

const Service = mongoose.model("services", serviceSchema);



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
        console.log(typeof req.session.userId._id)
        res.json({ message: "Login successful!" });
    } catch (err) {
        res.status(500).json({ message: "Server error." });
    }
});

// Handle signup requests
app.post('/signup', profilePictureUpload, async (req, res) => {
    const { username, password, description } = req.body;
    let imagePath = null;
        if (req.file) {
            console.log("image placed")
            imagePath = `/uploads/${req.file.filename}`;
            console.log(typeof imagePath)
        }
    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "Username already taken." });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create and save user
        const newUser = new User({ username, password: hashedPassword, description, profilePicture: imagePath});
        console.log("Saving user:", newUser);
        await newUser.save();
        req.session.userId = newUser;
        res.json({ message: "Signup successful!" });
    } catch (err) {
        res.status(500).json({ message: "Server error." });
    }
});

// Add route to update profile picture
app.post("/update-profile-picture", (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "You must be logged in to update your profile picture." });
    }

    profilePictureUpload(req, res, async function(err) {
        if (err) {
            return res.status(400).json({ message: err.message });
        }

        try {
            // Get current user
            const user = await User.findById(req.session.userId._id);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Delete old profile picture if it exists
            if (user.profilePicture) {
                const oldImagePath = path.join(__dirname, user.profilePicture);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }

            // Save new profile picture path
            const profilePicturePath = req.file ? `/uploads/${req.file.filename}` : null;
            
            // Update user with new profile picture path
            const updatedUser = await User.findByIdAndUpdate(
                user._id,
                { profilePicture: profilePicturePath },
                { new: true }
            );

            res.json({ 
                message: "Profile picture updated successfully!",
                profilePicture: profilePicturePath
            });
        } catch (error) {
            console.error("Error updating profile picture:", error);
            res.status(500).json({ message: "Server error" });
        }
    });
});

// Also add support for base64 profile picture uploads
app.post("/update-profile-picture-base64", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "You must be logged in to update your profile picture." });
    }

    try {
        const { imageData } = req.body;
        
        if (!imageData || !imageData.startsWith('data:image')) {
            return res.status(400).json({ message: "Valid image data is required." });
        }

        // Get current user
        const user = await User.findById(req.session.userId._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Delete old profile picture if it exists
        if (user.profilePicture) {
            const oldImagePath = path.join(__dirname, user.profilePicture);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }

        // Process base64 image
        const matches = imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        
        if (!matches || matches.length !== 3) {
            return res.status(400).json({ message: "Invalid image format." });
        }

        const type = matches[1].split('/')[1];
        const buffer = Buffer.from(matches[2], 'base64');
        const filename = `profile-${user._id}-${Date.now()}.${type}`;
        const filepath = path.join(uploadsDir, filename);
        
        fs.writeFileSync(filepath, buffer);
        const profilePicturePath = `/uploads/${filename}`;

        // Update user with new profile picture path
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { profilePicture: profilePicturePath },
            { new: true }
        );

        res.json({ 
            message: "Profile picture updated successfully!",
            profilePicture: profilePicturePath
        });
    } catch (error) {
        console.error("Error updating profile picture:", error);
        res.status(500).json({ message: "Server error" });
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
        res.json({ 
            _id: user._id,  // Add this line
            username: user.username, 
            description: user.description,
            profilePicture: user.profilePicture 
        });
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

app.get('/getReviews', async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('User_ID')
            .populate('Service_ID')
            .sort({ Date: -1 }); // Most recent first
        
        res.json(reviews);
    } catch (err) {
        console.error("Error fetching reviews:", err);
        res.status(500).json({ message: "Server error while fetching reviews." });
    }
});

// Updated to handle file upload and title
app.post("/addreview", upload.single('reviewImage'), async (req, res) => {
    console.log("POST /addreview route triggered with body:", req.body);
    if (!req.session.userId) {
        return res.status(401).json({ message: "You must be logged in to post a review." });
    }

    try {
        console.log("review attempt");
        
        const { serviceName, title, review, starRating } = req.body;
        
        if (!review || !starRating) {
            return res.status(400).json({ message: "Review text and rating are required." });
        }

        // Default to a general service if no serviceName is provided
        let serviceId = null;
        if (serviceName) {
            const service = await Service.findOne({ Service_Name: serviceName });
            if (service) {
                serviceId = service._id;
            } else {
                // Create the service if it doesn't exist
                const newService = new Service({ Service_Name: serviceName });
                await newService.save();
                serviceId = newService._id;
            }
        }
        console.log(serviceId);

        // Handle image path if an image was uploaded
        let imagePath = null;
        if (req.file) {
            imagePath = `/uploads/${req.file.filename}`;
        }

        const newReview = new Review({
            User_ID: req.session.userId._id,
            Service_ID: serviceId,
            Title: title || 'Review', // Ensure title is saved with a default if not provided
            Review: review,
            Date: new Date().toLocaleDateString('en-GB'),
            Star_rating: starRating,
            Image_path: imagePath,
            likes: 0,
            dislikes: 0,
            likedBy: []
        });
        
        console.log("Review object to be saved:", newReview);
        await newReview.save();
        res.json({ message: "Review submitted successfully!" });
    } catch (err) {
        console.error("Error saving review:", err);
        res.status(500).json({ message: "Server error while saving review." });
    }
});

app.post("/likereview",  async (req, res) => {
    
    try{
        let { reviewId } = req.body; 
        const userId = req.session.userId._id;

        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            return res.status(400).json({ message: "Invalid review ID" });
        }
        reviewId = new mongoose.Types.ObjectId(reviewId);

         //find review in db
        const review =  await Review.findOne({_id: reviewId});

        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        if (review.likedBy.includes(userId)) {
            await Review.updateOne(
                { _id: reviewId }, // Filter
                {
                    $inc: { likes: -1} , // Increment likes by 1
                    $pull: { likedBy: userId }
                }
            );
            const result = await Review.findOne({ _id: reviewId });
            return res.json({ message: "Unliked successfully", likes: result.likes });
        }else{
       
         
            await Review.updateOne(
                { _id: reviewId }, // Filter
                {
                    $inc: { likes: 1} , // Increment likes by 1
                    $push: { likedBy: userId }
                }
            );
            const result = await Review.findOne({ _id: reviewId });

            res.json({ message: "Liked successfully", likes: result.likes});
            
        }

    }catch (err) {
        console.error("Error liking review:", err);
        res.status(500).json({ message: "Server error while liking review." });
    }
    
});


app.post("/dislikereview",  async (req, res) => {
    
    try{
        let { reviewId } = req.body; 
        const userId = req.session.userId._id;

        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            return res.status(400).json({ message: "Invalid review ID" });
        }
        reviewId = new mongoose.Types.ObjectId(reviewId);

         //find review in db
        const review =  await Review.findOne({_id: reviewId});

        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }
        console.log("review found")
        console.log(userId)
        if (review.dislikedBy.includes(userId)) {
            console.log("its here")
            await Review.updateOne(
                { _id: reviewId }, // Filter
                {
                    $inc: { dislikes: -1} , // Increment likes by 1
                    $pull: { dislikedBy: userId }
                }
            );
            const result = await Review.findOne({ _id: reviewId });
            console.log(result)
            return res.json({ message: "Undisliked successfully", dislikes: result.dislikes });
        }else{
       
           
            await Review.updateOne(
                { _id: reviewId }, // Filter
                {
                    $inc: { dislikes: 1} , // Increment likes by 1
                    $push: { dislikedBy: userId }
                }
            );
            const result = await Review.findOne({ _id: reviewId });
            console.log(result)
            res.json({ message: "disliked successfully", dislikes: result.dislikes});
            
        }

    }catch (err) {
        console.error("Error liking review:", err);
        res.status(500).json({ message: "Server error while liking review." });
    }
    
});

// Also update the base64 endpoint to match
app.post("/addreview-base64", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "You must be logged in to post a review." });
    }

    try {
        const { serviceName, title, review, starRating, imageData } = req.body;
        
        if (!review || !starRating) {
            return res.status(400).json({ message: "Review text and rating are required." });
        }

        let imagePath = null;
        
        // Handle base64 image if provided
        if (imageData && imageData.startsWith('data:image')) {
            const matches = imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            
            if (matches && matches.length === 3) {
                const type = matches[1].split('/')[1];
                const buffer = Buffer.from(matches[2], 'base64');
                const filename = `review-${Date.now()}.${type}`;
                const filepath = path.join(uploadsDir, filename);
                
                fs.writeFileSync(filepath, buffer);
                imagePath = `/uploads/${filename}`;
            }
        }

        // Handle service same as before
        let serviceId = null;
        if (serviceName) {
            const service = await Service.findOne({ Service_Name: serviceName });
            if (service) {
                serviceId = service._id;
            } else {
                const newService = new Service({ Service_Name: serviceName });
                await newService.save();
                serviceId = newService._id;
            }
        }

        const newReview = new Review({
            User_ID: req.session.userId._id,
            Service_ID: serviceId,
            Title: title || 'Review',  // Ensure title is saved with a default if not provided
            Review: review,
            Date: new Date().toLocaleDateString('en-GB'),
            Star_rating: starRating,
            Image_path: imagePath
        });
        
        console.log("Review object to be saved (base64):", newReview);
        await newReview.save();
        res.json({ message: "Review submitted successfully!" });
    } catch (err) {
        console.error("Error saving review:", err);
        res.status(500).json({ message: "Server error while saving review." });
    }
});

// Add routes for editing and deleting reviews
app.put("/editreview/:id", upload.single('reviewImage'), async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "You must be logged in to edit a review." });
    }

    try {
        const reviewId = req.params.id;
        const { title, review, starRating, serviceName } = req.body;
        
        // Check if review exists and belongs to the user
        const existingReview = await Review.findById(reviewId);
        if (!existingReview) {
            return res.status(404).json({ message: "Review not found." });
        }
        
        if (existingReview.User_ID.toString() !== req.session.userId._id.toString()) {
            return res.status(403).json({ message: "You can only edit your own reviews." });
        }

        // Handle service same as before
        let serviceId = existingReview.Service_ID;
        if (serviceName) {
            const service = await Service.findOne({ Service_Name: serviceName });
            if (service) {
                serviceId = service._id;
            } else {
                const newService = new Service({ Service_Name: serviceName });
                await newService.save();
                serviceId = newService._id;
            }
        }

        // Handle image upload if provided
        let imagePath = existingReview.Image_path;
        if (req.file) {
            // Delete old image if it exists
            if (existingReview.Image_path) {
                const oldImagePath = path.join(__dirname, existingReview.Image_path);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            imagePath = `/uploads/${req.file.filename}`;
        }

        // Update review
        const updatedReview = await Review.findByIdAndUpdate(
            reviewId, 
            {
                Title: title || existingReview.Title,
                Review: review || existingReview.Review,
                Star_rating: starRating || existingReview.Star_rating,
                Service_ID: serviceId,
                Image_path: imagePath
            },
            { new: true }
        );

        res.json({ message: "Review updated successfully!", review: updatedReview });
    } catch (err) {
        console.error("Error updating review:", err);
        res.status(500).json({ message: "Server error while updating review." });
    }
});

app.delete("/deletereview/:id", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "You must be logged in to delete a review." });
    }

    try {
        const reviewId = req.params.id;
        
        // Check if review exists and belongs to the user
        const existingReview = await Review.findById(reviewId);
        if (!existingReview) {
            return res.status(404).json({ message: "Review not found." });
        }
        
        if (existingReview.User_ID.toString() !== req.session.userId._id.toString()) {
            return res.status(403).json({ message: "You can only delete your own reviews." });
        }

        // Delete the image file if it exists
        if (existingReview.Image_path) {
            const imagePath = path.join(__dirname, existingReview.Image_path);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        // Delete the review
        await Review.findByIdAndDelete(reviewId);
        res.json({ message: "Review deleted successfully!" });
    } catch (err) {
        console.error("Error deleting review:", err);
        res.status(500).json({ message: "Server error while deleting review." });
    }
});

// Route to get a specific user's data
app.get('/user/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Validate if userId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user ID format" });
        }
        
        // Find user by ID
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Return user data without sensitive information
        res.json({
            username: user.username,
            description: user.description || '',
            profilePicture: user.profilePicture || null
        });
        
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).json({ message: "Server error while fetching user data" });
    }
});

// Route to get reviews by a specific user
app.get('/user-reviews/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Validate if userId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user ID format" });
        }
        
        // Find reviews by this user
        const reviews = await Review.find({ User_ID: userId })
            .populate('Service_ID')
            .sort({ Date: -1 }); // Most recent first
        
        res.json(reviews);
        
    } catch (error) {
        console.error("Error fetching user reviews:", error);
        res.status(500).json({ message: "Server error while fetching user reviews" });
    }
});

// Endpoint for the view_user.html page
app.get('/view_user.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'view_user.html'));
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});