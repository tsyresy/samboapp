import type { AccessLevel, MembershipCategory, ValidationStatus } from '@/lib/types'

export const CATEGORY_LABELS: Record<MembershipCategory, string> = {
  membre_standard: 'Membre standard',
  membre_bureau: 'Membre de bureau',
  sojabe: 'Sojabe',
  partenaire: 'Partenaire',
  sponsor: 'Sponsor',
}

export const VALIDATION_STATUS_LABELS: Record<ValidationStatus, string> = {
  en_attente: 'En attente de validation',
  valide: 'Validé',
  refuse: 'Refusé',
  suspendu: 'Suspendu',
}

export const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  membre: 'Membre',
  responsable: 'Responsable',
  administrateur: 'Administrateur',
}

export function categoryLabel(category: string) {
  return CATEGORY_LABELS[category as MembershipCategory] ?? category
}

/** What the membership card QR encodes. A custom scheme rather than a web
 *  address: the SAMBO app opens it directly, and a scan never depends on
 *  where the site happens to be running. Personal details are not in the
 *  code itself — the app fetches them for signed-in members only. */
const MEMBER_QR_PREFIX = 'sambo://membre/'

export function memberQrPayload(verificationId: string) {
  return MEMBER_QR_PREFIX + verificationId
}

/** Verification id read from a scanned QR, or null if it is not a SAMBO
 *  membership card. */
export function parseMemberQr(text: string): string | null {
  const value = text.trim()
  if (!value.startsWith(MEMBER_QR_PREFIX)) return null
  const id = value.slice(MEMBER_QR_PREFIX.length)
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? id.toLowerCase() : null
}
