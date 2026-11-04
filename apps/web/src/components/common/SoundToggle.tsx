import { useTranslation } from 'react-i18next'
import { Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { unlockSound } from '@/lib/sound'
import { setGameSound, useGameSound } from '@/lib/soundPrefs'

// 🔊 / 🔇 for a game screen's header (PageHeader action). Remembered per game on this device.
export function SoundToggle({ game }: { game: string }) {
  const { t } = useTranslation()
  const on = useGameSound(game)
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-pressed={on}
      aria-label={on ? t('common.soundOn') : t('common.soundOff')}
      onClick={() => {
        unlockSound()
        setGameSound(game, !on)
      }}
    >
      {on ? <Volume2 /> : <VolumeX />}
    </Button>
  )
}
