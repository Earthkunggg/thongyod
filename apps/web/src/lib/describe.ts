// Turns API data (kind + fields) into text in the current UI language.
// The API never sends UI sentences (see packages/shared/src/home.ts).
import type { FeedItem, PendingItem } from '@thongyod/shared'
import i18n from '@/i18n'
import { formatDayLabel, formatTime } from './date'
import { formatBaht } from './money'

export function pendingTitle(item: PendingItem): string {
  const amount = item.amountSatang !== undefined ? formatBaht(item.amountSatang) : ''
  const name = item.counterpartName ?? ''
  switch (item.kind) {
    case 'vote_time':
      return i18n.t('pending.voteTime')
    case 'vote_restaurant':
      return i18n.t('pending.voteRestaurant')
    case 'pay_bill':
      return i18n.t('pending.payBill', { name, amount })
    case 'confirm_payment':
      return i18n.t('pending.confirmPayment', { name, amount })
  }
}

export function pendingSubtitle(item: PendingItem, now: Date): string {
  const parts = [item.gangName, item.subject]
  if (item.dueAt) {
    const due = new Date(item.dueAt)
    parts.push(i18n.t('time.closesAt', { when: `${formatDayLabel(due, now)} ${formatTime(due)}` }))
  }
  return parts.join(' · ')
}

export function feedText(item: FeedItem): string {
  const values = { name: item.actorName, subject: item.subject }
  switch (item.kind) {
    case 'meetup_created':
      return i18n.t('feed.meetupCreated', values)
    case 'title_earned':
      return i18n.t('feed.titleEarned', values)
    case 'bill_paid':
      return i18n.t('feed.billPaid', values)
  }
}
