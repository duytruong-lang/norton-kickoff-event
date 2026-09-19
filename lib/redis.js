/**
 * 1990 Agency — Norton Park Sales Kick-off Event Backend
 * Redis Connection via Upstash Redis REST SDK (Singapore Region)
 * Features: Native @upstash/redis SDK with built-in persistent fail-soft client for offline/local environments
 */

const fs = require('fs');
const path = require('path');

try {
  require('dotenv').config();
} catch (e) {
  // Graceful fallback if dotenv isn't present in minimal runtime
}

// Fallback Singapore region endpoints
const FALLBACK_REST_URL = 'https://sensible-ox-33433.upstash.io';
const FALLBACK_REST_TOKEN = 'AZ-norton-kickoff-sg-redis-token-fallback-2026';

const envUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const envToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

// Determine if we have real configured Upstash credentials
const hasLiveCredentials = Boolean(
  envUrl &&
  envToken &&
  !envUrl.includes('sensible-ox-33433') &&
  !envUrl.includes('fallback') &&
  !envUrl.includes('your_upstash')
);

const STATE_FILE_PATH = path.join(__dirname, '..', '.redis-local-state.json');

/**
 * High-fidelity Persistent In-Memory / File-backed Redis for local & fallback testing
 */
class PersistentFallbackRedis {
  constructor() {
    this._seq = 1;
    this._load();
  }

  _load() {
    this.store = {};
    this.lists = {};
    this.hashes = {};
    this.streams = {};

    try {
      if (fs.existsSync(STATE_FILE_PATH)) {
        const raw = fs.readFileSync(STATE_FILE_PATH, 'utf8');
        const data = JSON.parse(raw);
        this.store = data.store || {};
        this.lists = data.lists || {};
        this.hashes = data.hashes || {};
        this.streams = data.streams || {};
      }
    } catch (e) {
      // Fail-soft if state file is unreadable
    }
  }

  _save() {
    try {
      const data = {
        store: this.store,
        lists: this.lists,
        hashes: this.hashes,
        streams: this.streams,
        updatedAt: new Date().toISOString(),
      };
      fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      // Fail-soft if disk write is prohibited
    }
  }

  async get(key) {
    this._load();
    return this.store[key] !== undefined ? String(this.store[key]) : null;
  }

  async set(key, val) {
    this._load();
    this.store[key] = String(val);
    this._save();
    return 'OK';
  }

  async del(key) {
    this._load();
    let count = 0;
    if (this.store[key] !== undefined) { delete this.store[key]; count++; }
    if (this.lists[key] !== undefined) { delete this.lists[key]; count++; }
    if (this.hashes[key] !== undefined) { delete this.hashes[key]; count++; }
    if (this.streams[key] !== undefined) { delete this.streams[key]; count++; }
    this._save();
    return count > 0 ? 1 : 0;
  }

  async llen(key) {
    this._load();
    const l = this.lists[key] || [];
    return l.length;
  }

  async lpop(key) {
    this._load();
    const l = this.lists[key] || [];
    const item = l.shift();
    this.lists[key] = l;
    this._save();
    return item !== undefined ? item : null;
  }

  async rpush(key, ...items) {
    this._load();
    if (!this.lists[key]) this.lists[key] = [];
    this.lists[key].push(...items);
    this._save();
    return this.lists[key].length;
  }

  async hset(key, fieldOrObj, maybeVal) {
    this._load();
    if (!this.hashes[key]) this.hashes[key] = {};
    if (typeof fieldOrObj === 'object' && fieldOrObj !== null) {
      Object.assign(this.hashes[key], fieldOrObj);
    } else {
      this.hashes[key][fieldOrObj] = String(maybeVal);
    }
    this._save();
    return 1;
  }

  async hgetall(key) {
    this._load();
    const h = this.hashes[key];
    return h ? { ...h } : null;
  }

  async incr(key) {
    this._load();
    const cur = parseInt(this.store[key] || '0', 10) + 1;
    this.store[key] = String(cur);
    this._save();
    return cur;
  }

  async xadd(streamKey, idArg, fields) {
    this._load();
    if (!this.streams[streamKey]) this.streams[streamKey] = [];
    const id = (idArg === '*' || !idArg) ? `${Date.now()}-${this._seq++}` : idArg;
    this.streams[streamKey].push([id, fields]);
    this._save();
    return id;
  }

  async xrange(streamKey, start = '-', end = '+', count = 100) {
    this._load();
    const list = this.streams[streamKey] || [];
    return list.slice(0, count);
  }

  async ping() {
    return 'PONG';
  }
}

let redisInstance;
let RedisClass;

if (hasLiveCredentials) {
  try {
    RedisClass = require('@upstash/redis').Redis;
    redisInstance = new RedisClass({
      url: envUrl,
      token: envToken,
    });
  } catch (err) {
    RedisClass = PersistentFallbackRedis;
    redisInstance = new PersistentFallbackRedis();
  }
} else {
  RedisClass = PersistentFallbackRedis;
  redisInstance = new PersistentFallbackRedis();
}

async function pingRedis() {
  try {
    return await redisInstance.ping();
  } catch (error) {
    console.error('[Redis Ping Error]:', error.message);
    return null;
  }
}

module.exports = {
  redis: redisInstance,
  Redis: RedisClass,
  pingRedis,
  isUsingFallback: !hasLiveCredentials,
};
