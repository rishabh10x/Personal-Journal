import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Compass, Check, Sparkles } from 'lucide-react';
import { GeolocationData } from '../types';

interface SpatialLocationPickerProps {
  currentLocation?: GeolocationData;
  onChange: (loc: GeolocationData) => void;
  selectedEnvironment: string;
  onEnvironmentChange: (envTag: string) => void;
  mapsApiKey?: string;
}

export const PRESET_ENVIRONMENTS = [
  { id: 'Nature Walk', label: 'Nature Walk', icon: '🌲', vibe: 'Expansive, grounded, calming' },
  { id: 'Home Office', label: 'Home Office', icon: '🏡', vibe: 'Focused, intentional, structured' },
  { id: 'Late Night Coffee Shop', label: 'Late Night Coffee', icon: '☕', vibe: 'Ambient murmur, creative flow' },
  { id: 'Quiet Library', label: 'Quiet Library', icon: '📚', vibe: 'Deep focus, contemplation' },
  { id: 'Mountain Trail', label: 'Mountain Trail', icon: '⛰️', vibe: 'Elevation, perspective, endurance' },
  { id: 'Sunset Coast', label: 'Sunset Coast', icon: '🌊', vibe: 'Fluidity, release, twilight' },
  { id: 'Urban Commute', label: 'Urban Commute', icon: '🚆', vibe: 'Transitory, observant, kinetic' },
];

export const SpatialLocationPicker: React.FC<SpatialLocationPickerProps> = ({
  currentLocation,
  onChange,
  selectedEnvironment,
  onEnvironmentChange,
  mapsApiKey,
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const [manualPlace, setManualPlace] = useState(currentLocation?.placename || '');

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const newLoc: GeolocationData = {
          lat: Number(latitude.toFixed(4)),
          lng: Number(longitude.toFixed(4)),
          placename: manualPlace || 'Current Coordinates',
          environmentalTag: selectedEnvironment,
        };

        // Try reverse geocode if Maps API key is available or fallback
        if (mapsApiKey && mapsApiKey.length > 5) {
          try {
            const resp = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${mapsApiKey}`
            );
            const data = await resp.json();
            if (data.results?.[0]) {
              newLoc.placename = data.results[0].formatted_address;
              setManualPlace(newLoc.placename || '');
            }
          } catch {
            // continue with fallback
          }
        } else {
          newLoc.placename = `Reflecting at (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)`;
          setManualPlace(newLoc.placename);
        }

        onChange(newLoc);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setIsLocating(false);
        // Fallback default coordinates (Cupertino, CA / Apple Park)
        onChange({
          lat: 37.3346,
          lng: -122.009,
          placename: 'Apple Park (Cupertino, CA)',
          city: 'Cupertino',
          environmentalTag: selectedEnvironment,
        });
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="p-6 rounded-3xl bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-2xl border border-black/5 dark:border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)] space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
              Spatial & Geolocation Context
            </h4>
            <p className="text-xs text-[#86868B]">Informs Gemini of environmental ambiance</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDetectLocation}
          disabled={isLocating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] hover:bg-[#0071E3]/20 active:scale-[0.98] text-xs font-medium transition-all"
        >
          <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
          {isLocating ? 'Locating...' : 'Detect GPS'}
        </button>
      </div>

      {/* Environmental Ambiance Chips */}
      <div>
        <label className="block text-xs font-medium text-[#86868B] mb-2.5">
          Environmental Ambiance
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESET_ENVIRONMENTS.map((env) => {
            const isSelected = selectedEnvironment === env.id;
            return (
              <button
                key={env.id}
                type="button"
                onClick={() => {
                  onEnvironmentChange(env.id);
                  if (currentLocation) {
                    onChange({ ...currentLocation, environmentalTag: env.id });
                  }
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-[0.98] border ${
                  isSelected
                    ? 'bg-[#0071E3] text-white border-[#0071E3] shadow-sm'
                    : 'bg-black/5 dark:bg-white/5 text-[#1D1D1F] dark:text-[#F5F5F7] border-transparent hover:bg-black/10 dark:hover:bg-white/10'
                }`}
              >
                <span>{env.icon}</span>
                <span>{env.label}</span>
                {isSelected && <Check className="w-3 h-3 ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Location Pin & Coordinate Input */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-[#86868B] mb-1.5">
            Location Name / Pin
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-[#86868B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={manualPlace}
              placeholder="e.g. Muir Woods, Cupertino Home Office, Blue Bottle Cafe"
              onChange={(e) => {
                setManualPlace(e.target.value);
                onChange({
                  lat: currentLocation?.lat || 37.7749,
                  lng: currentLocation?.lng || -122.4194,
                  placename: e.target.value,
                  environmentalTag: selectedEnvironment,
                });
              }}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#86868B] mb-1.5">
            Coordinates (Lat, Lng)
          </label>
          <div className="px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-xs font-mono text-[#86868B] truncate">
            {currentLocation ? `${currentLocation.lat.toFixed(3)}, ${currentLocation.lng.toFixed(3)}` : 'Not pinned yet'}
          </div>
        </div>
      </div>

      {/* AI Spatial Awareness Note */}
      <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#0071E3]/5 border border-[#0071E3]/10 text-xs text-[#0071E3] dark:text-[#2997FF]">
        <Sparkles className="w-4 h-4 shrink-0" />
        <span>Gemini adapts its cognitive tone based on your environmental ambiance and geographical rhythm.</span>
      </div>
    </div>
  );
};
