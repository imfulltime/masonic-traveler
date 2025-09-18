'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DebugPage() {
  const { user, loading, isVerified, signIn, signOut } = useAuth();
  const router = useRouter();
  const [testEmail, setTestEmail] = useState('brother1@example.com');
  const [testPassword, setTestPassword] = useState('masonic123');
  const [loginError, setLoginError] = useState('');

  const testAccounts = [
    { email: 'secretary.sf@example.com', verified: true, role: 'secretary', name: 'Robert' },
    { email: 'brother1@example.com', verified: true, role: 'brother', name: 'Thomas' },
    { email: 'newbro1@example.com', verified: false, role: 'brother', name: 'Matthew' },
    { email: 'admin@masonictraveler.com', verified: true, role: 'admin', name: 'Admin' }
  ];

  const handleTestLogin = async () => {
    try {
      setLoginError('');
      console.log('🧪 Testing login with:', testEmail);
      await signIn(testEmail, testPassword);
    } catch (error: any) {
      setLoginError(error.message);
      console.error('❌ Login error:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const goToDashboard = () => {
    router.push('/dashboard');
  };

  const goToVerification = () => {
    router.push('/verification/required');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Debug Page
          </h1>
          <p className="text-gray-600">
            Test login and check authentication state
          </p>
        </div>

        {/* Current Auth State */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Current Authentication State</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Auth Status</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Loading:</span> {loading ? '✅ True' : '❌ False'}</p>
                <p><span className="font-medium">User exists:</span> {user ? '✅ True' : '❌ False'}</p>
                <p><span className="font-medium">Is verified:</span> {isVerified ? '✅ True' : '❌ False'}</p>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">User Data</h3>
              {user ? (
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">ID:</span> {user.id}</p>
                  <p><span className="font-medium">Email:</span> {user.email}</p>
                  <p><span className="font-medium">Name:</span> {user.first_name}</p>
                  <p><span className="font-medium">Role:</span> {user.role}</p>
                  <p><span className="font-medium">Verified:</span> {user.is_verified ? '✅' : '❌'}</p>
                  <p><span className="font-medium">Lodge:</span> {user.lodge?.name || 'None'}</p>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No user data</p>
              )}
            </div>
          </div>
        </div>

        {/* Login Test */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Login</h2>
          
          {/* Test Account Buttons */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Quick Test Accounts:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {testAccounts.map((account) => (
                <button
                  key={account.email}
                  onClick={() => {
                    setTestEmail(account.email);
                    setTestPassword('masonic123');
                  }}
                  className={`p-3 text-left border rounded-lg hover:border-gray-300 transition-colors ${
                    testEmail === account.email ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="font-medium text-gray-900">{account.name}</div>
                  <div className="text-sm text-gray-600">{account.email}</div>
                  <div className="text-xs text-gray-500">
                    {account.role} • {account.verified ? 'verified' : 'unverified'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Login Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {loginError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{loginError}</p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleTestLogin}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Test Login'}
              </button>
              
              {user && (
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Test */}
        {user && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Test Navigation</h2>
            <div className="space-y-3">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-900 font-medium mb-2">Expected Behavior:</p>
                <p className="text-blue-800 text-sm">
                  {isVerified 
                    ? '✅ Should redirect to /dashboard (user is verified)'
                    : '⚠️ Should redirect to /verification/required (user not verified)'
                  }
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={goToDashboard}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={goToVerification}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                >
                  Go to Verification
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Console Logs */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Instructions</h2>
          <div className="prose prose-sm text-gray-600">
            <ol>
              <li>Open browser dev tools (F12) and go to Console tab</li>
              <li>Select a test account and click "Test Login"</li>
              <li>Watch the console logs to see the authentication flow</li>
              <li>Check if the redirect logic triggers correctly</li>
            </ol>
            <p className="mt-4 font-medium">Look for these console messages:</p>
            <ul>
              <li><code>Auth state change: SIGNED_IN</code></li>
              <li><code>Loading user data...</code></li>
              <li><code>User data loaded:</code></li>
              <li><code>Login redirect useEffect:</code></li>
              <li><code>Redirecting user...</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
