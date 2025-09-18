-- Create a test invitation for email testing
-- Run this in Supabase SQL Editor

-- First, let's find your user ID and create a test trip
-- Replace 'vincent.juteau@gmail.com' with your actual email if different
DO $$
DECLARE
    user_uuid uuid;
    test_trip_id uuid;
    test_invitation_id uuid;
    test_token text;
BEGIN
    -- Get your user ID
    SELECT id INTO user_uuid
    FROM auth.users
    WHERE email = 'vincent.juteau@gmail.com';

    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'User not found. Please update the email in this script.';
    END IF;

    -- Generate IDs and token
    test_trip_id := gen_random_uuid();
    test_invitation_id := gen_random_uuid();
    test_token := 'test_token_' || substr(md5(random()::text), 1, 10);

    -- Create a test trip
    INSERT INTO trips (
        id, user_id, name, start_date, end_date,
        notes, days, created_at, updated_at,
        is_shared, version
    ) VALUES (
        test_trip_id,
        user_uuid,
        'Test Disney World Adventure',
        CURRENT_DATE + INTERVAL '30 days',
        CURRENT_DATE + INTERVAL '37 days',
        'This is a test trip for email testing',
        '[]'::jsonb,
        NOW(),
        NOW(),
        true,
        1
    );

    -- Create a test invitation
    INSERT INTO trip_invitations (
        id, trip_id, invited_email, invited_by,
        permission_level, invitation_token, message,
        expires_at, created_at, updated_at
    ) VALUES (
        test_invitation_id,
        test_trip_id,
        'test@example.com', -- Change this to your test email
        user_uuid,
        'edit',
        test_token,
        'Join me for an amazing Disney World adventure!',
        NOW() + INTERVAL '7 days',
        NOW(),
        NOW()
    );

    -- Output the test data for use in the email test
    RAISE NOTICE 'Test invitation created successfully!';
    RAISE NOTICE 'Use these values in your email test:';
    RAISE NOTICE 'Invitation ID: %', test_invitation_id;
    RAISE NOTICE 'Invitation Token: %', test_token;
    RAISE NOTICE 'Trip ID: %', test_trip_id;

END $$;