// Envia alertas para o Discord via webhook configurado em DISCORD_WEBHOOK_URL
// Silencia se a variável não estiver definida (dev local)

type Nivel = 'critico' | 'aviso' | 'info' | 'ok'

const CORES: Record<Nivel, number> = {
  critico: 0xe74c3c,  // vermelho
  aviso:   0xf39c12,  // laranja
  info:    0x3498db,  // azul
  ok:      0x2ecc71,  // verde
}

const ICONES: Record<Nivel, string> = {
  critico: '🔴',
  aviso:   '🟡',
  info:    '🔵',
  ok:      '🟢',
}

export async function alertarDiscord(
  nivel: Nivel,
  titulo: string,
  descricao: string,
  campos?: { nome: string; valor: string }[],
): Promise<void> {
  const url = process.env.DISCORD_WEBHOOK_URL
  if (!url) return

  const embed: Record<string, unknown> = {
    title: `${ICONES[nivel]} ${titulo}`,
    description: descricao,
    color: CORES[nivel],
    timestamp: new Date().toISOString(),
    footer: { text: 'UniAVP · Sistema' },
  }

  if (campos?.length) {
    embed.fields = campos.map(c => ({
      name: c.nome,
      value: c.valor,
      inline: true,
    }))
  }

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    })
  } catch {
    // Discord indisponível não deve derrubar o fluxo principal
  }
}
