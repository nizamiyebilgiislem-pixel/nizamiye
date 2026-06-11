import type { MatchedIntent, IntentId } from "./types";

type IntentDef = {
  id: IntentId;
  keywords: string[];
  weight: number;
};

const intents: IntentDef[] = [
  {
    id: "attendance_today",
    keywords: ["yoklama", "alındı", "bugün", "yoklama alındı", "çekildi"],
    weight: 1,
  },
  {
    id: "attendance_class",
    keywords: ["yoklama", "alındı", "sınıf", "sınıfında"],
    weight: 1,
  },
  {
    id: "infirmary_today",
    keywords: ["revir", "kaydı", "giden", "hasta", "rapor", "bugün"],
    weight: 1,
  },
  {
    id: "student_new_today",
    keywords: ["yeni", "kayıt", "öğrenci", "kaydoldu", "eklendi", "bugün"],
    weight: 1,
  },
  {
    id: "schedule_class",
    keywords: ["ders", "programı", "ders programı", "saat", "sınıf", "hakkında", "bilgi"],
    weight: 1,
  },
  {
    id: "tasks_today",
    keywords: ["görev", "atama", "iş", "yapılacak", "bugün", "task"],
    weight: 1,
  },
  {
    id: "live_session_today",
    keywords: ["canlı", "oturum", "toplantı", "live", "bugün"],
    weight: 1,
  },
  {
    id: "library_overdue",
    keywords: ["kitap", "gecikmiş", "gecikme", "teslim", "iade"],
    weight: 1,
  },
  {
    id: "summary_today",
    keywords: ["özet", "durum", "rapor", "genel", "bugün", "neler var", "gündem"],
    weight: 1,
  },
  {
    id: "announcements_active",
    keywords: ["duyuru", "haber", "aktif", "ilan"],
    weight: 1,
  },
  {
    id: "class_info",
    keywords: ["sınıf", "hakkında", "bilgi", "öğrenci", "kaç", "mevcut"],
    weight: 1,
  },
  {
    id: "weather_city",
    keywords: ["hava", "durumu", "hava durumu", "kaç derece", "sıcaklık", "yağmur", "kar", "rüzgar"],
    weight: 1,
  },
  {
    id: "prayer_city",
    keywords: ["namaz", "vakti", "vakitleri", "imsak", "akşam", "yatsı", "öğle", "ikindi"],
    weight: 1,
  },
  {
    id: "search_web",
    keywords: ["ara", "araştır", "search", "internet", "web", "söyle", "kimdir", "nedir", "ne demek", "nerede"],
    weight: 1,
  },
  {
    id: "student_query",
    keywords: ["talebe", "öğrenci", "hakkında", "bilgi ver", "rapor", "durumu", "kimdir", "tanıt", "profil", "incele"],
    weight: 1,
  },
];

function normalize(text: string): string {
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/[?.!]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractClassName(text: string): string {
  const cleaned = text.toLocaleLowerCase("tr-TR").trim();

  const patterns = [
    /(\d+)\s*[a-zA-ZğüşıöçĞÜŞİÖÇ]/i,
    /([a-zğüşıöç]+\s*\d+\s*[a-zğüşıöç]*)/i,
    /(\d+\s*\/\s*\w+)/i,
  ];

  for (const p of patterns) {
    const m = cleaned.match(p);
    if (m) {
      const raw = m[0].trim().toUpperCase();
      if (/^\d+[A-ZĞÜŞİÖÇ]/i.test(raw)) return raw;
    }
  }

  return "";
}

function extractCityName(text: string): string {
  const cleaned = text.toLocaleLowerCase("tr-TR").trim();

  const knownCities = [
    "istanbul", "ankara", "izmir", "bursa", "antalya", "adana", "konya",
    "erzurum", "trabzon", "samsun", "gaziantep", "diyarbakır", "mersin",
    "kayseri", "eskişehir", "malatya", "van", "şanlıurfa", "elazığ",
    "sivas", "denizli", "batman", "kahramanmaraş", "edirne", "aydın",
    "muğla", "çorum", "yozgat", "bolu", "karabük", "çanakkale", "ordu",
    "giresun", "rize", "artvin", "kars", "ığdır", "ağrı", "muş", "bitlis",
    "hakkari", "şırnak", "mardin", "adiyaman", "hatay", "osmaniye",
    "kilis", "aksaray", "karaman", "kırıkkale", "kırşehir", "nevşehir",
    "niğde", "uşak", "kütahya", "afyon", "isparta", "burdur",
    "tekirdağ", "kırklareli", "yalova", "sakarya", "kocaeli", "düzce",
  ];

  for (const city of knownCities) {
    if (cleaned.includes(city)) {
      return city.charAt(0).toUpperCase() + city.slice(1);
    }
  }

  return "";
}

export function matchIntent(question: string): MatchedIntent {
  const normalized = normalize(question);

  let best: MatchedIntent = { id: "unknown", confidence: 0, params: {} };

  for (const intent of intents) {
    const matchedCount = intent.keywords.filter((kw) => normalized.includes(kw)).length;
    const score = matchedCount / intent.keywords.length;
    const confidence = score * intent.weight;

    if (confidence > best.confidence) {
      const params: Record<string, string> = {};
      if (intent.id === "attendance_class" || intent.id === "schedule_class") {
        const cn = extractClassName(question);
        if (cn) params.className = cn;
      }
      if (intent.id === "weather_city" || intent.id === "prayer_city") {
        const city = extractCityName(question);
        if (city) params.city = city;
      }
      if (intent.id === "search_web") {
        params.query = question;
      }
      if (intent.id === "student_query") {
        const nameMatch = question.match(/talebe (\S+(?:\s+\S+){0,2})|öğrenci (\S+(?:\s+\S+){0,2})|(\S+(?:\s+\S+){0,2}) (?:hakkında|kimdir|raporu|durumu|tanıt)/i);
        if (nameMatch) {
          params.studentName = nameMatch[1] || nameMatch[2] || nameMatch[3] || "";
        } else {
          params.studentName = question.replace(/talebe|öğrenci|hakkında|bilgi ver|rapor|durumu|kimdir|tanıt|profil|incele/i, "").trim();
        }
      }
      best = { id: intent.id, confidence, params };
    }
  }

  if (best.confidence < 0.15) {
    best.id = "unknown";
  }

  return best;
}
