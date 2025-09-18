-- Get the test invitation data that was just created
SELECT
    ti.id as invitation_id,
    ti.invitation_token,
    ti.trip_id,
    ti.invited_email,
    t.name as trip_name
FROM trip_invitations ti
JOIN trips t ON t.id = ti.trip_id
WHERE ti.invited_email = 'test@example.com'
ORDER BY ti.created_at DESC
LIMIT 1;