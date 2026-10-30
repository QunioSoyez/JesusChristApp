#!/usr/bin/env bash
# Builds the worker's church tiles (./data) from OpenStreetMap, one US state at a time.
#
# Needs: curl, osmium-tool (apt install osmium-tool), node 20+.
# Run from anywhere:  bash church-finder-worker/data-build/build.sh
#
# Steps for each state listed in Geofabrik's index (parent "us"), plus Puerto Rico if listed:
#   1. download <state>-latest.osm.pbf from Geofabrik
#   2. osmium tags-filter: keep only amenity=place_of_worship (plus the nodes their outlines use)
#   3. osmium export: write those as GeoJSON lines, appended to one file
#   4. delete the state download (keeps disk use to one state at a time)
# Then build-tiles.mjs keeps named Christian churches and writes ./data/tiles + ./data/meta.json.
set -euo pipefail

WORKER_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WORK="${WORK_DIR:-$(mktemp -d)}"
UA="JesusChristApp-church-data/1.0 (+https://github.com/QunioSoyez/JesusChristApp)"
INDEX_URL="https://download.geofabrik.de/index-v1-nogeom.json"
ALL="$WORK/places.geojsonseq"

echo "Working in $WORK"
curl -fsSL --retry 3 -A "$UA" "$INDEX_URL" -o "$WORK/index.json"

# "<id> <pbf url>" for each US state/territory extract. Geofabrik puts ISO 3166-2 codes (e.g.
# "US-AL") on the smallest extract that contains each state, so those identify the state files.
# Fallbacks: parent id ending in "us", or a ".../north-america/us/<name>-latest.osm.pbf" URL.
node -e '
  const idx = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
  const props = idx.features.map((f) => f.properties);
  const isUsState = (p) =>
    (p["iso3166-2"] || []).some((c) => /^US-[A-Z]{2}$/.test(c)) ||
    (p["iso3166-1:alpha2"] || []).includes("PR") ||
    /(^|\/)us$/.test(p.parent || "") ||
    /\/north-america\/us\/[a-z-]+-latest\.osm\.pbf$/.test((p.urls || {}).pbf || "");
  const groupings = /(^|\/)us-(midwest|northeast|pacific|south|west)(-latest\.osm\.pbf)?$/; // multi-state bundles
  const wanted = props.filter((p) => p.urls && p.urls.pbf && isUsState(p) && !groupings.test(p.id) && !groupings.test(p.urls.pbf));
  if (wanted.length < 50) {
    console.error(`Only ${wanted.length} US regions in Geofabrik index; aborting. Sample US-looking entries:`);
    for (const p of props.filter((p) => /us/.test(p.id) || /\/us\//.test((p.urls || {}).pbf || "")).slice(0, 8)) {
      console.error(JSON.stringify({ id: p.id, parent: p.parent, iso2: p["iso3166-2"], iso1: p["iso3166-1:alpha2"], pbf: (p.urls || {}).pbf }));
    }
    process.exit(1);
  }
  for (const p of wanted) console.log(p.id, p.urls.pbf);
' "$WORK/index.json" > "$WORK/regions.txt"
cut -d" " -f1 "$WORK/regions.txt" | tr "\n" " "; echo
echo "$(wc -l < "$WORK/regions.txt") regions to process"

: > "$ALL"
while read -r id url; do
  echo "== $id"
  curl -fL --retry 3 --retry-delay 10 -sS -A "$UA" "$url" -o "$WORK/region.osm.pbf"
  osmium tags-filter "$WORK/region.osm.pbf" nwr/amenity=place_of_worship -o "$WORK/pow.osm.pbf" --overwrite
  osmium export "$WORK/pow.osm.pbf" -f geojsonseq -a type,id -o "$WORK/part.geojsonseq" --overwrite
  cat "$WORK/part.geojsonseq" >> "$ALL"
  rm -f "$WORK/region.osm.pbf" "$WORK/pow.osm.pbf" "$WORK/part.geojsonseq"
done < "$WORK/regions.txt"

node "$WORKER_DIR/data-build/build-tiles.mjs" "$ALL" "$WORKER_DIR/data"
