import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';

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
  return null;
}

export default function LocationPicker({
  street,
  city,
  voivodeship,
  postal_code,
  country = "Polska",
  latitude,
  longitude,
  onCoordsChange,
}) {
  const hasCustomPin = useRef(false);
  const [position, setPosition] = useState({ lat: 52.237049, lng: 21.017532 });
  const [debouncedAddress, setDebouncedAddress] = useState('');
  const [forceRefresh, setForceRefresh] = useState(false); // 👈 Do ręcznego wyzwolenia resetu
  const { t } = useTranslation();

  // Sklejanie adresu
  const addressParts = [street, city, postal_code, voivodeship, country]
    .filter(Boolean)
    .join(' ')
    .trim();

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasCustomPin.current && addressParts.length > 10) {
        setDebouncedAddress(addressParts);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [addressParts, forceRefresh]); // 👈 uwzględniamy też ręczny reset

  // Geolokalizacja
  useEffect(() => {
    if (
      !hasCustomPin.current &&
      debouncedAddress.length > 10 &&
      /\d/.test(debouncedAddress) // sprawdź, czy jest jakaś liczba (np. nr domu)
    ) {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(debouncedAddress)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data[0]) {
            const newCoords = {
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon),
            };
            setPosition(newCoords);
          }
        })
        .catch((err) => console.error('Geocoding error:', err));
    }
  }, [debouncedAddress]);
  

  // Ręcznie wpisane współrzędne
  useEffect(() => {
    if (
      !hasCustomPin.current &&
      latitude !== '' &&
      longitude !== '' &&
      !isNaN(parseFloat(latitude)) &&
      !isNaN(parseFloat(longitude))
    ) {
      setPosition({ lat: parseFloat(latitude), lng: parseFloat(longitude) });
    }
  }, [latitude, longitude]);

  // Emit do rodzica
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
    if (addressParts.length > 10) {
      hasCustomPin.current = false;
      setForceRefresh(prev => !prev); // wyzwala ponowny efekt debounce
    }
  };
  

  return (
    <div className="mt-4">
      <MapContainer center={position} zoom={13} style={{ height: '400px', width: '100%' }} className="z-10 rounded-md">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
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
