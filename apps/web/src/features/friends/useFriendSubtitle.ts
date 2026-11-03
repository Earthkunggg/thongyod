import { useTranslation } from 'react-i18next'

/** Builds "สายมู · เพื่อนร่วมกัน 2 คน"; empty parts are skipped. */
export function useFriendSubtitle() {
  const { t } = useTranslation()
  return (title: string | null, mutualFriends: number) =>
    [title, mutualFriends > 0 ? t('friends.mutual', { count: mutualFriends }) : null].filter(Boolean).join(' · ') ||
    undefined
}
