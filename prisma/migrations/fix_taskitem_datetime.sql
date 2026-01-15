-- Drop and recreate TaskItem table with correct DATETIME format
-- This fixes the "Conversion failed: string-encoded number must be an i32" error

DROP TABLE IF EXISTS TaskItem;

CREATE TABLE TaskItem (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normale',
  category TEXT NOT NULL DEFAULT 'Personnel',
  completed INTEGER NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  dueDate DATETIME,
  lastCompleted DATETIME,
  daysNotCompleted INTEGER NOT NULL DEFAULT 0,
  isFromHabit INTEGER NOT NULL DEFAULT 0,
  habitId TEXT,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX TaskItem_completed_idx ON TaskItem(completed);
CREATE INDEX TaskItem_type_idx ON TaskItem(type);
CREATE INDEX TaskItem_category_idx ON TaskItem(category);
