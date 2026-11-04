import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/layout/PageHeader'
import { markDone } from '@/features/daily/daily'
import { HandoffScreen } from '@/features/quick-vote/HandoffScreen'
import { createSession, quickVoteReducer, type QuickVoteAction, type QuickVoteSession } from '@/features/quick-vote/logic'
import { ResultView } from '@/features/quick-vote/ResultView'
import { SetupForm } from '@/features/quick-vote/SetupForm'
import { loadSession, saveSession } from '@/features/quick-vote/storage'
import { TieDialog } from '@/features/quick-vote/TieDialog'
import { VoteScreen } from '@/features/quick-vote/VoteScreen'

// Quick vote on one phone: setup -> (vote -> cover) x N -> result (-> tie dialog).
export function QuickVotePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [session, setSession] = useState<QuickVoteSession | null>(loadSession)

  useEffect(() => saveSession(session), [session])

  const dispatch = (action: QuickVoteAction) => setSession((s) => (s ? quickVoteReducer(s, action) : s))

  return (
    <>
      <PageHeader
        title={t('quickVote.setupTitle')}
        subtitle={session ? undefined : t('quickVote.setupSubtitle')}
        backTo="/explore"
      />

      {!session && (
        <SetupForm
          onStart={(setup) => {
            setSession(createSession(setup))
            markDone('tool')
          }}
        />
      )}

      {session?.phase === 'voting' && (
        // key: a fresh screen (no leftover ticks) for every voter
        <VoteScreen
          key={`${session.round}-${session.ballots.length}`}
          session={session}
          onVote={(choices) => dispatch({ type: 'vote', choices })}
        />
      )}

      {session?.phase === 'handoff' && (
        <HandoffScreen
          session={session}
          onNext={() => dispatch({ type: 'next' })}
          onUndo={() => dispatch({ type: 'undo' })}
          onCloseNow={() => dispatch({ type: 'closeEarly' })}
        />
      )}

      {(session?.phase === 'result' || session?.phase === 'decided') && (
        <ResultView session={session} onNewVote={() => setSession(null)} onDone={() => void navigate('/explore')} />
      )}

      {session?.phase === 'result' && (
        <TieDialog
          session={session}
          onRandom={() => dispatch({ type: 'pickRandom' })}
          onRunoff={() => dispatch({ type: 'runoff' })}
          onManual={(index) => dispatch({ type: 'pickManual', index })}
        />
      )}
    </>
  )
}
