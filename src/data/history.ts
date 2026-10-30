// Gospel places and archaeology for the History screens.
//
// Text: every fact here comes from the linked source pages (checked October 2026). Where a site
// is identified by tradition rather than certainty, the text says so. Keep it that way when editing.
//
// Images: `wiki` is the English Wikipedia article whose free lead image is used. Run
//   node scripts/fetch-history-images.mjs
// to download them into assets/history/ and regenerate src/data/history-images.ts (credits
// included). To use a different picture, set `image` (a Wikimedia Commons file name) or
// `imageSearch` (a Commons search; the first free-licensed photo is used).

export type HistoryCategory = 'place' | 'archaeology';

/** A Bible passage: book slug, chapter, first verse, optional last verse. */
export type HistoryRef = { b: string; c: number; v: number; to?: number };

export type HistoryEntry = {
  id: string;
  title: string;
  category: HistoryCategory;
  /** One line under the title in the list. */
  subtitle: string;
  /** Short paragraphs. */
  body: string[];
  refs: HistoryRef[];
  sources: { title: string; url: string }[];
  /** English Wikipedia article title (underscores) whose lead image is used. */
  wiki: string;
  /** Optional Commons file name ("Example.jpg") to use instead of the article's lead image. */
  image?: string;
  /** Optional Commons search; the first freely licensed photo found is used (if `image` isn't set). */
  imageSearch?: string;
};

export const HISTORY_SECTIONS: { id: HistoryCategory; title: string; intro: string }[] = [
  { id: 'place', title: 'Gospel places', intro: 'Towns, hills and waters named in the Gospels, and what stands there today.' },
  {
    id: 'archaeology',
    title: 'Archaeology',
    intro: 'Objects and sites from the time of Jesus that connect to people and places in the New Testament.',
  },
];

const wp = (title: string) => ({ title: `Wikipedia: ${title.replace(/_/g, ' ')}`, url: `https://en.wikipedia.org/wiki/${title}` });

