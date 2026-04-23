-- RunOut personal fields table.
-- `data` is an AES-GCM encrypted JSON blob (base64, with 12-byte IV prefix).
-- Field shape after decryption (all optional):
--   { price: number, currency: string, purchase_date: string,
--     location: string, notes: string, tags: string[] }

CREATE TABLE IF NOT EXISTS user_fields (
  user_id INTEGER NOT NULL,
  release_id INTEGER NOT NULL,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, release_id)
);

CREATE INDEX IF NOT EXISTS idx_user_updated
  ON user_fields(user_id, updated_at DESC);
