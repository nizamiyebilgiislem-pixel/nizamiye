let cachedWeather: { data: string; timestamp: number; city: string } | null = null;
const CACHE_TTL = 30 * 60 * 1000;

export async function getWeather(city = "Erzurum"): Promise<string> {
  if (cachedWeather && Date.now() - cachedWeather.timestamp < CACHE_TTL && cachedWeather.city === city) {
    return cachedWeather.data;
  }

  try {
    const res = await fetch(
      `https://wttr.in/${encodeURIComponent(city)}?format=%C+%t&lang=tr`,
      { signal: AbortSignal.timeout(5000) },
    );

    if (!res.ok) return `${city} için hava durumu alınamadı.`;

    const text = await res.text();
    const result = text.trim();
    cachedWeather = { data: result, timestamp: Date.now(), city };
    return result;
  } catch {
    return `${city} için hava durumu alınamadı.`;
  }
}
