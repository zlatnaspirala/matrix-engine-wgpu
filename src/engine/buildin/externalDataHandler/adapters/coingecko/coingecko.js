export class CoinGeckoAdapter {
  constructor(coinIds = ["bitcoin", "ripple"], historyLen = 64) {
    this.coinIds = coinIds;
    this.historyLen = historyLen;
    this.history = {};
    this.prevPrice = {};
    this.coinIds.forEach(id => {
      this.history[id] = new Float32Array(historyLen);
      this.prevPrice[id] = 0;
    });
    this.onUpdate = null;
    this._timer = null;
  }

  async start(intervalMs = 60000) {
    await this._seedHistory();
    if (this.onUpdate) this.onUpdate(this._buildGrid());
    this._timer = setInterval(() => this._tick(), intervalMs);
  }

  stop() { clearInterval(this._timer); }

  async _seedHistory() {
    await Promise.all(this.coinIds.map(async id => {
      try {
        const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=1`;
        const res = await fetch(url);
        const data = await res.json();
        const prices = data.prices.map(p => p[1]);
        const buf = this.history[id];
        for (let i = 0; i < this.historyLen; i++) {
          const srcIdx = Math.floor((i / this.historyLen) * prices.length);
          buf[i] = prices[srcIdx] ?? prices[prices.length - 1] ?? 0;
        }
        this.prevPrice[id] = buf[this.historyLen - 1];
      } catch (e) {
        console.warn(`CoinGeckoAdapter: seed failed for ${id}`, e);
      }
    }));
  }

  async _tick() {
    const ids = this.coinIds.join(",");
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      this.coinIds.forEach(id => {
        const price = data[id]?.usd ?? this.prevPrice[id];
        const buf = this.history[id];
        buf.copyWithin(0, 1);            // shift left, drop oldest
        buf[this.historyLen - 1] = price; // push newest at the end
        this.prevPrice[id] = price;
      });
      if (this.onUpdate) this.onUpdate(this._buildGrid());
    } catch (e) {
      console.warn("CoinGeckoAdapter tick failed:", e);
    }
  }

  _buildGrid() {
    const coins = this.coinIds.map(id => {
      const buf = this.history[id];
      let min = Infinity, max = -Infinity;
      for (const v of buf) { min = Math.min(min, v); max = Math.max(max, v); }
      return {id, min, max, samples: buf};
    });
    return {coinCount: this.coinIds.length, timeSteps: this.historyLen, coins};
  }
}

export const cryptoNames = [
  "bitcoin",       // BTC
  "ethereum",      // ETH
  "ripple",        // XRP
  "binancecoin",   // BNB
  "solana",        // SOL
  "cardano",       // ADA
  "dogecoin",      // DOGE
  "polkadot",      // DOT
  "tron",          // TRX
  "avalanche-2",   // AVAX
  "chainlink",     // LINK
  "polygon",       // MATIC (older id: "matic-network")
  "litecoin",      // LTC
  "shiba-inu",     // SHIB
  "uniswap",       // UNI
  "cosmos",        // ATOM
  "stellar",       // XLM
  "monero",        // XMR
  "ethereum-classic", // ETC
  "filecoin",      // FIL
];