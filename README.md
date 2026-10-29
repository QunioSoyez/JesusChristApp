# JesusChristApp

An app for everyone to learn more about Jesus Christ. Free, open source, no login.

Built with [Expo](https://expo.dev) (React Native + TypeScript) so one codebase runs on iOS, Android and the web.

## What's in the MVP

- **Home**: black screen, white cross, and a random uplifting verse (tap for another)
- **Jesus in Scripture**: 1,375 New Testament verses that mention Jesus by name or title, searchable and filterable by title (Jesus/Christ, Son of man, Son of God, Lamb of God, the Word, the "I am" sayings, and more)
- **Read the Bible**: the full King James Version, by book and chapter; tapping a reference opens the chapter with that verse highlighted
- **Find a Church**: churches within 5, 10 (default) or 25 miles, shown on a map and in a list with distance, denomination, address and service times when known, plus Directions, Call and Website buttons. Uses your location (asked once, never stored) or a city/ZIP you type.
- Works offline: the Bible text is bundled with the app (Find a Church needs a connection)

## Run it

```bash
npm install
npx expo start
```

Then press `w` for web, or scan the QR code with the **Expo Go** app on your phone.

## Project layout

```
src/app/                    screens (Expo Router: each file is a route)
  index.tsx                 home
  references.tsx            Jesus in Scripture
  bible/index.tsx           book list
  bible/[book]/index.tsx    chapter picker
  bible/[book]/[chapter].tsx  reader
src/components/             shared UI (cross, tappable)
src/lib/bible.ts            data access helpers
src/data/                   generated data (do not edit by hand)
scripts/build-data.mjs      regenerates src/data from the KJV source
```

## Data

Bible text: King James Version (1769), public domain, from
[scrollmapper/bible_databases](https://github.com/scrollmapper/bible_databases).

To change which titles count as "references to Jesus", or the home-screen verses, edit
`CATEGORIES` / `QUOTES` in `scripts/build-data.mjs`, then run:

```bash
npm run build-data
```

Church listings and map tiles: © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors,
searched with the [Overpass API](https://overpass-api.de) and [Nominatim](https://nominatim.org). The map uses
[Leaflet](https://leafletjs.com) (BSD-2-Clause), bundled into `src/data/leaflet.ts` by `npm run build-map`.

Before a public release, move map tiles off `tile.openstreetmap.org` to a tile provider or a self-hosted
server; OpenStreetMap's free tile servers aren't meant for app traffic at scale.

## License

MIT
