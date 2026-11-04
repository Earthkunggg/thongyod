import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/layout/PageHeader'
import { WORD_PACKS, wordPack } from '@/config/wordPacks'
import { markDone } from '@/features/daily/daily'
import { MIX_PACK, pickWords, score, toggleAnswer, type Answer } from '@/features/heads-up/logic'
import { PlayScreen } from '@/features/heads-up/PlayScreen'
import { ResultScreen } from '@/features/heads-up/ResultScreen'
import { SetupScreen } from '@/features/heads-up/SetupScreen'
import { loadHeadsUp, saveHeadsUp, type HeadsUpSaved } from '@/features/heads-up/storage'
import { enterLandscape, leaveLandscape, requestTiltPermission, tiltSupport, type TiltSupport } from '@/features/heads-up/useTilt'
import { celebrate } from '@/lib/celebrate'
import { appUrl } from '@/lib/share'
import { unlockSound } from '@/lib/sound'

type Stage = 'setup' | 'play' | 'result'

// /head-guess — ใบ้บนหัว (UX_GUIDELINES §4, our own name and word packs). One phone, played in a group.
export function HeadsUpPage() {
  const { t } = useTranslation()
  const [saved, setSaved] = useState<HeadsUpSaved>(loadHeadsUp)
  const [tilt, setTilt] = useState<TiltSupport>(tiltSupport)
  const [stage, setStage] = useState<Stage>('setup')
  const [words, setWords] = useState<string[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [isBest, setIsBest] = useState(false)
  const [round, setRound] = useState(0)
  /** Words already shown in this visit: no repeats until the pack runs out. */
  const used = useRef(new Set<string>())

  useEffect(() => saveHeadsUp(saved), [saved])
  useEffect(() => () => leaveLandscape(), [])

  const packName = saved.pack === MIX_PACK ? t('headsUp.mix.name') : t(`headsUp.packs.${(wordPack(saved.pack)?.id ?? 'food') as 'food'}.name`)

  async function start() {
    // Everything here runs inside the tap: audio unlock, iOS motion permission, fullscreen.
    unlockSound()
    let support = tilt
    if (saved.useTilt && support === 'needs-permission') {
      support = await requestTiltPermission()
      setTilt(support)
    }
    void enterLandscape()
    const source = saved.pack === MIX_PACK ? WORD_PACKS.flatMap((p) => p.words) : (wordPack(saved.pack) ?? WORD_PACKS[0]).words
    const list = pickWords(source, used.current)
    setWords(list)
    setAnswers([])
    setRound((r) => r + 1)
    setStage('play')
    markDone('tool')
  }

  function finish(list: Answer[]) {
    leaveLandscape()
    for (const a of list) used.current.add(a.word)
    setAnswers(list)
    const total = score(list)
    const best = saved.best[saved.pack] ?? 0
    const beaten = total > best
    setIsBest(beaten)
    if (beaten) {
      setSaved((s) => ({ ...s, best: { ...s.best, [s.pack]: total } }))
      celebrate()
    }
    setStage('result')
  }

  function toggle(index: number) {
    const next = toggleAnswer(answers, index)
    setAnswers(next)
    const total = score(next)
    if (total > (saved.best[saved.pack] ?? 0)) {
      setSaved((s) => ({ ...s, best: { ...s.best, [s.pack]: total } }))
      setIsBest(true)
    }
  }

  return (
    <>
      <PageHeader title={t('headsUp.title')} subtitle={stage === 'setup' ? t('headsUp.subtitle') : undefined} backTo="/explore" />
      {stage === 'setup' && <SetupScreen saved={saved} onChange={setSaved} tilt={tilt} onStart={() => void start()} />}
      {stage === 'play' && (
        <PlayScreen
          key={round}
          words={words}
          seconds={saved.seconds}
          useTilt={saved.useTilt && tilt === 'on'}
          inverted={saved.inverted}
          sound={saved.sound}
          onFinish={finish}
        />
      )}
      {stage === 'result' && (
        <ResultScreen
          answers={answers}
          score={score(answers)}
          packName={packName}
          isBest={isBest}
          shareUrl={appUrl('/head-guess')}
          onToggle={toggle}
          onAgain={() => void start()}
          onChangePack={() => setStage('setup')}
        />
      )}
    </>
  )
}
