import { useState } from 'react'
import { CalendarPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getTheme, setTheme, type Theme } from '@/lib/theme'

// Temporary test page: checks fonts, both themes, and light/dark mode.
// Will be replaced by the real app shell (bottom tabs + Home).
function App() {
  const [theme, setThemeState] = useState<Theme>(getTheme)

  function chooseTheme(next: Theme) {
    setTheme(next)
    setThemeState(next)
  }

  return (
    <main className="mx-auto min-h-dvh max-w-md bg-background p-4">
      <h1 className="text-2xl font-medium">ทองหยอด</h1>
      <p className="text-sm text-muted-foreground">
        หน้าทดสอบธีม · โหมดสว่าง/มืดเปลี่ยนตามเครื่อง
      </p>

      <section className="mt-4">
        <h2 className="mb-2 text-sm font-medium">เลือกธีม</h2>
        <div className="flex gap-2">
          <Button
            className="flex-1"
            variant={theme === 'default' ? 'default' : 'outline'}
            onClick={() => chooseTheme('default')}
          >
            ค่าเริ่มต้น
          </Button>
          <Button
            className="flex-1"
            variant={theme === 'cute' ? 'default' : 'outline'}
            onClick={() => chooseTheme('cute')}
          >
            น่ารัก
          </Button>
        </div>
      </section>

      <section className="mt-4 rounded-xl border bg-card p-4 text-card-foreground">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">นัดถัดไป</span>
          <span className="rounded-md bg-accent px-2 text-xs font-medium text-accent-foreground">
            อีก 5 ชม.
          </span>
        </div>
        <h3 className="mt-1 text-base font-medium">หมูกระทะหลังสอบ</h3>
        <p className="text-sm text-muted-foreground">แก๊งคอม 66 · วันนี้ 18:00 · ไป 5 อาจจะ 2</p>
        <div className="mt-3 flex gap-2">
          <Button className="flex-1">ไป</Button>
          <Button className="flex-1" variant="outline">อาจจะ</Button>
          <Button className="flex-1" variant="outline">ไม่ไป</Button>
        </div>
      </section>

      <section className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary">
          <CalendarPlus data-icon="inline-start" />
          ชวนนัด
        </Button>
        <Button variant="ghost">ยกเลิก</Button>
        <Button variant="destructive">ลบ</Button>
      </section>
    </main>
  )
}

export default App
