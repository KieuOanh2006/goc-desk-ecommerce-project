const buckets = new Map();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_IP = 5;

function limitVerificationResendsByIp(req, res, next) {
  const now = Date.now();
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  let bucket = buckets.get(ip);
  if (!bucket || now - bucket.startedAt >= WINDOW_MS) {
    bucket = { startedAt: now, count: 0 };
    buckets.set(ip, bucket);
  }
  bucket.count += 1;
  req.verificationResendRateLimitedByIp = bucket.count > MAX_REQUESTS_PER_IP;

  if (buckets.size > 10000) {
    for (const [key, value] of buckets) {
      if (now - value.startedAt >= WINDOW_MS) buckets.delete(key);
    }
  }
  return next();
}

module.exports = limitVerificationResendsByIp;
