-- The "全部" wall lists the latest cards across all roles.
CREATE INDEX shares_recent ON shares (created_at DESC);
