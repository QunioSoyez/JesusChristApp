// HTML page for the church map. It runs Leaflet (bundled, see src/data/leaflet.ts) inside a
// WebView on iOS/Android or an iframe on web, and talks to the app with small JSON messages:
//   app -> map:  { type: 'data', center, radiusMiles, churches }  |  { type: 'select', id }
//   map -> app:  { type: 'ready' }  |  { type: 'select', id }  |  { type: 'directions', id }
import { LEAFLET_CSS, LEAFLET_JS } from '@/data/leaflet';
import type { LatLon } from '@/lib/churches';

export type MapChurch = LatLon & { id: string; name: string; distance: string };

export type MapInbound =
  | { type: 'data'; center: LatLon; radiusMiles: number; churches: MapChurch[] }
  | { type: 'select'; id: string };

export type MapOutbound = { type: 'ready' } | { type: 'select'; id: string } | { type: 'directions'; id: string };

export type ChurchMapProps = {
  center: LatLon;
  radiusMiles: number;
  churches: MapChurch[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDirections: (id: string) => void;
};

const MAP_SCRIPT = `
(function () {
  var METERS_PER_MILE = 1609.344;
  var map = L.map('map', { zoomControl: true }).setView([39.8, -98.6], 4);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  var layer = L.layerGroup().addTo(map);
  var markers = {};

  function send(msg) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
    else if (window.parent !== window) window.parent.postMessage({ source: 'church-map', payload: msg }, '*');
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function handle(msg) {
    if (!msg) return;
    if (msg.type === 'data') {
      layer.clearLayers();
      markers = {};
      var c = msg.center;
      var area = L.circle([c.lat, c.lon], {
        radius: msg.radiusMiles * METERS_PER_MILE, color: '#ffffff', weight: 1, opacity: 0.35, fill: false
      }).addTo(layer);
      L.circleMarker([c.lat, c.lon], {
        radius: 7, color: '#000', weight: 2, fillColor: '#4da3ff', fillOpacity: 1
      }).bindTooltip('Search center').addTo(layer);
      msg.churches.forEach(function (ch) {
        var m = L.circleMarker([ch.lat, ch.lon], {
          radius: 7, color: '#000', weight: 2, fillColor: '#ffffff', fillOpacity: 1
        });
        m.bindPopup('<div class="name">' + esc(ch.name) + '</div><div class="dist">' + esc(ch.distance) +
          '</div><button data-directions="' + esc(ch.id) + '">Directions</button>');
        m.on('click', function () { send({ type: 'select', id: ch.id }); });
        markers[ch.id] = m;
        m.addTo(layer);
      });
      map.fitBounds(area.getBounds(), { padding: [8, 8] });
    } else if (msg.type === 'select') {
      var mk = markers[msg.id];
      if (mk) { map.panTo(mk.getLatLng()); mk.openPopup(); }
    }
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-directions]');
    if (b) send({ type: 'directions', id: b.getAttribute('data-directions') });
  });
  window.__receive = handle;
  window.addEventListener('message', function (e) {
    var d = e.data;
    if (d && d.source === 'church-app') handle(d.payload);
  });
  send({ type: 'ready' });
})();
`;

const PAGE_CSS = `
html, body, #map { height: 100%; margin: 0; background: #000; }
.leaflet-tile-pane { filter: invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.9); }
.leaflet-container { font-family: -apple-system, system-ui, sans-serif; background: #000; }
.leaflet-control-attribution { background: rgba(0,0,0,0.7) !important; color: #aaa; }
.leaflet-control-attribution a { color: #ddd; }
.leaflet-popup-content-wrapper, .leaflet-popup-tip { background: #111; color: #fff; }
.leaflet-popup-content .name { font-weight: 600; font-size: 14px; }
.leaflet-popup-content .dist { color: #aaa; margin: 2px 0 8px; }
.leaflet-popup-content button {
  background: #fff; color: #000; border: 0; border-radius: 999px; padding: 6px 14px; font-weight: 600;
}
`;

export function buildMapHtml(): string {
  return `<!doctype html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>${LEAFLET_CSS}</style>
<style>${PAGE_CSS}</style>
</head><body>
<div id="map"></div>
<script>${LEAFLET_JS}</script>
<script>${MAP_SCRIPT}</script>
</body></html>`;
}
