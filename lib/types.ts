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

export type TriggerType = "date" | "death";
export type MessageStatus = "draft" | "scheduled" | "sent" | "failed";

export interface Message {
  id: string;
  user_id: string;
  memorial_id: string | null;
  title: string;
  body: string;
  recipient_name: string;
  recipient_email: string;
  trigger_type: TriggerType;
  trigger_date: string | null;
  repeat_yearly: boolean;
  status: MessageStatus;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
  memorials?: { name: string } | null;
}

export interface TrustedPerson {
  id: string;
  user_id: string;
  name: string;
  email: string;
  relationship: string | null;
  confirmed: boolean;
  created_at: string;
}

export const STATUS_STYLES: Record<MessageStatus, string> = {
  draft: "bg-surface-container-high text-on-surface-variant",
  scheduled: "bg-primary/10 text-primary",
  sent: "bg-success/10 text-success",
  failed: "bg-error/10 text-error",
};

export const STATUS_LABELS: Record<MessageStatus, string> = {
  draft: "Entwurf",
  scheduled: "Geplant",
  sent: "Gesendet",
  failed: "Fehler",
};

export type ReminderType = "birthday" | "deathday" | "anniversary" | "custom";

export interface Reminder {
  id: string;
  user_id: string;
  memorial_id: string | null;
  title: string;
  description: string | null;
  reminder_date: string;
  reminder_type: ReminderType;
  repeat_yearly: boolean;
  created_at: string;
  updated_at: string;
  memorials?: { name: string } | null;
}

export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  birthday: "Geburtstag",
  deathday: "Todestag",
  anniversary: "Jahrestag",
  custom: "Benutzerdefiniert",
};

export const REMINDER_TYPE_ICONS: Record<ReminderType, string> = {
  birthday: "🎂",
  deathday: "🕊️",
  anniversary: "💍",
  custom: "📅",
};
