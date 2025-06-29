const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET all walk requests (for walkers to view)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT wr.*, d.name AS dog_name, d.size, u.username AS owner_name
      FROM WalkRequests wr
      JOIN Dogs d ON wr.dog_id = d.dog_id
      JOIN Users u ON d.owner_id = u.user_id
      WHERE wr.status = 'open'
    `);
    res.json(rows);
  } catch (error) {
    console.error('SQL Error:', error);
    res.status(500).json({ error: 'Failed to fetch walk requests' });
  }
});

// POST a new walk request (from owner)
router.post('/', async (req, res) => {
  const { dog_id, requested_time, duration_minutes, location } = req.body;

  try {
    const [result] = await db.query(`
      INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location)
      VALUES (?, ?, ?, ?)
    `, [dog_id, requested_time, duration_minutes, location]);

    res.status(201).json({ message: 'Walk request created', request_id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create walk request' });
  }
});

// POST an application to walk a dog (from walker)
router.post('/:id/apply', async (req, res) => {
  const requestId = req.params.id;
  const { walker_id } = req.body;

  try {
    await db.query(`
      INSERT INTO WalkApplications (request_id, walker_id)
      VALUES (?, ?)
    `, [requestId, walker_id]);

    await db.query(`
      UPDATE WalkRequests
      SET status = 'accepted'
      WHERE request_id = ?
    `, [requestId]);

    res.status(201).json({ message: 'Application submitted' });
  } catch (error) {
    console.error('SQL Error:', error);
    res.status(500).json({ error: 'Failed to apply for walk' });
  }
});

// GET walk requests for currently logged-in owner
router.get('/myrequests', async (req, res) => {
    // Check if user is logged in & is an owner
    if (!req.session.user || req.session.user.role !== 'owner') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const ownerId = req.session.user.user_id;

    try {
      // filter dogs belonging to logged-in owner
      const [rows] = await db.query(`
        SELECT wr.*, d.name AS dog_name, d.size
        FROM WalkRequests wr
        JOIN Dogs d ON wr.dog_id = d.dog_id
        WHERE d.owner_id = ? AND wr.status = 'open'
        ORDER BY wr.requested_time DESC
      `, [ownerId]);
      res.json(rows);
    } catch (error) {
      console.error('SQL Error fetching owner requests:', error);
      res.status(500).json({ error: 'Failed to fetch your walk requests' });
    }
});

// GET all dogs for homepage table
router.get('/dogs', async (req, res) => {
    try {
      // Joins Dogs & Users tables to get necessary details
      const [rows] = await db.query(`
        SELECT d.dog_id, d.name, d.size, u.username AS owner_username
        FROM Dogs d
        JOIN Users u ON d.owner_id = u.user_id
        ORDER BY d.dog_id
      `);
      res.json(rows);
    } catch (error) {
      console.error('SQL Error fetching all dogs:', error);
      res.status(500).json({ error: 'Failed to fetch list of all dogs' });
    }
});

module.exports = router;