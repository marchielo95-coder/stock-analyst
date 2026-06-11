import express from 'express';
import cors from 'cors';
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey'],
  fetchOptions: {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
  },
});
import Parser from 'rss-parser';
import NodeCache from 'node-cache';
import { RSI, MACD, SMA } from 'technicalindicators';
import { translate } from '@vitalets/google-translate-api';

const app = express();
const cache      = new NodeCache({ stdTTL: 900 });
const shortCache = new NodeCache({ stdTTL: 30 });
const rssParser  = new Parser();

app.use(cors());
app.use(express.json());

// ─── Default Portfolio ────────────────────────────────────────────────────────
const DEFAULT_PORTFOLIO = [
  { ticker: 'VOO',  shares: 6.596038958,  entryPrice: 695.24, name: 'Vanguard S&P 500 ETF' },
  { ticker: 'AAPL', shares: 5.444941544,  entryPrice: 308.04, name: 'Apple Inc.' },
  { ticker: 'TSM',  shares: 2.255249092,  entryPrice: 443.41, name: 'Taiwan Semiconductor' },
];

const ALERT_RULES = { stopLoss: -0.07, takeProfit: 0.15, rsiOversold: 35 };

// ─── Range config ─────────────────────────────────────────────────────────────
const RANGE_CONFIG = {
  '1D':  { chartDays: 1,    interval: '5m',  historyDays: 400, ttl: 60   },
  '5D':  { chartDays: 5,    interval: '30m', historyDays: 400, ttl: 300  },
  '1M':  { chartDays: 30,   interval: '1d',  historyDays: 400, ttl: 900  },
  '6M':  { chartDays: 180,  interval: '1d',  historyDays: 400, ttl: 900  },
  '1Y':  { chartDays: 365,  interval: '1d',  historyDays: 400, ttl: 900  },
  '5Y':  { chartDays: 1825, interval: '1wk', historyDays: 2500, ttl: 3600 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcIndicators(closes) {
  if (closes.length < 14) return { rsi: null, macd: null, ma50: null, ma200: null, rsiSeries: [], macdSeries: [], ma50Series: [], ma200Series: [] };
  const rsiValues  = RSI.calculate({ values: closes, period: 14 });
  const macdValues = closes.length >= 26 ? MACD.calculate({ values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false }) : [];
  const ma50  = closes.length >= 50  ? SMA.calculate({ values: closes, period: 50  }) : [];
  const ma200 = closes.length >= 200 ? SMA.calculate({ values: closes, period: 200 }) : [];
  return { rsi: rsiValues.at(-1) ?? null, macd: macdValues.at(-1) ?? null, ma50: ma50.at(-1) ?? null, ma200: ma200.at(-1) ?? null, rsiSeries: rsiValues, macdSeries: macdValues, ma50Series: ma50, ma200Series: ma200 };
}

function calcIndicatorsForRange(quotes, chartStartIdx) {
  const allCloses = quotes.map(q => q.close).filter(Boolean);
  const indicators = calcIndicators(allCloses);

  const rsiOffset  = allCloses.length - indicators.rsiSeries.length;
  const macdOffset = allCloses.length - indicators.macdSeries.length;
  const ma50Offset = allCloses.length - indicators.ma50Series.length;
  const ma200Offset= allCloses.length - indicators.ma200Series.length;

  const rsiData  = [];
  const macdData = [];

  for (let i = chartStartIdx; i < allCloses.length; i++) {
    const rsiIdx  = i - rsiOffset;
    const macdIdx = i - macdOffset;
    if (rsiIdx >= 0)  rsiData.push({ index: rsiData.length, rsi: parseFloat((indicators.rsiSeries[rsiIdx] ?? 0).toFixed(2)) });
    if (macdIdx >= 0) {
      const m = indicators.macdSeries[macdIdx];
      macdData.push({ index: macdData.length, macd: parseFloat((m?.MACD??0).toFixed(4)), signal: parseFloat((m?.signal??0).toFixed(4)), histogram: parseFloat((m?.histogram??0).toFixed(4)) });
    }
  }

  const ma50ForChart  = [];
  const ma200ForChart = [];
  for (let i = chartStartIdx; i < allCloses.length; i++) {
    ma50ForChart.push(indicators.ma50Series[i - ma50Offset]  ?? null);
    ma200ForChart.push(indicators.ma200Series[i - ma200Offset] ?? null);
  }

  return { indicators, rsiData, macdData, ma50ForChart, ma200ForChart };
}

function getAlerts(ticker, currentPrice, entryPrice, indicators) {
  const alerts = [];
  const change = (currentPrice - entryPrice) / entryPrice;
  if (change <= ALERT_RULES.stopLoss) alerts.push({ type: 'danger', code: 'STOP_LOSS', message: `Stop loss activado: caída del ${(change * 100).toFixed(1)}% desde entrada` });
  if (change >= ALERT_RULES.takeProfit) alerts.push({ type: 'success', code: 'TAKE_PROFIT', message: `Toma de ganancias sugerida: +${(change * 100).toFixed(1)}% desde entrada` });
  if (indicators.rsi != null && indicators.rsi < ALERT_RULES.rsiOversold && indicators.ma200 && currentPrice > indicators.ma200)
    alerts.push({ type: 'buy', code: 'ACCUMULATE', message: `Señal de acumulación: RSI ${indicators.rsi.toFixed(1)} + precio sobre MA200` });
  if (indicators.ma50 && currentPrice < indicators.ma50)
    alerts.push({ type: 'warning', code: 'BELOW_MA50', message: `Precio bajo MA50 — tendencia de mediano plazo debilitada` });
  return alerts;
}

function calcSupportResistance(quotes) {
  if (!quotes.length) return { support: 0, resistance: 0 };
  const recent = quotes.slice(-60);
  const highs = recent.map(q => q.high).filter(Boolean);
  const lows  = recent.map(q => q.low).filter(Boolean);
  return { resistance: Math.max(...highs), support: Math.min(...lows) };
}

function getMomentum(rsi, macd) {
  if (!macd || rsi == null) return 'NEUTRAL';
  if (rsi < 35 && macd.histogram > 0) return 'ALCISTA_FUERTE';
  if (rsi > 65 && macd.histogram < 0) return 'BAJISTA_FUERTE';
  if (macd.histogram > 0) return 'ALCISTA';
  if (macd.histogram < 0) return 'BAJISTA';
  return 'NEUTRAL';
}

async function translateText(text) {
  if (!text || !text.trim()) return text;
  try {
    const result = await translate(text, { to: 'es' });
    return result.text;
  } catch (e) {
    console.warn('translate error:', e.message);
    return text;
  }
}

// ─── Portfolio compute helper ─────────────────────────────────────────────────
async function computePortfolio(positions) {
  const results = await Promise.all(positions.map(async (pos) => {
    const quote = await yahooFinance.quote(pos.ticker);
    const hist  = await yahooFinance.chart(pos.ticker, { period1: new Date(Date.now() - 400 * 86400000), interval: '1d' });
    const quotes = hist.quotes.filter(q => q.close);
    const closes = quotes.map(q => q.close);
    const ind = calcIndicators(closes);
    const { support, resistance } = calcSupportResistance(quotes);
    const currentPrice = quote.regularMarketPrice;
    const marketValue  = currentPrice * pos.shares;
    const costBasis    = pos.entryPrice * pos.shares;
    const pnl = marketValue - costBasis;
    const name = pos.name || quote.longName || quote.shortName || pos.ticker;

    return {
      ...pos, name, currentPrice,
      dailyChange: quote.regularMarketChange,
      dailyChangePct: quote.regularMarketChangePercent,
      marketValue, costBasis, pnl, pnlPct: (pnl / costBasis) * 100,
      indicators: { rsi: ind.rsi, macd: ind.macd, ma50: ind.ma50, ma200: ind.ma200 },
      support, resistance,
      alerts: getAlerts(pos.ticker, currentPrice, pos.entryPrice, ind),
      chartData: quotes.slice(-180).map(q => ({ date: q.date, close: q.close, volume: q.volume })),
    };
  }));

  const totalValue = results.reduce((s, p) => s + p.marketValue, 0);
  const totalCost  = results.reduce((s, p) => s + p.costBasis, 0);
  return { positions: results, totalValue, totalCost, totalPnl: totalValue - totalCost };
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ ok: true }));

