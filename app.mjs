import express from 'express'
import session from 'express-session';
import path from 'path'
import { fileURLToPath } from 'url';
import fs from 'fs';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import multer from 'multer'; 
import cookieParser from 'cookie-parser';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // for CSS and frontend files
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));


app.use(session({
  secret: 'very super secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    maxAge: null // We'll set it dynamically based on "remember me"
  }
}));


// MongoDB connection
dotenv.config();

app.use(express.json());
app.use(cookieParser());

app.use(session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));


app.use(express.static(__dirname));
app.post('/login', async (req, res) => {
    const { username, password, remember } = req.body;

    try {
        // First check the users collection
        let user = await User.findOne({ username });
        let isManager = false;
        
        // If not found in users, check managers collection
        if (!user) {
            user = await Manager.findOne({ Username: username });
            if (user) isManager = true;
            console.log("powet1");
            console.log(user);
            console.log(isManager);
        }
        
        // If not found in either collection
        if (!user) {
            console.log("powet2");
            return res.status(401).json({ message: "Invalid username or password." });
        }

        // Check password differently based on user type
        let isMatch = false;
        
        if (isManager) {
            // For managers, direct string comparison (no bcrypt)
            isMatch = user.Password === password;
        } else {
            // For regular users, use bcrypt
            isMatch = await bcrypt.compare(password, user.password);
        }
        
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid username or password." });
        }

        // Set session with user info and manager flag
        req.session.userId = user;
        req.session.isManager = isManager;

        // Set session cookie maxAge if remember me is checked
        if (remember) {
            req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 21; // 21 days
        } else {
            req.session.cookie.expires = false;
        }

        res.json({ 
            message: "Login successful!",
            isManager: isManager
        });

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Server error" });
    }
});


app.get('/dashboard', (req, res) => {
    if (req.session.user) {
      res.send(`Welcome ${req.session.user}! <a href="/logout">Logout</a>`);
    } else {
      res.redirect('/login.html');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
      res.redirect('/login.html');
    });
});
  
// Serve cookie consent bar
app.get('/cookie-notice', (req, res) => {
    res.send(`
        <div style="position: fixed; bottom: 10px; left: 10px; background: #eee; padding: 10px; border: 1px solid #aaa;">
            This website uses cookies to improve your experience.
            <button onclick="document.cookie='accepted=true; max-age=1814400'; this.parentElement.style.display='none';">Accept</button>
        </div>
    `);
});


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
        fileSize: 50 * 1024 * 1024  // 5MB limit per file
    },
    fileFilter: (req, file, cb) => {
        // Allow both images and videos
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);  // Accept the file
        } else {
            cb(new Error('Invalid file type! Only images and videos are allowed.'), false);
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

const managerSchema = new mongoose.Schema({
    Username: { type: String, required: true },
    Password: { type: String, required: true },
    Description: String,
    Location_ID: { type: mongoose.Schema.Types.ObjectId, ref: "locations" }
});

const Manager = mongoose.model("managers", managerSchema);

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
    Location_ID: { type: mongoose.Schema.Types.ObjectId, ref: "locations" },
    Title: String, 
    Review: String,
    Date: String,
    Star_rating: Number,
    Image_path: String, 
    Video_path: String,
    likes: Number,
    dislikes: Number,
    likedBy: [String],
    dislikedBy: [String],
    // New fields for manager comments
    managerComment: String,
    managerCommentId: String, // Format: MC-XXXXX as mentioned
    managerCommentDate: String,
    Manager_ID: { type: mongoose.Schema.Types.ObjectId, ref: "managers" },
    Date: String, // original date (already used for sorting)
    uploadTimestamp: { type: Date, default: Date.now }, // for exact upload time
    lastEdited: { type: Date }, // this will store the latest edit timestamp
    edited: { type: Boolean, default: false }, // indicator for whether review was edited
});

const Review = mongoose.model('reviews', reviewSchema);

const serviceSchema = new mongoose.Schema({
    Service_Name: { type: String, required: true }
});

const Service = mongoose.model("services", serviceSchema);

const locationSchema = new mongoose.Schema({
    Location_Name: { type: String, required: true }
});

const Location = mongoose.model("locations", locationSchema);



