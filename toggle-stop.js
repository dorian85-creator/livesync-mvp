const { redisCommand } = require('../lib/redis');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  try {
    const current = await redisCommand(['GET', 'stopped']);
    const next = current === '1' ? '0' : '1';
    await redisCommand(['SET', 'stopped', next]);
    res.status(200).json({ stopped: next === '1' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
