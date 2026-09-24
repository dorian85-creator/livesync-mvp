// Pequeña utilidad para enviar comandos a la base de datos Redis (Upstash)
// usando su API REST. No necesita ninguna librería externa (npm install),
// solo las dos variables de entorno que configuras en el panel de Vercel:
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN

async function redisCommand(command) {
  // Vercel puede nombrar estas variables de dos formas distintas según cómo
  // se conectó la base de datos. Aceptamos ambas para que funcione sin
  // importar cuál te haya tocado a ti.
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      'Faltan las variables de la base de datos (KV_REST_API_URL / KV_REST_API_TOKEN) en Vercel.'
    );
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

module.exports = { redisCommand };
