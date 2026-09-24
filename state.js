const { redisCommand } = require('../lib/redis');

const PRODUCT_IDS = ['p1', 'p2', 'p3', 'p4'];
const RESERVED = { p1: 60, p2: 40, p3: 50, p4: 35 };
const CHANNELS = ['tiktok', 'instagram', 'website'];

module.exports = async (req, res) => {
  try {
    // La primera vez que alguien visita el panel (o después de un reinicio),
    // el inventario aún no existe en la base de datos: se crea aquí mismo.
    const alreadyInitialized = await redisCommand(['GET', 'stock:p1']);
    if (alreadyInitialized === null) {
      for (const id of PRODUCT_IDS) {
        await redisCommand(['SET', `stock:${id}`, String(RESERVED[id])]);
        for (const ch of CHANNELS) {
          await redisCommand(['SET', `count:${id}:${ch}`, '0']);
        }
      }
      await redisCommand(['SET', 'stopped', '0']);
      await redisCommand(['SET', 'focus', 'p1']);
      await redisCommand(['SET', 'started_at', String(Date.now())]);
    }

    const stockKeys = PRODUCT_IDS.map((id) => `stock:${id}`);
    const stockVals = await redisCommand(['MGET', ...stockKeys]);
    const stocks = {};
    PRODUCT_IDS.forEach((id, i) => { stocks[id] = Number(stockVals[i]); });

    const countKeys = [];
    PRODUCT_IDS.forEach((id) => CHANNELS.forEach((ch) => countKeys.push(`count:${id}:${ch}`)));
    const countVals = await redisCommand(['MGET', ...countKeys]);
    const counts = {};
    let k = 0;
    PRODUCT_IDS.forEach((id) => {
      counts[id] = {};
      CHANNELS.forEach((ch) => { counts[id][ch] = Number(countVals[k++] || 0); });
    });

    const stopped = (await redisCommand(['GET', 'stopped'])) === '1';
    const focus = await redisCommand(['GET', 'focus']);
    const startedAt = Number(await redisCommand(['GET', 'started_at']));

    res.status(200).json({ stocks, counts, stopped, focus, startedAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
