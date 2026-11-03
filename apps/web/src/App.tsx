import { Button } from '@/components/ui/button'

// Temporary test page: checks that Tailwind CSS and shadcn/ui work.
// Will be replaced by the real app shell (bottom tabs + Home).
function App() {
  return (
    <main className="min-h-dvh bg-neutral-50 p-4">
      <h1 className="text-xl font-medium">Thongyod</h1>
      <p className="mt-1 text-sm text-neutral-500">Tailwind + shadcn/ui ทำงานแล้ว</p>
      <Button className="mt-4">ไป</Button>
    </main>
  )
}

export default App
