import { QRCodeSVG } from 'qrcode.react'

// QR code of a URL. Always black on white (in every theme) so phone cameras read it reliably.
// Library: qrcode.react (ISC).
export function QrCodeCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="mx-auto w-fit rounded-2xl bg-white p-4 shadow-sm">
      <QRCodeSVG value={value} size={208} level="M" marginSize={0} title={label} bgColor="#ffffff" fgColor="#000000" />
    </div>
  )
}
