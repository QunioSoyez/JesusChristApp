// "The Life of Jesus" timeline, shown at the top of the History section.
//
// Written for this app from the Gospel accounts (each event links to its passages). Dates are
// approximate: the Gospels don't give calendar years, so they're estimates scholars commonly
// give, and the text says so. `places` are History entry ids (src/data/history.ts) that the
// event links to.
import type { HistoryRef } from '@/data/history';

export type LifeEvent = {
  id: string;
  /** Approximate time, shown above the title. */
  when: string;
  title: string;
  body: string;
  refs: HistoryRef[];
  places: string[];
};

export const LIFE_OF_JESUS_INTRO =
  'The main events of Jesus’s life, in order, as the Gospels tell them. Dates are approximate; the Gospels don’t give calendar years, and scholars’ estimates differ by a few years.';

export const LIFE_OF_JESUS: LifeEvent[] = [
  {
    id: 'birth',
    when: 'About 6–4 BC',
    title: 'Born in Bethlehem',
    body: 'Jesus is born to Mary, who is engaged to Joseph, in Bethlehem while Herod the Great is king. Shepherds come to see him, and later wise men from the east arrive to worship him. Herod died around 4 BC, so Jesus was born a few years before that.',
    refs: [
      { b: 'luke', c: 2, v: 1, to: 20 },
      { b: 'matthew', c: 2, v: 1, to: 12 },
    ],
    places: ['nativity', 'herodium'],
  },
  {
    id: 'childhood',
    when: 'Childhood',
    title: 'Growing up in Nazareth',
    body: 'Joseph takes Mary and Jesus to Egypt to escape Herod, then settles the family in Nazareth. At twelve, Jesus stays behind in the Temple in Jerusalem, listening to the teachers and asking them questions. He grows “in wisdom and stature, and in favour with God and man.”',
    refs: [
      { b: 'matthew', c: 2, v: 13, to: 23 },
      { b: 'luke', c: 2, v: 39, to: 52 },
    ],
    places: ['nazareth'],
  },
  {
    id: 'baptism',
    when: 'About AD 28',
    title: 'Baptism and temptation',
    body: 'John the Baptist is preaching by the Jordan River when Jesus comes to be baptized. The Spirit descends on him like a dove, and a voice from heaven calls him “my beloved Son.” Jesus then spends forty days in the wilderness, where he is tempted by the devil. Luke dates John’s ministry to the fifteenth year of the emperor Tiberius and says Jesus was about thirty.',
    refs: [
      { b: 'luke', c: 3, v: 1, to: 3 },
      { b: 'matthew', c: 3, v: 13, to: 17 },
      { b: 'matthew', c: 4, v: 1, to: 11 },
      { b: 'luke', c: 3, v: 23 },
    ],
    places: ['baptism-site'],
  },
  {
    id: 'first-disciples',
    when: 'Start of his ministry',
    title: 'First disciples and first sign',
    body: 'Jesus calls fishermen by the Sea of Galilee (Simon Peter, Andrew, James and John) to follow him. At a wedding in Cana he turns water into wine, the first of the signs John’s Gospel records.',
    refs: [
      { b: 'john', c: 1, v: 35, to: 51 },
      { b: 'mark', c: 1, v: 16, to: 20 },
      { b: 'john', c: 2, v: 1, to: 11 },
    ],
    places: ['sea-of-galilee', 'cana', 'bethsaida'],
  },
  {
    id: 'galilee',
    when: 'About AD 28–30',
    title: 'Ministry in Galilee',
    body: 'Based in Capernaum, Jesus travels through the towns of Galilee, teaching in their synagogues, announcing the kingdom of God and healing the sick. Crowds follow him from all over the region. John’s Gospel mentions at least three Passovers during his ministry, so it is usually thought to have lasted about three years.',
    refs: [
      { b: 'matthew', c: 4, v: 23, to: 25 },
      { b: 'mark', c: 1, v: 21, to: 39 },
      { b: 'mark', c: 2, v: 1, to: 12 },
    ],
    places: ['capernaum', 'magdala', 'chorazin'],
  },
  {
    id: 'teaching',
    when: 'During his ministry',
    title: 'The Sermon on the Mount and the parables',
    body: 'On a mountainside Jesus teaches the Beatitudes, the Lord’s Prayer and what it means to live in God’s kingdom. He often teaches in parables, everyday stories like the sower, the lost sheep and the prodigal son, that show what God is like.',
    refs: [
      { b: 'matthew', c: 5, v: 1, to: 12 },
      { b: 'matthew', c: 6, v: 9, to: 13 },
      { b: 'matthew', c: 13, v: 1, to: 9 },
      { b: 'luke', c: 15, v: 1, to: 32 },
    ],
    places: ['beatitudes'],
  },
  {
    id: 'miracles',
    when: 'During his ministry',
    title: 'Miracles and signs',
    body: 'Jesus heals the sick, the blind and the lame, calms a storm on the lake and walks on the water. He feeds five thousand people with five loaves and two fish, the only miracle besides the resurrection that all four Gospels record.',
    refs: [
      { b: 'mark', c: 4, v: 35, to: 41 },
      { b: 'mark', c: 6, v: 30, to: 44 },
      { b: 'matthew', c: 14, v: 22, to: 33 },
      { b: 'john', c: 5, v: 1, to: 9 },
    ],
    places: ['sea-of-galilee', 'bethesda'],
  },
  {
    id: 'transfiguration',
    when: 'Later in his ministry',
    title: 'Peter’s confession and the Transfiguration',
    body: 'Near Caesarea Philippi, Jesus asks his disciples who they say he is, and Peter answers, “Thou art the Christ, the Son of the living God.” Jesus begins to tell them he must suffer, die and rise again. Days later, on a high mountain, he is transfigured before Peter, James and John, and Moses and Elijah appear with him.',
    refs: [
      { b: 'matthew', c: 16, v: 13, to: 21 },
      { b: 'matthew', c: 17, v: 1, to: 9 },
    ],
    places: ['caesarea-philippi', 'mount-tabor'],
  },
  {
    id: 'to-jerusalem',
    when: 'His last months',
    title: 'The journey to Jerusalem',
    body: 'Jesus “stedfastly set his face to go to Jerusalem.” On the way he teaches and heals; in Jericho he restores blind Bartimaeus’s sight and stays with the tax collector Zacchaeus. In Bethany, near Jerusalem, he raises his friend Lazarus from the dead.',
    refs: [
      { b: 'luke', c: 9, v: 51 },
      { b: 'mark', c: 10, v: 46, to: 52 },
      { b: 'luke', c: 19, v: 1, to: 10 },
      { b: 'john', c: 11, v: 1, to: 44 },
    ],
    places: ['jericho', 'bethany'],
  },
  {
    id: 'holy-week',
    when: 'The last week',
    title: 'Entry into Jerusalem',
    body: 'Jesus rides into Jerusalem on a donkey as crowds spread their cloaks and branches on the road and shout “Hosanna!” He drives the money changers out of the Temple, teaches in its courts, and tells his disciples that the Temple will be destroyed.',
    refs: [
      { b: 'mark', c: 11, v: 1, to: 11 },
      { b: 'mark', c: 11, v: 15, to: 17 },
      { b: 'mark', c: 13, v: 1, to: 2 },
      { b: 'luke', c: 19, v: 37, to: 44 },
    ],
    places: ['mount-of-olives', 'temple-mount'],
  },
  {
    id: 'last-supper',
    when: 'The last week',
    title: 'The Last Supper, arrest and trials',
    body: 'At the Passover meal Jesus shares bread and wine with his disciples as his body and blood. That night he prays in Gethsemane and is arrested. He is questioned by the high priest Caiaphas and the council, then handed over to the Roman governor Pontius Pilate, who sentences him to be crucified.',
    refs: [
      { b: 'mark', c: 14, v: 12, to: 26 },
      { b: 'mark', c: 14, v: 32, to: 50 },
      { b: 'matthew', c: 26, v: 57, to: 68 },
      { b: 'john', c: 18, v: 28, to: 40 },
    ],
    places: ['gethsemane', 'caiaphas-ossuary', 'pilate-stone'],
  },
  {
    id: 'crucifixion',
    when: 'About AD 30 or 33',
    title: 'Crucifixion and burial',
    body: 'Jesus is crucified at Golgotha, outside the city, between two criminals. He dies that afternoon, and Joseph of Arimathea lays his body in a new tomb cut from rock nearby. AD 30 and AD 33 are the years most often proposed.',
    refs: [
      { b: 'john', c: 19, v: 16, to: 30 },
      { b: 'luke', c: 23, v: 44, to: 56 },
      { b: 'john', c: 19, v: 38, to: 42 },
    ],
    places: ['holy-sepulchre'],
  },
  {
    id: 'resurrection',
    when: 'The third day',
    title: 'The Resurrection',
    body: 'Early on the first day of the week, women come to the tomb and find it empty. An angel tells them, “He is not here: for he is risen.” Jesus appears to Mary Magdalene and then to his disciples.',
    refs: [
      { b: 'matthew', c: 28, v: 1, to: 10 },
      { b: 'luke', c: 24, v: 1, to: 12 },
      { b: 'john', c: 20, v: 1, to: 20 },
    ],
    places: ['holy-sepulchre'],
  },
  {
    id: 'ascension',
    when: 'Forty days later',
    title: 'Appearances and Ascension',
    body: 'For forty days Jesus appears to his followers, including by the Sea of Galilee, and Paul writes that he was seen by more than five hundred at once. He sends them to make disciples of all nations, then is taken up into heaven from the Mount of Olives.',
    refs: [
      { b: 'john', c: 21, v: 1, to: 14 },
      { b: 'matthew', c: 28, v: 16, to: 20 },
      { b: '1-corinthians', c: 15, v: 3, to: 8 },
      { b: 'acts', c: 1, v: 3, to: 12 },
    ],
    places: ['sea-of-galilee', 'mount-of-olives'],
  },
];
