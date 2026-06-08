export const documentTypes = [
  "Kimlik",
  "İkametgah",
  "Sağlık Raporu",
  "Veli İzin Belgesi",
  "Öğrenci Fotoğrafı",
  "Sözleşme",
  "Diğer",
] as const;

export type DocumentType = (typeof documentTypes)[number];
