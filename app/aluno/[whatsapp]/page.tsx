import { notFound, redirect } from 'next/navigation';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';
import CarrosselModulos from './CarrosselModulos';
import type { Aluno, TrilhaItem } from '@/lib/database.types';

export default async function AlunoPorWhatsAppPage({ params }: { params: Promise<{ whatsapp: string }> }) {
  const { whatsapp } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/aluno/${whatsapp}`);

  const adminClient = createServiceRoleClient();
  const { data: aluno } = await (adminClient.from('alunos') as any)
    .select('id, nome, email, whatsapp, status')
    .eq('whatsapp', whatsapp).maybeSingle() as { data: Pick<Aluno, 'id' | 'nome' | 'email' | 'whatsapp' | 'status'> | null };
  if (!aluno) notFound();

  const { data: meuAluno } = await (adminClient.from('alunos') as any).select('whatsapp').eq('user_id', user.id).maybeSingle() as { data: { whatsapp: string } | null };
  if (meuAluno && meuAluno.whatsapp !== whatsapp) redirect(`/aluno/${meuAluno.whatsapp}`);

  const { data: trilhaRaw } = await (adminClient.rpc as any)('obter_trilha_aluno', { p_aluno_id: aluno.id });
  const trilha = (trilhaRaw ?? []) as TrilhaItem[];

  const totalAulas = trilha.length;
  const aulasConcluidas = trilha.filter(a => a.status === 'concluida').length;
  const progressoPct = totalAulas > 0 ? Math.round((aulasConcluidas / totalAulas) * 100) : 0;

  const proximaAula = trilha.find(a => a.status === 'disponivel' || a.status === 'aguardando_tempo');

  const modulosMap = new Map<string, { modulo_id: string; modulo_titulo: string; modulo_ordem: number; aulas: TrilhaItem[] }>();
  for (const item of trilha) {
    if (!modulosMap.has(item.modulo_id)) {
      modulosMap.set(item.modulo_id, {
        modulo_id: item.modulo_id,
        modulo_titulo: item.modulo_titulo,
        modulo_ordem: item.modulo_ordem,
        aulas: [],
      });
    }
    modulosMap.get(item.modulo_id)!.aulas.push(item);
  }
  const modulos = Array.from(modulosMap.values()).sort((a, b) => a.modulo_ordem - b.modulo_ordem);

  const primeiroNome = aluno.nome.split(' ')[0];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--avp-black)' }}>
      <div style={{
        padding: '48px 5% 40px',
        background: 'linear-gradient(180deg, rgba(51,54,135,0.18) 0%, transparent 100%)',
        borderBottom: '1px solid var(--avp-border)',
        marginBottom: 40,
      }}>
        <p style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 3, color: 'var(--avp-text-dim)', marginBottom: 8 }}>
          Universidade Auto Vale Prevenções
        </p>
        <h1 style={{ fontFamily: 'Inter', fontSize: 'clamp(32px, 5vw, 52px)', letterSpacing: 2, margin: '0 0 16px' }}>
          Bem-vindo, <span className="text-gradient">{primeiroNome}</span>
        </h1>

        {totalAulas > 0 ? (
          <div style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--avp-text-dim)' }}>
                {aulasConcluidas} de {totalAulas} aulas concluídas
              </span>
              <span style={{ fontSize: 13, color: 'var(--avp-green)' }}>{progressoPct}%</span>
            </div>
            <div style={{ height: 6, background: 'var(--avp-border)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressoPct}%`, background: 'var(--grad-brand)', borderRadius: 99, transition: 'width 0.6s ease' }} />
            </div>
            {proximaAula && (
              <a
                href={`/aluno/${whatsapp}/aula/${proximaAula.aula_id}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  marginTop: 20, padding: '10px 24px',
                  background: 'var(--grad-brand)', color: '#fff',
                  borderRadius: 8, fontWeight: 600, fontSize: 14,
                  textDecoration: 'none',
                }}
              >
                ▶ Continuar
              </a>
            )}
          </div>
        ) : (
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 14 }}>Sua trilha está sendo preparada.</p>
        )}
      </div>

      {modulos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 5%' }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>🎓</p>
          <p style={{ fontFamily: 'Inter', fontSize: 24, letterSpacing: 2, marginBottom: 8 }}>Em breve!</p>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 14 }}>Novos módulos serão liberados em breve.</p>
        </div>
      ) : (
        <CarrosselModulos modulos={modulos} whatsapp={whatsapp} />
      )}
    </div>
  );
}
