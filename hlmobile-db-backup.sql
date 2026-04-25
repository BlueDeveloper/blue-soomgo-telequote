PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE carriers (
  id TEXT PRIMARY KEY,
  icon TEXT NOT NULL,
  icon_style TEXT NOT NULL DEFAULT 'serviceIconBlue',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  forms TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
, parent_id TEXT DEFAULT NULL, payment_type TEXT DEFAULT 'both' CHECK(payment_type IN ('postpaid','prepaid','both')));
INSERT INTO "carriers" ("id","icon","icon_style","title","description","forms","sort_order","is_active","created_at","updated_at","parent_id","payment_type") VALUES('skt','https://hlmobile-api.raon-foodtruck.workers.dev/r2/icons/1777134235802-lhoyfa.png','serviceIconOrange','SK텔레콤','SKT 망','',1,1,'2026-04-25 10:52:47','2026-04-25 16:25:14',NULL,'both');
INSERT INTO "carriers" ("id","icon","icon_style","title","description","forms","sort_order","is_active","created_at","updated_at","parent_id","payment_type") VALUES('kt','https://hlmobile-api.raon-foodtruck.workers.dev/r2/icons/1777134307046-swtb32.png','serviceIconBlue','KT','KT 망','',2,1,'2026-04-25 10:52:47','2026-04-25 16:25:07',NULL,'both');
INSERT INTO "carriers" ("id","icon","icon_style","title","description","forms","sort_order","is_active","created_at","updated_at","parent_id","payment_type") VALUES('lgu','https://hlmobile-api.raon-foodtruck.workers.dev/r2/icons/1777134911599-f4hxm3.png','serviceIconPurple','LG U+','LGU+ 망','',3,1,'2026-04-25 10:52:47','2026-04-25 16:35:13',NULL,'both');
CREATE TABLE plans (
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
CREATE TABLE notices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  reply TEXT DEFAULT NULL,
  replied_at TEXT DEFAULT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('plans',6);
CREATE INDEX idx_plans_carrier ON plans(carrier_id);
CREATE INDEX idx_plans_type ON plans(type);
