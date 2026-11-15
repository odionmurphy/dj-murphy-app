import { AudioLines, Camera, Music, Play, type LucideIcon } from "lucide-react";


export const site = {
  url: "https://www.djmurphy.de",
};
// Fill in every TODO before you deploy.
export const legal = {
  name: "I am DJ Murphy",
  street: "TODO: street and house number",
  postalCode: "TODO: postcode",
  city: "Dusselsorf",
  country: "Germany",
  email: "djmurphy041@gmail.com",
  phone: "+49 1521 7744404",
  vatId: "", // leave empty if you have none
  smallBusiness: false, // true if you are a Kleinunternehmer under § 19 UStG
};

export const privacy = {
  supabaseRegion: "TODO: region of your Supabase project",
  requestRetentionMonths: 24, // how long you keep enquiries that never became a booking
};

type Social = { label: string; href: string; icon: LucideIcon };

// Entries with an empty href are hidden automatically.
export const socials: Social[] = [
  { label: "Instagram", href: "https://www.instagram.com/i_am_dj_murphy", icon: Camera },
  { label: "SoundCloud", href: "", icon: AudioLines },
  { label: "YouTube", href: "", icon: Play },
  { label: "TikTok", href: "https://www.tiktok.com/@deejaylive1", icon: Music },
];

export const pressKit = {
  tagline: "International DJ · Afrobeat · Amapiano · Hip-Hop · Afro House",
  shortBio:
    "DJ Murphy is an international DJ based in Germany, available worldwide for clubs, weddings, private events and festivals.",
  // Paragraphs starting with "TODO" are hidden on the page.
  bio: [
    "DJ Murphy plays Afrobeat, Amapiano, Dancehall, Latin, Reggaeton, Reggae, R&B, Old School, Pop, Hip-Hop and Afro House, building each set around the crowd and the night. He also performs live on TikTok as DJ MURPHY LIVE.",
        "DJ Murphy has played at several venues and events over the years, including five years as resident DJ at Chocolate City Düsseldorf.",
  ],
  // Entries whose detail starts with "TODO" are hidden on the page.
  experience: [
        {
      title: "Clubs and festivals",
      detail: "Ten years of experience as a DJ at clubs and festivals, performing for diverse audiences.",
    },
  ],
  genres: [
    "Afrobeat",
    "Amapiano",
    "Dancehall",
    "Latin",
    "Reggaeton",
    "Reggae",
    "R&B",
    "Old School",
    "Pop",
    "Hip-Hop",
    "Afro House",
  ],
};