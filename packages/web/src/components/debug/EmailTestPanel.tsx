import React, { useState } from 'react';
import { supabase } from '@waylight/shared';
import { Send, Clock, CheckCircle, XCircle } from 'lucide-react';

interface EmailTestResult {
  step: string;
  status: 'pending' | 'success' | 'error';
  duration?: number;
  details?: any;
  error?: string;
}

export default function EmailTestPanel() {
  const [testEmail, setTestEmail] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<EmailTestResult[]>([]);

  const runEmailTest = async () => {
    if (!testEmail.trim()) {
      alert('Please enter a test email address');
      return;
    }

    setIsRunning(true);
    setResults([]);

    const addResult = (step: string, status: 'pending' | 'success' | 'error', details?: any, error?: string, duration?: number) => {
      setResults(prev => [...prev.filter(r => r.step !== step), { step, status, details, error, duration }]);
    };

    try {
      // Test 1: Check session
      addResult('Getting session', 'pending');
      const sessionStart = Date.now();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      const sessionTime = Date.now() - sessionStart;

      if (sessionError || !session) {
        addResult('Getting session', 'error', null, sessionError?.message || 'No session found', sessionTime);
        return;
      }
      addResult('Getting session', 'success', { userId: session.user.id }, undefined, sessionTime);

      // Test 2: Prepare test data
      addResult('Preparing email data', 'pending');
      const emailData = {
        invitationId: 'test_invitation_id',
        invitedEmail: testEmail.trim(),
        inviterName: session.user.email || 'Test User',
        tripName: 'Email Test Trip',
        invitationToken: `test_${Date.now()}`,
        permissionLevel: 'edit',
        message: 'This is a test email from Waylight collaboration system',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };
      addResult('Preparing email data', 'success', emailData);

      // Test 3: Call Edge Function
      addResult('Calling Edge Function', 'pending');
      const edgeStart = Date.now();

      const { data, error } = await Promise.race([
        supabase.functions.invoke('send-invitation-simple', {
          body: emailData,
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout after 30 seconds')), 30000)
        )
      ]) as any;

      const edgeTime = Date.now() - edgeStart;

      if (error) {
        addResult('Calling Edge Function', 'error', data, error.message, edgeTime);
        return;
      }

      addResult('Calling Edge Function', 'success', data, undefined, edgeTime);

      // Test 4: Verify email response
      addResult('Verifying response', 'pending');
      if (data?.emailId) {
        addResult('Verifying response', 'success', { emailId: data.emailId, success: data.success });
      } else {
        addResult('Verifying response', 'error', data, 'No email ID in response');
      }

    } catch (error) {
      addResult('Test execution', 'error', null, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: EmailTestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Send className="w-5 h-5 mr-2" />
        Email System Diagnostic
      </h3>

      <div className="space-y-4">
        <div className="flex space-x-3">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="test@example.com"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-sea focus:border-transparent"
            disabled={isRunning}
          />
          <button
            onClick={runEmailTest}
            disabled={isRunning || !testEmail.trim()}
            className="px-4 py-2 bg-sea text-white rounded-md hover:bg-sea/80 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isRunning ? 'Testing...' : 'Test Email'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Test Results:</h4>
            {results.map((result, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-md border">
                {getStatusIcon(result.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{result.step}</span>
                    {result.duration && (
                      <span className="text-xs text-gray-500">{result.duration}ms</span>
                    )}
                  </div>
                  {result.error && (
                    <p className="text-xs text-red-600 mt-1">{result.error}</p>
                  )}
                  {result.details && (
                    <details className="mt-1">
                      <summary className="text-xs text-gray-500 cursor-pointer">Details</summary>
                      <pre className="text-xs text-gray-600 mt-1 overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>How to use:</strong> Enter your email address and click "Test Email" to diagnose the email sending process.
          This will show you timing information for each step and help identify where delays or failures occur.
        </p>
      </div>
    </div>
  );
}