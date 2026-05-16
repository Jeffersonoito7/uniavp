/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
  },

  async rewrites() {
    return [
      // ── UNIAVP PRO (antes /gestor) ──────────────────────────────
      { source: '/pro',               destination: '/gestor' },
      { source: '/pro/:path*',        destination: '/gestor/:path*' },

      // ── UNIAVP FREE (antes /aluno) ──────────────────────────────
      { source: '/free/:whatsapp',        destination: '/aluno/:whatsapp' },
      { source: '/free/:whatsapp/:path*', destination: '/aluno/:whatsapp/:path*' },

      // ── Páginas de upgrade ──────────────────────────────────────
      { source: '/assinar-pro',       destination: '/consultor/assinar-pro' },
      { source: '/upgrade',           destination: '/consultor/upgrade' },
    ]
  },

  async redirects() {
    return [
      // Logins antigos → login unificado
      { source: '/login',           destination: '/entrar', permanent: false },
      { source: '/gestor/login',    destination: '/entrar', permanent: true },
      { source: '/gestor/otp',      destination: '/entrar/otp', permanent: true },
      { source: '/consultor/login', destination: '/entrar', permanent: true },
      { source: '/consultor/otp',   destination: '/entrar/otp', permanent: true },
    ]
  },
};
module.exports = nextConfig;
