const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const UA = 'Mozilla/5.0 GameStatsApp/1.0';

app.use(cors());
app.use(express.json());

const STEAM_TIMEOUT_MS = 8000;
const CACHE_MAX = 500;
const CACHE_CLEAN_MS = 60 * 1000;

const cache = new Map();
const inflight = new Map();

function sweepCache() {
  const now = Date.now();
  for (const [key, hit] of cache) {
    if (now > hit.expires) cache.delete(key);
  }
  while (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
}

function getCache(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expires) {
    cache.delete(key);
    return null;
  }
  cache.delete(key);
  cache.set(key, hit);
  return hit.value;
}

function setCache(key, value, ms) {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, { value, expires: Date.now() + ms });
  if (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
}

function singleflight(key, fn) {
  const existing = inflight.get(key);
  if (existing) return existing;

  const pending = Promise.resolve()
    .then(fn)
    .finally(() => inflight.delete(key));

  inflight.set(key, pending);
  return pending;
}

async function cachedSingleflight(key, ttlMs, loader) {
  const cached = getCache(key);
  if (cached) return cached;

  return singleflight(key, async () => {
    const again = getCache(key);
    if (again) return again;
    const value = await loader();
    setCache(key, value, ttlMs);
    return value;
  });
}

setInterval(sweepCache, CACHE_CLEAN_MS).unref();

async function steamGet(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(STEAM_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`Steam 요청 실패 (${res.status})`);
  }
  return res.json();
}

