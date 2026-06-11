let cachedToday: { data: string; timestamp: number } | null = null;
const CACHE_TTL = 6 * 60 * 60 * 1000;

const fixedHolidays: Record<string, string> = {
  "01-01": "Yılbaşı",
  "04-23": "Ulusal Egemenlik ve Çocuk Bayramı",
  "05-01": "İşçi Bayramı",
  "05-19": "Atatürk'ü Anma Gençlik ve Spor Bayramı",
  "07-15": "Demokrasi ve Milli Birlik Günü",
  "08-30": "Zafer Bayramı",
  "10-29": "Cumhuriyet Bayramı",
};

const specialDays: Record<string, string> = {
  "01-06": "Dünya Çocuk Günü",
  "02-14": "Sevgililer Günü",
  "03-08": "Dünya Kadınlar Günü",
  "03-14": "Dünya Matematik Günü",
  "05-10": "Dünya Sağlık Haftası",
  "06-05": "Dünya Çevre Günü",
  "10-05": "Dünya Öğretmenler Günü",
};

function getTurkishDayName(day: number): string {
  const days = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  return days[day];
}

async function getHijriDate(): Promise<string> {
  try {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();

    const res = await fetch(
      `https://api.aladhan.com/v1/gToH?date=${dd}-${mm}-${yyyy}`,
      { signal: AbortSignal.timeout(5000) },
    );

    if (!res.ok) return "";

    const json = await res.json();
    const hijri = json.data?.hijri;
    if (!hijri) return "";

    return `${hijri.day} ${hijri.month?.tr ?? hijri.month?.en ?? ""} ${hijri.year}`;
  } catch {
    return "";
  }
}

export async function getTodayInfo(): Promise<string> {
  if (cachedToday && Date.now() - cachedToday.timestamp < CACHE_TTL) {
    return cachedToday.data;
  }

  const now = new Date();
  const erzurumDate = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
  const dayName = getTurkishDayName(erzurumDate.getDay());
  const dateStr = `${erzurumDate.getDate()} ${erzurumDate.toLocaleString("tr-TR", { month: "long" })} ${erzurumDate.getFullYear()}`;
  const key = `${String(erzurumDate.getMonth() + 1).padStart(2, "0")}-${String(erzurumDate.getDate()).padStart(2, "0")}`;

  const hijriDate = await getHijriDate();

  const parts: string[] = [`${dateStr}, ${dayName}`];

  if (hijriDate) {
    parts.push(`Hicri: ${hijriDate}`);

    const hijriMonthMatch = hijriDate.match(/(\d+)\s+(\S+)\s+(\d+)/);
    if (hijriMonthMatch) {
      const monthName = hijriMonthMatch[2];
      if (monthName === "Ramazan") {
        parts.push("🌙 Ramazan ayındayız!");
      }
    }
  }

  if (fixedHolidays[key]) {
    parts.push(`🎉 Resmi Tatil: ${fixedHolidays[key]}`);
  } else if (specialDays[key]) {
    parts.push(`📌 Özel Gün: ${specialDays[key]}`);
  }

  const result = parts.join(" | ");
  cachedToday = { data: result, timestamp: Date.now() };
  return result;
}
