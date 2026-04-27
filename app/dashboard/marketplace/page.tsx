'use client';

import { useState, useEffect } from 'react';
import { MarketplaceService } from '@/lib/marketplace';
import { useAuth } from '@/components/AuthProvider';
import { Business } from '@/types';
import {
  Store,
  Search,
  MapPin,
  ExternalLink,
  Mail,
  Plus,
  Building,
  X
} from 'lucide-react';

const BUSINESS_CATEGORIES = [
  'regalia',
  'hotel',
  'restaurant',
  'bookstore',
  'jewelry',
  'financial',
  'travel',
  'retail',
  'services',
];

interface AddBusinessForm {
  name: string;
  category: string;
  city: string;
  country: string;
  lodge_proximity_km: string;
  contact: string;
  website: string;
}

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
  const [addForm, setAddForm] = useState<AddBusinessForm>({
    name: '',
    category: '',
    city: '',
    country: '',
    lodge_proximity_km: '',
    contact: '',
    website: '',
  });
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState(false);

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

  const openAddForm = () => {
    setAddForm({ name: '', category: '', city: '', country: '', lodge_proximity_km: '', contact: '', website: '' });
    setAddError('');
    setAddSuccess(false);
    setShowAddForm(true);
  };

  const closeAddForm = () => {
    if (addSubmitting) return;
    setShowAddForm(false);
    setAddSuccess(false);
    setAddError('');
  };

  const handleAddFormChange = (key: keyof AddBusinessForm, value: string) => {
    setAddForm(prev => ({ ...prev, [key]: value }));
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.category || !addForm.city.trim() || !addForm.country.trim()) {
      setAddError('Please fill in all required fields (Name, Category, City, Country).');
      return;
    }
    setAddSubmitting(true);
    setAddError('');
    try {
      await MarketplaceService.submitBusiness({
        name: addForm.name.trim(),
        category: addForm.category,
        city: addForm.city.trim(),
        country: addForm.country.trim(),
        ...(addForm.lodge_proximity_km ? { lodge_proximity_km: parseFloat(addForm.lodge_proximity_km) } : {}),
        ...(addForm.contact.trim() ? { contact: addForm.contact.trim() } : {}),
        ...(addForm.website.trim() ? { website: addForm.website.trim() } : {}),
      });
      setAddSuccess(true);
      // Reload businesses and close modal after 2 seconds
      await loadData();
      setTimeout(() => {
        setShowAddForm(false);
        setAddSuccess(false);
      }, 2000);
    } catch (err: any) {
      setAddError(err.message || 'Failed to submit business. Please try again.');
    } finally {
      setAddSubmitting(false);
    }
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
          onClick={openAddForm}
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
                    Added {new Date(business.created_at ?? '').toLocaleDateString()}
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
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Business</h3>
              <button
                onClick={closeAddForm}
                disabled={addSubmitting}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {/* Success state */}
              {addSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-green-800 font-medium">Business submitted successfully!</p>
                  <p className="text-green-600 text-sm mt-1">Closing in a moment...</p>
                </div>
              )}

              {/* Error state */}
              {addError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{addError}</p>
                </div>
              )}

              {!addSuccess && (
                <>
                  <p className="text-sm text-gray-600">
                    Submit a Masonic-friendly business for inclusion in our directory. Required fields are marked with *.
                  </p>

                  {/* Business Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Name *
                    </label>
                    <input
                      type="text"
                      value={addForm.name}
                      onChange={(e) => handleAddFormChange('name', e.target.value)}
                      className="input w-full"
                      placeholder="e.g. Brothers' Regalia Shop"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={addForm.category}
                      onChange={(e) => handleAddFormChange('category', e.target.value)}
                      className="input w-full"
                      required
                    >
                      <option value="">Select a category</option>
                      {BUSINESS_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      value={addForm.city}
                      onChange={(e) => handleAddFormChange('city', e.target.value)}
                      className="input w-full"
                      placeholder="e.g. New York"
                      required
                    />
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country *
                    </label>
                    <input
                      type="text"
                      value={addForm.country}
                      onChange={(e) => handleAddFormChange('country', e.target.value)}
                      className="input w-full"
                      placeholder="e.g. United States"
                      required
                    />
                  </div>

                  {/* Lodge Proximity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Distance from nearest lodge (km)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={addForm.lodge_proximity_km}
                      onChange={(e) => handleAddFormChange('lodge_proximity_km', e.target.value)}
                      className="input w-full"
                      placeholder="Optional — e.g. 0.5"
                    />
                  </div>

                  {/* Contact */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact (email or phone)
                    </label>
                    <input
                      type="text"
                      value={addForm.contact}
                      onChange={(e) => handleAddFormChange('contact', e.target.value)}
                      className="input w-full"
                      placeholder="Optional — e.g. info@business.com or +1 555-0100"
                    />
                  </div>

                  {/* Website */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website
                    </label>
                    <input
                      type="text"
                      value={addForm.website}
                      onChange={(e) => handleAddFormChange('website', e.target.value)}
                      className="input w-full"
                      placeholder="Optional — e.g. www.business.com"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={closeAddForm}
                      disabled={addSubmitting}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addSubmitting}
                      className="btn-primary flex-1"
                    >
                      {addSubmitting ? 'Submitting...' : 'Submit Business'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
