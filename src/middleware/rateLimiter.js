/**
 * In-memory sliding window rate limiter
 * Protects against brute-force attacks and abuse without external dependencies
 */

class SimpleRateLimiter {
  constructor(windowMs = 60000, maxAttempts = 10, message = 'Trop de requêtes, veuillez réessayer plus tard.') {
    this.windowMs = windowMs;
    this.maxAttempts = maxAttempts;
    this.message = message;
    this.records = new Map(); // key -> [timestamp, timestamp, ...]

    // Periodic cleanup of expired entries every 2 minutes
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, 120000);

    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  cleanup() {
    const now = Date.now();
    for (const [key, timestamps] of this.records.entries()) {
      const valid = timestamps.filter(t => now - t < this.windowMs);
      if (valid.length === 0) {
        this.records.delete(key);
      } else {
        this.records.set(key, valid);
      }
    }
  }

  isAllowed(key) {
    const now = Date.now();
    const timestamps = this.records.get(key) || [];
    const valid = timestamps.filter(t => now - t < this.windowMs);

    if (valid.length >= this.maxAttempts) {
      const oldest = valid[0];
      const retryAfterSeconds = Math.ceil((oldest + this.windowMs - now) / 1000);
      return { allowed: false, retryAfterSeconds, message: this.message };
    }

    valid.push(now);
    this.records.set(key, valid);
    return { allowed: true, remaining: this.maxAttempts - valid.length };
  }

  middleware() {
    return (req, res, next) => {
      const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
      const key = `${req.path}:${ip}`;
      const check = this.isAllowed(key);
      if (!check.allowed) {
        res.setHeader('Retry-After', check.retryAfterSeconds);
        return res.status(429).json({
          error: check.message,
          retryAfter: check.retryAfterSeconds
        });
      }
      next();
    };
  }
}

// 10 login attempts per 5 minutes per IP
const authLimiter = new SimpleRateLimiter(
  5 * 60 * 1000,
  10,
  'Trop de tentatives de connexion. Veuillez patienter 5 minutes avant de réessayer.'
);

// 5 registrations per 10 minutes per IP
const registerLimiter = new SimpleRateLimiter(
  10 * 60 * 1000,
  5,
  'Trop de créations de compte récentes depuis cette adresse. Veuillez patienter 10 minutes.'
);

module.exports = {
  SimpleRateLimiter,
  authLimiter,
  registerLimiter
};
