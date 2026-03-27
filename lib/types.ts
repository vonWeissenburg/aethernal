export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  onboarding_done: boolean;
  created_at: string;
  updated_at: string;
}

export interface Memorial {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  type: "human" | "animal";
  birth_date: string | null;
  death_date: string | null;
  description: string | null;
  biography: string | null;
  profile_photo_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface MemorialPhoto {
  id: string;
  memorial_id: string;
  url: string;
  caption: string | null;
  order_index: number;
  created_at: string;
}

export type DiaryMood =
  | "sad"
  | "reflective"
  | "grateful"
  | "loving"
  | "joyful";

export interface DiaryEntry {
  id: string;
  user_id: string;
  memorial_id: string;
  title: string | null;
  content: string;
  mood: DiaryMood | null;
  entry_date: string;
  created_at: string;
  memorial?: Memorial;
}

export const MOOD_ICONS: Record<DiaryMood, string> = {
  sad: "😢",
  reflective: "💭",
  grateful: "🙏",
  loving: "💜",
  joyful: "😊",
};

export const MOOD_LABELS: Record<DiaryMood, string> = {
  sad: "Traurig",
  reflective: "Nachdenklich",
  grateful: "Dankbar",
  loving: "Liebevoll",
  joyful: "Freudig",
};
