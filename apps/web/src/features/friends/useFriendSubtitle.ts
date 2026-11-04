import { useTranslation } from 'react-i18next'

/** Builds "@ploy.mu · สายมู · เพื่อนร่วมกัน 2 คน"; empty parts are skipped. Handle first: names may repeat (#45). */
export function useFriendSubtitle() {
  const { t } = useTranslation()
  return (handle: string | null, title: string | null, mutualFriends = 0) =>
    [handle ? `@${handle}` : null, title, mutualFriends > 0 ? t('friends.mutual', { count: mutualFriends }) : null]
      .filter(Boolean)
      .join(' · ') || undefined
}
