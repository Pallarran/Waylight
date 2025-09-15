-- Add helper function for atomic sync status updates
-- This ensures consistent updates to sync counters

CREATE OR REPLACE FUNCTION update_sync_status(
  p_service_name text,
  p_success boolean,
  p_error_message text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO live_sync_status (
    service_name,
    last_sync_at,
    last_success_at,
    last_error,
    total_syncs,
    successful_syncs,
    failed_syncs
  ) VALUES (
    p_service_name,
    NOW(),
    CASE WHEN p_success THEN NOW() ELSE NULL END,
    CASE WHEN p_success THEN NULL ELSE p_error_message END,
    1,
    CASE WHEN p_success THEN 1 ELSE 0 END,
    CASE WHEN p_success THEN 0 ELSE 1 END
  )
  ON CONFLICT (service_name) DO UPDATE SET
    last_sync_at = NOW(),
    last_success_at = CASE
      WHEN p_success THEN NOW()
      ELSE live_sync_status.last_success_at
    END,
    last_error = CASE
      WHEN p_success THEN NULL
      ELSE p_error_message
    END,
    total_syncs = live_sync_status.total_syncs + 1,
    successful_syncs = live_sync_status.successful_syncs + CASE WHEN p_success THEN 1 ELSE 0 END,
    failed_syncs = live_sync_status.failed_syncs + CASE WHEN p_success THEN 0 ELSE 1 END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_sync_status(text, boolean, text) TO authenticated;

COMMENT ON FUNCTION update_sync_status IS 'Atomically updates sync status with proper counter increments';