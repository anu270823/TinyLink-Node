-- migrations.sql
CREATE TABLE IF NOT EXISTS links (
  code VARCHAR(8) PRIMARY KEY,
  url TEXT NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_clicked TIMESTAMPTZ
);
