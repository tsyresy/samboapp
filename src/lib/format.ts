export function fullName(p: { last_name: string | null; first_names: string | null } | undefined | null, fallback = 'Membre') {
  if (!p) return fallback
  return [p.last_name, p.first_names].filter(Boolean).join(' ') || fallback
}

export function shortName(p: { nickname: string | null; first_names: string | null; last_name: string | null }) {
  return p.nickname || p.first_names?.split(' ')[0] || p.last_name || 'Membre'
}

export function timeAgo(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.round(hours / 24)
  if (days < 7) return `il y a ${days} j`
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function formatDay(iso: string) {
  const s = new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** « 14:32 » today, « 3 sept. » before. */
export function shortTime(iso: string) {
  const d = new Date(iso)
  if (d.toDateString() === new Date().toDateString()) return formatTime(iso)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

/** A date column (yyyy-mm-dd or timestamp) as jj/mm/aaaa. */
export function formatDate(value: string | null) {
  if (!value) return null
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('fr-FR')
}

export function sameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString()
}
