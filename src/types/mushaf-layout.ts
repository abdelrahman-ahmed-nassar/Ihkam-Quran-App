export type LineType = "surah_name" | "basmallah" | "ayah";

export interface MushafLine {
  page_number: number;
  line_number: number;
  line_type: LineType;

  is_centered: 0 | 1;

  first_word_id: number;
  last_word_id: number;

  surah_number: number; // 0 if not applicable
}
export type MushafLayout = MushafLine[];
