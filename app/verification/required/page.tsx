'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { VerificationService } from '@/lib/verification';
import { useAuth } from '@/components/AuthProvider';
import { Lodge } from '@/types';
import { Shield, Search, Users, CheckCircle } from 'lucide-react';

export default function VerificationRequiredPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [step, setStep] = useState<'choose' | 'lodge-search' | 'secretary' | 'vouch'>('choose');
  const [lodges, setLodges] = useState<Lodge[]>([]);
  const [selectedLodge, setSelectedLodge] = useState<Lodge | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // If user is already verified, redirect to dashboard
    if (user?.is_verified) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const searchLodges = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      const results = await VerificationService.searchLodges(searchQuery);
      setLodges(results);
    } catch (err: any) {
      setError(err.message || 'Error searching lodges');
    } finally {
      setLoading(false);
    }
  };

  const handleSecretaryVerification = async () => {
    if (!selectedLodge) return;
    
    try {
      setSubmitting(true);
      await VerificationService.requestSecretaryVerification(selectedLodge.id);
      
      // Show success message and redirect
      alert('Verification request submitted! A secretary will review your request.');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error submitting verification request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVouchVerification = async () => {
    if (!selectedLodge) return;
    
    try {
      setSubmitting(true);
      await VerificationService.requestVouchVerification(selectedLodge.id);
      
      // Show success message and redirect
      alert('Verification request submitted! Ask verified brethren to vouch for you.');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error submitting verification request');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'choose') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Shield className="h-16 w-16 text-primary-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Verification Required
            </h2>
            <p className="text-gray-600">
              To access Masonic Traveler's features, you need to be verified by a Lodge Secretary.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setStep('lodge-search')}
              className="w-full card hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Secretary Verification</h3>
                  <p className="text-sm text-gray-600">
                    Direct approval from your Lodge Secretary (recommended)
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setStep('lodge-search')}
              className="w-full card hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Vouch Verification</h3>
                  <p className="text-sm text-gray-600">
                    Get vouched by verified brethren, then secretary approval
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Why verification?</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Ensures only genuine Masons access the platform</p>
              <p>• Protects privacy and maintains fraternal integrity</p>
              <p>• Required for nearby brethren, messaging, and events</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'lodge-search') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Find Your Lodge
            </h2>
            <p className="text-gray-600">
              Search for your lodge to begin the verification process
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="card">
            <div className="flex space-x-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by lodge name, city, or Grand Lodge..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10"
                  onKeyPress={(e) => e.key === 'Enter' && searchLodges()}
                />
              </div>
              <button
                onClick={searchLodges}
                disabled={!searchQuery.trim() || loading}
                className="btn-primary"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {lodges.length > 0 && (
              <div className="space-y-2">
                {lodges.map((lodge) => (
                  <div
                    key={lodge.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedLodge?.id === lodge.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedLodge(lodge)}
                  >
                    <h3 className="font-medium text-gray-900">
                      {lodge.name} #{lodge.number}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {lodge.grand_lodge} • District {lodge.district}
                    </p>
                    <p className="text-sm text-gray-500">
                      {lodge.city}, {lodge.country}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {selectedLodge && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">
                  Choose verification method for {selectedLodge.name}:
                </h4>
                
                <div className="space-y-3">
                  <button
                    onClick={() => setStep('secretary')}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <div>
                        <h5 className="font-medium text-gray-900">Secretary Verification</h5>
                        <p className="text-sm text-gray-600">Direct approval from your Secretary</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setStep('vouch')}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Users className="h-6 w-6 text-blue-600" />
                      <div>
                        <h5 className="font-medium text-gray-900">Vouch Verification</h5>
                        <p className="text-sm text-gray-600">Get vouched by verified brethren</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="text-center">
            <button
              onClick={() => setStep('choose')}
              className="btn-secondary"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'secretary') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Secretary Verification
            </h2>
            <p className="text-gray-600">
              Request verification from your Lodge Secretary
            </p>
          </div>

          {selectedLodge && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">Selected Lodge:</h3>
              <div className="mb-4">
                <h4 className="font-medium text-gray-900">
                  {selectedLodge.name} #{selectedLodge.number}
                </h4>
                <p className="text-sm text-gray-600">
                  {selectedLodge.grand_lodge} • District {selectedLodge.district}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedLodge.city}, {selectedLodge.country}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-900 mb-2">What happens next:</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>1. Your request will be sent to the Lodge Secretary</p>
                  <p>2. The Secretary will verify your membership</p>
                  <p>3. Once approved, you'll have full access to all features</p>
                  <p>4. You'll receive a notification when verified</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('lodge-search')}
                  className="btn-secondary flex-1"
                >
                  Back
                </button>
                <button
                  onClick={handleSecretaryVerification}
                  disabled={submitting}
                  className="btn-primary flex-1"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'vouch') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Users className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Vouch Verification
            </h2>
            <p className="text-gray-600">
              Get vouched by verified brethren, then secretary approval
            </p>
          </div>

          {selectedLodge && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">Selected Lodge:</h3>
              <div className="mb-4">
                <h4 className="font-medium text-gray-900">
                  {selectedLodge.name} #{selectedLodge.number}
                </h4>
                <p className="text-sm text-gray-600">
                  {selectedLodge.grand_lodge} • District {selectedLodge.district}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedLodge.city}, {selectedLodge.country}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-900 mb-2">How vouch verification works:</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>1. Your request is created and awaits vouches</p>
                  <p>2. Ask verified brethren you know to vouch for you</p>
                  <p>3. At least 1 verified vouch is required</p>
                  <p>4. The Lodge Secretary reviews and approves</p>
                  <p>5. You'll be notified when verified</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('lodge-search')}
                  className="btn-secondary flex-1"
                >
                  Back
                </button>
                <button
                  onClick={handleVouchVerification}
                  disabled={submitting}
                  className="btn-primary flex-1"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
