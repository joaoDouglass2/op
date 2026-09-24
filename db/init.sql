

CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    status      VARCHAR(10) NOT NULL DEFAULT 'todo'
                CHECK (status IN ('todo', 'doing', 'done')),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