function headerImage(appid) {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`;
}

function formatPlayers(n) {
  const num = Number(n) || 0;
  return num.toLocaleString('ko-KR');
}

const REVIEW_KO = {
  0: '평가 없음',
  1: '압도적으로 부정적',
  2: '매우 부정적',
  3: '부정적',
  4: '대체로 부정적',
  5: '복합적',
  6: '대체로 긍정적',
  7: '긍정적',
  8: '매우 긍정적',
  9: '압도적으로 긍정적',
};

async function getStoreItems(appids) {
  const ids = [...new Set(appids.map((id) => Number(id)).filter(Boolean))];
  if (!ids.length) return new Map();

  const input = {
    ids: ids.map((appid) => ({ appid })),
    context: { language: 'koreana', country_code: 'KR', steam_realm: 1 },
    data_request: {
      include_assets: true,
      include_basic_info: true,
    },
  };
  const url =
    'https://api.steampowered.com/IStoreBrowseService/GetItems/v1/?input_json=' +
    encodeURIComponent(JSON.stringify(input));
  const data = await steamGet(url);
  const map = new Map();
  for (const item of data.response?.store_items || []) {
    map.set(item.appid || item.id, {
      name: item.name || `App ${item.appid || item.id}`,
      isFree: Boolean(item.is_free),
      description: item.basic_info?.short_description || '',
    });
  }
  return map;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/popular', async (_req, res) => {
  try {
    const payload = await cachedSingleflight('popular', 2 * 60 * 1000, async () => {
      const charts = await steamGet(
        'https://api.steampowered.com/ISteamChartsService/GetGamesByConcurrentPlayers/v1/'
      );
      const ranks = (charts.response?.ranks || []).slice(0, 30);
      const infoMap = await getStoreItems(ranks.map((r) => r.appid));

      const games = ranks.map((row) => {
        const info = infoMap.get(row.appid) || {};
        return {
          rank: row.rank,
          appid: row.appid,
          name: info.name || `게임 ${row.appid}`,
          image: headerImage(row.appid),
          currentPlayers: row.concurrent_in_game || 0,
          currentPlayersText: formatPlayers(row.concurrent_in_game),
          peakToday: row.peak_in_game || 0,
          peakTodayText: formatPlayers(row.peak_in_game),
        };
      });

      return {
        lastUpdate: charts.response?.last_update || Math.floor(Date.now() / 1000),
        games,
      };
    });
    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '인기 순위를 불러오지 못했습니다.' });
  }
});

app.get('/api/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json({ games: [] });

    const payload = await cachedSingleflight(`search:${q.toLowerCase()}`, 5 * 60 * 1000, async () => {
      const data = await steamGet(
        'https://store.steampowered.com/api/storesearch/?term=' +
          encodeURIComponent(q) +
          '&l=koreana&cc=KR'
      );

      const games = (data.items || [])
        .filter((item) => item.type === 'app' && item.id)
        .map((item) => {
          const price = formatSearchPrice(item);
          return {
            appid: item.id,
            name: item.name,
            image: item.tiny_image || headerImage(item.id),
            priceText: price,
          };
        });

      return { games };
    });
    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '검색에 실패했습니다.' });
  }
});

function formatSearchPrice(item) {
  if (!item.price) return '가격 정보 없음';
  const { currency, final: finalPrice, initial } = item.price;
  if (finalPrice === 0) return '무료';
  const amount = Number(finalPrice) / 100;
  const text =
    currency === 'KRW'
      ? `₩${amount.toLocaleString('ko-KR')}`
      : `${amount.toLocaleString()} ${currency}`;
  if (initial && finalPrice < initial) {
    return `${text} (할인)`;
  }
  return text;
}

function formatHours(minutes) {
  const h = Number(minutes) / 60;
  if (!Number.isFinite(h) || h <= 0) return '-';
  if (h < 1) return `${Math.round(minutes)}분`;
  return `${h.toFixed(1)}시간`;
}

function computePlaytime(reviews) {
  const mins = (reviews || [])
    .map((r) => r.author?.playtime_forever)
    .filter((n) => Number.isFinite(n) && n > 0);
  if (!mins.length) return null;

  const sorted = [...mins].sort((a, b) => a - b);
  const avg = mins.reduce((a, b) => a + b, 0) / mins.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const hours = mins.map((m) => m / 60);
  const defs = [
    { label: '2시간 미만', test: (h) => h < 2 },
    { label: '2–10시간', test: (h) => h >= 2 && h < 10 },
    { label: '10–50시간', test: (h) => h >= 10 && h < 50 },
    { label: '50–200시간', test: (h) => h >= 50 && h < 200 },
    { label: '200시간 이상', test: (h) => h >= 200 },
  ];
  const buckets = defs.map((d) => {
    const count = hours.filter(d.test).length;
    return {
      label: d.label,
      count,
      percent: Math.round((count / hours.length) * 100),
    };
  });

  return {
    sampleSize: mins.length,
    averageHours: Math.round((avg / 60) * 10) / 10,
    medianHours: Math.round((median / 60) * 10) / 10,
    averageText: formatHours(avg),
    medianText: formatHours(median),
    buckets,
    note: '최근 리뷰를 남긴 플레이어 기준 추정입니다. 스팀은 전체 유저 평균을 공개하지 않습니다.',
  };
}

function achievementDistribution(achs) {
  const list = achs || [];
  if (!list.length) return [];
  const defs = [
    { label: '0–10%', min: 0, max: 10 },
    { label: '10–25%', min: 10, max: 25 },
    { label: '25–50%', min: 25, max: 50 },
    { label: '50–75%', min: 50, max: 75 },
    { label: '75–100%', min: 75, max: 101 },
  ];
  return defs.map((d) => ({
    label: d.label,
    count: list.filter((a) => {
      const p = Number(a.percent);
      return p >= d.min && p < d.max;
    }).length,
  }));
}

function parseLanguages(html) {
  const text = stripHtml(html || '')
    .replace(/\*/g, '')
    .replace(/음성이 지원되는 언어[\s\S]*/g, '')
    .trim();
  return text
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatOwners(raw) {
  if (!raw) return '';
  return String(raw).replace(/\s*\.\.\s*/g, ' ~ ') + '명';
}

async function safeSteamGet(url) {
  try {
    return await steamGet(url);
  } catch {
    return null;
  }
}

async function getPeakToday(appid) {
  const popular = getCache('popular');
  const hit = popular?.games?.find((g) => g.appid === appid);
  if (hit) return { peakToday: hit.peakToday, peakTodayText: hit.peakTodayText };
  const charts = await safeSteamGet(
    'https://api.steampowered.com/ISteamChartsService/GetGamesByConcurrentPlayers/v1/'
  );
  const row = (charts?.response?.ranks || []).find((r) => r.appid === appid);
  if (!row) return { peakToday: 0, peakTodayText: '-' };
  return {
    peakToday: row.peak_in_game || 0,
    peakTodayText: formatPlayers(row.peak_in_game),
  };
}

function formatDetailPrice(data) {
  if (data.is_free) return { isFree: true, text: '무료 플레이' };
  const p = data.price_overview;
  if (!p) return { isFree: false, text: '가격 정보 없음' };
  return {
    isFree: false,
    text: p.final_formatted || p.final,
    discount: p.discount_percent || 0,
  };
}

app.get('/api/game/:id', async (req, res) => {
  try {
    const appid = Number(req.params.id);
    if (!appid) return res.status(400).json({ error: '잘못된 게임 ID입니다.' });

    const payload = await cachedSingleflight(`game:${appid}`, 5 * 60 * 1000, async () => {
      const [detailJson, reviewJson, playersJson, spyJson, achJson] = await Promise.all([
        steamGet(
          `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=KR&l=koreana`
        ),
        steamGet(
          `https://store.steampowered.com/appreviews/${appid}?json=1&language=all&purchase_type=all&num_per_page=100&filter=all`
        ),
        steamGet(
          `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appid}`
        ),
        safeSteamGet(`https://steamspy.com/api.php?request=appdetails&appid=${appid}`),
        safeSteamGet(
          `https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid=${appid}`
        ),
      ]);

      const wrapped = detailJson[String(appid)];
      if (!wrapped?.success || !wrapped.data) {
        const err = new Error('게임 정보를 찾을 수 없습니다.');
        err.status = 404;
        throw err;
      }

      const data = wrapped.data;
      const summary = reviewJson.query_summary || {};
      const total = summary.total_reviews || 0;
      const positive = summary.total_positive || 0;
      const negative = summary.total_negative || 0;
      const percent = total ? Math.round((positive / total) * 100) : 0;
      const currentPlayers = playersJson.response?.player_count || 0;
      const price = formatDetailPrice(data);
      const peak = await getPeakToday(appid);
      const languages = parseLanguages(data.supported_languages);
      const tags = Object.entries(spyJson?.tags || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, votes]) => ({ name, votes }));
      const achList = achJson?.achievementpercentages?.achievements || [];

      return {
        appid,
        name: data.name,
        image: data.header_image || headerImage(appid),
        description: stripHtml(data.short_description || ''),
        about: stripHtml(data.about_the_game || '').slice(0, 900),
        genres: (data.genres || []).map((g) => g.description),
        categories: (data.categories || []).map((c) => c.description),
        developers: data.developers || [],
        publishers: data.publishers || [],
        releaseDate: data.release_date?.date || '',
        platforms: {
          windows: Boolean(data.platforms?.windows),
          mac: Boolean(data.platforms?.mac),
          linux: Boolean(data.platforms?.linux),
        },
        languages,
        languageCount: languages.length,
        hasKorean: languages.some((l) => l.includes('한국')),
        metacritic: data.metacritic?.score || null,
        recommendations: data.recommendations?.total || 0,
        dlcCount: Array.isArray(data.dlc) ? data.dlc.length : 0,
        screenshots: (data.screenshots || []).slice(0, 6).map((s) => s.path_thumbnail || s.path_full),
        price,
        currentPlayers,
        currentPlayersText: formatPlayers(currentPlayers),
        peakToday: peak.peakToday,
        peakTodayText: peak.peakTodayText,
        owners: formatOwners(spyJson?.owners),
        tags,
        playtime: computePlaytime(reviewJson.reviews || []),
        review: {
          score: summary.review_score || 0,
          description: REVIEW_KO[summary.review_score] || summary.review_score_desc || '평가 없음',
          total,
          totalText: formatPlayers(total),
          positive,
          negative,
          positiveText: formatPlayers(positive),
          negativeText: formatPlayers(negative),
          positivePercent: percent,
          negativePercent: total ? 100 - percent : 0,
        },
        achievements: {
          total: data.achievements?.total || achList.length || 0,
          highlighted: (data.achievements?.highlighted || [])
            .slice(0, 8)
            .map((a) => ({ name: a.localized_name || a.name, icon: a.path })),
          distribution: achievementDistribution(achList),
        },
      };
    });
    res.json(payload);
  } catch (err) {
    console.error(err);
    if (err.status === 404) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: '상세 정보를 불러오지 못했습니다.' });
  }
});

function stripHtml(html) {
  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`백엔드 실행 중: http://localhost:${PORT}`);
  });
}

module.exports = app;
