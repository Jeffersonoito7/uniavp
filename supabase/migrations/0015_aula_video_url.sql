-- Suporte a vídeos em arquivo (MP4, Vimeo, URL direta) além do YouTube
ALTER TABLE aulas ADD COLUMN IF NOT EXISTS video_url TEXT;
