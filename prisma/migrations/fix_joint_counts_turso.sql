-- Fix entries that have hasSmoked=true but jointCount=0 or NULL
-- These entries won't appear in the sobriety counter because the query searches for jointCount > 0

UPDATE Entry
SET jointCount = 1
WHERE hasSmoked = 1
  AND (jointCount = 0 OR jointCount IS NULL);

-- Verify the fix
SELECT
  COUNT(*) as broken_entries
FROM Entry
WHERE hasSmoked = 1
  AND (jointCount = 0 OR jointCount IS NULL);
-- This should return 0 after the fix
