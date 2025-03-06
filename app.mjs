import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express()

const USERS_FILE = path.join(__dirname, 'users.json');

app.use(express.json());

app.use(express.static(__dirname));

app.get('/', (req, res) =>{
    res.sendFile(path.join(__dirname, 'login.html'));
});



app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Load users from users.json
    let users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));

    // Find user with matching username and password
    const user = users.find(user => user.username === username && user.password === password);

    if (user) {
        res.json({ message: "Login successful!" });
        console.log("Login success:", username);
    } else {
        res.status(401).json({ message: "Invalid username or password" });
        console.log("Login failed:", username);
    }
});

// Handle signup requests
app.post('/signup', (req, res) => {
    const { username, password, description } = req.body;

    // Load existing users
    let users = JSON.parse(fs.readFileSync(USERS_FILE));

    // Check if the username already exists
    if (users.some(user => user.username === username)) {
        return res.status(400).json({ message: "Username already taken." });
    }

    // Save new user
    const newUser = { username, password, description };
    users.push(newUser);
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

    res.json({ message: "Signup successful!" });
});


app.listen(3000, () => {

    console.log("Server is running on port 3000");
});