// Hotlines and resource links for the Next Steps screen (US numbers).
// Verified against each organization's own website on 2026-10-29. Re-check before each release:
//   Billy Graham Prayer Line: billygraham.org (story "Billy Graham 24/7 Prayer Line answers 2 millionth call")
//   CBN Prayer Center:        cbn.com/ask-prayer
//   Focus on the Family:      focusonthefamily.com/family-qa/what-is-focus-on-the-familys-phone-number/
//   988 Lifeline:             ncdhhs.gov 988 page / 988lifeline.org

export type Resource = {
  name: string;
  description: string;
  hours?: string;
  phone?: { display: string; dial: string };
  text?: { display: string; number: string };
  link?: { label: string; url: string };
};

export type ResourceSection = { title: string; items: Resource[] };

export const CRISIS: Resource = {
  name: '988 Suicide & Crisis Lifeline',
  description: 'If you are in crisis or thinking about suicide, free and confidential help is available.',
  hours: '24/7',
  phone: { display: 'Call 988', dial: '988' },
  text: { display: 'Text 988', number: '988' },
  link: { label: 'Chat online', url: 'https://chat.988lifeline.org/' },
};

export const SECTIONS: ResourceSection[] = [
  {
    title: 'Talk to someone now',
    items: [
      {
        name: 'Billy Graham Prayer Line',
        description: 'Talk with someone about Jesus, ask for prayer, or ask how to begin a relationship with God.',
        hours: '24/7',
        phone: { display: '1-888-388-2683', dial: '18883882683' },
        link: { label: 'Peace with God', url: 'https://peacewithgod.net' },
      },
      {
        name: 'CBN Prayer Center',
        description: 'Prayer partners from The 700 Club ready to pray with you.',
        hours: '24 hours a day',
        phone: { display: '1-800-700-7000', dial: '18007007000' },
        link: { label: 'Prayer requests', url: 'https://cbn.com/ask-prayer' },
      },
      {
        name: 'NeedHim',
        description: 'Chat online with someone about Jesus and what it means to follow Him.',
        link: { label: 'Chat now', url: 'https://needhim.org/chat-now/' },
      },
    ],
  },
  {
    title: 'Have questions?',
    items: [
      {
        name: 'Got Questions',
        description: 'Short, searchable answers to thousands of questions about God, Jesus and the Bible.',
        link: { label: 'gotquestions.org', url: 'https://www.gotquestions.org' },
      },
      {
        name: 'Alpha',
        description: 'Explore life, faith and meaning with others in a relaxed group setting, online or nearby.',
        link: { label: 'Find an Alpha', url: 'https://alpha.org' },
      },
    ],
  },
  {
    title: 'Christian counseling',
    items: [
      {
        name: 'Focus on the Family',
        description: 'Free one-time consultation with a licensed Christian counselor, plus referrals near you.',
        hours: 'Mon–Fri (you may get a callback)',
        phone: { display: '1-855-771-4357', dial: '18557714357' },
      },
    ],
  },
];
