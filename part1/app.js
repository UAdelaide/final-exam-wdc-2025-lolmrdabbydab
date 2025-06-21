const express = require('express');
const logger = require('morgan');
const mysql = require('mysql2/promise');

const app = express();

app.use(logger('dev'));
app.use(express.json());

let pool;

(async () => {
  try {
    // Connection pool to the MySQL server (without a specific database)
    const initialConnection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      multipleStatements: true // Allow multiple SQL queries at once for seeding
    });

    // 2. Create the database if it doesn't exist
    await initialConnection.query('CREATE DATABASE IF NOT EXISTS DogWalkService');
    await initialConnection.end();

    // 3. Now create a connection pool to our specific database
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

    // Make the pool accessible to our routes
    app.locals.pool = pool;

    // 4. Create tables from dogwalks.sql
    const schemaSql = require('fs').readFileSync(require('path').join(__dirname, 'dogwalks.sql'), 'utf8');
    await pool.query(schemaSql);

    // 5. Insert seed data if tables are empty
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
    process.exit(1); // Exit if DB setup fails
  }
})();


// --- API Routes ---

// Q6. Route to get all dogs
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

// Q7. Route to get all open walk requests
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


// Q8. Will go here later...


// Simple welcome route for the root
app.get('/', (req, res) => {
  res.send('Welcome to the Dog Walking Service API. Use /api/dogs to see data.');
});


module.exports = app;
