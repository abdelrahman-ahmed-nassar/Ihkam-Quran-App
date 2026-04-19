export type ChapterId = `${number}`;
export type VerseKey = `${number}:${number}`;

export interface Chapter {
  id: number;
  name_arabic: string;
  verses_count: number;
}

export type Chapters = {
  [key in ChapterId]: Chapter;
};

export type Verses = {
  [key in VerseKey]: string;
};

export interface QuranData {
  chapters: Chapters;
  verses: Verses;
}
