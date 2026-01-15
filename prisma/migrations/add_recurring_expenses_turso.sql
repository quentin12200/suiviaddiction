-- Add RecurringExpense table for bank forecasting
CREATE TABLE IF NOT EXISTS RecurringExpense (
  id TEXT PRIMARY KEY NOT NULL,
  label TEXT NOT NULL,
  amount REAL NOT NULL,
  dayOfMonth INTEGER NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'mensuel',
  category TEXT NOT NULL DEFAULT 'Autre',
  startDate DATETIME,
  endDate DATETIME,
  isVariable INTEGER NOT NULL DEFAULT 0,
  variableMonths TEXT,
  isActive INTEGER NOT NULL DEFAULT 1,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS RecurringExpense_dayOfMonth_idx ON RecurringExpense(dayOfMonth);
CREATE INDEX IF NOT EXISTS RecurringExpense_isActive_idx ON RecurringExpense(isActive);
CREATE INDEX IF NOT EXISTS RecurringExpense_category_idx ON RecurringExpense(category);
