let cachedRates: { data: string; timestamp: number } | null = null;
const CACHE_TTL = 4 * 60 * 60 * 1000;

export async function getExchangeRates(): Promise<string> {
  if (cachedRates && Date.now() - cachedRates.timestamp < CACHE_TTL) {
    return cachedRates.data;
  }

  try {
    const [usdRes, eurRes] = await Promise.all([
      fetch("https://api.floatrates.com/daily/usd.json", { signal: AbortSignal.timeout(5000) }),
      fetch("https://api.floatrates.com/daily/eur.json", { signal: AbortSignal.timeout(5000) }),
    ]);

    if (!usdRes.ok || !eurRes.ok) return "Döviz kuru alınamadı.";

    const usdJson = await usdRes.json();
    const eurJson = await eurRes.json();

    const usdToTry = usdJson?.try?.rate;
    const eurToTry = eurJson?.try?.rate;

    if (!usdToTry || !eurToTry) return "Döviz kuru alınamadı.";

    const result = `USD/TRY: ${Number(usdToTry).toFixed(4)}, EUR/TRY: ${Number(eurToTry).toFixed(4)}`;

    cachedRates = { data: result, timestamp: Date.now() };
    return result;
  } catch {
    return "Döviz kuru alınamadı.";
  }
}
