import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import { useDisaster } from '../../context/DisasterContext';
import { 
  Flame, 
  Warehouse as WarehouseIcon, 
  Tent, 
  Users, 
  Activity, 
  Radio, 
  Eye, 
  Droplets, 
  Hospital as HospitalIcon,
  Video
} from 'lucide-react';

// Custom Leaflet Markers using inline SVG icons
const createCustomIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background-color: ${color}; 
        width: 32px; 
        height: 32px; 
        border-radius: 50%; 
        border: 2px solid #ffffff; 
        box-shadow: 0 0 12px ${color}; 
        display: flex; 
        align-items: center; 
        justify-content: center;
        color: #ffffff;
        font-weight: bold;
        font-size: 11px;
      ">
        ${label}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

export const DisasterGisMap: React.FC = () => {
  const { disasters, camps, warehouses, hospitals, weather } = useDisaster();
  const [isDroneView, setIsDroneView] = useState(false);

  // Center coordinate around Cuddalore Tamil Nadu (11.748, 79.7714)
  const centerLat = 11.748;
  const centerLng = 79.7714;

  return (
    <div className="space-y-6">
      
      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-base">Live GIS Disaster Radar Map</h3>
            <p className="text-xs text-slate-400">Interactive Map Telemetry • Flood Heatmaps • Relief Camps & Warehouses</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Drone View Mode Toggle */}
          <button
            onClick={() => setIsDroneView(!isDroneView)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
              isDroneView 
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/30' 
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>{isDroneView ? 'Satellite / Drone View Active' : 'Enable Drone Overlay'}</span>
          </button>

          <span className="px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 text-xs font-bold border border-cyan-500/30 animate-pulse">
            GPS Live Stream Active
          </span>
        </div>
      </div>

      {/* IoT Telemetry Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[10px]">River Flood Water Sensor</span>
            <span className="font-extrabold text-rose-400 text-sm">{weather.waterSensorLevelMeters} meters</span>
          </div>
          <Droplets className="w-6 h-6 text-rose-400" />
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[10px]">Rainfall Metric</span>
            <span className="font-extrabold text-cyan-400 text-sm">{weather.rainfallMm} mm (24h)</span>
          </div>
          <Radio className="w-6 h-6 text-cyan-400" />
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[10px]">Cyclone Risk Level</span>
            <span className="font-extrabold text-amber-400 text-sm">{weather.cycloneRisk}</span>
          </div>
          <Flame className="w-6 h-6 text-amber-400" />
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[10px]">Safe Relief Camps</span>
            <span className="font-extrabold text-emerald-400 text-sm">{camps.length} Camps Active</span>
          </div>
          <Tent className="w-6 h-6 text-emerald-400" />
        </div>
      </div>

      {/* Leaflet Map Canvas Container */}
      <div className="h-[550px] w-full rounded-3xl overflow-hidden border border-cyan-500/30 shadow-2xl relative">
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={11}
          scrollWheelZoom={true}
          className="h-full w-full z-0"
        >
          {/* Base Tile Layer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url={
              isDroneView 
                ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' 
                : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            }
          />

          {/* Disaster Radius Flood Zones */}
          {disasters.map(d => (
            <Circle
              key={d.id}
              center={[d.centerCoordinates.lat, d.centerCoordinates.lng]}
              radius={8000}
              pathOptions={{
                color: '#f44336',
                fillColor: '#f44336',
                fillOpacity: 0.2,
                weight: 2,
                dashArray: '6, 6'
              }}
            />
          ))}

          {/* Relief Camps Markers */}
          {camps.map(c => (
            <Marker
              key={c.id}
              position={[c.coordinates.lat, c.coordinates.lng]}
              icon={createCustomIcon('#4caf50', 'CAMP')}
            >
              <Popup>
                <div className="text-slate-900 p-1 text-xs">
                  <h4 className="font-bold text-sm text-blue-900">{c.name}</h4>
                  <p className="text-slate-600">Officer In-Charge: {c.inChargeOfficer}</p>
                  <p className="font-semibold text-emerald-700">
                    Occupancy: {c.currentOccupancy} / {c.capacity} Beds
                  </p>
                  <div className="mt-2 text-[10px] bg-slate-100 p-1.5 rounded space-y-0.5">
                    <div>Doctors: {c.facilities.doctorsCount}</div>
                    <div>Food Kits: {c.facilities.foodKitsAvailable}</div>
                    <div>Water: {c.facilities.waterLitersAvailable} L</div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Warehouses Markers */}
          {warehouses.map(w => (
            <Marker
              key={w.id}
              position={[w.coordinates.lat, w.coordinates.lng]}
              icon={createCustomIcon('#00bcd4', 'WH')}
            >
              <Popup>
                <div className="text-slate-900 p-1 text-xs">
                  <h4 className="font-bold text-sm text-cyan-900">{w.name}</h4>
                  <p className="text-slate-600">Location: {w.location}</p>
                  <p className="font-semibold text-blue-800">
                    Capacity: {w.usedCapacityTons} / {w.totalCapacityTons} Tons Used
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">Manager: {w.managerName} ({w.managerPhone})</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Hospitals Markers */}
          {hospitals.map(h => (
            <Marker
              key={h.id}
              position={[h.coordinates.lat, h.coordinates.lng]}
              icon={createCustomIcon('#0b3d91', 'HOSP')}
            >
              <Popup>
                <div className="text-slate-900 p-1 text-xs">
                  <h4 className="font-bold text-sm text-blue-900">{h.name}</h4>
                  <p className="font-semibold text-rose-700">Available Beds: {h.availableBeds}</p>
                  <p className="text-slate-600">ICU Beds: {h.totalICUBeds}</p>
                  <p className="text-[10px] text-slate-500">Contact: {h.contactNumber}</p>
                </div>
              </Popup>
            </Marker>
          ))}

        </MapContainer>
      </div>

    </div>
  );
};
