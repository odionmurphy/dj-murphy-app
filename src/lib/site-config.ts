import { AudioLines, Camera, Music, Play, type LucideIcon } from "lucide-react";


export const site = {
  url: "https://www.djmurphy.de",
};
// Fill in every TODO before you deploy.
export const legal = {
  name: "TODO: your full legal name",
  street: "TODO: street and house number",
  postalCode: "TODO: postcode",
  city: "TODO: city",
  country: "Germany",
  email: "djmurphy041@gmail.com",
  phone: "TODO: phone number",
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
  { label: "TikTok", href: "", icon: Music },
];

export const pressKit = {
  tagline: "International DJ · Afrobeat · Amapiano · Hip-Hop · Afro House",
  shortBio:
    "DJ Murphy is an international DJ based in Germany, available worldwide for clubs, weddings, private events and festivals.",
  // Paragraphs starting with "TODO" are hidden on the page.
  bio: [
    "DJ Murphy plays Afrobeat, Amapiano, Dancehall, Latin, Reggaeton, Reggae, R&B, Old School, Pop, Hip-Hop and Afro House, building each set around the crowd and the night. He also performs live on TikTok as DJ MURPHY LIVE.",
    "TODO: one paragraph about your story: where you started, what shaped your sound, what makes your sets different.",
  ],
  // Entries whose detail starts with "TODO" are hidden on the page.
  experience: [
    {
      title: "Chocolate City",
      detail: "TODO: your role, the years, and the events or shows you can name.",
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