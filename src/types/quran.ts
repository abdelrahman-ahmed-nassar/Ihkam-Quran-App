export type ChapterId = `${number}`;

export interface Chapter {
  id: number;
  name_arabic: string;
  verses_count: number;
  startPage: number;
}

export type Chapters = {
  [key in ChapterId]: Chapter;
};

export interface QuranData {
  chapters: Chapters;
}
