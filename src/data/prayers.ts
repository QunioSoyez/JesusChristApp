// Prayer Guide topics, shown from the top of Next Steps.
//
// Every prayer is in the public domain:
//  - Bible prayers are the King James Version text, taken word for word from the app's own KJV data
//    (src/data/bible/kjv), with Psalm headings ("A Psalm of David.") left off.
//  - Classic prayers are from the 1928 American Book of Common Prayer (public domain in the United
//    States), checked word for word against https://episcopalnet.org/1928bcp/. Where the book has a
//    blank for a name ("thy sick servant N."), the blank is left out.
// Generated once for the app; edit freely, but keep new prayers to public-domain sources.
import type { HistoryRef } from '@/data/history';

export type Prayer =
  | { title: string; kind: 'bible'; text: string; refs: HistoryRef[] }
  | { title: string; kind: 'classic'; source: string; text: string };

export type PrayerTopic = {
  id: string;
  title: string;
  icon: string;
  intro: string;
  /** A Bible passage for the topic, shown under the intro. */
  verse: HistoryRef;
  prayers: Prayer[];
};

export const PRAYER_GUIDE_INTRO =
  'Prayer is simply talking with God. These prayers from the Bible and from Christians through the centuries can help when you don’t know what to say. Many use older English (“thee” and “thou”); you can pray them as written, or put them in your own words.';

