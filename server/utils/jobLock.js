const os = require('os');
const JobLock = require('../models/JobLock');

const tryAcquire = async (name, ttlMs) => {
  const owner = `${os.hostname()}:${process.pid}:${Date.now()}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs);

  try {
    await JobLock.create({ _id: name, owner, expiresAt });
    return owner;
  } catch (err) {
    if (err.code !== 11000) throw err;
    const stolen = await JobLock.findOneAndUpdate(
      { _id: name, expiresAt: { $lte: now } },
      { $set: { owner, expiresAt } },
      { new: true }
    );
    return stolen && stolen.owner === owner ? owner : null;
  }
};

const release = async (name, owner) => {
  if (!owner) return;
  await JobLock.deleteOne({ _id: name, owner }).catch(() => {});
};

const forceRelease = async (name) => {
  await JobLock.deleteOne({ _id: name }).catch(() => {});
};

/**
 * 同一任务同一时刻只跑一份。
 * 拿不到锁则跳过，不抛错。
 */
const withJobLock = async (name, ttlMs, fn) => {
  let owner = null;
  try {
    owner = await tryAcquire(name, ttlMs);
  } catch (err) {
    console.error(`⚠️  获取任务锁失败 (${name}):`, err.message);
    return { skipped: true, error: err };
  }

  if (!owner) {
    console.log(`⏭️  任务跳过（锁占用）: ${name}`);
    return { skipped: true };
  }

  try {
    const result = await fn();
    return result === undefined ? { skipped: false } : result;
  } finally {
    await release(name, owner);
  }
};

module.exports = { withJobLock, forceRelease };
