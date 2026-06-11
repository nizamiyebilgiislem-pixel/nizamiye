let cachedTimes: { data: string; timestamp: number; city: string; country: string } | null = null;
const CACHE_TTL = 6 * 60 * 60 * 1000;

export async function getPrayerTimes(city = "Erzurum", country = "Turkey"): Promise<string> {
  if (
    cachedTimes &&
    Date.now() - cachedTimes.timestamp < CACHE_TTL &&
    cachedTimes.city === city &&
    cachedTimes.country === country
  ) {
    return cachedTimes.data;
  }

  try {
    const res = await fetch(
      `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=13`,
      { signal: AbortSignal.timeout(5000) },
    );

    if (!res.ok) return `${city} için namaz vakitleri alınamadı.`;

    const json = await res.json();
    const timings = json.data?.timings;

    if (!timings) return `${city} için namaz vakitleri alınamadı.`;

    const result = `İmsak: ${timings.Fajr}, Güneş: ${timings.Sunrise}, Öğle: ${timings.Dhuhr}, İkindi: ${timings.Asr}, Akşam: ${timings.Maghrib}, Yatsı: ${timings.Isha}`;

    cachedTimes = { data: result, timestamp: Date.now(), city, country };
    return result;
  } catch {
    return `${city} için namaz vakitleri alınamadı.`;
  }
}
