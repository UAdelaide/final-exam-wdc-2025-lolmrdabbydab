const express = require('express');
const path = require('path');
const session = require('express-session');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));
app.use(session({
    secret: 'a-simple-secret-for-the-exam', // Hardcoded key for exam
    resave: false, // Prevents session from being saved back to the session store if it was never modified during the request.
    saveUninitialized: false, // Prevents a session from being created for a user until something is actually stored in session.
    cookie: { secure: false } // true if using HTTPS
}));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

// Export the app instead of listening here
module.exports = app;