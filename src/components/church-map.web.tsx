// Web: Leaflet map in an iframe. The iOS/Android version is church-map.tsx.
import { useEffect, useMemo, useRef, useState } from 'react';

import { buildMapHtml, type ChurchMapProps, type MapInbound, type MapOutbound } from '@/lib/map-html';

export function ChurchMap({ center, radiusMiles, churches, selectedId, onSelect, onDirections }: ChurchMapProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const html = useMemo(buildMapHtml, []);

  const post = (msg: MapInbound) => frame.current?.contentWindow?.postMessage({ source: 'church-app', payload: msg }, '*');

  // Keep the latest callbacks without re-subscribing the listener.
  const handlers = useRef({ onSelect, onDirections });
  handlers.current = { onSelect, onDirections };

  useEffect(() => {
    const listener = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || e.data?.source !== 'church-map') return;
      const msg = e.data.payload as MapOutbound;
      if (msg.type === 'ready') setReady(true);
      else if (msg.type === 'select') handlers.current.onSelect(msg.id);
      else if (msg.type === 'directions') handlers.current.onDirections(msg.id);
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, []);

  useEffect(() => {
    if (ready) post({ type: 'data', center, radiusMiles, churches });
  }, [ready, center, radiusMiles, churches]);

  useEffect(() => {
    if (ready && selectedId) post({ type: 'select', id: selectedId });
  }, [ready, selectedId]);

  return (
    <iframe
      ref={frame}
      srcDoc={html}
      title="Map of nearby churches"
      style={{ border: 0, width: '100%', height: '100%', display: 'block', background: '#000' }}
    />
  );
}
