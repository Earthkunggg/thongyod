import type { Budget, Category } from '@/features/restaurants/logic'

/** Made-up places so a new user can try สุ่มร้าน right away (clearly named as samples in the UI). */
export const SAMPLE_RESTAURANTS: ReadonlyArray<{ name: string; category: Category; budget: Budget | null }> = [
  { name: 'ตามสั่งหน้าหอ', category: 'tamsang', budget: 'le60' },
  { name: 'ก๋วยเตี๋ยวเรือริมคลอง', category: 'noodles', budget: 'le60' },
  { name: 'ข้าวมันไก่ประตูหลัง', category: 'chickenRice', budget: 'le60' },
  { name: 'ส้มตำซอยสาม', category: 'somtam', budget: 'b61to150' },
  { name: 'หมูกระทะบุฟเฟต์ตลาดเย็น', category: 'mookata', budget: 'b151to300' },
  { name: 'ชาบูสายพาน', category: 'shabu', budget: 'b151to300' },
  { name: 'คาเฟ่ต้นไม้', category: 'cafe', budget: 'b61to150' },
  { name: 'บิงซูหลังมอ', category: 'dessert', budget: null },
]
