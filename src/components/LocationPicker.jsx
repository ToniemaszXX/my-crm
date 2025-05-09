import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// 🧲 Komponent markera
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

export default function LocationPicker({ street, city, voivodeship, country = "Polska", onCoordsChange }) {
  const [position, setPosition] = useState({ lat: 52.237049, lng: 21.017532 }); // Warszawa jako default
  const hasCustomPin = useRef(false);

  // 🔁 Sklejamy adres
  const fullAddress = `${street ?? ''} ${city ?? ''} ${voivodeship ?? ''} ${country}`.trim();

  // 🌍 Geokodowanie adresu (tylko jeśli user nie ruszył pinezki)
  useEffect(() => {
    if (fullAddress.length > 5 && !hasCustomPin.current) {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`)
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
  }, [fullAddress]);

  // 🛰️ Aktualizacja rodzica
  useEffect(() => {
    if (typeof onCoordsChange === 'function') {
      onCoordsChange(position);
    }
  }, [position]);

  const handleManualPosition = (newPos) => {
    hasCustomPin.current = true;
    setPosition(newPos);
  };

  return (
    <div className="mt-4">
      <MapContainer center={position} zoom={13} style={{ height: '400px', width: '100%' }} className="z-10 rounded-md">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <DraggableMarker position={position} setPosition={handleManualPosition} />
      </MapContainer>

      <p className="mt-2 text-sm text-neutral-700">
        Szerokość: <strong>{position.lat.toFixed(6)}</strong>, Długość: <strong>{position.lng.toFixed(6)}</strong>
      </p>
    </div>
  );
}
