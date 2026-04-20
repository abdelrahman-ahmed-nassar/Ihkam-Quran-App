export type LocationKey = `${number}:${number}:${number}`;

export interface Word {

  id: number;

  surah: `${number}`;

  ayah: `${number}`;

  word: `${number}`;

  location: LocationKey;

  text: string; // glyph (QPC font char)

}

export type WordsMap = {

  [key in LocationKey]: Word;

};