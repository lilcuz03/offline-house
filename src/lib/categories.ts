export type SubCategory = {
  label: string;
  slug: string;
  hint: string;
};

export type Category = {
  slug: string;
  label: string;
  tagline: string;
  accent: string;
  children: SubCategory[];
};

export const SITE = {
  name: "Offline House",
  tagline: "Disconnect to reconnect.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};

export const ACCENTS = {
  gold: "#d4af7c",
  sale: "#b3261e",
} as const;

export const CATEGORIES: Category[] = [
  {
    slug: "tech",
    label: "Tech",
    tagline: "Gadgets and accessories that keep your devices running.",
    accent: "#7b9bbd",
    children: [
      {
        label: "Chargers and adapters",
        slug: "chargers-adapters",
        hint: "Wall, car and wireless",
      },
      {
        label: "Cables and USB",
        slug: "cables-usb",
        hint: "USB-C, Lightning, braided",
      },
      {
        label: "Power banks",
        slug: "power-banks",
        hint: "Slim and high capacity",
      },
      {
        label: "Phone cases",
        slug: "phone-cases",
        hint: "Protective, clear and slim",
      },
      {
        label: "Earbuds and audio",
        slug: "earbuds-audio",
        hint: "Wireless and wired",
      },
      {
        label: "Stands and screen guards",
        slug: "stands-screen-guards",
        hint: "Holders, mounts, protectors",
      },
    ],
  },
  {
    slug: "home",
    label: "Home",
    tagline: "Small upgrades for the rooms you live in.",
    accent: "#d4af7c",
    children: [
      { label: "Kitchen", slug: "kitchen", hint: "Tools and gadgets" },
      {
        label: "Storage and organisers",
        slug: "storage-organisers",
        hint: "Tidy every shelf",
      },
      { label: "Lighting", slug: "lighting", hint: "Lamps and LED strips" },
      { label: "Decor", slug: "decor", hint: "Finishing touches" },
    ],
  },
  {
    slug: "living",
    label: "Living",
    tagline: "Lifestyle picks for days out and days off.",
    accent: "#a7b49f",
    children: [
      { label: "Travel", slug: "travel", hint: "Pack lighter" },
      {
        label: "Fitness and outdoors",
        slug: "fitness-outdoors",
        hint: "Train and explore",
      },
      { label: "Drinkware", slug: "drinkware", hint: "Bottles and tumblers" },
      { label: "Gifts", slug: "gifts", hint: "Easy to give" },
    ],
  },
  {
    slug: "beauty",
    label: "Beauty",
    tagline: "Personal care tools worth keeping.",
    accent: "#e59aa8",
    children: [
      {
        label: "Skincare tools",
        slug: "skincare-tools",
        hint: "Rollers and devices",
      },
      { label: "Hair tools", slug: "hair-tools", hint: "Dryers and stylers" },
      {
        label: "Makeup accessories",
        slug: "makeup-accessories",
        hint: "Brushes and organisers",
      },
      { label: "Grooming", slug: "grooming", hint: "Trimmers and shavers" },
    ],
  },
  {
    slug: "essentials",
    label: "Essentials",
    tagline: "Everyday things you always end up needing.",
    accent: "#b9a4e6",
    children: [
      {
        label: "Everyday carry",
        slug: "everyday-carry",
        hint: "Small things, big use",
      },
      { label: "Cleaning", slug: "cleaning", hint: "Keep it fresh" },
      {
        label: "Stationery",
        slug: "stationery",
        hint: "Write, plan, organise",
      },
      {
        label: "Batteries and bulbs",
        slug: "batteries-bulbs",
        hint: "Power and light",
      },
    ],
  },
];

export const ANNOUNCEMENTS = [
  "Free delivery on orders over R600",
  "Only our top sellers, nothing filler",
  "Secure checkout and easy returns",
  "Disconnect to reconnect",
];

export const POPULAR_SEARCHES = [
  "20W fast charger",
  "USB-C cable",
  "Power bank 20000mAh",
  "MagSafe case",
  "Car charger",
  "Wireless earbuds",
];