export const PRAYER_TOPICS: PrayerTopic[] = [
  {
    id: 'following-jesus',
    title: 'Beginning to follow Jesus',
    icon: 'cross',
    intro:
      'You don’t need special words to come to God. These short prayers from the Gospels were prayed by people meeting Jesus, and you can make them your own.',
    verse: {
      b: 'romans',
      c: 10,
      v: 9,
      to: 10,
    },
    prayers: [
      {
        title: 'A prayer for mercy',
        kind: 'bible',
        text: 'God be merciful to me a sinner.',
        refs: [
          {
            b: 'luke',
            c: 18,
            v: 13,
          },
        ],
      },
      {
        title: 'A prayer for faith',
        kind: 'bible',
        text: 'Lord, I believe; help thou mine unbelief.',
        refs: [
          {
            b: 'mark',
            c: 9,
            v: 24,
          },
        ],
      },
      {
        title: 'A prayer of trust',
        kind: 'bible',
        text: 'Lord, to whom shall we go? thou hast the words of eternal life. And we believe and are sure that thou art that Christ, the Son of the living God.',
        refs: [
          {
            b: 'john',
            c: 6,
            v: 68,
            to: 69,
          },
        ],
      },
    ],
  },
  {
    id: 'gratitude',
    title: 'Gratitude',
    icon: 'hand-heart-outline',
    intro: 'Thanking God for what he has given, in good times and hard ones.',
    verse: {
      b: '1-thessalonians',
      c: 5,
      v: 18,
    },
    prayers: [
      {
        title: 'Make a joyful noise',
        kind: 'bible',
        text: 'Make a joyful noise unto the Lord, all ye lands.\nServe the Lord with gladness: come before his presence with singing.\nKnow ye that the Lord he is God: it is he that hath made us, and not we ourselves; we are his people, and the sheep of his pasture.\nEnter into his gates with thanksgiving, and into his courts with praise: be thankful unto him, and bless his name.\nFor the Lord is good; his mercy is everlasting; and his truth endureth to all generations.',
        refs: [
          {
            b: 'psalms',
            c: 100,
            v: 1,
            to: 5,
          },
        ],
      },
      {
        title: 'Bless the Lord, O my soul',
        kind: 'bible',
        text: 'Bless the Lord, O my soul: and all that is within me, bless his holy name.\nBless the Lord, O my soul, and forget not all his benefits:\nWho forgiveth all thine iniquities; who healeth all thy diseases;\nWho redeemeth thy life from destruction; who crowneth thee with lovingkindness and tender mercies;\nWho satisfieth thy mouth with good things; so that thy youth is renewed like the eagle’s.',
        refs: [
          {
            b: 'psalms',
            c: 103,
            v: 1,
            to: 5,
          },
        ],
      },
      {
        title: 'A General Thanksgiving',
        kind: 'classic',
        source: 'Book of Common Prayer (1928)',
        text: 'Almighty God, Father of all mercies, we, thine unworthy servants, do give thee most humble and hearty thanks for all thy goodness and lovingkindness to us, and to all men; We bless thee for our creation, preservation, and all the blessings of this life; but above all, for thine inestimable love in the redemption of the world by our Lord Jesus Christ; for the means of grace, and for the hope of glory. And, we beseech thee, give us that due sense of all thy mercies, that our hearts may be unfeignedly thankful; and that we show forth thy praise, not only with our lips, but in our lives, by giving up our selves to thy service, and by walking before thee in holiness and righteousness all our days; through Jesus Christ our Lord, to whom, with thee and the Holy Ghost, be all honour and glory, world without end. Amen.',
      },
    ],
  },
  {
    id: 'forgiveness',
    title: 'Forgiveness',
    icon: 'heart-outline',
    intro: 'Confessing what we have done wrong and asking God to forgive us, and to help us forgive others.',
    verse: {
      b: '1-john',
      c: 1,
      v: 9,
    },
    prayers: [
      {
        title: 'The Lord’s Prayer',
        kind: 'bible',
        text: 'Our Father which art in heaven, Hallowed be thy name. Thy kingdom come. Thy will be done in earth, as it is in heaven. Give us this day our daily bread. And forgive us our debts, as we forgive our debtors. And lead us not into temptation, but deliver us from evil: For thine is the kingdom, and the power, and the glory, for ever. Amen.',
        refs: [
          {
            b: 'matthew',
            c: 6,
            v: 9,
            to: 13,
          },
        ],
      },
      {
        title: 'Create in me a clean heart',
        kind: 'bible',
        text: 'Have mercy upon me, O God, according to thy lovingkindness: according unto the multitude of thy tender mercies blot out my transgressions.\nWash me throughly from mine iniquity, and cleanse me from my sin.\nFor I acknowledge my transgressions: and my sin is ever before me.\n\nCreate in me a clean heart, O God; and renew a right spirit within me.\nCast me not away from thy presence; and take not thy holy spirit from me.\nRestore unto me the joy of thy salvation; and uphold me with thy free spirit.',
        refs: [
          {
            b: 'psalms',
            c: 51,
            v: 1,
            to: 3,
          },
          {
            b: 'psalms',
            c: 51,
            v: 10,
            to: 12,
          },
        ],
      },
      {
        title: 'A General Confession',
        kind: 'classic',
        source: 'Book of Common Prayer (1928)',
        text: 'Almighty and most merciful Father; We have erred, and strayed from thy ways like lost sheep. We have followed too much the devices and desires of our own hearts. We have offended against thy holy laws. We have left undone those things which we ought to have done; And we have done those things which we ought not to have done; And there is no health in us. But thou, O Lord, have mercy upon us, miserable offenders. Spare thou those, O God, who confess their faults. Restore thou those who are penitent; According to thy promises declared unto mankind In Christ Jesus our Lord. And grant, O most merciful Father, for his sake; That we may hereafter live a godly, righteous, and sober life, To the glory of thy holy Name. Amen.',
      },
    ],
  },
  {
    id: 'guidance',
    title: 'Guidance',
    icon: 'compass-outline',
    intro: 'Asking God to show the way when a decision is hard or the path isn’t clear.',
    verse: {
      b: 'proverbs',
      c: 3,
      v: 5,
      to: 6,
    },
    prayers: [
      {
        title: 'Shew me thy ways',
        kind: 'bible',
        text: 'Shew me thy ways, O Lord; teach me thy paths.\nLead me in thy truth, and teach me: for thou art the God of my salvation; on thee do I wait all the day.',
        refs: [
          {
            b: 'psalms',
            c: 25,
            v: 4,
            to: 5,
          },
        ],
      },
      {
        title: 'Teach me to do thy will',
        kind: 'bible',
        text: 'Cause me to hear thy lovingkindness in the morning; for in thee do I trust: cause me to know the way wherein I should walk; for I lift up my soul unto thee.\nDeliver me, O Lord, from mine enemies: I flee unto thee to hide me.\nTeach me to do thy will; for thou art my God: thy spirit is good; lead me into the land of uprightness.',
        refs: [
          {
            b: 'psalms',
            c: 143,
            v: 8,
            to: 10,
          },
        ],
      },
      {
        title: 'Search me, O God',
        kind: 'bible',
        text: 'Search me, O God, and know my heart: try me, and know my thoughts:\nAnd see if there be any wicked way in me, and lead me in the way everlasting.',
        refs: [
          {
            b: 'psalms',
            c: 139,
            v: 23,
            to: 24,
          },
        ],
      },
    ],
  },
  {
    id: 'difficult-times',
    title: 'Difficult times',
    icon: 'weather-lightning-rainy',
    intro: 'When life is hard, the Psalms give words for trusting God in the middle of it.',
    verse: {
      b: 'matthew',
      c: 11,
      v: 28,
      to: 30,
    },
    prayers: [
      {
        title: 'The Lord is my shepherd',
        kind: 'bible',
        text: 'The Lord is my shepherd; I shall not want.\nHe maketh me to lie down in green pastures: he leadeth me beside the still waters.\nHe restoreth my soul: he leadeth me in the paths of righteousness for his name’s sake.\nYea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.\nThou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over.\nSurely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the Lord for ever.',
        refs: [
          {
            b: 'psalms',
            c: 23,
            v: 1,
            to: 6,
          },
        ],
      },
      {
        title: 'Hear my cry, O God',
        kind: 'bible',
        text: 'Hear my cry, O God; attend unto my prayer.\nFrom the end of the earth will I cry unto thee, when my heart is overwhelmed: lead me to the rock that is higher than I.\nFor thou hast been a shelter for me, and a strong tower from the enemy.\nI will abide in thy tabernacle for ever: I will trust in the covert of thy wings. Selah.',
        refs: [
          {
            b: 'psalms',
            c: 61,
            v: 1,
            to: 4,
          },
        ],
      },
      {
        title: 'God is our refuge',
        kind: 'bible',
        text: 'God is our refuge and strength, a very present help in trouble.\nTherefore will not we fear, though the earth be removed, and though the mountains be carried into the midst of the sea;\nThough the waters thereof roar and be troubled, though the mountains shake with the swelling thereof. Selah.',
        refs: [
          {
            b: 'psalms',
            c: 46,
            v: 1,
            to: 3,
          },
        ],
      },
    ],
  },
  {
    id: 'fear-and-worry',
    title: 'Fear and worry',
    icon: 'shield-outline',
    intro: 'Bringing anxious thoughts to God and asking for his peace.',
    verse: {
      b: 'philippians',
      c: 4,
      v: 6,
      to: 7,
    },
    prayers: [
      {
        title: 'When I am afraid',
        kind: 'bible',
        text: 'What time I am afraid, I will trust in thee.\nIn God I will praise his word, in God I have put my trust; I will not fear what flesh can do unto me.',
        refs: [
          {
            b: 'psalms',
            c: 56,
            v: 3,
            to: 4,
          },
        ],
      },
      {
        title: 'In the multitude of my thoughts',
        kind: 'bible',
        text: 'When I said, My foot slippeth; thy mercy, O Lord, held me up.\nIn the multitude of my thoughts within me thy comforts delight my soul.',
        refs: [
          {
            b: 'psalms',
            c: 94,
            v: 18,
            to: 19,
          },
        ],
      },
      {
        title: 'A Collect for Peace',
        kind: 'classic',
        source: 'Book of Common Prayer (1928)',
        text: 'O God, from whom all holy desires, all good counsels, and all just works do proceed; Give unto thy servants that peace which the world cannot give; that our hearts may be set to obey thy commandments, and also that by thee, we, being defended from the fear of our enemies, may pass our time in rest and quietness; through the merits of Jesus Christ our Saviour. Amen.',
      },
    ],
  },
  {
    id: 'grief',
    title: 'Grief',
    icon: 'water-outline',
    intro: 'For loss and sorrow. God hears our grief, and it’s right to bring it to him honestly.',
    verse: {
      b: 'matthew',
      c: 5,
      v: 4,
    },
    prayers: [
      {
        title: 'How long, O Lord?',
        kind: 'bible',
        text: 'How long wilt thou forget me, O Lord? for ever? how long wilt thou hide thy face from me?\nHow long shall I take counsel in my soul, having sorrow in my heart daily? how long shall mine enemy be exalted over me?\nConsider and hear me, O Lord my God: lighten mine eyes, lest I sleep the sleep of death;\nLest mine enemy say, I have prevailed against him; and those that trouble me rejoice when I am moved.\nBut I have trusted in thy mercy; my heart shall rejoice in thy salvation.\nI will sing unto the Lord, because he hath dealt bountifully with me.',
        refs: [
          {
            b: 'psalms',
            c: 13,
            v: 1,
            to: 6,
          },
        ],
      },
      {
        title: 'The God of all comfort',
        kind: 'bible',
        text: 'Blessed be God, even the Father of our Lord Jesus Christ, the Father of mercies, and the God of all comfort;\nWho comforteth us in all our tribulation, that we may be able to comfort them which are in any trouble, by the comfort wherewith we ourselves are comforted of God.',
        refs: [
          {
            b: '2-corinthians',
            c: 1,
            v: 3,
            to: 4,
          },
        ],
      },
      {
        title: 'For a Person under Affliction',
        kind: 'classic',
        source: 'Book of Common Prayer (1928)',
        text: 'O merciful God, and heavenly Father, who hast taught us in thy holy Word that thou dost not willingly afflict or grieve the children of men; Look with pity, we beseech thee, upon the sorrows of thy servant for whom our prayers are offered. Remember him, O Lord, in mercy; endue his soul with patience; comfort him with a sense of thy goodness; lift up thy countenance upon him, and give him peace; through Jesus Christ our Lord. Amen.',
      },
    ],
  },
  {
    id: 'healing',
    title: 'Healing',
    icon: 'bandage',
    intro: 'Praying for ourselves or someone else who is sick or hurting.',
    verse: {
      b: 'james',
      c: 5,
      v: 14,
      to: 15,
    },
    prayers: [
      {
        title: 'Heal me, O Lord',
        kind: 'bible',
        text: 'Heal me, O Lord, and I shall be healed; save me, and I shall be saved: for thou art my praise.',
        refs: [
          {
            b: 'jeremiah',
            c: 17,
            v: 14,
          },
        ],
      },
      {
        title: 'Have mercy upon me',
        kind: 'bible',
        text: 'Have mercy upon me, O Lord; for I am weak: O Lord, heal me; for my bones are vexed.\nMy soul is also sore vexed: but thou, O Lord, how long?\nReturn, O Lord, deliver my soul: oh save me for thy mercies’ sake.',
        refs: [
          {
            b: 'psalms',
            c: 6,
            v: 2,
            to: 4,
          },
        ],
      },
      {
        title: 'For a Sick Person',
        kind: 'classic',
        source: 'Book of Common Prayer (1928)',
        text: 'O Father of mercies and God of all comfort, our only help in time of need; We humbly beseech thee to behold, visit, and relieve thy sick servant for whom our prayers are desired. Look upon him with the eyes of thy mercy; comfort him with a sense of thy goodness; preserve him from the temptations of the enemy; and give him patience under his affliction. In thy good time, restore him to health, and enable him to lead the residue of his life in thy fear, and to thy glory; and grant that finally he may dwell with thee in life everlasting; through Jesus Christ our Lord. Amen.',
      },
    ],
  },
  {
    id: 'morning-evening',
    title: 'Morning and evening',
    icon: 'weather-sunset',
    intro: 'Prayers for starting the day with God and ending it in his care.',
    verse: {
      b: 'lamentations',
      c: 3,
      v: 22,
      to: 23,
    },
    prayers: [
      {
        title: 'In the morning',
        kind: 'bible',
        text: 'Give ear to my words, O Lord, consider my meditation.\nHearken unto the voice of my cry, my King, and my God: for unto thee will I pray.\nMy voice shalt thou hear in the morning, O Lord; in the morning will I direct my prayer unto thee, and will look up.',
        refs: [
          {
            b: 'psalms',
            c: 5,
            v: 1,
            to: 3,
          },
        ],
      },
      {
        title: 'A Collect for Grace (morning)',
        kind: 'classic',
        source: 'Book of Common Prayer (1928)',
        text: 'O Lord, our heavenly Father, Almighty and everlasting God, who hast safely brought us to the beginning of this day; Defend us in the same with thy mighty power; and grant that this day we fall into no sin, neither run into any kind of danger; but that all our doings, being ordered by thy governance, may be righteous in thy sight; through Jesus Christ our Lord. Amen.',
      },
      {
        title: 'A Collect for Aid against Perils (evening)',
        kind: 'classic',
        source: 'Book of Common Prayer (1928)',
        text: 'Lighten our darkness, we beseech thee, O Lord; and by thy great mercy defend us from all perils and dangers of this night; for the love of thy only Son, our Saviour, Jesus Christ. Amen.',
      },
    ],
  },
];
