const { redisCommand } = require('../lib/redis');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  try {
    const { productId } = req.body || {};
    if (!productId) return res.status(400).json({ error: 'invalid_payload' });
    await redisCommand(['SET', 'focus', productId]);
    res.status(200).json({ focus: productId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
