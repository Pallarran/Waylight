-- Update the test invitation to use your actual email
-- Replace 'vincent.juteau@gmail.com' with your actual email if different

UPDATE trip_invitations
SET invited_email = 'vincent.juteau@gmail.com'
WHERE id = 'e4017bf6-a2d8-4be7-be98-f91f896eeca8';

-- Verify the update
SELECT
    ti.id as invitation_id,
    ti.invitation_token,
    ti.invited_email,
    ti.invited_by,
    t.user_id as trip_owner,
    t.name as trip_name
FROM trip_invitations ti
JOIN trips t ON t.id = ti.trip_id
WHERE ti.id = 'e4017bf6-a2d8-4be7-be98-f91f896eeca8';