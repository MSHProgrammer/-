// Media detection and embedding utilities for JAMR

export function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
  return match ? match[1] : null;
}

export function getYouTubeEmbedUrl(url: string): string | null {
  const id = getYouTubeVideoId(url);
  return id ? `https://www.youtube.com/embed/${id}?rel=0` : null;
}

export function isDirectVideoUrl(url: string): boolean {
  if (!url) return false;
  return Boolean(url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i));
}

export function isVideoContent(url?: string, declaredType?: 'image' | 'video' | 'none'): boolean {
  if (declaredType === 'video') return true;
  if (!url) return false;
  return Boolean(getYouTubeVideoId(url) || isDirectVideoUrl(url));
}

export function detectMediaType(url: string, declaredType?: 'image' | 'video' | 'none'): 'image' | 'video' | 'none' {
  if (!url || !url.trim()) return 'none';
  if (declaredType && declaredType !== 'none') return declaredType;
  if (getYouTubeVideoId(url) || isDirectVideoUrl(url)) return 'video';
  return 'image';
}
