// Donation links shown under "Donate" in the home screen menu (☰).
//
// To turn a link on, paste its page address into `url`. Links with an empty url are hidden, and
// the whole Donate section is hidden when none are set.
//
// App stores: donation links in the store versions should go to the church (a registered
// nonprofit) once the app is registered under it. Set SHOW_DONATE to false to hide the section
// in any build that shouldn't show it.
import type { ComponentProps } from 'react';
import type MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export const SHOW_DONATE = true;

export type DonationLink = {
  name: string;
  url: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
};

export const DONATION_LINKS: DonationLink[] = [
  // Ko-fi page address
  { name: 'Ko-fi', url: 'https://ko-fi.com/jesuschristapp', icon: 'coffee-outline' },
  // Buy Me a Coffee page address
  { name: 'Buy Me a Coffee', url: 'https://buymeacoffee.com/jesuschristapp', icon: 'coffee' },
];

/** The links that are switched on. */
export const ACTIVE_DONATION_LINKS = SHOW_DONATE ? DONATION_LINKS.filter((l) => l.url.trim() !== '') : [];
