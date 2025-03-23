CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    priority TEXT NOT NULL, -- 'urgent', 'later', or 'someday'
    tags TEXT, -- store as JSON string
    dueDate TEXT, -- ISO format date string
    comments TEXT,
    pinned BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 