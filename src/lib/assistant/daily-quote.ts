const quotes: string[] = [
  "Başarı, hazırlık ile fırsatın kesiştiği yerdir.",
  "Bugün yaptıkların, yarının temelidir.",
  "Küçük adımlar büyük yolculukları başlatır.",
  "Eğitim, dünyayı değiştirmek için en güçlü silahtır.",
  "Bir insana balık verme, balık tutmayı öğret.",
  "En iyi öğretmen deneyimdir.",
  "İlim ilim bilmektir, ilim kendin bilmektir.",
  "Okumak, zihni beslemektir.",
  "Düzen, verimliliğin anahtarıdır.",
  "Her zorluk, beraberinde bir kolaylık getirir.",
  "Sabır acıdır ama meyvesi tatlıdır.",
  "Zaman, kılıçtan keskin, ipekten yumuşaktır.",
  "Ne ekersen onu biçersin.",
  "Ağaç yaşken eğilir.",
  "Erken kalkan yol alır.",
  "Damlaya damlaya göl olur.",
  "Emek olmadan yemek olmaz.",
  "Az söz, öz söz.",
  "Gülü seven dikenine katlanır.",
  "Dost kara günde belli olur.",
];

let cachedQuote: string | null = null;
let cachedDate: string | null = null;

export function getDailyQuote(): string {
  const today = new Date().toISOString().slice(0, 10);

  if (cachedQuote && cachedDate === today) {
    return cachedQuote;
  }

  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
  );

  cachedQuote = quotes[dayOfYear % quotes.length];
  cachedDate = today;
  return cachedQuote;
}
