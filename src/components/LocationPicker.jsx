import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useState, useEffect } from 'react';
import L from 'leaflet';

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

function DraggableMarker({ position, setPosition }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
    }
  });

  return (
    <Marker
      position={position}
      icon={markerIcon}
      draggable={true}
      eventHandlers={{
        dragend(e) {
          setPosition(e.target.getLatLng());
        }
      }}
    />
  );
}

export default function LocationPicker({ address, onCoordsChange }) {
  const [position, setPosition] = useState({ lat: 52.237049, lng: 21.017532 }); // Domyślnie Warszawa

  useEffect(() => {
    if (address) {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data[0]) {
            setPosition({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
          }
        });
    }
  }, [address]);

  useEffect(() => {
    onCoordsChange(position);
  }, [position, onCoordsChange]);

  return (
    <div className="mt-4">
      <MapContainer center={position} zoom={13} style={{ height: '300px', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DraggableMarker position={position} setPosition={setPosition} />
      </MapContainer>

      <p className="mt-2 text-sm text-neutral-700">
        Szerokość: <strong>{position.lat.toFixed(6)}</strong>, Długość: <strong>{position.lng.toFixed(6)}</strong>
      </p>
    </div>
  );
}
