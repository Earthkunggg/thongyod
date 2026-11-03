import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ApiError } from '@/api/client'
import { useMe, useUpdateMe } from '@/api/profile'
import type { Me } from '@/api/types'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BIO_MAX, charCount, checkDisplayName, NAME_MAX, NAME_MIN } from '@/features/profile/validation'
import { showErrorToast, toastManager } from '@/lib/toast'

// /me/edit — change app name and short bio.
export function EditProfilePage() {
  const { t } = useTranslation()
  const me = useMe()

  return (
    <div className="flex flex-col gap-3 pb-6">
      <PageHeader title={t('profile.edit')} backTo="/me" />
      {me.isPending ? (
        <LoadingState rows={2} />
      ) : me.isError ? (
        <ErrorState onRetry={() => void me.refetch()} />
      ) : (
        <EditForm me={me.data} />
      )}
    </div>
  )
}

function EditForm({ me }: { me: Me }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const update = useUpdateMe()
  const [name, setName] = useState(me.displayName)
  const [bio, setBio] = useState(me.bio ?? '')
  const [serverNameError, setServerNameError] = useState<string | null>(null)

  const nameProblem = checkDisplayName(name)
  const nameError =
    serverNameError ??
    (nameProblem === 'too_short' || nameProblem === 'too_long'
      ? t('profile.errors.nameLength', { min: NAME_MIN, max: NAME_MAX })
      : nameProblem === 'bad_chars'
        ? t('profile.errors.nameChars')
        : null)
  const bioTooLong = charCount(bio.trim()) > BIO_MAX
  const changed = name.trim() !== me.displayName || bio.trim() !== (me.bio ?? '')

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (nameError || bioTooLong || !changed) return
    update.mutate(
      { displayName: name.trim(), bio: bio.trim() === '' ? null : bio.trim() },
      {
        onSuccess: () => {
          toastManager.add({ title: t('profile.saved') })
          void navigate('/me')
        },
        onError: (error) => {
          if (error instanceof ApiError && error.code === 'DISPLAY_NAME_TAKEN') setServerNameError(t('profile.errors.nameTaken'))
          else if (error instanceof ApiError && error.code === 'INVALID_DISPLAY_NAME') setServerNameError(t('profile.errors.nameChars'))
          else showErrorToast(t('common.saveError'))
        },
      },
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 px-4" noValidate>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('profile.name')}</span>
        <Input
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setServerNameError(null)
          }}
          aria-invalid={nameError ? true : undefined}
          aria-describedby="name-hint"
          autoComplete="nickname"
        />
        <span id="name-hint" className={nameError ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
          {nameError ?? t('profile.nameHint')}
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('profile.bio')}</span>
        <Input
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder={t('profile.bioPlaceholder')}
          aria-invalid={bioTooLong ? true : undefined}
          aria-describedby="bio-count"
        />
        <span id="bio-count" className={bioTooLong ? 'text-xs text-destructive' : 'text-right text-xs text-muted-foreground'}>
          {charCount(bio.trim())}/{BIO_MAX}
        </span>
      </label>

      <Button type="submit" size="lg" disabled={!changed || !!nameError || bioTooLong || update.isPending}>
        {t('profile.save')}
      </Button>
    </form>
  )
}
