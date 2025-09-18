# Check Edge Function Logs

To see what's happening in the Edge Function:

1. **Go to Supabase Dashboard**
2. **Navigate to Edge Functions**
3. **Click on "send-invitation"**
4. **Go to the "Logs" tab**
5. **Look for recent entries** (should show logs from your test attempts)

The logs will show the exact error that's happening in the database query.

## Most likely issues:

1. **RLS Policy blocking the join query** - The trips table RLS might be interfering
2. **Missing relationship in schema** - The join between trip_invitations and trips might not work
3. **Column name mismatch** - Field names might not match what the query expects

## Temporary fix - Test with simple query

Let's modify the Edge Function to use a simpler query without the complex join.