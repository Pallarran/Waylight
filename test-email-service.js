// Quick test script for the email service
// Run this in your browser console or as a Node.js script

async function testEmailService() {
  console.log('🧪 Testing Email Service...');

  // Test data
  const testInvitation = {
    id: 'test-invitation-id',
    invitationId: 'test-invitation-id',
    invitedEmail: 'test@example.com', // Replace with your test email
    inviterName: 'Test User',
    tripName: 'Amazing Disney World Trip',
    invitationToken: 'test_token_12345',
    permissionLevel: 'edit',
    message: 'Join me for an incredible vacation!',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };

  try {
    // If running in browser with Supabase client available
    if (typeof supabase !== 'undefined') {
      const { data, error } = await supabase.functions.invoke('send-invitation', {
        body: testInvitation
      });

      if (error) {
        console.error('❌ Test failed:', error);
        return;
      }

      console.log('✅ Test email sent successfully!', data);
    } else {
      console.log('ℹ️ Browser test - please run this in your app console');
      console.log('Test data prepared:', testInvitation);
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// For Node.js testing with fetch
async function testWithFetch(supabaseUrl, supabaseKey, userToken) {
  const testData = {
    invitationId: 'test-invitation-id',
    invitedEmail: 'test@example.com', // Replace with your test email
    inviterName: 'Test User',
    tripName: 'Amazing Disney World Trip',
    invitationToken: 'test_token_12345',
    permissionLevel: 'edit',
    message: 'Join me for an incredible vacation!',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-invitation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
        'apikey': supabaseKey
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Test email sent successfully!', result);
    } else {
      console.error('❌ Test failed:', result);
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Instructions for testing
console.log(`
📧 Email Service Test Instructions:

1. Browser Testing:
   - Open your Waylight app
   - Open browser developer console
   - Paste and run: testEmailService()

2. Manual Testing:
   - Replace 'test@example.com' with your actual email
   - Use the trip sharing modal in the app
   - Send a real invitation to yourself

3. Node.js Testing:
   - Get your user JWT token from browser network tab
   - Run: testWithFetch('your-supabase-url', 'your-anon-key', 'your-user-token')

4. Check Results:
   - Look for email in inbox (and spam folder)
   - Check Supabase Edge Function logs
   - Check Resend dashboard for delivery status
`);

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testEmailService, testWithFetch };
}