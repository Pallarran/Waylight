// Test the simplified email function
// Run this in your browser console

async function testSimpleEmailFunction() {
    console.log('🧪 Testing simplified email function...');

    const token = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IlY4WWtNLzNyaGRRZ0xEL2siLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3pjbHpodmtvcXdlbGhmeGFoYWx5LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJhODlhZmIxZi02NTY4LTRmMzYtODdhNS1jN2EwZmIzYmE1ZWEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU4MTYxODc5LCJpYXQiOjE3NTgxNTgyNzksImVtYWlsIjoidmluY2VudC5qdXRlYXVAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6InZpbmNlbnQuanV0ZWF1QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJWaW5jZW50IEp1dGVhdSIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiYTg5YWZiMWYtNjU2OC00ZjM2LTg3YTUtYzdhMGZiM2JhNWVhIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoib3RwIiwidGltZXN0YW1wIjoxNzU3NTUzMzA5fV0sInNlc3Npb25faWQiOiI4ZjBhODJlNC1jMDllLTQ0M2EtYmFlMC0xZTJiMjA4NGEwMjYiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.aD8DCY73euUnDdB4vOmhhWGvXVw9uSlYZYLSAoGSgag';

    const testData = {
        invitationId: 'simple-test-' + Date.now(),
        invitedEmail: 'vincent.juteau@gmail.com',
        inviterName: 'Vincent Juteau',
        tripName: '🧪 Test Disney World Adventure',
        invitationToken: 'simple-test-token',
        permissionLevel: 'edit',
        message: '🧪 Testing the simplified email service - this should work!',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    try {
        console.log('📤 Calling simplified function...');

        const response = await fetch('https://zclzhvkoqwelhfxahaly.supabase.co/functions/v1/send-invitation-simple', {
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
            console.log('🎉 SUCCESS! Email sent successfully!');
            console.log('📧 Email ID:', responseData.emailId);
            console.log('✅ Your email service is working correctly!');
            alert('🎉 SUCCESS! Check your email inbox for the test email!');
        } else {
            console.error('❌ Error:', responseData.error);
        }

        return responseData;

    } catch (error) {
        console.error('❌ Network error:', error);
        return { error: error.message };
    }
}

// Run the test
testSimpleEmailFunction();