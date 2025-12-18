
-- Helper function to execute arbitrary SQL
-- This allows us to run migrations from the client side without direct DB access
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
END;
$$;
