-- ============================================================
-- RLS policies para tabelas de contratos digitais
-- O service role bypassa RLS nas rotas de API.
-- Estas policies protegem acesso via anon key / acesso direto.
-- ============================================================

-- contrato_templates: apenas admins do tenant leem
CREATE POLICY "contrato_templates: admin le" ON public.contrato_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.user_id = auth.uid()
        AND admins.ativo = true
        AND (admins.tenant_id = contrato_templates.tenant_id OR admins.tenant_id IS NULL)
    )
    OR
    EXISTS (SELECT 1 FROM public.super_admins WHERE super_admins.user_id = auth.uid() AND super_admins.ativo = true)
  );

CREATE POLICY "contrato_templates: admin escreve" ON public.contrato_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.user_id = auth.uid()
        AND admins.ativo = true
        AND (admins.tenant_id = contrato_templates.tenant_id OR admins.tenant_id IS NULL)
    )
    OR
    EXISTS (SELECT 1 FROM public.super_admins WHERE super_admins.user_id = auth.uid() AND super_admins.ativo = true)
  );

-- contratos_digitais: admins do tenant leem/escrevem
CREATE POLICY "contratos_digitais: admin le" ON public.contratos_digitais
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.user_id = auth.uid()
        AND admins.ativo = true
        AND (admins.tenant_id = contratos_digitais.tenant_id OR admins.tenant_id IS NULL)
    )
    OR
    EXISTS (SELECT 1 FROM public.super_admins WHERE super_admins.user_id = auth.uid() AND super_admins.ativo = true)
  );

CREATE POLICY "contratos_digitais: admin escreve" ON public.contratos_digitais
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.user_id = auth.uid()
        AND admins.ativo = true
        AND (admins.tenant_id = contratos_digitais.tenant_id OR admins.tenant_id IS NULL)
    )
    OR
    EXISTS (SELECT 1 FROM public.super_admins WHERE super_admins.user_id = auth.uid() AND super_admins.ativo = true)
  );

-- contrato_assinantes: admin le/escreve; assinante le o proprio registro via token (sem auth)
CREATE POLICY "contrato_assinantes: admin le" ON public.contrato_assinantes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contratos_digitais cd
      JOIN public.admins a ON a.tenant_id = cd.tenant_id OR a.tenant_id IS NULL
      WHERE cd.id = contrato_assinantes.contrato_id
        AND a.user_id = auth.uid()
        AND a.ativo = true
    )
    OR
    EXISTS (SELECT 1 FROM public.super_admins WHERE super_admins.user_id = auth.uid() AND super_admins.ativo = true)
  );

CREATE POLICY "contrato_assinantes: admin escreve" ON public.contrato_assinantes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.contratos_digitais cd
      JOIN public.admins a ON a.tenant_id = cd.tenant_id OR a.tenant_id IS NULL
      WHERE cd.id = contrato_assinantes.contrato_id
        AND a.user_id = auth.uid()
        AND a.ativo = true
    )
    OR
    EXISTS (SELECT 1 FROM public.super_admins WHERE super_admins.user_id = auth.uid() AND super_admins.ativo = true)
  );

-- contrato_gatilhos: apenas admins do tenant
CREATE POLICY "contrato_gatilhos: admin le" ON public.contrato_gatilhos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.user_id = auth.uid()
        AND admins.ativo = true
        AND (admins.tenant_id = contrato_gatilhos.tenant_id OR admins.tenant_id IS NULL)
    )
    OR
    EXISTS (SELECT 1 FROM public.super_admins WHERE super_admins.user_id = auth.uid() AND super_admins.ativo = true)
  );

CREATE POLICY "contrato_gatilhos: admin escreve" ON public.contrato_gatilhos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.user_id = auth.uid()
        AND admins.ativo = true
        AND (admins.tenant_id = contrato_gatilhos.tenant_id OR admins.tenant_id IS NULL)
    )
    OR
    EXISTS (SELECT 1 FROM public.super_admins WHERE super_admins.user_id = auth.uid() AND super_admins.ativo = true)
  );

-- ============================================================
-- Storage bucket "documentos": torna privado
-- Assinaturas sao acessiveis apenas via service role (backend)
-- ============================================================
UPDATE storage.buckets SET public = false WHERE id = 'documentos';

-- Remove policy publica se existir
DROP POLICY IF EXISTS "documentos publico" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Apenas service role (backend) le e escreve no bucket documentos
-- O frontend nunca acessa diretamente — usa a API que retorna signed URL se necessario
CREATE POLICY "documentos: service role apenas" ON storage.objects
  FOR ALL TO service_role
  USING (bucket_id = 'documentos');
