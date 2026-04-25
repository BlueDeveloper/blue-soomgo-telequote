CREATE TABLE IF NOT EXISTS carriers (
  id TEXT PRIMARY KEY,
  icon TEXT NOT NULL,
  icon_style TEXT NOT NULL DEFAULT 'serviceIconBlue',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  forms TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  parent_id TEXT DEFAULT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  carrier_id TEXT NOT NULL,
  name TEXT NOT NULL,
  monthly INTEGER NOT NULL,
  base_fee INTEGER NOT NULL,
  discount INTEGER NOT NULL DEFAULT 0,
  voice TEXT NOT NULL,
  sms TEXT NOT NULL,
  data TEXT NOT NULL,
  qos TEXT NOT NULL DEFAULT '-',
  type TEXT NOT NULL CHECK(type IN ('postpaid','prepaid')),
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_plans_carrier ON plans(carrier_id);
CREATE INDEX IF NOT EXISTS idx_plans_type ON plans(type);
