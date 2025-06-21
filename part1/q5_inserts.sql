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