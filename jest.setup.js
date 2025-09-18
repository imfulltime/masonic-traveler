import '@testing-library/jest-dom'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  usePathname() {
    return '/'
  },
  useParams() {
    return {}
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock Supabase
jest.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
    })),
  },
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
    })),
  },
}))

// Mock window.navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
}

Object.defineProperty(window.navigator, 'geolocation', {
  value: mockGeolocation,
})

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock maplibre-gl to avoid DOM/canvas requirements in tests
jest.mock('maplibre-gl', () => {
  const mapInstance = {
    addControl: jest.fn(),
    remove: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    flyTo: jest.fn(),
    setCenter: jest.fn(),
    setZoom: jest.fn(),
  }

  const Map = jest.fn(() => mapInstance)
  Map.prototype = mapInstance

  return {
    Map,
    NavigationControl: jest.fn(),
    Marker: jest.fn(() => ({
      setLngLat: jest.fn().mockReturnThis(),
      addTo: jest.fn().mockReturnThis(),
      remove: jest.fn(),
    })),
    Popup: jest.fn(() => ({
      setLngLat: jest.fn().mockReturnThis(),
      setHTML: jest.fn().mockReturnThis(),
      addTo: jest.fn().mockReturnThis(),
      remove: jest.fn(),
    })),
  }
})

// Provide minimal implementations for browser APIs used in components
if (!window.alert) {
  window.alert = jest.fn()
}

if (!window.matchMedia) {
  window.matchMedia = jest.fn().mockImplementation(() => ({
    matches: false,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }))
}

HTMLCanvasElement.prototype.getContext = jest.fn()
