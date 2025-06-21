const express = require('express');
const logger = require('morgan');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();

app.use(logger('dev'));
app.use(express.json());

let pool;

(async () => {
  try {
    // Connect to MySQL
    const initialConnection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      multipleStatements: true
    });

    // Create db if not exist
    await initialConnection.query('CREATE DATABASE IF NOT EXISTS DogWalkService');
    await initialConnection.end();

    // Connect to db
    pool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'DogWalkService',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: true
    });

    app.locals.pool = pool;

    // Create tables
    const schemaSql = require('fs').readFileSync(require('path').join(__dirname, 'dogwalks.sql'), 'utf8');
    await pool.query(schemaSql);

    // Insert data (if empty)
    const [userRows] = await pool.query('SELECT COUNT(*) AS count FROM Users');
    if (userRows[0].count === 0) {
      console.log('Tables are empty, inserting seed data...');
      const insertSql = require('fs').readFileSync(require('path').join(__dirname, 'q5_inserts.sql'), 'utf8');
      await pool.query(insertSql);
      console.log('Seed data inserted successfully.');
    } else {
      console.log('Database already contains data, skipping seed.');
    }

    console.log('Database setup complete and connection pool ready.');

  } catch (err) {
    console.error('Error setting up database:', err);
    process.exit(1);
  }
})();


// -= API Routes =-
// Q6. Get dogs
app.get('/api/dogs', async (req, res) => {
  try {
    const sqlQuery = `
      SELECT
        d.name AS dog_name,
        d.size,
        u.username AS owner_username
      FROM Dogs d
      JOIN Users u ON d.owner_id = u.user_id;
    `;
    const [rows] = await pool.query(sqlQuery);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching dogs:', error);
    res.status(500).json({ error: 'An error occurred while fetching dogs.' });
  }
});

// Q7. Get all open walk requests
app.get('/api/walkrequests/open', async (req, res) => {
    try {
      const sqlQuery = `
        SELECT
          wr.request_id,
          d.name AS dog_name,
          wr.requested_time,
          wr.duration_minutes,
          wr.location,
          u.username AS owner_username
        FROM WalkRequests wr
        JOIN Dogs d ON wr.dog_id = d.dog_id
        JOIN Users u ON d.owner_id = u.user_id
        WHERE wr.status = 'open';
      `;

      const [rows] = await pool.query(sqlQuery);
      res.json(rows);

    } catch (error) {
      console.error('Error fetching open walk requests:', error);
      res.status(500).json({ error: 'An error occurred while fetching open walk requests.' });
    }
  });


// Q8. Get all walkers' summary
app.get('/api/walkers/summary', async (req, res) => {
    try {
      const sqlQuery = `
        SELECT
            u.username AS walker_username,
            COALESCE(ratings_summary.total_ratings, 0) AS total_ratings,
            ratings_summary.average_rating,
            COALESCE(walks_summary.completed_walks, 0) AS completed_walks
        FROM
            Users u
        LEFT JOIN
            (SELECT
                walker_id,
                COUNT(rating_id) AS total_ratings,
                AVG(rating) AS average_rating
            FROM WalkRatings
            GROUP BY walker_id) AS ratings_summary
        ON u.user_id = ratings_summary.walker_id
        LEFT JOIN
            (SELECT
                wa.walker_id,
                COUNT(wr.request_id) AS completed_walks
            FROM WalkApplications wa
            JOIN WalkRequests wr ON wa.request_id = wr.request_id
            WHERE wa.status = 'accepted' AND wr.status = 'completed'
            GROUP BY wa.walker_id) AS walks_summary
        ON u.user_id = walks_summary.walker_id
        WHERE
            u.role = 'walker'
        ORDER BY
            u.username;
      `;

      const [rows] = await pool.query(sqlQuery);
      res.json(rows);

    } catch (error) {
      console.error('Error fetching walker summary:', error);
      res.status(500).json({ error: 'An error occurred while fetching walker summary.' });
    }
  });

app.use(express.static(path.join(__dirname, 'public')));

module.exports = app;
