/* eslint-disable no-console */
const express = require('express');
const mysql = require('mysql2/promise');
const fs =require('fs').promises;
const path = require('path');

const app = express();
const port = 8080;

// Middleware to parse JSON bodies
app.use(express.json());

// --- Database Configuration ---
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
};

// --- Database Seeding Function ---
async function seedDatabase(pool) {
    try {
        console.log('Creating database and tables...');
        const schemaSql = await fs.readFile(path.join(__dirname, 'dogwalks.sql'), 'utf-8');
        const statements = schemaSql.split(/;\s*$/m);
        // eslint-disable-next-line no-await-in-loop
        for (const statement of statements) {
            if (statement.trim()) {
                // eslint-disable-next-line no-await-in-loop
                await pool.query(statement);
            }
        }

        console.log('Database and tables created successfully.');
        console.log('Inserting seed data...');

        const insertSql = `
            INSERT INTO Users (username, email, password_hash, role) VALUES
            ('alice123', 'alice@example.com', 'hashed123', 'owner'),
            ('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
            ('carol123', 'carol@example.com', 'hashed789', 'owner'),
            ('davidowner', 'david@example.com', 'hashed101', 'owner'),
            ('emilywalker', 'emily@example.com', 'hashed112', 'walker');

            INSERT INTO Dogs (name, size, owner_id) VALUES
            ('Max', 'medium', (SELECT user_id FROM Users WHERE username = 'alice123')),
            ('Bella', 'small', (SELECT user_id FROM Users WHERE username = 'carol123')),
            ('Lucy', 'small', (SELECT user_id FROM Users WHERE username = 'alice123')),
            ('Charlie', 'large', (SELECT user_id FROM Users WHERE username = 'carol123')),
            ('Rocky', 'medium', (SELECT user_id FROM Users WHERE username = 'davidowner'));

            INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES
            ((SELECT dog_id FROM Dogs WHERE name = 'Max' AND owner_id = (SELECT user_id FROM Users WHERE username = 'alice123')), '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
            ((SELECT dog_id FROM Dogs WHERE name = 'Bella' AND owner_id = (SELECT user_id FROM Users WHERE username = 'carol123')), '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'),
            ((SELECT dog_id FROM Dogs WHERE name = 'Lucy' AND owner_id = (SELECT user_id FROM Users WHERE username = 'alice123')), '2025-06-21 14:00:00', 60, 'City Botanical Gardens', 'open'),
            ((SELECT dog_id FROM Dogs WHERE name = 'Charlie' AND owner_id = (SELECT user_id FROM Users WHERE username = 'carol123')), '2025-06-22 17:00:00', 30, 'River Torrens Linear Park', 'completed'),
            ((SELECT dog_id FROM Dogs WHERE name = 'Rocky' AND owner_id = (SELECT user_id FROM Users WHERE username = 'davidowner')), '2025-06-23 10:00:00', 45, 'North Adelaide Dog Park', 'cancelled');
        `;
        const insertStatements = insertSql.split(/;\s*$/m);
        // eslint-disable-next-line no-await-in-loop
         for (const statement of insertStatements) {
            if (statement.trim()) {
                // eslint-disable-next-line no-await-in-loop
                await pool.query(statement);
            }
        }
        console.log('Seed data inserted successfully.');
    } catch (error) {
        if (error.code === 'ER_DB_CREATE_EXISTS') {
            console.log('Database already exists. Skipping seeding.');
        } else {
            console.error('Error during database seeding:', error);
            process.exit(1);
        }
    }
}

// --- API Routes Setup ---
const apiRouter = express.Router();

apiRouter.get('/dogs', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
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
    res.status(500).json({ error: 'An error occurred while fetching the list of dogs.' });
  }
});

app.use('/api', apiRouter);

// --- Server Startup ---
async function startServer() {
    try {
        // This object creation is reformatted to fix the max-len error
        const initialPoolConfig = {
            ...dbConfig,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            multipleStatements: true
        };
        const pool = mysql.createPool(initialPoolConfig);

        await seedDatabase(pool);
        await pool.end();

        const mainPoolConfig = {
            ...dbConfig,
            database: 'DogWalkService',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        };
        const mainPool = mysql.createPool(mainPoolConfig);

        app.locals.pool = mainPool;
        console.log('Connected to DogWalkService database.');

        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();