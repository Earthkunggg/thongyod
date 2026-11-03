// Temporary body for pages that are not built yet. Remove when the page is real.
export function Placeholder({ text }: { text: string }) {
  return (
    <div className="mx-4 mt-4 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  )
}
