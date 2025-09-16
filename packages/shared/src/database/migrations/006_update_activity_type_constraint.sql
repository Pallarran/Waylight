-- Update Activity Type Constraint Migration
-- This updates the check constraint to include all possible activity types

-- Drop the existing constraint
ALTER TABLE activity_ratings DROP CONSTRAINT IF EXISTS activity_ratings_activity_type_check;

-- Add the updated constraint with all activity types
ALTER TABLE activity_ratings ADD CONSTRAINT activity_ratings_activity_type_check
CHECK (activity_type IN (
  'ride', 'show', 'dining', 'meet_greet', 'shopping', 'attraction',
  'waterpark', 'tours', 'special_events', 'quick_service', 'table_service',
  'snack', 'lounge', 'experience', 'walkthrough', 'entertainment',
  'transportation', 'parade'
));

-- Update the activity_rating_summaries table constraint as well
ALTER TABLE activity_rating_summaries DROP CONSTRAINT IF EXISTS activity_rating_summaries_activity_type_check;

ALTER TABLE activity_rating_summaries ADD CONSTRAINT activity_rating_summaries_activity_type_check
CHECK (activity_type IN (
  'ride', 'show', 'dining', 'meet_greet', 'shopping', 'attraction',
  'waterpark', 'tours', 'special_events', 'quick_service', 'table_service',
  'snack', 'lounge', 'experience', 'walkthrough', 'entertainment',
  'transportation', 'parade'
));