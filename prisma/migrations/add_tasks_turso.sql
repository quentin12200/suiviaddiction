-- Add TaskItem table for Turso
CREATE TABLE IF NOT EXISTS TaskItem (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normale',
  category TEXT NOT NULL DEFAULT 'Personnel',
  completed INTEGER NOT NULL DEFAULT 0,
  createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  dueDate INTEGER,
  lastCompleted INTEGER,
  daysNotCompleted INTEGER NOT NULL DEFAULT 0,
  isFromHabit INTEGER NOT NULL DEFAULT 0,
  habitId TEXT,
  updatedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS TaskItem_completed_idx ON TaskItem(completed);
CREATE INDEX IF NOT EXISTS TaskItem_type_idx ON TaskItem(type);
CREATE INDEX IF NOT EXISTS TaskItem_category_idx ON TaskItem(category);
