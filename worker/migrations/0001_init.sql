-- One row per shared card. board/marked are JSON arrays of prompt IDs.
CREATE TABLE shares (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  board TEXT NOT NULL,
  marked TEXT NOT NULL,
  lines INTEGER NOT NULL,
  marked_count INTEGER NOT NULL,
  nickname TEXT NOT NULL DEFAULT '',
  nickname_hidden INTEGER NOT NULL DEFAULT 0,
  lang TEXT NOT NULL,
  client_hash TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  board_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
-- Same anonymous client cannot share the same board twice.
CREATE UNIQUE INDEX shares_client_board ON shares (client_hash, board_hash);
-- Daily rate limits read only the matching rows.
CREATE INDEX shares_client_day ON shares (client_hash, created_at);
CREATE INDEX shares_ip_day ON shares (ip_hash, created_at);
-- Latest-cards wall per role.
CREATE INDEX shares_role_recent ON shares (role, created_at DESC);

-- Running aggregates so reading stats touches at most ~31 rows per role,
-- instead of scanning every share (keeps us far inside D1's free daily reads).
CREATE TABLE role_stats (
  role TEXT PRIMARY KEY,
  shares INTEGER NOT NULL DEFAULT 0,
  lines_sum INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE prompt_stats (
  role TEXT NOT NULL,
  prompt_id TEXT NOT NULL,
  appeared INTEGER NOT NULL DEFAULT 0,
  hits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (role, prompt_id)
);

-- One report per anonymous client per card.
CREATE TABLE reports (
  share_id TEXT NOT NULL,
  client_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (share_id, client_hash)
);
