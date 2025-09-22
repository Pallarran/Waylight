-- Migration 008: Fix RLS policies for live_entertainment table
-- Add write policies to match live_attractions table permissions

-- Add INSERT/UPDATE/DELETE policies for authenticated users (match live_attractions)
CREATE POLICY "Allow authenticated users to insert live_entertainment" ON live_entertainment
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update live_entertainment" ON live_entertainment
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete live_entertainment" ON live_entertainment
  FOR DELETE TO authenticated USING (true);

-- Also add service role policies (for background services)
CREATE POLICY "Service role full access for live_entertainment" ON live_entertainment
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Add helpful comment
COMMENT ON TABLE live_entertainment IS 'Real-time entertainment and show schedules - RLS policies updated to allow authenticated user writes';