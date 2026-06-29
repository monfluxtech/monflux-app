import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, MapPin } from 'lucide-react';
import { getProjectMeta, getProjectTitle, looksLikeRealAddress } from './projectUtils';

let leafletPromise = null;

function loadLeaflet() {
  if (typeof window !== 'undefined' && window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;

  leafletPromise = new Promise((resolve, reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.body.appendChild(script);
  });

  return leafletPromise;
}

export default function MapView({ projects, onGeocodeAll, geocoding, stageMap }) {
  const navigate = useNavigate();
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((leaflet) => {
        if (cancelled || !mapEl.current || mapRef.current) return;
        mapRef.current = leaflet.map(mapEl.current, { scrollWheelZoom: false }).setView([46.81, -71.21], 6);
        leaflet
          .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 19,
          })
          .addTo(mapRef.current);
        layerRef.current = leaflet.layerGroup().addTo(mapRef.current);
        setReady(true);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !window.L || !layerRef.current) return;
    const leaflet = window.L;
    layerRef.current.clearLayers();

    const located = projects.filter((project) => project.latitude && project.longitude);
    const bounds = [];

    located.forEach((project) => {
      const lat = Number(project.latitude);
      const lng = Number(project.longitude);
      const color = stageMap?.[project.status]?.color || '#94a3b8';
      const icon = leaflet.divIcon({
        className: '',
        html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      const marker = leaflet.marker([lat, lng], { icon });
      const label = getProjectTitle(project);
      const meta = getProjectMeta(project);

      marker.bindTooltip(
        `<b>${label}</b>${meta ? '<br>' + meta : ''}${project.contract_value ? '<br>' + Number(project.contract_value).toLocaleString('fr-CA') + ' $' : ''}`,
        { direction: 'top', offset: [0, -8] },
      );
      marker.on('click', () => navigate(`/projets/${project.id}`));
      marker.addTo(layerRef.current);
      bounds.push([lat, lng]);
    });

    if (bounds.length) {
      mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }, [ready, projects, navigate, stageMap]);

  const located = projects.filter((project) => project.latitude && project.longitude).length;
  const missing = projects.filter((project) => looksLikeRealAddress(project.address) && (!project.latitude || !project.longitude)).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
        <span>
          {located} chantier(s) localisé(s)
          {missing > 0 ? ` · ${missing} sans position` : ''}
        </span>
        {missing > 0 && (
          <button className="btn-secondary text-xs py-1" onClick={onGeocodeAll} disabled={geocoding}>
            {geocoding ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
            Localiser {missing} chantier{missing > 1 ? 's' : ''}
          </button>
        )}
      </div>
      <div style={{ position: 'relative' }}>
        <div
          ref={mapEl}
          style={{ height: 520, borderRadius: 16, overflow: 'hidden', zIndex: 0 }}
          className="border border-gray-100"
        />
        {geocoding && (
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(255,255,255,.92)',
              borderRadius: 20,
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: '#374151',
              boxShadow: '0 2px 8px rgba(0,0,0,.12)',
              zIndex: 999,
              backdropFilter: 'blur(4px)',
            }}
          >
            <Loader2 size={12} className="animate-spin" style={{ color: '#E8794E' }} />
            Géolocalisation en cours…
          </div>
        )}
      </div>
      {located === 0 && !geocoding && (
        <p className="text-center text-sm text-gray-400 mt-3">
          {missing > 0
            ? 'Géolocalisation en cours — rechargez dans quelques secondes si aucun point n\'apparaît.'
            : 'Ajoutez une adresse aux projets pour les voir sur la carte.'}
        </p>
      )}
    </div>
  );
}
