require('dotenv').config({ path: "./.env" });


const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const https = require('https');
const cors = require('cors');
const http = require('http');
const path = require('path');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const app = express();
app.use(express.json());
// Rate limiting
const limiter = rateLimit({
    max: 200, // Limit each IP to 100 requests per window (here, per hour)
    windowMs: 60 * 60 * 1000, // 1 hour
    message: "Too many requests from this IP, please try again in an hour!",
  });
  app.use(limiter);

// Serve the static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);
app.use(cors("*"));
// '/' route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Register a new user
app.post('/signup', async (req, res) => {
    const { username, password, role } = req.body;
    try {
        const hashedPassword = bcrypt.hashSync(password, 10);
        const user = new User({ username, password: hashedPassword, role });
        await user.save();
        res.status(201).send('User registered successfully');
    } catch (error) {
        if (error.code === 11000) {
            res.status(409).send('Username already exists');
        } else {
            res.status(500).send('Error registering user');
        }
    }
});

// Generate JWT Token
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (user && bcrypt.compareSync(password, user.password)) {
            const token = jwt.sign({ username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
            return res.json({ token });
        }
        res.status(401).send('Invalid credentials');
    } catch (error) {
        res.status(500).send('Error logging in');
    }
});

// Middleware to validate JWT //to check the tokens
function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.send('Token not send');
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.send('Token is not valid');
        req.user = user;
        next();
    });
}

// Middleware to authorize roles // checking tokens + roles both as well
function authorizeRole(role) {
    return (req, res, next) => {
        
            if (req.user.role !== role) return res.send(`your role is not allowed. your role is ${req.user.role} and permitted role is ${role}`);
            next();
    };
}

// Protected Route Example
app.get('/protected', authenticateToken, (req, res) => {
    res.send('Protected resource accessed');
});

// Admin Route Example
app.get('/admin', authenticateToken, authorizeRole('admin'), (req, res) => {
    res.send('Admin resource accessed');
});

app.get('/cat', authenticateToken, async (req, res) => {
    try {
        // const response = await fetch("https://dog.ceo/api/breeds/image/random");
        const response = await fetch("https://api.thecatapi.com/v1/images/search");
        const cat = await response.json();
        res.json(cat);
    } catch (error) {
        res.status(500).send('Error fetching cat image');
    }
});

// Read SSL/TLS certificates
const key = fs.readFileSync('key.pem');
const cert = fs.readFileSync('cert.pem');

// Create HTTPS server
const server = https.createServer({ key, cert }, app);
// const server = http.createServer(app);

// Connect to MongoDB using Mongoose and start the server
const url = process.env.MONGODB_URI;

mongoose.connect(url)
    .then(() => {
        console.log('Connected to MongoDB');

        server.listen(443, () => {
            console.log('HTTPs Server running on port 443');
        });
    })
    .catch(err => {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    });
