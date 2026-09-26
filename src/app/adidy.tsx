import { useEffect, useMemo, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { Backdrop, Card, IconButton, Loading, Pill, Subtitle } from '@/components/ui'
import { useAuth } from '@/context/auth'
import { DEFAULT_DUES_AMOUNT, DUES_STATUS_LABELS, fetchMyDuesTotal, formatAr, MONTH_NAMES, type DuesTotal } from '@/lib/dues'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/theme'
import type { DuesStatus, MembershipCategory } from '@/lib/types'

const STATUS_TONES: Record<DuesStatus, 'accent' | 'danger' | 'gold'> = {
  paye: 'accent',
  impaye: 'danger',
  exempte: 'accent',
  en_attente: 'gold',
}

interface RuleRow {
  month: number
  category: MembershipCategory | null
  amount: number
}

interface RecordRow {
  month: number
  status: DuesStatus
  amount_paid: number | null
  payment_date: string | null
}

export default function Dues() {
  const { profile } = useAuth()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [rules, setRules] = useState<RuleRow[]>([])
  const [records, setRecords] = useState<RecordRow[]>([])
  const [totalDue, setTotalDue] = useState<DuesTotal | null>(null)
  const [loadedYear, setLoadedYear] = useState<number | null>(null)

  useEffect(() => {
    if (!profile) return
    let cancelled = false
    Promise.all([
      supabase.from('dues_rules').select('month, category, amount').eq('year', year),
      supabase.from('dues_records').select('month, status, amount_paid, payment_date').eq('profile_id', profile.id).eq('year', year),
      fetchMyDuesTotal(),
    ]).then(([rulesRes, recordsRes, total]) => {
      if (cancelled) return
      setRules(rulesRes.data ?? [])
      setRecords(recordsRes.data ?? [])
      setTotalDue(total)
      setLoadedYear(year)
    })
    return () => {
      cancelled = true
    }
  }, [profile, year])

  // Mirrors the unpaid_dues_detail view (migration 0010), like the site:
  // this year, every month up to now is due at the rule's amount or the
  // default; earlier years only for months that had an amount set.
  const monthly = useMemo(() => {
    const now = new Date()
    const nowYear = now.getFullYear()
    const nowMonth = now.getMonth() + 1
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      const rule =
        rules.find((r) => r.month === month && r.category === profile?.category) ??
        rules.find((r) => r.month === month && r.category === null)
      const record = records.find((r) => r.month === month)
      const amount = rule ? rule.amount : year >= nowYear ? DEFAULT_DUES_AMOUNT : null
      const isPast = year < nowYear || (year === nowYear && month <= nowMonth)
      const status: DuesStatus | null = record?.status ?? (isPast && amount !== null && amount > 0 ? 'impaye' : null)
      return { month, rule, amount, status, paidOn: record?.payment_date ?? null }
    })
  }, [rules, records, profile, year])

  if (!profile || loadedYear === null) {
    return (
      <Backdrop>
        <Loading />
      </Backdrop>
    )
  }

  const owes = !!totalDue && totalDue.amount > 0

  return (
    <Backdrop>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}>
        <Subtitle>Suivi de vos cotisations mensuelles. Le paiement se fait auprès du trésorier, qui le marque ici.</Subtitle>

        {totalDue && (
          <Card tone={owes ? 'danger' : 'accent'}>
            <Text style={{ color: colors.inkMuted, fontSize: 13, fontWeight: '500' }}>Total dû à ce jour</Text>
            <Text style={{ color: owes ? colors.danger : colors.accent, fontSize: 34, fontWeight: '800', marginTop: 2 }}>{formatAr(totalDue.amount)}</Text>
            <Text style={{ color: colors.inkMuted, fontSize: 13 }}>
              {totalDue.months > 0
                ? `${totalDue.months} mois impayé${totalDue.months > 1 ? 's' : ''}, toutes années confondues.`
                : 'Vous êtes à jour. Misaotra !'}
            </Text>
          </Card>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <IconButton icon="chevron-back" label="Année précédente" onPress={() => setYear((y) => y - 1)} />
          <Text style={{ color: colors.ink, fontSize: 18, fontWeight: '700', minWidth: 60, textAlign: 'center' }}>{year}</Text>
          <IconButton icon="chevron-forward" label="Année suivante" onPress={() => setYear((y) => y + 1)} />
        </View>

        <Card style={{ paddingVertical: 4 }}>
          {loadedYear !== year ? (
            <Loading />
          ) : (
            monthly.map(({ month, rule, amount, status, paidOn }, i) => (
              <View
                key={month}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: colors.line,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.ink, fontSize: 15, fontWeight: '600' }}>{MONTH_NAMES[month - 1]}</Text>
                  <Text style={{ color: colors.inkSubtle, fontSize: 12 }}>
                    {amount === null ? '—' : amount === 0 ? 'Gratuit' : formatAr(amount)}
                    {!rule && amount !== null ? ' (par défaut)' : ''}
                    {status === 'paye' && paidOn ? ` · payé le ${new Date(paidOn).toLocaleDateString('fr-FR')}` : ''}
                  </Text>
                </View>
                {status && <Pill label={DUES_STATUS_LABELS[status]} tone={STATUS_TONES[status]} />}
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </Backdrop>
  )
}
