export async function webSearch(query: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 200));

  const ddgPromise = fetchDuckDuckGo(query);
  const wikiPromise = fetchWikipedia(query);

  const [ddg, wiki] = await Promise.all([ddgPromise, wikiPromise]);

  const parts: string[] = [];
  if (ddg) parts.push(ddg);
  if (wiki) parts.push(wiki);

  const combined = parts.join("\n\n");
  return combined || `"${query}" için sonuç bulunamadı.`;
}

async function fetchDuckDuckGo(query: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
      { signal: AbortSignal.timeout(5000) },
    );

    if (!res.ok) return null;

    const json = await res.json();
    const lines: string[] = [];

    if (json.AbstractText) {
      lines.push(json.AbstractText);
    }

    if (json.RelatedTopics?.length > 0) {
      const items = json.RelatedTopics.slice(0, 5).map((t: { Text?: string; Result?: string }) =>
        t.Text || t.Result || "",
      ).filter(Boolean);
      if (items.length > 0) lines.push(...items);
    }

    if (json.Answer) {
      lines.push(`Cevap: ${json.Answer}`);
    }

    return lines.length > 0 ? lines.join("\n") : null;
  } catch {
    return null;
  }
}

async function fetchWikipedia(query: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://tr.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=3&srprop=snippet`,
      { signal: AbortSignal.timeout(5000) },
    );

    if (!res.ok) return null;

    const json = await res.json();
    const results = json.query?.search;

    if (!results || results.length === 0) return null;

    const lines = results.map((r: { title: string; snippet: string }) =>
      `- ${r.title}: ${r.snippet.replace(/<[^>]+>/g, "")}`,
    );

    return `Wikipedia sonuçları:\n${lines.join("\n")}`;
  } catch {
    return null;
  }
}
