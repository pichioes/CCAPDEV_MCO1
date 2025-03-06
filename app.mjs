import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express()

app.use(express.json());

app.use(express.static(__dirname));

app.get('/', (req, res) =>{
    res.sendFile(path.join(__dirname, 'login.html'));
});



app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Example: Check credentials (replace with database authentication)
    if (username === "admin" && password === "password") {
        res.json({ message: "Login successful!" });
        console.log("login success")
    } else {
        res.status(401).json({ message: "Invalid username or password" });
    }
});

app.listen(3000, () => {

    console.log("Server is running on port 3000");
});