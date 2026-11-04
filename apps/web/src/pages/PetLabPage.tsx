import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Moon, Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { LayeredPet, type LayeredPetHandle } from '@/components/pet/LayeredPet'
import { Pet } from '@/components/pet/Pet'
import { EXPRESSION_IDS, type Expression } from '@/components/pet/rigs/expressions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// /pet/lab — preview of the layered dragon (DECISIONS #67) for Earth to review before it replaces <Pet>.
export function PetLabPage() {
  const { t } = useTranslation()
  const pet = useRef<LayeredPetHandle>(null)
  const [expression, setExpression] = useState<Expression>('sulky')

  return (
    <div className="flex flex-col gap-4 pb-10">
      <PageHeader title={t('petLab.title')} subtitle={t('petLab.subtitle')} backTo="/pet" />
      <div className="flex justify-center px-4">
        <LayeredPet ref={pet} expression={expression} size={260} onTap={() => undefined} />
      </div>
      <p className="text-center text-xs text-muted-foreground">{t('petLab.hint')}</p>

      <section className="flex flex-col gap-2 px-3">
        <h2 className="px-1 text-sm font-medium">{t('petLab.expressions')}</h2>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('petLab.expressions')}>
          {EXPRESSION_IDS.map((id) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={expression === id}
              onClick={() => setExpression(id)}
              className={cn('min-h-9 rounded-full border px-3 text-sm', expression === id ? 'border-primary bg-primary text-primary-foreground' : 'bg-card')}
            >
              {t(`petLab.faces.${id}`)}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button variant="outline" onClick={() => pet.current?.react()}>
            <Sparkles data-icon="inline-start" />
            {t('petLab.react')}
          </Button>
          <Button variant="outline" onClick={() => pet.current?.sleep()}>
            <Moon data-icon="inline-start" />
            {t('petLab.sleep')}
          </Button>
        </div>
      </section>

      <Card className="mx-3 flex items-center gap-3 p-3">
        <Pet species="dragon" size={88} />
        <p className="text-xs text-muted-foreground">{t('petLab.compare')}</p>
      </Card>
    </div>
  )
}
