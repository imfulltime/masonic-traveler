'use client';

import { useEffect, useState } from 'react';
import { Square, Users, Calendar, MapPin, Shield } from 'lucide-react';

export default function HomePage() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="masonic-gradient text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Square className="h-8 w-8" />
              <h1 className="text-2xl font-bold">Masonic Traveler</h1>
            </div>
            {showInstallPrompt && (
              <button
                onClick={handleInstallClick}
                className="btn bg-white/20 text-white border border-white/30 hover:bg-white/30"
              >
                Install App
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Connect with Brethren Nearby
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            A privacy-first platform for verified Masons to find nearby brethren, 
            discover lodge meetings, and participate in fraternal activities.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="card text-center">
              <Users className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Find Brethren</h3>
              <p className="text-gray-600 text-sm">
                Discover verified Masons within your chosen radius
              </p>
            </div>
            
            <div className="card text-center">
              <Calendar className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Lodge Meetings</h3>
              <p className="text-gray-600 text-sm">
                See nearby meetings in the next 7 days and RSVP
              </p>
            </div>
            
            <div className="card text-center">
              <MapPin className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Privacy First</h3>
              <p className="text-gray-600 text-sm">
                Your exact location is never shared or stored
              </p>
            </div>
            
            <div className="card text-center">
              <Shield className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Verified Only</h3>
              <p className="text-gray-600 text-sm">
                Secretary approval ensures genuine brotherhood
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-4 bg-gray-100">
        <div className="container mx-auto text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Connect?
          </h3>
          <p className="text-gray-600 mb-8">
            Join the community of traveling Masons and strengthen the bonds of brotherhood.
          </p>
          <div className="space-x-4">
            <a
              href="/auth/register"
              className="btn-masonic inline-block"
            >
              Get Started
            </a>
            <a
              href="/auth/login"
              className="btn-secondary inline-block"
            >
              Sign In
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Square className="h-6 w-6" />
            <span className="font-semibold">Masonic Traveler</span>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            An independent platform for the traveling Mason. Not officially affiliated with any Grand Lodge.
          </p>
          <div className="text-xs text-gray-500">
            <span>Privacy by design</span> • <span>Brotherhood first</span> • <span>Open source</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