// GET /api/portfolio  (default portfolio)
app.get('/api/portfolio', async (req, res) => {
  try {
    const cached = cache.get('portfolio_default');
    if (cached) return res.json(cached);
    const payload = await computePortfolio(DEFAULT_PORTFOLIO);
    cache.set('portfolio_default', payload);
    res.json(payload);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// POST /api/portfolio  (custom positions from frontend localStorage)
app.post('/api/portfolio', async (req, res) => {
  try {
    const { positions } = req.body;
    if (!positions || !Array.isArray(positions) || positions.length === 0)
      return res.status(400).json({ error: 'positions array required' });

    const cacheKey = 'portfolio_' + positions.map(p => `${p.ticker}:${p.shares}:${p.entryPrice}`).join('|');
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const payload = await computePortfolio(positions);
    cache.set(cacheKey, payload, 300);
    res.json(payload);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// GET /api/price/:ticker  (30s cache)
app.get('/api/price/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    const cacheKey = `price_${ticker}`;
    const cached = shortCache.get(cacheKey);
    if (cached) return res.json(cached);
    const q = await yahooFinance.quote(ticker);
    const payload = { ticker, price: q.regularMarketPrice, change: q.regularMarketChange, changePct: q.regularMarketChangePercent, high: q.regularMarketDayHigh, low: q.regularMarketDayLow, volume: q.regularMarketVolume, timestamp: new Date().toISOString() };
    shortCache.set(cacheKey, payload);
    res.json(payload);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/analysis/:ticker?range=1D
app.get('/api/analysis/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    const range  = req.query.range || '1D';
    const cfg    = RANGE_CONFIG[range] || RANGE_CONFIG['1D'];
    const cacheKey = `analysis_${ticker}_${range}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const isIntraday = range === '1D' || range === '5D';

    const chartPeriod1 = new Date(Date.now() - cfg.chartDays * 86400000);
    const histPeriod1  = new Date(Date.now() - cfg.historyDays * 86400000);

    const [quote, chartHist, fullHist] = await Promise.all([
      yahooFinance.quote(ticker),
      yahooFinance.chart(ticker, { period1: chartPeriod1, interval: cfg.interval }),
      isIntraday || cfg.historyDays > cfg.chartDays
        ? yahooFinance.chart(ticker, { period1: histPeriod1, interval: '1d' })
        : Promise.resolve(null),
    ]);

    const rawChartQuotes = chartHist.quotes.filter(q => q.close != null);
    // For 1D: only show regular market hours (9:30–16:00 ET)
    const chartQuotes = range === '1D'
      ? rawChartQuotes.filter(q => {
          const d = new Date(q.date);
          const etHour = d.toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false });
          const etMin  = d.toLocaleString('en-US', { timeZone: 'America/New_York', minute: 'numeric' });
          const mins = parseInt(etHour) * 60 + parseInt(etMin);
          return mins >= 570 && mins <= 960; // 9:30 (570) to 16:00 (960)
        })
      : rawChartQuotes;
    const dailyQuotes = isIntraday
      ? (fullHist?.quotes ?? []).filter(q => q.close)
      : cfg.historyDays > cfg.chartDays
        ? (fullHist?.quotes ?? []).filter(q => q.close)
        : chartQuotes;

    const dailyCloses = dailyQuotes.map(q => q.close);
    const fullInd = calcIndicators(dailyCloses);

    const chartStart = dailyQuotes.length - chartQuotes.length;
    const { rsiData, macdData, ma50ForChart, ma200ForChart } = calcIndicatorsForRange(dailyQuotes, Math.max(0, chartStart));

    const chartData = chartQuotes.map((q, i) => ({
      date: q.date,
      close: q.close,
      volume: q.volume,
      high: q.high,
      low: q.low,
      ma50:  ma50ForChart[i]  ?? null,
      ma200: ma200ForChart[i] ?? null,
    }));

    const { support, resistance } = calcSupportResistance(chartQuotes);
    const currentPrice = quote.regularMarketPrice;

    const payload = {
      ticker, range,
      name: quote.longName || quote.shortName || ticker,
      currentPrice,
      dailyChange: quote.regularMarketChange,
      dailyChangePct: quote.regularMarketChangePercent,
      dayHigh: quote.regularMarketDayHigh,
      dayLow:  quote.regularMarketDayLow,
      week52High: quote.fiftyTwoWeekHigh,
      week52Low:  quote.fiftyTwoWeekLow,
      marketCap: quote.marketCap,
      peRatio:   quote.trailingPE,
      indicators: {
        rsi:  fullInd.rsi  ? parseFloat(fullInd.rsi.toFixed(2))  : null,
        macd: fullInd.macd ? { macd: parseFloat((fullInd.macd.MACD??0).toFixed(4)), signal: parseFloat((fullInd.macd.signal??0).toFixed(4)), histogram: parseFloat((fullInd.macd.histogram??0).toFixed(4)) } : null,
        ma50:  fullInd.ma50  ? parseFloat(fullInd.ma50.toFixed(2))  : null,
        ma200: fullInd.ma200 ? parseFloat(fullInd.ma200.toFixed(2)) : null,
      },
      support: parseFloat(support.toFixed(2)),
      resistance: parseFloat(resistance.toFixed(2)),
      momentum: getMomentum(fullInd.rsi, fullInd.macd),
      chartData, rsiData, macdData,
    };

    cache.set(cacheKey, payload, cfg.ttl);
    res.json(payload);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// GET /api/news/:ticker  (translated to Spanish)
app.get('/api/news/:ticker', async (req, res) => {
  try {
    const ticker   = req.params.ticker.toUpperCase();
    const cacheKey = `news_es_${ticker}`;
    const cached   = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const feed     = await rssParser.parseURL(`https://feeds.finance.yahoo.com/rss/2.0/headline?s=${ticker}&region=US&lang=en-US`);
    const rawItems = feed.items.slice(0, 10);

    const items = await Promise.all(rawItems.map(async (item) => {
      const [titleEs, summaryEs] = await Promise.all([
        translateText(item.title),
        translateText(item.contentSnippet?.slice(0, 200) || ''),
      ]);
      return {
        title:   titleEs,
        titleEn: item.title,
        link:    item.link,
        pubDate: item.pubDate,
        source:  item.creator || 'Yahoo Finance',
        summary: summaryEs,
      };
    }));

    cache.set(cacheKey, items, 1800);
    res.json(items);
  } catch (err) { console.error(err); res.json([]); }
});

// GET /api/quote/:ticker
app.get('/api/quote/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    const q = await yahooFinance.quote(ticker);
    res.json({ ticker, name: q.longName || q.shortName || ticker, price: q.regularMarketPrice, change: q.regularMarketChange, changePct: q.regularMarketChangePercent });
  } catch { res.status(404).json({ error: 'Ticker no encontrado' }); }
});

// ── Serve frontend in production ──────────────────────────────
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));

if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.use((req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Stock Analyst API :${PORT}`));
