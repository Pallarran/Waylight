// Direct test of email sending functionality
// Run this in your browser console on your Waylight app page

async function testDirectEmail() {
    console.log('🧪 Testing direct email sending...');

    // Your JWT token from the form
    const token = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IlY4WWtNLzNyaGRRZ0xEL2siLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3pjbHpodmtvcXdlbGhmeGFoYWx5LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJhODlhZmIxZi02NTY4LTRmMzYtODdhNS1jN2EwZmIzYmE1ZWEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU4MTYxODc5LCJpYXQiOjE3NTgxNTgyNzksImVtYWlsIjoidmluY2VudC5qdXRlYXVAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6InZpbmNlbnQuanV0ZWF1QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJWaW5jZW50IEp1dGVhdSIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiYTg5YWZiMWYtNjU2OC00ZjM2LTg3YTUtYzdhMGZiM2JhNWVhIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoib3RwIiwidGltZXN0YW1wIjoxNzU3NTUzMzA5fV0sInNlc3Npb25faWQiOiI4ZjBhODJlNC1jMDllLTQ0M2EtYmFlMC0xZTJiMjA4NGEwMjYiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.aD8DCY73euUnDdB4vOmhhWGvXVw9uSlYZYLSAoGSgag';

    const testData = {
        invitationId: 'e4017bf6-a2d8-4be7-be98-f91f896eeca8',
        invitedEmail: 'vincent.juteau@gmail.com',
        inviterName: 'Vincent Juteau',
        tripName: 'Test Disney World Adventure',
        invitationToken: 'test_token_199a9f28f9',
        permissionLevel: 'edit',
        message: 'Testing the email service!',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    try {
        console.log('📤 Sending request with data:', testData);

        const response = await fetch('https://zclzhvkoqwelhfxahaly.supabase.co/functions/v1/send-invitation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(testData)
        });

        console.log('📥 Response status:', response.status);

        const responseData = await response.json();
        console.log('📥 Response data:', responseData);

        if (response.ok) {
            console.log('✅ Success! Email sent successfully!');
            console.log('📧 Email ID:', responseData.emailId);
        } else {
            console.error('❌ Error:', responseData.error);
            console.error('📋 Details:', responseData.details);
        }

        return responseData;

    } catch (error) {
        console.error('❌ Network error:', error);
        return { error: error.message };
    }
}

// Call the function
testDirectEmail();

console.log('📋 Instructions:');
console.log('1. Copy this entire script');
console.log('2. Open your Waylight app (http://localhost:3000)');
console.log('3. Open browser console (F12)');
console.log('4. Paste and run the script');
console.log('5. Check console output for detailed debugging');