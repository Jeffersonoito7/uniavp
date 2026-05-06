import { NextResponse } from 'next/server';

const EFI_BASE_URL = process.env.EFI_SANDBOX === 'true'
  ? 'https://sandbox.efipay.com.br'
  : 'https://api.efipay.com.br';

async function getEfiToken(): Promise<string> {
  const credentials = Buffer.from(`${process.env.EFI_CLIENT_ID}:${process.env.EFI_CLIENT_SECRET}`).toString('base64');
  const resp = await fetch(`${EFI_BASE_URL}/v1/authorize`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ grant_type: 'client_credentials' }),
  });
  const data = await resp.json();
  return data.access_token;
}

export async function POST(request: Request) {
  try {
    const { plano, nome, cpf, email, telefone } = await request.json();

    const valores: Record<string, number> = {
      starter: 29700,
      profissional: 49700,
      enterprise: 99700,
    };

    const valor = valores[plano];
    if (!valor) return NextResponse.json({ erro: 'Plano inválido' }, { status: 400 });

    const token = await getEfiToken();

    const vencimento = new Date();
    vencimento.setDate(vencimento.getDate() + 3);

    const resp = await fetch(`${EFI_BASE_URL}/v1/charge`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payment: {
          banking_billet: {
            expire_at: vencimento.toISOString().split('T')[0],
            customer: {
              name: nome,
              cpf: cpf.replace(/\D/g, ''),
              email,
              phone_number: telefone?.replace(/\D/g, ''),
            },
          },
        },
        items: [{
          name: `Plano ${plano.charAt(0).toUpperCase() + plano.slice(1)} - Uni AVP`,
          value: valor,
          amount: 1,
        }],
      }),
    });

    const data = await resp.json();

    if (!resp.ok) return NextResponse.json({ erro: data.message || 'Erro ao gerar boleto' }, { status: 400 });

    return NextResponse.json({
      ok: true,
      boleto_url: data.data?.link,
      boleto_codigo: data.data?.barcode,
      charge_id: data.data?.charge_id,
    });
  } catch (err: any) {
    console.error('EFI erro:', err);
    return NextResponse.json({ erro: 'Erro interno ao gerar boleto' }, { status: 500 });
  }
}
