export async function enviarWhatsApp(numero: string, mensagem: string): Promise<boolean> {
  const url = process.env.EVOLUTION_API_URL;
  const key = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_API_INSTANCE;

  if (!url || !key || !instance) return false;

  const numeroLimpo = numero.replace(/\D/g, '');
  const numeroFormatado = numeroLimpo.startsWith('55') ? numeroLimpo : `55${numeroLimpo}`;

  try {
    const resp = await fetch(`${url}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': key,
      },
      body: JSON.stringify({
        number: numeroFormatado,
        text: mensagem,
      }),
    });
    return resp.ok;
  } catch {
    return false;
  }
}
