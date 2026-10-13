-- One row per order request. Photos live in R2 under <id>/<n>.jpg.
CREATE TABLE IF NOT EXISTS orders (
  id          TEXT PRIMARY KEY,           -- e.g. ORD-261013-7KQ2
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  description TEXT NOT NULL,
  lang        TEXT NOT NULL DEFAULT 'en',
  photos      TEXT NOT NULL DEFAULT '[]', -- JSON array of R2 keys
  status      TEXT NOT NULL DEFAULT 'new',-- new, quoted, deposit_paid, in_progress, firing, ready, delivered, cancelled
  ip_hash     TEXT,                       -- for rate limiting only, never the raw IP
  notes       TEXT                        -- the owner's own notes (admin page, later)
);
CREATE INDEX IF NOT EXISTS orders_created ON orders (created_at);
CREATE INDEX IF NOT EXISTS orders_ip ON orders (ip_hash, created_at);
