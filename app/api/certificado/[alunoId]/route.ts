import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ alunoId: string }> }
) {
  const { alunoId } = await params;
  const adminClient = createServiceRoleClient();

  const { data: aluno } = await (adminClient.from('alunos') as any)
    .select('id, nome, status, created_at')
    .eq('id', alunoId)
    .maybeSingle();

  if (!aluno) {
    return new NextResponse('Aluno não encontrado', { status: 404 });
  }

  const dataConclusao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Certificado — ${aluno.nome}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', sans-serif;
    background: #f8f8f8;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 40px 20px;
  }
  .certificado {
    background: #fff;
    width: 900px;
    min-height: 620px;
    border-radius: 16px;
    padding: 60px 80px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  }
  .borda-top {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 8px;
    background: linear-gradient(135deg, #333687 0%, #1f216b 35%, #017a3e 70%, #02A153 100%);
  }
  .borda-bottom {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 8px;
    background: linear-gradient(135deg, #02A153 0%, #017a3e 30%, #1f216b 65%, #333687 100%);
  }
  .borda-left {
    position: absolute;
    top: 8px; left: 0; bottom: 8px;
    width: 8px;
    background: linear-gradient(180deg, #333687, #02A153);
  }
  .borda-right {
    position: absolute;
    top: 8px; right: 0; bottom: 8px;
    width: 8px;
    background: linear-gradient(180deg, #02A153, #333687);
  }
  .inner {
    border: 2px solid #e8e8f0;
    border-radius: 8px;
    padding: 48px 56px;
    text-align: center;
    position: relative;
  }
  .logo {
    width: 80px;
    height: 80px;
    object-fit: contain;
    margin-bottom: 24px;
  }
  .titulo-cert {
    font-size: 11px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: #333687;
    font-weight: 600;
    margin-bottom: 6px;
  }
  .cert-title {
    font-size: 32px;
    font-weight: 800;
    letter-spacing: 3px;
    text-transform: uppercase;
    background: linear-gradient(135deg, #333687 0%, #02A153 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 32px;
  }
  .cert-text {
    font-size: 15px;
    color: #666;
    margin-bottom: 8px;
    font-weight: 400;
  }
  .nome-aluno {
    font-size: 36px;
    font-weight: 700;
    color: #1a1a2e;
    letter-spacing: 1px;
    margin: 12px 0 16px;
    font-style: italic;
  }
  .cert-text-prog {
    font-size: 15px;
    color: #666;
    margin-bottom: 4px;
  }
  .nome-empresa {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #333687;
    margin: 4px 0 36px;
  }
  .divider {
    width: 80px;
    height: 3px;
    background: linear-gradient(135deg, #333687, #02A153);
    margin: 0 auto 32px;
    border-radius: 99px;
  }
  .data-text {
    font-size: 13px;
    color: #999;
    margin-bottom: 32px;
  }
  .assinatura-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
  }
  .assinatura-linha {
    width: 220px;
    height: 1px;
    background: #333687;
    margin-bottom: 8px;
  }
  .assinatura-nome {
    font-size: 14px;
    font-weight: 600;
    color: #1a1a2e;
  }
  .assinatura-cargo {
    font-size: 12px;
    color: #888;
    margin-top: 2px;
  }
  @media print {
    body {
      background: #fff;
      padding: 0;
    }
    .certificado {
      box-shadow: none;
      border-radius: 0;
      width: 100%;
      min-height: 100vh;
    }
    @page {
      size: A4 landscape;
      margin: 0;
    }
  }
</style>
</head>
<body>
<div class="certificado">
  <div class="borda-top"></div>
  <div class="borda-bottom"></div>
  <div class="borda-left"></div>
  <div class="borda-right"></div>
  <div class="inner">
    <img src="/logo.png" class="logo" alt="AVP Logo" />
    <p class="titulo-cert">Auto Vale Prevenções</p>
    <h1 class="cert-title">Certificado de Conclusão</h1>
    <p class="cert-text">Certificamos que</p>
    <p class="nome-aluno">${aluno.nome}</p>
    <p class="cert-text-prog">concluiu com êxito o programa de formação</p>
    <p class="nome-empresa">Universidade Auto Vale Prevenções</p>
    <div class="divider"></div>
    <p class="data-text">${dataConclusao}</p>
    <div class="assinatura-area">
      <div class="assinatura-linha"></div>
      <p class="assinatura-nome">Jefferson Soares</p>
      <p class="assinatura-cargo">Gestor Auto Vale Prevenções</p>
    </div>
  </div>
</div>
<script>window.onload = function() { window.print(); };</script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
