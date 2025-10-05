# Map Singleton Implementation

## Overview

The Jaagratha disaster management platform now uses a **Map Singleton Pattern** to initialize the Leaflet map container only once when the user first logs in, preventing the "Map container is already initialized" error.

## Architecture

### 1. **MapSingleton Class** (`lib/map-singleton.ts`)
- **Single Responsibility**: Manages one global Leaflet map instance
- **Container Transfer**: Seamlessly moves the map between different components/pages
- **Lifecycle Management**: Proper initialization and cleanup
- **State Persistence**: Maintains map state (center, zoom, layers) across navigation

### 2. **useMapSingleton Hook** (`hooks/use-map-singleton.ts`)
- **React Integration**: Provides React hook interface for the singleton
- **Component Identification**: Each component gets a unique ID
- **Loading States**: Handles initialization loading states
- **Event Management**: Centralized map event handling

### 3. **UnifiedMap Component** (`components/map/unified-map.tsx`)
- **Single Map Component**: Replaces multiple map implementations
- **API Integration**: Maintains all NASA GIBS and EONET integrations
- **Layer Management**: Dynamic layer addition/removal
- **Event Handling**: Global map events (pan, pin, locate)

### 4. **MapProvider** (`components/providers/map-provider.tsx`)
- **Session Integration**: Initializes map on user login
- **Cleanup Management**: Destroys map on logout
- **Global State**: Provides map initialization status

## Key Benefits

### ✅ **Eliminates "Map Container Already Initialized" Error**
- Map container is created only once per user session
- Container is transferred between components, not recreated
- Proper cleanup on logout prevents memory leaks

### ✅ **Seamless Navigation**
- Map state persists when switching between Citizen and Rescue dashboards
- No loading delays when navigating between pages
- Consistent map position and zoom levels

### ✅ **Performance Optimization**
- Single map instance reduces memory usage
- Faster page transitions (no map re-initialization)
- Optimized layer management

### ✅ **Maintained Functionality**
- All NASA GIBS satellite overlays (Precipitation, FIRMS)
- NASA EONET global events integration
- Browser Geolocation API support
- Interactive features (clickable alerts, pin mode, locate me)

## Implementation Details

### Component Usage

\`\`\`tsx
// Replace old MapClient with UnifiedMap
<UnifiedMap 
  initial={{ lat: 10.068, lng: 76.628 }} 
  height={520} 
  componentId="citizen-dashboard" // Unique identifier
/>
\`\`\`

### Map Lifecycle

1. **User Login** → MapProvider detects authentication
2. **First Map Request** → MapSingleton creates Leaflet instance
3. **Navigation** → Map container transfers to new component
4. **User Logout** → MapSingleton destroys instance and cleans up

### Event System

\`\`\`typescript
// Global events for map interaction
window.dispatchEvent(new CustomEvent("jaagratha:panTo", { 
  detail: { lat, lng, title, zoom } 
}))

window.dispatchEvent(new CustomEvent("jaagratha:enablePin"))

window.dispatchEvent(new CustomEvent("jaagratha:pinned", { 
  detail: { lat, lng } 
}))
\`\`\`

## API Integrations Maintained

### 🌍 NASA EONET
- **Endpoint**: `https://eonet.gsfc.nasa.gov/api/v2.1/events`
- **Usage**: Global disaster events in sidebar
- **Features**: Clickable events, distance calculation

### 🛰️ NASA GIBS  
- **Endpoint**: `https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi`
- **Layers**: IMERG_Precipitation_Rate, FIRMS
- **Features**: Toggleable overlays, real-time data

### 📍 Geolocation API
- **Browser API**: `navigator.geolocation`
- **Features**: User location, nearest relief centers, incident reporting

## Migration from Old System

### Files Replaced
- ❌ `components/map/map-client.tsx` (still exists but not used)
- ❌ `components/map/centralized-map.tsx` 
- ✅ `components/map/unified-map.tsx` (new single implementation)

### Files Added
- ✅ `lib/map-singleton.ts`
- ✅ `hooks/use-map-singleton.ts`  
- ✅ `components/providers/map-provider.tsx`
- ✅ `components/providers.tsx`

### Updated Files
- ✅ `app/layout.tsx` - Added MapProvider
- ✅ `app/dashboard/page.tsx` - Uses UnifiedMap
- ✅ `app/rescue/page.tsx` - Uses UnifiedMap
- ✅ `components/citizen/report-incident-dialog.tsx` - Uses UnifiedMap

## Testing Checklist

- [x] Map loads without "already initialized" error
- [x] Navigation between Citizen/Rescue dashboards works seamlessly
- [x] Map state persists across page changes
- [x] NASA GIBS overlays (Precipitation, FIRMS) toggle correctly
- [x] NASA EONET events display and are clickable
- [x] Geolocation "Locate Me" functionality works
- [x] Alert clicking pans map to location
- [x] Report incident dialog map interaction works
- [x] Map cleanup on logout prevents memory leaks

## Troubleshooting

### If Map Doesn't Load
1. Check browser console for Leaflet errors
2. Verify component has unique `componentId`
3. Ensure user is authenticated (MapProvider)

### If Events Don't Work
1. Check global event listeners are attached
2. Verify UnifiedMap `setupMapEvents` is called
3. Check browser network tab for API responses

### Performance Issues
1. Monitor MapSingleton instance count (should be 1)
2. Check for memory leaks in browser dev tools
3. Verify proper cleanup on logout

## Future Enhancements

- **Multi-user Sessions**: Support for multiple concurrent users
- **Map State Persistence**: Save/restore map state in localStorage
- **Advanced Layer Management**: Dynamic layer loading based on user preferences
- **Mobile Optimization**: Touch gesture handling for mobile devices
