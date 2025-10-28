import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';

// Simple in-memory cache and throttle for Nominatim requests
const geocodeCache = new Map(); // key: address string, value: { lat, lng }
let lastGeocodeTs = 0;
let inflightController = null;

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function DraggableMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return (
    <Marker
      position={position}
      icon={markerIcon}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          setPosition(e.target.getLatLng());
        },
      }}
    />
  );
}

function MapCenterUpdater({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position);
    }
  }, [position]);

  // Invalidate size when map mounts or when container becomes visible (e.g., modal open)
  useEffect(() => {
    const t = setTimeout(() => {
      try { map.invalidateSize(); } catch {}
    }, 0);
    return () => clearTimeout(t);
  }, [map]);

  return null;
}

export default function LocationPicker({
  street,
  city,
  voivodeship,
  postal_code,
  country = 'Polska',
  latitude,
  longitude,
  onCoordsChange,
  isOpen, // optional: if provided by modal, can retrigger invalidation
}) {
  const hasCustomPin = useRef(false);
  const [position, setPosition] = useState({ lat: 52.237049, lng: 21.017532 });
  const [debouncedAddress, setDebouncedAddress] = useState('');
  const [forceRefresh, setForceRefresh] = useState(false);
  const { t } = useTranslation();

  // Glue address parts
  const addressParts = [street, city, postal_code, voivodeship, country]
    .filter(Boolean)
    .join(' ')
    .trim();

  // Debounce stronger (900ms) to reduce API churn
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasCustomPin.current && addressParts.length > 5) {
        setDebouncedAddress(addressParts);
      }
    }, 900);
    return () => clearTimeout(timer);
  }, [addressParts, forceRefresh]);

  // If coords are preset and valid, prefer them and suppress auto geocoding
  useEffect(() => {
    const latOk = latitude !== '' && !isNaN(parseFloat(latitude));
    const lngOk = longitude !== '' && !isNaN(parseFloat(longitude));
    if (!hasCustomPin.current && latOk && lngOk) {
      hasCustomPin.current = true; // lock to provided coords until reset
      setPosition({ lat: parseFloat(latitude), lng: parseFloat(longitude) });
    }
  }, [latitude, longitude]);

  // Optional: re-invalidate map size when modal opens
  const mapForInvalidation = useMap;
  useEffect(() => {
    if (!isOpen) return;
    // Best effort; actual invalidate happens inside MapCenterUpdater as well
    try { /* no-op placeholder */ } catch {}
  }, [isOpen]);

  // Geocoding with cache, throttle (min 1000ms between calls), and cancellation
  useEffect(() => {
    if (hasCustomPin.current) return; // honor manual pin or preset coords
    if (!debouncedAddress) return;

    // Use cache if available
    if (geocodeCache.has(debouncedAddress)) {
      const cached = geocodeCache.get(debouncedAddress);
      setPosition(cached);
      return;
    }

    const now = Date.now();
    const wait = Math.max(0, 1000 - (now - lastGeocodeTs));

    // Cancel any inflight request
    if (inflightController) {
      try { inflightController.abort(); } catch {}
    }
    inflightController = new AbortController();

    const timer = setTimeout(() => {
      lastGeocodeTs = Date.now();
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(debouncedAddress)}&addressdetails=0&limit=1`, {
        signal: inflightController.signal,
        // Note: Browsers set UA automatically; for compliance, proxy via backend if possible.
        headers: { 'Accept-Language': 'pl,en;q=0.8' },
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data[0]) {
            const newCoords = {
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon),
            };
            geocodeCache.set(debouncedAddress, newCoords);
            setPosition(newCoords);
          }
        })
        .catch((err) => {
          if (err?.name === 'AbortError') return; // expected on fast changes
          // Soft-handle 429 or network issues: just skip update
          // console.warn('Geocoding error:', err);
        });
    }, wait);

    return () => clearTimeout(timer);
  }, [debouncedAddress]);

  // Emit coords to parent
  useEffect(() => {
    if (typeof onCoordsChange === 'function') {
      onCoordsChange(position);
    }
  }, [position]);

  const handleManualPosition = (newPos) => {
    hasCustomPin.current = true;
    setPosition(newPos);
  };

  const handleResetToAddress = () => {
    if (addressParts.length > 5) {
      hasCustomPin.current = false;
      setForceRefresh((prev) => !prev); // retrigger debounce/geocode
    }
  };

  return (
    <div className="mt-4">
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: '400px', width: '100%' }}
        className="z-10 rounded-md"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <MapCenterUpdater position={position} />
        <DraggableMarker position={position} setPosition={handleManualPosition} />
      </MapContainer>

      <p className="mt-2 text-sm text-neutral-700">
        {t('editClientModal.locationPicker.latitude')}: <strong>{position.lat.toFixed(6)}</strong>, {t('editClientModal.locationPicker.longitude')}: <strong>{position.lng.toFixed(6)}</strong>
      </p>

      <button
        type="button"
        onClick={handleResetToAddress}
        className="mt-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-sm text-black rounded"
      >
        {t('editClientModal.locationPicker.reset')}
      </button>
    </div>
  );
}
