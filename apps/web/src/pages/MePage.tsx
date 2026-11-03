import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { getTheme, setTheme, type Theme } from '@/lib/theme'

const THEMES: { value: Theme; label: string }[] = [
  { value: 'default', label: 'ค่าเริ่มต้น' },
  { value: 'cute', label: 'น่ารัก' },
]

export function MePage() {
  const [theme, setThemeState] = useState<Theme>(getTheme)

  function chooseTheme(next: Theme) {
    setTheme(next)
    setThemeState(next)
  }

  return (
    <>
      <PageHeader title="ฉัน" subtitle="โปรไฟล์และการตั้งค่า" />
      <section className="px-4 pt-2">
        <h2 className="mb-1 text-sm font-medium">ธีม</h2>
        <p className="mb-2 text-xs text-muted-foreground">โหมดสว่าง/มืดเปลี่ยนตามเครื่องอัตโนมัติ</p>
        <div className="flex gap-2" role="group" aria-label="เลือกธีม">
          {THEMES.map(({ value, label }) => (
            <Button
              key={value}
              className="flex-1"
              variant={theme === value ? 'default' : 'outline'}
              aria-pressed={theme === value}
              onClick={() => chooseTheme(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </section>
    </>
  )
}
