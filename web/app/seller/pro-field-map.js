"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";

function FitToFields({ fields }) {
  const map = useMap();
  useEffect(() => {
    if (!fields.length) {
      return;
    }

    const bounds = fields.map((field) => [field.latitude, field.longitude]);
    map.fitBounds(bounds, {
      padding: [40, 40]
    });
  }, [fields, map]);

  return null;
}

export default function ProFieldMap({ fields }) {
  const plottedFields = fields.filter(
    (field) => Number.isFinite(Number(field.latitude)) && Number.isFinite(Number(field.longitude))
  );

  const fallbackCenter = plottedFields.length
    ? [Number(plottedFields[0].latitude), Number(plottedFields[0].longitude)]
    : [-1.286389, 36.817223];

  return (
    <MapContainer center={fallbackCenter} className="h-[470px] w-full" scrollWheelZoom zoom={8}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={19}
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToFields fields={plottedFields} />
      {plottedFields.map((field) => (
        <CircleMarker
          key={field.id}
          center={[Number(field.latitude), Number(field.longitude)]}
          color="#1f6f3f"
          fillColor="#2f8f50"
          fillOpacity={0.88}
          radius={12}
          weight={2}
        >
          <Popup>
            <div className="space-y-1">
              <div className="font-semibold">{field.name}</div>
              <div>{field.crop}</div>
              <div>{field.acreage.toFixed(1)} acres</div>
              <div>Health: {field.health}</div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
