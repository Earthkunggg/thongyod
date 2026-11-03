import { Link } from 'react-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { buttonVariants } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <>
      <PageHeader title="ไม่เจอหน้านี้" subtitle="ลิงก์อาจผิด หรือหน้านี้ถูกย้ายไปแล้ว" />
      <div className="px-4 pt-2">
        <Link to="/" className={buttonVariants()}>
          กลับหน้าหลัก
        </Link>
      </div>
    </>
  )
}
