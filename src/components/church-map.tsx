// iOS/Android: Leaflet map in a WebView. The web version is church-map.web.tsx.
import { type ComponentType, type Ref, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, type StyleProp, StyleSheet, type ViewStyle } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { type Palette } from '@/constants/theme';
import { useColors, useStyles } from '@/lib/theme';
import { buildMapHtml, type ChurchMapProps, type MapInbound, type MapOutbound } from '@/lib/map-html';

// OpenStreetMap's tile policy asks apps to identify themselves.
const USER_AGENT = 'JesusChristApp/1.0 (+https://github.com/QunioSoyez/JesusChristApp)';

// react-native-webview 14's combined iOS/Android/Windows prop types resolve to `never` with the
// React Native types in this SDK, so we describe just the props we use. Runtime behavior is unaffected.
type WebViewHandle = { injectJavaScript: (script: string) => void };
type MapWebViewProps = {
  ref?: Ref<WebViewHandle>;
  source: { html: string; baseUrl?: string };
  originWhitelist?: string[];
  userAgent?: string;
  onMessage?: (event: WebViewMessageEvent) => void;
  onShouldStartLoadWithRequest?: (request: { url: string }) => boolean;
  style?: StyleProp<ViewStyle>;
  scrollEnabled?: boolean;
};
const MapWebView = WebView as unknown as ComponentType<MapWebViewProps>;

export function ChurchMap({ center, radiusMiles, churches, selectedId, onSelect, onDirections }: ChurchMapProps) {
  const ref = useRef<WebViewHandle>(null);
  const [ready, setReady] = useState(false);
  const styles = useStyles(makeStyles);
  const { scheme } = useColors();
  const html = useMemo(() => buildMapHtml(scheme), [scheme]);
  // A theme change reloads the page; wait for the new page's "ready" before sending data.
  useEffect(() => setReady(false), [html]);

  const post = (msg: MapInbound) => ref.current?.injectJavaScript(`window.__receive(${JSON.stringify(msg)});true;`);

  useEffect(() => {
    if (ready) post({ type: 'data', center, radiusMiles, churches });
  }, [ready, center, radiusMiles, churches]);

  useEffect(() => {
    if (ready && selectedId) post({ type: 'select', id: selectedId });
  }, [ready, selectedId]);

  const onMessage = (e: WebViewMessageEvent) => {
    let msg: MapOutbound;
    try {
      msg = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    if (msg.type === 'ready') setReady(true);
    else if (msg.type === 'select') onSelect(msg.id);
    else if (msg.type === 'directions') onDirections(msg.id);
  };

  return (
    <MapWebView
      ref={ref}
      source={{ html, baseUrl: 'https://localhost/' }}
      originWhitelist={['*']}
      userAgent={USER_AGENT}
      onMessage={onMessage}
      // Links inside the map (e.g. the OpenStreetMap credit) open in the browser, not the map.
      onShouldStartLoadWithRequest={(req) => {
        if (req.url.startsWith('http') && !req.url.startsWith('https://localhost')) {
          Linking.openURL(req.url);
          return false;
        }
        return true;
      }}
      style={styles.map}
      scrollEnabled={false}
    />
  );
}

const makeStyles = (Colors: Palette) =>
  StyleSheet.create({
  map: { flex: 1, backgroundColor: Colors.background },
});
