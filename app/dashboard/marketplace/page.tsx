'use client';

import { useState, useEffect } from 'react';
import { MarketplaceService } from '@/lib/marketplace';
import { useAuth } from '@/components/AuthProvider';
import { Business } from '@/types';
import { 
  Store, 
  Search, 
  Filter, 
  MapPin, 
  ExternalLink, 
  Mail,
  Plus,
  Building
} from 'lucide-react';

export default function MarketplacePage() {
  const { isVerified } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  const [filters, setFilters] = useState({
    category: '',
    city: '',
    search: '',
  });

  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      loadBusinesses();
    }
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [businessesData, categoriesData, citiesData] = await Promise.all([
        MarketplaceService.getBusinesses(),
        MarketplaceService.getCategories(),
        MarketplaceService.getCities(),
      ]);
      
      setBusinesses(businessesData);
      setCategories(categoriesData);
      setCities(citiesData);
    } catch (err: any) {
      setError(err.message || 'Error loading marketplace data');
    } finally {
      setLoading(false);
    }
  };

  const loadBusinesses = async () => {
    try {
      const businessesData = await MarketplaceService.getBusinesses(filters);
      setBusinesses(businessesData);
    } catch (err: any) {
      setError(err.message || 'Error loading businesses');
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      city: '',
      search: '',
    });
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      regalia: '👔',
      hotel: '🏨',
      restaurant: '🍽️',
      bookstore: '📚',
      jewelry: '💍',
      financial: '💰',
      travel: '✈️',
      retail: '🛍️',
      services: '🔧',
    };
    
    return icons[category.toLowerCase()] || '🏢';
  };

  const formatWebsite = (website: string | null) => {
    if (!website) return null;
    
    if (website.startsWith('http://') || website.startsWith('https://')) {
      return website;
    }
    
    return `https://${website}`;
  };

  const getContactType = (contact: string | null) => {
    if (!contact) return null;
    
    if (contact.includes('@')) return 'email';
    if (contact.match(/^\+?[\d\s()-]+$/)) return 'phone';
    return 'other';
  };

  if (!isVerified) {
    return (
      <div className="p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <Store className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-yellow-900 mb-2">
            Verification Required
          </h2>
          <p className="text-yellow-700">
            You need to be verified to access the Masonic business directory.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
          <p className="text-gray-600">Masonic-friendly businesses and services</p>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Business
        </button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search businesses, services, or locations..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="input pl-10"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="input flex-1"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={filters.city}
            onChange={(e) => handleFilterChange('city', e.target.value)}
            className="input flex-1"
          >
            <option value="">All Cities</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          {(filters.category || filters.city || filters.search) && (
            <button
              onClick={clearFilters}
              className="btn-secondary whitespace-nowrap"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button
            onClick={loadData}
            className="mt-2 btn-secondary text-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">
            {businesses.length} Business{businesses.length !== 1 ? 'es' : ''}
          </h2>
        </div>

        {businesses.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Building className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filters.category || filters.city || filters.search
                ? 'No businesses found'
                : 'No businesses yet'
              }
            </h3>
            <p>
              {filters.category || filters.city || filters.search
                ? 'Try adjusting your search or filters'
                : 'Be the first to add a Masonic-friendly business!'
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.map((business) => (
              <div key={business.id} className="card">
                <div className="flex items-start space-x-3 mb-3">
                  <div className="text-2xl">
                    {getCategoryIcon(business.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {business.name}
                    </h3>
                    <p className="text-sm text-gray-600 capitalize">
                      {business.category}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {business.city}, {business.country}
                    </span>
                  </div>

                  {business.lodge_proximity_km && (
                    <p className="text-xs text-blue-600">
                      ~{business.lodge_proximity_km}km from nearest lodge
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    {business.website && (
                      <a
                        href={formatWebsite(business.website) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Visit website"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}

                    {business.contact && getContactType(business.contact) === 'email' && (
                      <a
                        href={`mailto:${business.contact}`}
                        className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Send email"
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                    )}

                    {business.contact && getContactType(business.contact) === 'phone' && (
                      <a
                        href={`tel:${business.contact}`}
                        className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Call"
                      >
                        📞
                      </a>
                    )}
                  </div>

                  <span className="text-xs text-gray-500">
                    Added {new Date(business.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">About the Marketplace</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• This is a community-driven directory of Masonic-friendly businesses</p>
          <p>• Listings are submitted by verified brethren and reviewed by admins</p>
          <p>• No payment processing - contact businesses directly</p>
          <p>• Report any issues to help maintain quality</p>
        </div>
      </div>

      {/* Add Business Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Business</h3>
            <p className="text-gray-600 mb-4">
              Submit a Masonic-friendly business for review and inclusion in our directory.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddForm(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // This would open a proper form
                  alert('Add business form would open here');
                  setShowAddForm(false);
                }}
                className="btn-primary flex-1"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
