import { supabase } from '@/lib/supabase'
import type { DuesStatus } from '@/lib/types'

export const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

export const DUES_STATUS_LABELS: Record<DuesStatus, string> = {
  impaye: 'Impayé',
  paye: 'Payé',
  exempte: 'Exempté',
  en_attente: 'En attente',
}

/** Monthly adidy when no amount is set for a month — mirrors
 *  public.default_dues_amount() (migration 0010). */
export const DEFAULT_DUES_AMOUNT = 1000

export function formatAr(amount: number) {
  // Narrow no-break spaces from fr-FR render as boxes on some Android fonts.
  return `${amount.toLocaleString('fr-FR').replace(/\s/g, ' ')} Ar`
}

export interface DuesTotal {
  months: number
  amount: number
}

/** The signed-in member's own unpaid adidy, all years, up to today. */
export async function fetchMyDuesTotal(): Promise<DuesTotal> {
  const { data } = await supabase.from('my_unpaid_dues').select('amount_due')
  const dues = data ?? []
  return { months: dues.length, amount: dues.reduce((sum, d) => sum + Number(d.amount_due), 0) }
}
