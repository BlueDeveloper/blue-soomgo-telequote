CREATE TABLE IF NOT EXISTS form_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  carrier_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  label TEXT NOT NULL DEFAULT '',
  pages TEXT NOT NULL DEFAULT '[]',
  is_active INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_fv_carrier ON form_versions(carrier_id);
