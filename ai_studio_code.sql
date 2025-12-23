CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INTEGER,
    level VARCHAR(50), -- ex: 'Externe (4ème année)'
    xp INTEGER DEFAULT 0,
    maxXp INTEGER DEFAULT 1000,
    cases_completed INTEGER DEFAULT 0,
    average_score FLOAT DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertion d'un profil test
INSERT INTO students (name, age, level, xp, maxXp, cases_completed, average_score) 
VALUES ('Jean Dupont', 24, 'Externe (4ème année)', 350, 1000, 3, 72.5);