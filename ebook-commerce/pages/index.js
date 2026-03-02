import Link from "next/link";

const POLYMARKET_ENDPOINT =
  "https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=500&offset=0";

function parseOutcomeProbability(market) {
  if (!Array.isArray(market?.outcomes) || !Array.isArray(market?.outcomePrices)) {
    return null;
  }

  const yesIndex = market.outcomes.findIndex((outcome) =>
    String(outcome).toLowerCase().includes("yes")
  );

  if (yesIndex === -1) {
    return null;
  }

  const raw = Number(market.outcomePrices[yesIndex]);
  if (Number.isNaN(raw)) {
    return null;
  }

  return Math.max(0, Math.min(1, raw));
}

function toPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function classifyMarket(question) {
  const text = question.toLowerCase();

  if (text.includes("president") || text.includes("white house") || text.includes("biden") || text.includes("trump")) {
    return "Presidency";
  }
  if (text.includes("senate")) {
    return "Senate";
  }
  if (text.includes("house") || text.includes("congress")) {
    return "House & Congress";
  }
  if (text.includes("governor") || text.includes("state")) {
    return "State Politics";
  }
  if (text.includes("supreme court") || text.includes("scotus")) {
    return "Courts";
  }

  return "Policy & Other";
}

function isUSPoliticsMarket(market) {
  const source = `${market.question || ""} ${market.description || ""} ${market.slug || ""}`.toLowerCase();

  const includeTerms = [
    "us",
    "u.s.",
    "united states",
    "america",
    "american",
    "president",
    "white house",
    "senate",
    "house",
    "congress",
    "governor",
    "biden",
    "trump",
    "democrat",
    "republican",
    "gop",
    "election",
    "scotus",
    "supreme court",
  ];

  const excludeTerms = [
    "nfl",
    "nba",
    "mlb",
    "soccer",
    "champions league",
    "bitcoin",
    "ethereum",
    "crypto",
    "weather",
    "earthquake",
  ];

  const included = includeTerms.some((term) => source.includes(term));
  const excluded = excludeTerms.some((term) => source.includes(term));

  return included && !excluded;
}

export async function getServerSideProps() {
  try {
    const response = await fetch(POLYMARKET_ENDPOINT);
    const allMarkets = await response.json();

    const filtered = allMarkets
      .filter((market) => isUSPoliticsMarket(market))
      .map((market) => {
        const probability = parseOutcomeProbability(market);
        return {
          id: market.id,
          question: market.question,
          slug: market.slug,
          category: classifyMarket(market.question || ""),
          yesProbability: probability,
          volume: Number(market.volume || 0),
        };
      })
      .filter((market) => market.yesProbability !== null)
      .sort((a, b) => b.volume - a.volume);

    const count = filtered.length;
    const avgProbability =
      count > 0
        ? filtered.reduce((sum, market) => sum + market.yesProbability, 0) / count
        : 0;

    const highConviction = filtered
      .filter((market) => market.yesProbability >= 0.7 || market.yesProbability <= 0.3)
      .slice(0, 8);

    const closestRaces = [...filtered]
      .sort((a, b) => Math.abs(a.yesProbability - 0.5) - Math.abs(b.yesProbability - 0.5))
      .slice(0, 8);

    const categories = filtered.reduce((acc, market) => {
      if (!acc[market.category]) {
        acc[market.category] = { total: 0, count: 0 };
      }
      acc[market.category].total += market.yesProbability;
      acc[market.category].count += 1;
      return acc;
    }, {});

    const categorySummary = Object.entries(categories)
      .map(([name, data]) => ({
        name,
        count: data.count,
        average: data.total / data.count,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      props: {
        generatedAt: new Date().toISOString(),
        markets: filtered,
        overview: {
          count,
          avgProbability,
          highConvictionCount: highConviction.length,
          tossUpCount: filtered.filter((market) => Math.abs(market.yesProbability - 0.5) <= 0.05).length,
        },
        highConviction,
        closestRaces,
        categorySummary,
      },
    };
  } catch {
    return {
      props: {
        generatedAt: new Date().toISOString(),
        markets: [],
        overview: { count: 0, avgProbability: 0, highConvictionCount: 0, tossUpCount: 0 },
        highConviction: [],
        closestRaces: [],
        categorySummary: [],
      },
    };
  }
}

export default function HomePage({ generatedAt, markets, overview, highConviction, closestRaces, categorySummary }) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">Polymarket Intelligence</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">State of US Politics</h1>
          <p className="mt-4 max-w-3xl text-sm text-slate-300 sm:text-base">
            This report analyzes every currently active Polymarket market matched to US politics. Probabilities are interpreted as
            market-implied odds for the <span className="font-semibold text-white">YES</span> outcome.
          </p>
          <p className="mt-3 text-xs text-slate-400">Updated: {new Date(generatedAt).toLocaleString()}</p>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Markets analyzed" value={overview.count} />
          <StatCard label="Average YES probability" value={toPercent(overview.avgProbability)} />
          <StatCard label="High-conviction markets" value={overview.highConvictionCount} />
          <StatCard label="Toss-up markets (45-55%)" value={overview.tossUpCount} />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <Panel title="Category heatmap">
            <div className="space-y-3">
              {categorySummary.map((item) => (
                <div key={item.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{item.name}</span>
                    <span className="text-slate-300">{toPercent(item.average)} avg YES · {item.count} markets</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800">
                    <div className="h-2 rounded-full bg-sky-500" style={{ width: `${Math.round(item.average * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Quick read">
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-300">
              <li>
                The overall political market sentiment sits at <span className="font-semibold text-white">{toPercent(overview.avgProbability)}</span> YES,
                signaling moderately directional pricing across the board.
              </li>
              <li>
                <span className="font-semibold text-white">{overview.highConvictionCount}</span> markets have high conviction pricing (&le;30% or
                &ge;70%), suggesting traders see clearer outcomes in those contracts.
              </li>
              <li>
                <span className="font-semibold text-white">{overview.tossUpCount}</span> markets remain true coin-flips (45-55%), where incoming
                headlines are likely to move prices quickly.
              </li>
            </ul>
          </Panel>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <Panel title="Highest-conviction markets">
            <MarketList markets={highConviction} />
          </Panel>
          <Panel title="Closest races">
            <MarketList markets={closestRaces} />
          </Panel>
        </section>

        <section className="mt-6">
          <Panel title="All US politics markets (ranked by volume)">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Question</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">YES Probability</th>
                    <th className="px-3 py-2">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {markets.map((market) => (
                    <tr key={market.id} className="border-b border-slate-900 align-top">
                      <td className="px-3 py-2">
                        <Link
                          href={`https://polymarket.com/event/${market.slug}`}
                          className="text-sky-300 hover:text-sky-200 hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {market.question}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-slate-300">{market.category}</td>
                      <td className="px-3 py-2 font-semibold text-white">{toPercent(market.yesProbability)}</td>
                      <td className="px-3 py-2 text-slate-300">${Math.round(market.volume).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </section>
      </div>
    </main>
  );
}

function Panel({ title, children }) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
      <h2 className="mb-4 text-lg font-semibold sm:text-xl">{title}</h2>
      {children}
    </article>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function MarketList({ markets }) {
  return (
    <ul className="space-y-3">
      {markets.map((market) => (
        <li key={market.id} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-sm font-medium text-white">{market.question}</p>
          <p className="mt-1 text-xs text-slate-400">{market.category}</p>
          <p className="mt-2 text-sm text-sky-300">YES: {toPercent(market.yesProbability)}</p>
        </li>
      ))}
    </ul>
  );
}
