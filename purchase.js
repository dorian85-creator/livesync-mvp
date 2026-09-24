const { redisCommand } = require('../lib/redis');

// Este script se ejecuta dentro de la base de datos como una sola operación
// indivisible: lee el stock y lo descuenta en el mismo paso. Así, si dos
// compras llegan al mismo tiempo (una desde un celular, otra desde otro),
// nunca se vende más de lo que hay disponible.
const DECREMENT_SCRIPT = `
  local current = tonumber(redis.call('GET', KEYS[1]))
  if current == nil then
    return -2
  end
  if current < tonumber(ARGV[1]) then
    return -1
  end
  redis.call('DECRBY', KEYS[1], ARGV[1])
  redis.call('INCRBY', KEYS[2], ARGV[1])
  return current - tonumber(ARGV[1])
`;

const VALID_CHANNELS = ['tiktok', 'instagram', 'website'];

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  try {
    const { productId, channel } = req.body || {};
    if (!productId || !VALID_CHANNELS.includes(channel)) {
      return res.status(400).json({ error: 'invalid_payload' });
    }

    const stopped = await redisCommand(['GET', 'stopped']);
    if (stopped === '1') {
      return res.status(409).json({ error: 'sales_stopped' });
    }

    const stockKey = `stock:${productId}`;
    const countKey = `count:${productId}:${channel}`;
    const result = await redisCommand(['EVAL', DECREMENT_SCRIPT, '2', stockKey, countKey, '1']);

    if (result === -1) {
      return res.status(409).json({ error: 'out_of_stock' });
    }
    if (result === -2) {
      return res.status(500).json({ error: 'not_initialized' });
    }

    return res.status(200).json({ success: true, remaining: result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
