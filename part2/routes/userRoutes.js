const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET all users (for admin/testing)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT user_id, username, email, role FROM Users');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST a new user (simple signup)
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const [result] = await db.query(`
      INSERT INTO Users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `, [username, email, password, role]);

    res.status(201).json({ message: 'User registered', user_id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  res.json(req.session.user);
});

// POST /login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
      // Find user by username & pass hash
      const [rows] = await db.query(`
        SELECT user_id, username, role FROM Users
        WHERE username = ? AND password_hash = ?
      `, [username, password]);

      // send error when if user
      if (rows.length === 0) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      const user = rows[0];

      // Store user info in session
      req.session.user = {
        user_id: user.user_id,
        username: user.username,
        role: user.role
      };

      // Send back user object (successful login)
      res.json(user);

    } catch (error) {
      console.error('Login failed:', error);
      res.status(500).json({ error: 'Login failed due to a server error' });
    }
  });

// POST /logout
router.post('/logout', (req, res) => {
    // removes session data from server's store
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ error: 'Could not log out, please try again.' });
      }
      // Clear client side cookie
      res.clearCookie('connect.sid');
      res.status(200).json({ message: 'Logout successful' });
    });
});

module.exports = router;