export const HISTORY: HistoryEntry[] = [
  // ───────────────────────── Gospel places ─────────────────────────
  {
    id: 'nativity',
    title: 'Church of the Nativity',
    category: 'place',
    subtitle: 'Bethlehem',
    body: [
      'Christian tradition holds that this is where Jesus was born. Beneath the main altar is the Grotto of the Nativity, where a 14-pointed silver star marks the traditional spot.',
      'Constantine the Great had the first church built after his mother Helena visited in 325–326; it was dedicated in 339. Emperor Justinian I rebuilt it in the 500s. The grotto is described as the oldest site continuously used as a place of worship in Christianity, and UNESCO listed the church as a World Heritage Site in 2012.',
    ],
    refs: [
      { b: 'luke', c: 2, v: 1, to: 7 },
      { b: 'matthew', c: 2, v: 1 },
    ],
    sources: [wp('Church_of_the_Nativity')],
    wiki: 'Church_of_the_Nativity',
  },
  {
    id: 'nazareth',
    title: 'Nazareth',
    category: 'place',
    subtitle: 'Where Jesus grew up',
    body: [
      'Luke names Nazareth as Mary’s home, where the angel Gabriel told her she would bear Jesus. Matthew says Joseph and Mary settled there after returning from Egypt, and Jesus grew up there.',
      'In Jesus’s day it was a small village; one archaeologist’s estimate is a maximum of about 480 people. In 2009 excavators uncovered a house from the early Roman period, the first found from the Jewish village. Today Nazareth is the largest city in Israel’s Northern District.',
    ],
    refs: [
      { b: 'luke', c: 1, v: 26, to: 38 },
      { b: 'matthew', c: 2, v: 23 },
      { b: 'luke', c: 4, v: 16, to: 30 },
    ],
    sources: [wp('Nazareth')],
    wiki: 'Nazareth',
  },
  {
    id: 'baptism-site',
    title: 'Baptism Site (Al-Maghtas)',
    category: 'place',
    subtitle: '“Bethany beyond the Jordan”',
    body: [
      'John’s Gospel says John was baptizing at “Bethany beyond the Jordan.” Al-Maghtas, on the east bank of the Jordan River in Jordan, has been venerated as the place of Jesus’s baptism since at least the Byzantine period.',
      'Excavations there uncovered three churches, three baptismal pools and the remains of a monastery on Tell al-Kharrar (Elijah’s Hill). UNESCO listed it in 2015 as “Baptism Site ‘Bethany Beyond the Jordan.’” The west bank of the river, Qasr al-Yahud, is a separate site.',
    ],
    refs: [
      { b: 'john', c: 1, v: 28 },
      { b: 'matthew', c: 3, v: 13, to: 17 },
    ],
    sources: [wp('Al-Maghtas')],
    wiki: 'Al-Maghtas',
  },
  {
    id: 'cana',
    title: 'Cana',
    category: 'place',
    subtitle: 'Water into wine',
    body: [
      'In John’s Gospel, Jesus’s first sign is turning water into wine at a wedding in Cana. He is in Cana again when he heals a royal official’s son, and Nathanael is said to come from there.',
      'Where Cana was is not settled. Kafr Kanna, near Nazareth, has been identified with it since at least the 8th century and is where most pilgrims visit. Excavations at Khirbet Qana, a few miles north, found a village from about 200 BC to AD 650 with signs of early Christian worship, and some scholars favor it.',
    ],
    refs: [
      { b: 'john', c: 2, v: 1, to: 11 },
      { b: 'john', c: 4, v: 46, to: 54 },
      { b: 'john', c: 21, v: 2 },
    ],
    sources: [wp('Cana')],
    wiki: 'Cana',
  },
  {
    id: 'sea-of-galilee',
    title: 'Sea of Galilee',
    category: 'place',
    subtitle: 'Where much of Jesus’s ministry happened',
    body: [
      'Jesus called the fishermen Simon (Peter), Andrew, James and John from its shores. The Gospels place many events on or by the lake, including walking on the water, calming the storm and the miraculous catch of fish.',
      'It is a freshwater lake about 13 miles long and 8 miles wide, fed mainly by the Jordan River, with its surface around 700 feet below sea level. It is also called the Lake of Gennesaret, the Sea of Tiberias and Kinneret.',
    ],
    refs: [
      { b: 'mark', c: 1, v: 16, to: 20 },
      { b: 'mark', c: 4, v: 35, to: 41 },
      { b: 'matthew', c: 14, v: 22, to: 33 },
      { b: 'luke', c: 5, v: 1, to: 11 },
    ],
    sources: [wp('Sea_of_Galilee')],
    wiki: 'Sea_of_Galilee',
  },
  {
    id: 'capernaum',
    title: 'Capernaum',
    category: 'place',
    subtitle: 'Jesus’s base in Galilee',
    body: [
      'All four Gospels name this fishing village on the north shore of the Sea of Galilee as Jesus’s base; Matthew calls it “his own city.” Healings there include Peter’s mother-in-law and a paralyzed man let down through a roof.',
      'The white limestone synagogue visitors see dates from the 4th or 5th century, but the basalt foundations beneath it may belong to a 1st-century synagogue. Nearby, Christian tradition identifies a 1st-century house as Peter’s home; an octagonal church was built over it in the 5th century, and a modern church above it was dedicated in 1990.',
    ],
    refs: [
      { b: 'matthew', c: 4, v: 13 },
      { b: 'matthew', c: 9, v: 1 },
      { b: 'mark', c: 1, v: 21, to: 34 },
      { b: 'mark', c: 2, v: 1, to: 12 },
    ],
    sources: [wp('Capernaum')],
    wiki: 'Capernaum',
  },
  {
    id: 'magdala',
    title: 'Magdala Synagogue',
    category: 'place',
    subtitle: 'A synagogue from Jesus’s time',
    body: [
      'Magdala, on the Sea of Galilee, is named in early Christian texts as the home of Mary Magdalene. In 2009, a dig at the site of a planned hotel uncovered a synagogue from the Second Temple period, one of only a few known from that era.',
      'It has stone benches along its walls, painted walls and a partly mosaic floor. The Gospels say Jesus went throughout Galilee teaching in its synagogues; whether he taught in this one is not known.',
    ],
    refs: [
      { b: 'luke', c: 8, v: 1, to: 3 },
      { b: 'matthew', c: 4, v: 23 },
    ],
    sources: [wp('Migdal_Synagogue')],
    wiki: 'Migdal_Synagogue',
  },
  {
    id: 'bethsaida',
    title: 'Bethsaida',
    category: 'place',
    subtitle: 'Hometown of Peter, Andrew and Philip',
    body: [
      'John’s Gospel names Bethsaida as the town of Peter, Andrew and Philip. Mark records Jesus healing a blind man just outside it. Philip the Tetrarch later raised the village to a city and renamed it Julias.',
      'Its exact location is still debated. Two sites near the north end of the lake have been excavated: et-Tell and el-Araj. Recent finds at el-Araj, including a Roman bathhouse and a possible Byzantine church, have led archaeologists there to consider it the most likely candidate.',
    ],
    refs: [
      { b: 'john', c: 1, v: 44 },
      { b: 'mark', c: 8, v: 22, to: 26 },
      { b: 'matthew', c: 11, v: 21 },
    ],
    sources: [wp('Bethsaida')],
    wiki: 'Bethsaida',
    imageSearch: 'Bethsaida et-Tell',
  },
  {
    id: 'chorazin',
    title: 'Chorazin',
    category: 'place',
    subtitle: 'A town that did not repent',
    body: [
      'Matthew and Luke name Chorazin among the towns where Jesus did many mighty works, and record his woe on it because it did not repent.',
      'The ruins sit on a hill above the north shore of the Sea of Galilee, about 2.5 miles from Capernaum. The large basalt synagogue there was built in the late 3rd century and rebuilt in the 6th. The site is now Korazim National Park.',
    ],
    refs: [
      { b: 'matthew', c: 11, v: 20, to: 24 },
      { b: 'luke', c: 10, v: 13, to: 15 },
    ],
    sources: [wp('Chorazin')],
    wiki: 'Chorazin',
  },
  {
    id: 'beatitudes',
    title: 'Mount of Beatitudes',
    category: 'place',
    subtitle: 'Traditional site of the Sermon on the Mount',
    body: [
      'This hill above the Sea of Galilee, near Capernaum, is the traditional place of the Sermon on the Mount. Whether it is the exact spot is uncertain, but it is in the area where the sermon is set.',
      'The Church of the Beatitudes was built in 1936–1938 to a design by Antonio Barluzzi. It is eight-sided, one side for each of the eight Beatitudes. Ruins of a small late-4th-century Byzantine church lie downhill.',
    ],
    refs: [{ b: 'matthew', c: 5, v: 1, to: 12 }],
    sources: [wp('Church_of_the_Beatitudes')],
    wiki: 'Church_of_the_Beatitudes',
  },
  {
    id: 'caesarea-philippi',
    title: 'Caesarea Philippi (Banias)',
    category: 'place',
    subtitle: '“Who do you say that I am?”',
    body: [
      'Matthew and Mark place Peter’s confession that Jesus is the Messiah in the region of Caesarea Philippi.',
      'The city was founded around 3 BC by Philip, a son of Herod the Great, at the foot of Mount Hermon. A spring here, once associated with the Greek god Pan, flows from a large cave that was lined with shrines to him; it feeds one of the main sources of the Jordan River. The site is now a nature reserve.',
    ],
    refs: [
      { b: 'matthew', c: 16, v: 13, to: 20 },
      { b: 'mark', c: 8, v: 27, to: 30 },
    ],
    sources: [wp('Banias')],
    wiki: 'Banias',
  },
  {
    id: 'mount-tabor',
    title: 'Mount Tabor',
    category: 'place',
    subtitle: 'Traditional site of the Transfiguration',
    body: [
      'The Gospels say Jesus was transfigured on “a high mountain” but do not name it. Mount Tabor was first identified as the place by Origen in the 3rd century and is one of the mountains traditionally associated with it.',
      'The rounded mountain rises about 1,886 feet above sea level from the Jezreel Valley in Lower Galilee. In the Old Testament, Deborah and Barak gathered their army here. The Church of the Transfiguration on its summit was built in 1919–1924, also by Antonio Barluzzi.',
    ],
    refs: [
      { b: 'matthew', c: 17, v: 1, to: 9 },
      { b: 'mark', c: 9, v: 2, to: 8 },
      { b: 'judges', c: 4, v: 6, to: 14 },
    ],
    sources: [wp('Mount_Tabor')],
    wiki: 'Mount_Tabor',
  },
  {
    id: 'jericho',
    title: 'Jericho in Jesus’s day',
    category: 'place',
    subtitle: 'Zacchaeus and blind Bartimaeus',
    body: [
      'On his last journey to Jerusalem, Jesus passed through Jericho, where he healed blind Bartimaeus and stayed at the house of the tax collector Zacchaeus.',
      'The Jericho of that time included royal winter palaces at Tulul Abu el-‘Alayiq, near where the road enters Wadi Qelt. They were begun by the Hasmonean king John Hyrcanus I and expanded by Herod the Great, with pools, bathhouses and gardens. Ehud Netzer excavated them over ten seasons starting in the 1970s.',
    ],
    refs: [
      { b: 'mark', c: 10, v: 46, to: 52 },
      { b: 'luke', c: 19, v: 1, to: 10 },
    ],
    sources: [wp('Hasmonean_and_Herodian_royal_winter_palaces')],
    wiki: 'Hasmonean_and_Herodian_royal_winter_palaces',
  },
  {
    id: 'bethany',
    title: 'Bethany and the Tomb of Lazarus',
    category: 'place',
    subtitle: 'Where Jesus raised Lazarus',
    body: [
      'Bethany was the village of Mary, Martha and Lazarus, about two miles from Jerusalem. John’s Gospel records Jesus raising Lazarus from the dead there.',
      'In today’s al-Eizariya, on the southeast slope of the Mount of Olives, a tomb has been identified as Lazarus’s since at least the 4th century; Eusebius and the Bordeaux pilgrim mention it around 330. A church was built there by 390. The present Franciscan Church of Saint Lazarus dates from 1952–1955.',
    ],
    refs: [
      { b: 'john', c: 11, v: 1, to: 44 },
      { b: 'john', c: 12, v: 1, to: 8 },
    ],
    sources: [wp('Tomb_of_Lazarus')],
    wiki: 'Tomb_of_Lazarus',
  },
  {
    id: 'mount-of-olives',
    title: 'Mount of Olives',
    category: 'place',
    subtitle: 'Across the Kidron Valley from the Temple',
    body: [
      'The ridge east of Jerusalem’s Old City appears often in Jesus’s last days. Luke describes the crowd praising God as Jesus came down it, and Jesus weeping over the city. He taught his disciples about the end of the age there, and Acts places the Ascension on it.',
      'Its western slopes hold a Jewish cemetery used for more than 3,000 years, with about 150,000 graves. Churches on the mount include Dominus Flevit, the Pater Noster and the Chapel of the Ascension.',
    ],
    refs: [
      { b: 'luke', c: 19, v: 37, to: 44 },
      { b: 'matthew', c: 24, v: 3 },
      { b: 'acts', c: 1, v: 9, to: 12 },
    ],
    sources: [wp('Mount_of_Olives')],
    wiki: 'Mount_of_Olives',
  },
  {
    id: 'gethsemane',
    title: 'Gethsemane',
    category: 'place',
    subtitle: 'Where Jesus prayed before his arrest',
    body: [
      'Matthew and Mark name Gethsemane as the place where Jesus prayed the night he was arrested; John calls it a garden across the Kidron. The name is generally understood to mean “oil press.”',
      'The olive garden at the foot of the Mount of Olives has eight very old trees. A 2012 study dated three of them to about 1092, 1166 and 1198. Next to it, the Church of All Nations (1919–1924, by Antonio Barluzzi) encloses a section of bedrock where tradition says Jesus prayed. It stands over the remains of a 4th-century Byzantine church.',
    ],
    refs: [
      { b: 'matthew', c: 26, v: 36, to: 46 },
      { b: 'mark', c: 14, v: 32, to: 42 },
      { b: 'john', c: 18, v: 1 },
    ],
    sources: [wp('Gethsemane'), wp('Church_of_All_Nations')],
    wiki: 'Church_of_All_Nations',
  },
  {
    id: 'bethesda',
    title: 'Pool of Bethesda',
    category: 'place',
    subtitle: 'Five porches by the Sheep Gate',
    body: [
      'John describes a pool by the Sheep Gate with five covered porches, where Jesus healed a man who had been ill for 38 years.',
      'For centuries there was no clear archaeological evidence for it. In the 19th century Conrad Schick found a large pool near the Church of St. Anne, close to today’s Lions’ Gate, and excavations in 1964 uncovered two large pools with a dam between them.',
    ],
    refs: [{ b: 'john', c: 5, v: 1, to: 9 }],
    sources: [wp('Pool_of_Bethesda')],
    wiki: 'Pool_of_Bethesda',
  },
  {
    id: 'temple-mount',
    title: 'The Temple: Western Wall and Southern Steps',
    category: 'place',
    subtitle: 'What remains of Herod’s Temple Mount',
    body: [
      'Jesus taught in the Temple courts, drove out the money changers, and foretold the Temple’s destruction when his disciples admired its great stones.',
      'Herod the Great began rebuilding the Temple Mount around 19 BC. The Western Wall is part of its retaining wall; its largest stone is about 44 feet long. On the south side, a monumental stairway led up to the Huldah Gates in the southern wall. Benjamin Mazar excavated the steps after 1967.',
    ],
    refs: [
      { b: 'mark', c: 11, v: 15, to: 17 },
      { b: 'mark', c: 13, v: 1, to: 2 },
      { b: 'john', c: 10, v: 22, to: 23 },
    ],
    sources: [wp('Western_Wall'), wp('Southern_Wall'), wp('Huldah_Gates')],
    wiki: 'Western_Wall',
  },
  {
    id: 'holy-sepulchre',
    title: 'Church of the Holy Sepulchre',
    category: 'place',
    subtitle: 'Traditional site of the crucifixion and tomb',
    body: [
      'Since the 4th century, Christians have venerated this site in Jerusalem’s Old City as both Golgotha and the tomb of Jesus. Constantine’s church, which replaced a temple built by Hadrian, was consecrated in 335. It was destroyed in 1009 and rebuilt by 1048.',
      'Archaeological evidence suggests the site was outside the city walls in the 1st century, as the Gospels indicate. The area was a quarry, and a 1st-century Jewish tomb lies nearby. During restoration in 2016, the original limestone burial bed inside the tomb shrine was uncovered.',
    ],
    refs: [
      { b: 'john', c: 19, v: 17, to: 20 },
      { b: 'john', c: 19, v: 41, to: 42 },
      { b: 'matthew', c: 28, v: 5, to: 6 },
    ],
    sources: [wp('Church_of_the_Holy_Sepulchre')],
    wiki: 'Church_of_the_Holy_Sepulchre',
  },

  // ───────────────────────── Archaeology ─────────────────────────
  {
    id: 'pilate-stone',
    title: 'Pilate Stone',
    category: 'archaeology',
    subtitle: 'Pontius Pilate’s name in stone',
    body: [
      'A limestone block found in 1961 at Caesarea Maritima, reused in a 4th-century staircase. Its damaged Latin inscription names “Pontius Pilate, prefect of Judea” dedicating a building called the Tiberieum.',
      'It is the only known inscription from Pilate’s own lifetime that names him. Outside the New Testament he was otherwise known from writers such as Josephus, Philo and Tacitus. The original is in the Israel Museum in Jerusalem; a replica stands at Caesarea.',
    ],
    refs: [
      { b: 'luke', c: 3, v: 1 },
      { b: 'matthew', c: 27, v: 2 },
      { b: 'john', c: 19, v: 13, to: 16 },
    ],
    sources: [wp('Pilate_stone')],
    wiki: 'Pilate_stone',
  },
  {
    id: 'caiaphas-ossuary',
    title: 'Caiaphas Ossuary',
    category: 'archaeology',
    subtitle: 'A bone box inscribed “Joseph son of Caiaphas”',
    body: [
      'In 1990, construction workers in Jerusalem’s Peace Forest uncovered a burial cave with twelve ossuaries (stone boxes for bones). One is inscribed “Yehosef bar Qayafa” — Joseph son of Caiaphas.',
      'The Gospels name Caiaphas as the high priest who questioned Jesus. Many identify the ossuary with him, though some scholars question it because of the spelling and because it doesn’t mention the high priesthood. It is in the Israel Museum.',
    ],
    refs: [
      { b: 'matthew', c: 26, v: 57, to: 66 },
      { b: 'john', c: 18, v: 13, to: 14 },
    ],
    sources: [wp('Caiaphas_ossuary')],
    wiki: 'Caiaphas_ossuary',
  },
  {
    id: 'galilee-boat',
    title: 'Sea of Galilee Boat',
    category: 'archaeology',
    subtitle: 'A fishing boat from the 1st century',
    body: [
      'During a drought in 1986, two fishermen from Kibbutz Ginosar found the remains of a wooden boat on the lake’s northwest shore. It is about 27 feet long and 7.5 feet wide, built mostly of cedar with ten kinds of wood.',
      'Radiocarbon dating gives about 40 BC (give or take 80 years), and the pottery and nails found with it suggest 50 BC to AD 50. There is no evidence connecting it to Jesus or his disciples, but it shows the kind of boat they would have used. It is displayed at the Yigal Allon Museum in Ginosar.',
    ],
    refs: [
      { b: 'luke', c: 5, v: 1, to: 11 },
      { b: 'mark', c: 4, v: 35, to: 41 },
    ],
    sources: [wp('Sea_of_Galilee_Boat')],
    wiki: 'Sea_of_Galilee_Boat',
  },
  {
    id: 'magdala-stone',
    title: 'Magdala Stone',
    category: 'archaeology',
    subtitle: 'A carved block from the Magdala synagogue',
    body: [
      'Found in the Magdala synagogue in 2009 and dated to before the Temple’s destruction in AD 70. Its front shows a seven-branched menorah flanked by two jars, beneath an arch on two pillars.',
      'It is considered the oldest known carving of the menorah in a Jewish setting. Some scholars see the whole stone as a depiction of the Jerusalem Temple. The original was removed for safekeeping; a replica sits in the synagogue at Magdala.',
    ],
    refs: [{ b: 'luke', c: 8, v: 1, to: 3 }],
    sources: [wp('Magdala_stone')],
    wiki: 'Magdala_stone',
  },
  {
    id: 'siloam',
    title: 'Pool of Siloam',
    category: 'archaeology',
    subtitle: 'Where the man born blind washed',
    body: [
      'In John’s Gospel, Jesus puts mud on the eyes of a man born blind and tells him to wash in the Pool of Siloam; he comes back seeing.',
      'In 2004, workers repairing a sewer pipe south of the Old City struck ancient steps, and archaeologists Eli Shukron and Ronny Reich uncovered a large stepped pool from the Second Temple period, about 225 feet wide. Coins in its plaster help date it. It is fed by the Gihon Spring through Hezekiah’s tunnel. Fuller excavation began in 2023.',
    ],
    refs: [{ b: 'john', c: 9, v: 1, to: 11 }],
    sources: [wp('Pool_of_Siloam')],
    wiki: 'Pool_of_Siloam',
    imageSearch: 'Pool of Siloam steps excavation',
  },
  {
    id: 'temple-warning',
    title: 'Temple Warning Inscription',
    category: 'archaeology',
    subtitle: '“No stranger is to enter…”',
    body: [
      'A stone tablet in Greek from the barrier around the inner Temple in Jerusalem, warning non-Jews not to go further on pain of death. Josephus describes such notices in almost the same words.',
      'A complete tablet was found in 1871 by Charles Clermont-Ganneau and is in the Istanbul Archaeology Museums; a fragment of another, found in the 1930s, is in the Israel Museum. Acts describes a riot when Paul was accused of bringing a Gentile into the Temple.',
    ],
    refs: [
      { b: 'acts', c: 21, v: 27, to: 30 },
      { b: 'ephesians', c: 2, v: 14 },
    ],
    sources: [wp('Temple_Warning_inscription')],
    wiki: 'Temple_Warning_inscription',
  },
  {
    id: 'herodium',
    title: 'Herodium',
    category: 'archaeology',
    subtitle: 'Herod the Great’s palace and tomb',
    body: [
      'Herod the Great built this fortress-palace on a cone-shaped hill about 3 miles southeast of Bethlehem, around 23–15 BC. Josephus says Herod was buried there after his death in 4 BC.',
      'In 2007, archaeologist Ehud Netzer found and identified Herod’s tomb on the hill’s northern slope; he died in a fall at the site in 2010. Matthew’s Gospel describes Herod as king when Jesus was born.',
    ],
    refs: [{ b: 'matthew', c: 2, v: 1, to: 16 }],
    sources: [wp('Herodium')],
    wiki: 'Herodium',
  },
  {
    id: 'isaiah-scroll',
    title: 'Great Isaiah Scroll',
    category: 'archaeology',
    subtitle: 'The whole book of Isaiah, from before Jesus',
    body: [
      'Found by Bedouin shepherds in Qumran Cave 1 around 1947, it is one of the Dead Sea Scrolls. It contains all 66 chapters of Isaiah on 17 sheets of parchment, about 24 feet long, and is commonly dated to about 125 BC.',
      'It is about 1,000 years older than the oldest Hebrew manuscripts of Isaiah known before it, and its text generally agrees with them. In Luke, Jesus reads from Isaiah in the Nazareth synagogue. It is displayed in the Shrine of the Book at the Israel Museum.',
    ],
    refs: [
      { b: 'luke', c: 4, v: 16, to: 21 },
      { b: 'isaiah', c: 53, v: 1, to: 12 },
    ],
    sources: [wp('Isaiah_Scroll')],
    wiki: 'Isaiah_Scroll',
    // A close-up of one section; the article's photo is the whole 24-foot scroll in one thin strip.
    image: 'Great Isaiah Scroll Ch53.jpg',
    imageSearch: 'Great Isaiah Scroll column',
  },
  {
    id: 'p52',
    title: 'Rylands Papyrus P52',
    category: 'archaeology',
    subtitle: 'Often called the earliest New Testament fragment',
    body: [
      'A scrap of papyrus about 3.5 by 2.4 inches with part of John 18 in Greek: Jesus before Pilate. It was bought in Egypt in 1920 and published by C. H. Roberts in 1935.',
      'Roberts dated it to AD 100–150. Later scholars have proposed dates up to about 175 or later, so its exact age is debated, but it is often described as the earliest known fragment of the New Testament. It is held by the John Rylands Library in Manchester, England.',
    ],
    refs: [
      { b: 'john', c: 18, v: 31, to: 33 },
      { b: 'john', c: 18, v: 37, to: 38 },
    ],
    sources: [wp('Rylands_Library_Papyrus_P52')],
    wiki: 'Rylands_Library_Papyrus_P52',
  },
];
