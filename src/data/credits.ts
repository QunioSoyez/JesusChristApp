// Data sources and key components credited on the About & Credits screen (and in CREDITS.md).
// The full list of bundled npm packages and their license texts is generated separately into
// licenses.json by scripts/build-licenses.mjs.

export type Credit = {
  name: string;
  /** What it's used for in this app. */
  use: string;
  license: string;
  url: string;
  /** Required copyright/license notice, shown in full. */
  notice?: string;
  /** npm package whose license text (from licenses.json) applies, shown in full. */
  licensePackage?: string;
};

export const APP_REPO_URL = 'https://github.com/QunioSoyez/JesusChristApp';

export const DATA_SOURCES: Credit[] = [
  {
    name: 'King James Version (1769)',
    use: 'Bible text (KJV version), Jesus in Scripture, and home screen verses.',
    license: 'Public domain (United States)',
    url: 'https://github.com/scrollmapper/bible_databases',
    notice: `Text prepared by the Scrollmapper Bible Databases project.

MIT License

Copyright (c) 2024 Scrollmapper

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,
  },
  {
    name: 'Berean Standard Bible (BSB)',
    use: 'Bible text when the BSB version is selected.',
    license: 'Public domain (dedicated April 30, 2023)',
    url: 'https://berean.bible/licensing.htm',
    notice:
      'The Berean Bible texts were placed into the public domain on April 30, 2023 by their publisher. Text files prepared by the Scrollmapper Bible Databases project (MIT License; see the King James Version entry above for the full notice).',
  },
  {
    name: 'Reina-Valera 1909 (RV1909)',
    use: 'Spanish Bible text when the RV1909 version is selected.',
    license: 'Public domain',
    url: 'https://github.com/scrollmapper/bible_databases',
    notice:
      'La Santa Biblia, Reina-Valera revision of 1909, is in the public domain. Text files prepared by the Scrollmapper Bible Databases project (MIT License; see the King James Version entry above for the full notice). The capitalized first word of each chapter (a printing convention) is shown in normal case.',
  },
  {
    name: 'Book of Common Prayer (1928)',
    use: 'Classic prayers in the Prayer Guide (the other prayers there are from the King James Version).',
    license: 'Public domain (United States)',
    url: 'https://episcopalnet.org/1928bcp/',
  },
  {
    name: 'OpenStreetMap',
    use: 'Church listings, map images, and city / ZIP code lookups in Find a Church.',
    license: 'Open Database License (ODbL)',
    url: 'https://www.openstreetmap.org/copyright',
    notice:
      '© OpenStreetMap contributors. Data is available under the Open Database License (ODbL). Church listings in this app are extracted from OpenStreetMap and are also available under the ODbL. Details: https://www.openstreetmap.org/copyright',
  },
  {
    name: 'Geofabrik',
    use: 'Monthly OpenStreetMap data downloads used to build the church listings.',
    license: 'OpenStreetMap data (ODbL)',
    url: 'https://download.geofabrik.de',
  },
  {
    name: 'Nominatim',
    use: 'Turns a city or ZIP code into a map location.',
    license: 'OpenStreetMap data (ODbL)',
    url: 'https://nominatim.org',
  },
];

export const COMPONENTS: Credit[] = [
  {
    name: 'Leaflet',
    use: 'The map in Find a Church.',
    license: 'BSD 2-Clause',
    url: 'https://leafletjs.com',
    licensePackage: 'leaflet',
  },
  {
    name: 'Material Design Icons (Pictogrammers)',
    use: 'Icons on the home screen and Next Steps.',
    license: 'Apache License 2.0',
    url: 'https://pictogrammers.com/library/mdi/',
    notice: 'Material Design Icons by Pictogrammers, licensed under the Apache License, Version 2.0: https://www.apache.org/licenses/LICENSE-2.0',
  },
  {
    name: 'react-native-vector-icons / @expo/vector-icons',
    use: 'Delivers the icons above.',
    license: 'MIT',
    url: 'https://github.com/expo/vector-icons',
    licensePackage: '@expo/vector-icons',
  },
  {
    name: 'Expo, React Native and React',
    use: 'The app framework.',
    license: 'MIT',
    url: 'https://expo.dev',
    licensePackage: 'expo',
  },
];
