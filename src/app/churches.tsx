import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ChurchMap } from '@/components/church-map';
import { Tappable } from '@/components/tappable';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import {
  type Church,
  DEFAULT_RADIUS_MILES,
  directionsUrl,
  formatMiles,
  geocode,
  type LatLon,
  RADIUS_OPTIONS_MILES,
  SearchError,
  searchChurches,
} from '@/lib/churches';
import type { MapChurch } from '@/lib/map-html';

type Status = 'locating' | 'needs-place' | 'searching' | 'ready' | 'error';

export default function ChurchesScreen() {
  const [center, setCenter] = useState<(LatLon & { label: string }) | null>(null);
  const [radius, setRadius] = useState<number>(DEFAULT_RADIUS_MILES);
  const [status, setStatus] = useState<Status>('locating');
  const [message, setMessage] = useState<string | null>(null);
  const [churches, setChurches] = useState<Church[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [place, setPlace] = useState('');
  const listRef = useRef<FlatList<Church>>(null);
  const searchId = useRef(0);

  const useMyLocation = useCallback(async () => {
    setStatus('locating');
    setMessage(null);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        setStatus('needs-place');
        setMessage('Location is off. Enter a city or ZIP code to search instead.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCenter({ lat: pos.coords.latitude, lon: pos.coords.longitude, label: 'your location' });
    } catch {
      setStatus('needs-place');
      setMessage("Couldn't get your location. Enter a city or ZIP code to search instead.");
    }
  }, []);

  // Ask for location once when the screen opens.
  useEffect(() => {
    useMyLocation();
  }, [useMyLocation]);

  // Search whenever the center or radius changes; ignore results from older searches.
  useEffect(() => {
    if (!center) return;
    const id = ++searchId.current;
    setStatus('searching');
    setMessage(null);
    setSelectedId(null);
    searchChurches(center, radius)
      .then((list) => {
        if (id !== searchId.current) return;
        setChurches(list);
        setStatus('ready');
      })
      .catch((e) => {
        if (id !== searchId.current) return;
        setChurches([]);
        setStatus('error');
        setMessage(e instanceof SearchError ? e.message : 'Something went wrong. Please try again.');
      });
  }, [center, radius]);

  const searchPlace = async () => {
    if (!place.trim()) return;
    setStatus('searching');
    setMessage(null);
    try {
      const found = await geocode(place);
      if (!found) {
        setStatus('needs-place');
        setMessage(`Couldn't find "${place.trim()}". Try a city and state, or a ZIP code.`);
        return;
      }
      setCenter(found);
    } catch (e) {
      setStatus('error');
      setMessage(e instanceof SearchError ? e.message : 'Something went wrong. Please try again.');
    }
  };

  const openDirections = useCallback(
    (id: string) => {
      const church = churches.find((c) => c.id === id);
      if (church) Linking.openURL(directionsUrl(church));
    },
    [churches],
  );

  // Tapping a pin on the map highlights and scrolls to that church in the list.
  const selectFromMap = useCallback(
    (id: string) => {
      setSelectedId(id);
      const index = churches.findIndex((c) => c.id === id);
      if (index >= 0) listRef.current?.scrollToIndex({ index, viewPosition: 0, animated: true });
    },
    [churches],
  );

  const mapChurches = useMemo<MapChurch[]>(
    () => churches.map((c) => ({ id: c.id, name: c.name, lat: c.lat, lon: c.lon, distance: formatMiles(c.distanceMiles) })),
    [churches],
  );

  const busy = status === 'locating' || status === 'searching';

  return (
    <View style={styles.screen}>
      <View style={styles.controls}>
        <View style={styles.searchRow}>
          <TextInput
            value={place}
            onChangeText={setPlace}
            onSubmitEditing={searchPlace}
            placeholder="City or ZIP code"
            placeholderTextColor={Colors.textMuted}
            returnKeyType="search"
            style={styles.input}
            accessibilityLabel="City or ZIP code"
          />
          <Tappable onPress={searchPlace} style={styles.smallButton}>
            <Text style={styles.smallButtonText}>Search</Text>
          </Tappable>
          <Tappable onPress={useMyLocation} style={styles.smallButton} accessibilityLabel="Use my location">
            <Text style={styles.smallButtonText}>Near me</Text>
          </Tappable>
        </View>

        <View style={styles.radiusRow}>
          <Text style={styles.radiusLabel}>Within</Text>
          {RADIUS_OPTIONS_MILES.map((r) => (
            <Tappable
              key={r}
              onPress={() => setRadius(r)}
              accessibilityState={{ selected: radius === r }}
              style={[styles.chip, radius === r && styles.chipActive]}>
              <Text style={[styles.chipText, radius === r && styles.chipTextActive]}>{r} mi</Text>
            </Tappable>
          ))}
        </View>

        <StatusLine status={status} message={message} count={churches.length} label={center?.label} radius={radius} />
      </View>

      {center && (
        <View style={styles.mapBox}>
          <ChurchMap
            center={center}
            radiusMiles={radius}
            churches={mapChurches}
            selectedId={selectedId}
            onSelect={selectFromMap}
            onDirections={openDirections}
          />
        </View>
      )}

      <FlatList
        ref={listRef}
        data={churches}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        onScrollToIndexFailed={({ index, averageItemLength }) =>
          listRef.current?.scrollToOffset({ offset: index * averageItemLength })
        }
        renderItem={({ item }) => (
          <ChurchRow
            church={item}
            selected={item.id === selectedId}
            onPress={() => setSelectedId(item.id)}
            onDirections={() => openDirections(item.id)}
          />
        )}
        ListFooterComponent={
          busy ? undefined : (
            <Text style={styles.credit}>
              Church listings © OpenStreetMap contributors. Missing a church or service times?{' '}
              <Text style={styles.link} onPress={() => Linking.openURL('https://www.openstreetmap.org/fixthemap')}>
                Add it to OpenStreetMap
              </Text>
              .
            </Text>
          )
        }
      />
    </View>
  );
}

function StatusLine({
  status,
  message,
  count,
  label,
  radius,
}: {
  status: Status;
  message: string | null;
  count: number;
  label?: string;
  radius: number;
}) {
  if (status === 'locating' || status === 'searching') {
    return (
      <View style={styles.statusRow}>
        <ActivityIndicator color={Colors.text} size="small" />
        <Text style={styles.status}>{status === 'locating' ? 'Finding your location…' : 'Searching for churches…'}</Text>
      </View>
    );
  }
  if (message) return <Text style={[styles.status, status === 'error' && styles.statusError]}>{message}</Text>;
  if (status === 'ready') {
    return (
      <Text style={styles.status}>
        {count === 0
          ? `No churches found within ${radius} miles of ${label}. Try a wider radius.`
          : `${count} ${count === 1 ? 'church' : 'churches'} within ${radius} miles of ${label}`}
      </Text>
    );
  }
  return null;
}

function ChurchRow({
  church,
  selected,
  onPress,
  onDirections,
}: {
  church: Church;
  selected: boolean;
  onPress: () => void;
  onDirections: () => void;
}) {
  const meta = [church.denomination, formatMiles(church.distanceMiles)].filter(Boolean).join(' · ');

  return (
    <Tappable onPress={onPress} style={[styles.row, selected && styles.rowSelected]}>
      <Text style={styles.name}>{church.name}</Text>
      <Text style={styles.meta}>{meta}</Text>
      {church.address ? <Text style={styles.detail}>{church.address}</Text> : null}
      {church.serviceTimes ? (
        <Text style={styles.detail}>Services: {church.serviceTimes}</Text>
      ) : church.website ? (
        <Text style={styles.detailMuted}>Check the website for service times</Text>
      ) : null}

      <View style={styles.actions}>
        <ActionButton label="Directions" primary onPress={onDirections} />
        {church.phone ? <ActionButton label="Call" onPress={() => Linking.openURL(`tel:${church.phone}`)} /> : null}
        {church.website ? <ActionButton label="Website" onPress={() => Linking.openURL(church.website!)} /> : null}
      </View>
    </Tappable>
  );
}

function ActionButton({ label, onPress, primary }: { label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => StyleSheet.flatten([styles.action, primary && styles.actionPrimary, pressed && styles.pressed])}>
      <Text style={[styles.actionText, primary && styles.actionTextPrimary]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  controls: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  searchRow: { flexDirection: 'row', gap: Spacing.two },
  input: {
    flex: 1,
    minWidth: 0,
    backgroundColor: Colors.surface,
    color: Colors.text,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    fontSize: 16,
  },
  smallButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  smallButtonText: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  radiusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  radiusLabel: { color: Colors.textSecondary, fontSize: 14 },
  chip: { borderWidth: 1, borderColor: Colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  chipActive: { backgroundColor: Colors.text, borderColor: Colors.text },
  chipText: { color: Colors.textSecondary, fontSize: 14 },
  chipTextActive: { color: Colors.background, fontWeight: '600' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  status: { color: Colors.textSecondary, fontSize: 13, paddingBottom: Spacing.two },
  statusError: { color: '#ff8a8a' },
  mapBox: {
    height: 240,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  list: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
  },
  row: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    marginHorizontal: -Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    borderRadius: 8,
    gap: 3,
  },
  rowSelected: { backgroundColor: Colors.highlight },
  name: { color: Colors.text, fontSize: 17, fontWeight: '600' },
  meta: { color: Colors.textSecondary, fontSize: 14 },
  detail: { color: Colors.textSecondary, fontSize: 14 },
  detailMuted: { color: Colors.textMuted, fontSize: 13, fontStyle: 'italic' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.two },
  action: { borderWidth: 1, borderColor: Colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  actionPrimary: { backgroundColor: Colors.text, borderColor: Colors.text },
  actionText: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  actionTextPrimary: { color: Colors.background },
  credit: { color: Colors.textMuted, fontSize: 12, lineHeight: 18, paddingTop: Spacing.four },
  link: { color: Colors.textSecondary, textDecorationLine: 'underline' },
  pressed: { opacity: 0.6 },
});
