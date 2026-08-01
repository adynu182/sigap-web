export type Role = "sppg" | "admin";
export type ProfileStatus = "pending" | "approved" | "rejected";
export type Category = "Conformity" | "Minor" | "Major";

export interface SppgProfile {
  uid: string;
  namaSppg: string;
  wilayah: string;
  penanggungJawab: string;
  telepon: string;
  email: string;
  role: Role;
  status: ProfileStatus;
  createdAt: number; // ms epoch, set client-side with Date.now()
}

export interface Question {
  id: string; // e.g. "q001"
  order: number;
  text: string;
}

export interface Answer {
  questionId: string;
  category: Category | null;
  essay: string;
  photoUrl: string | null;
  updatedAt: number;
}

export interface QuestionWithAnswer extends Question {
  answer: Answer | null;
}

export const CATEGORY_LABEL: Record<Category, string> = {
  Conformity: "Conformity",
  Minor: "Minor",
  Major: "Major",
};

export const CATEGORY_TOKENS: Record<
  Category | "empty",
  { text: string; bg: string; soft: string; label: string }
> = {
  Conformity: {
    text: "text-conform",
    bg: "bg-conform",
    soft: "bg-conform-soft",
    label: "Conformity",
  },
  Minor: {
    text: "text-minor",
    bg: "bg-minor",
    soft: "bg-minor-soft",
    label: "Minor",
  },
  Major: {
    text: "text-major",
    bg: "bg-major",
    soft: "bg-major-soft",
    label: "Major",
  },
  empty: {
    text: "text-empty",
    bg: "bg-empty",
    soft: "bg-empty-soft",
    label: "Belum diisi",
  },
};