app.get('/', (req, res) => {
    if (req.session.userId) {
        // User has an active session (even remembered), redirect to landing page
        return res.redirect('/landingpage.html');
    } else {
        // Not logged in, show login page
        return res.sendFile(path.join(__dirname, 'login.html'));
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

        // password hash
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

app.get("/profile", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Not logged in" });
    }

    try {
        let user;
        if (req.session.isManager) {
            user = await Manager.findById(req.session.userId._id);
            if (!user) {
                return res.status(404).json({ message: "Manager not found" });
            }
            
            res.json({ 
                _id: user._id,
                username: user.Username,
                description: user.Description,
                locationId: user.Location_ID,
                isManager: true,
                profilePicture: user.profilePicture || null
            });
        } else {
            user = await User.findById(req.session.userId._id);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            
            res.json({ 
                _id: user._id,
                username: user.username, 
                description: user.description,
                profilePicture: user.profilePicture,
                isManager: false
            });
        }
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

app.get("/getServiceRatings", async (req, res) => {
   
    const { service } = req.query;
    const serviceId = await Service.findOne({ Service_Name: service });
    
    if (!service) {
      return res.status(400).json({ error: "Service is required" });
    }
  
    try {
      const reviews = await Review.find({ Service_ID: serviceId._id });
      if (reviews.length === 0) {
        return res.json({ service, averageRating: "No ratings yet" });
        
      }
      
      const avgRating = reviews.reduce((sum, review) => sum + review.Star_rating, 0) / reviews.length;
      const response = res.json({ service, averageRating: avgRating.toFixed(1) });
      
    } catch (error) {
      res.status(500).json({ error: "Error fetching reviews" });
    }
  });

  app.get('/getLocation/:locationId', async (req, res) => {
    try {
        const locationId = req.params.locationId;
        const location = await Location.findById(locationId);
        
        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }
        
        res.json(location);
    } catch (error) {
        console.error('Error fetching location:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get reviews by location ID
app.get('/getReviewsByLocation/:locationId', async (req, res) => {
    try {
        const locationId = req.params.locationId;
        
        // Find all reviews for the given location, populate user and service info
        const reviews = await Review.find({ Location_ID: locationId })
            .populate('User_ID')
            .populate('Service_ID')
            .sort({ Date: -1 }); // Sort by date, newest first
        
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching reviews by location:', error);
        res.status(500).json({ message: 'Server error' });
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
        
        const { serviceName, title, review, starRating, mediaType, locationId } = req.body;
        
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
        
        // media path
        let imagePath = null;
        let videoPath = null;
        
        if (req.file) {
            const filePath = `/uploads/${req.file.filename}`;
            
            // Determine if it's an image or video based on mediaType or file mimetype
            if (mediaType === 'video' || (req.file.mimetype && req.file.mimetype.startsWith('video/'))) {
                videoPath = filePath;
            } else {
                imagePath = filePath;
            }
        }
        console.log(locationId)
        const newReview = new Review({
            User_ID: req.session.userId._id,
            Service_ID: serviceId,
            Location_ID: locationId,
            Title: title || 'Review',
            Review: review,
            Date: new Date().toLocaleDateString('en-GB'),
            Star_rating: starRating,
            Image_path: imagePath,
            Video_path: videoPath, 
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
                Image_path: imagePath,
                lastEdited: new Date(),     // Add this
                edited: true                // Add this
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
        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({ message: "Review not found." });
        }

        const userId = req.session.userId._id.toString();
        const isManager = req.session.isManager;

        // If user is a manager, check location match
        if (isManager) {
            const manager = await Manager.findById(userId);
            if (!manager || !manager.Location_ID.equals(review.Location_ID)) {
                return res.status(403).json({ message: "You can only delete reviews for your own location." });
            }
        } else {
            // If not a manager, make sure user owns the review
            if (review.User_ID.toString() !== userId) {
                return res.status(403).json({ message: "You can only delete your own reviews." });
            }
        }

        // Delete attached image if it exists
        if (review.Image_path) {
            const imagePath = path.join(__dirname, review.Image_path);
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        }

        await Review.findByIdAndDelete(reviewId);
        res.json({ message: "Review deleted successfully!" });

    } catch (err) {
        console.error("Error deleting review:", err);
        res.status(500).json({ message: "Server error while deleting review." });
    }
});


// Add manager comment to a review
app.post("/addmanagercomment/:reviewId", async (req, res) => {
    if (!req.session.userId || !req.session.isManager) {
        return res.status(401).json({ message: "You must be logged in as a manager to add comments." });
    }

    try {
        const reviewId = req.params.reviewId;
        const { comment } = req.body;
        
        if (!comment) {
            return res.status(400).json({ message: "Comment text is required." });
        }

        // Find the review
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: "Review not found." });
        }

        // Check if the manager belongs to the location of the review
        const manager = await Manager.findById(req.session.userId._id);
        if (!manager || !manager.Location_ID.equals(review.Location_ID)) {
            return res.status(403).json({ 
                message: "You can only comment on reviews for your location." 
            });
        }

        // Generate a unique comment ID
        const commentId = `MC-${Math.floor(10000 + Math.random() * 90000)}`;

        // Update the review with the manager's comment
        const updatedReview = await Review.findByIdAndUpdate(
            reviewId,
            {
                managerComment: comment,
                managerCommentId: commentId,
                managerCommentDate: new Date().toLocaleDateString('en-GB'),
                Manager_ID: req.session.userId._id
            },
            { new: true }
        );

        res.json({ 
            message: "Comment added successfully!", 
            review: updatedReview 
        });
    } catch (err) {
        console.error("Error adding manager comment:", err);
        res.status(500).json({ message: "Server error while adding comment." });
    }
});

// Delete manager comment from a review
app.delete("/deletemanagercomment/:reviewId", async (req, res) => {
    if (!req.session.userId || !req.session.isManager) {
        return res.status(401).json({ message: "You must be logged in as a manager to delete comments." });
    }

    try {
        const reviewId = req.params.reviewId;
        
        // Find the review
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: "Review not found." });
        }

        // Check if the manager belongs to the location of the review
        const manager = await Manager.findById(req.session.userId._id);
        if (!manager || !manager.Location_ID.equals(review.Location_ID)) {
            return res.status(403).json({ 
                message: "You can only delete comments for reviews in your location." 
            });
        }

        // Update the review to remove the manager's comment
        const updatedReview = await Review.findByIdAndUpdate(
            reviewId,
            {
                $unset: {
                    managerComment: "",
                    managerCommentId: "",
                    managerCommentDate: "",
                    Manager_ID: ""
                }
            },
            { new: true }
        );

        res.json({ 
            message: "Comment deleted successfully!", 
            review: updatedReview 
        });
    } catch (err) {
        console.error("Error deleting manager comment:", err);
        res.status(500).json({ message: "Server error while deleting comment." });
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

// example endpoint in 
app.get('/reviews/location/:locationId', async (req, res) => {
    const reviews = await Review.find({ Location_ID: req.params.locationId })
        .populate('User_ID')
        .populate('Location_ID');
    res.json(reviews);
});

// Endpoint for the view_user.html page
app.get('/view_user.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'view_user.html'));
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});