// Thai UI text (default language). Every user-facing string lives here or in en.ts.
// Rule: never write UI text directly in components; add a key here and use t('key').
// en.ts must have exactly the same keys (TypeScript checks this).
export const th = {
  nav: {
    label: 'เมนูหลัก',
    home: 'หน้าหลัก',
    gangs: 'แก๊ง',
    explore: 'ทำอะไรดี',
    pet: 'น้อง',
    me: 'ฉัน',
  },
  common: {
    underConstruction: 'หน้านี้กำลังสร้าง',
    back: 'ย้อนกลับ',
    notifications: 'การแจ้งเตือน',
    backHome: 'กลับหน้าหลัก',
  },
  time: {
    // Weekday short names, Sunday first (matches Date.getDay()).
    weekdaysShort: 'อา,จ,อ,พ,พฤ,ศ,ส',
    today: 'วันนี้',
    todaySuffix: ' (วันนี้)',
    tomorrow: 'พรุ่งนี้',
    inMinutes: 'อีก {{count}} นาที',
    inHours: 'อีก {{count}} ชม.',
    inDays: 'อีก {{count}} วัน',
    justNow: 'เมื่อกี้',
    minutesAgo: '{{count}} นาที',
    hoursAgo: '{{count}} ชม.',
    daysAgo: '{{count}} วัน',
    closesAt: 'ปิด {{when}}',
  },
  money: {
    baht: '{{amount}} บาท',
  },
  meetup: {
    going: 'ไป',
    maybe: 'อาจจะ',
    notGoing: 'ไม่ไป',
    respondTo: 'ตอบรับนัด {{title}}',
    countsShort: 'ไป {{going}} อาจจะ {{maybe}}',
  },
  home: {
    subtitle: 'สัปดาห์นี้มี {{count}} นัด',
    thisWeek: 'สัปดาห์นี้',
    hasMeetup: ' มีนัด',
    nextMeetup: 'นัดถัดไป',
    noMeetupOnDay: '{{day}} ยังไม่มีนัด',
    pendingTitle: 'รอคุณอยู่ {{count}} เรื่อง',
    friendsUpdates: 'อัปเดตจากเพื่อน',
  },
  pending: {
    voteTime: 'โหวตเวลา',
    voteRestaurant: 'โหวตร้าน',
    payBill: 'จ่ายให้{{name}} {{amount}}',
    confirmPayment: '{{name}}โอนให้ {{amount}} รอคุณยืนยัน',
  },
  feed: {
    meetupCreated: '{{name}} ตั้งนัด "{{subject}}"',
    titleEarned: '{{name}} ได้ฉายา "{{subject}}"',
    billPaid: '{{name}} จ่าย{{subject}}แล้ว',
  },
  pet: {
    defaultName: 'แมวก้อน',
    luckyColorToday: 'สีมงคลวันนี้',
    moods: {
      happy: 'อารมณ์ดี',
      normal: 'ปกติดี',
      missing_you: 'คิดถึงนิดๆ',
      sulking: 'งอนนิดๆ',
      wilting: 'เหี่ยวๆ',
    },
    hints: {
      play: 'แตะเพื่อไปเล่นด้วย',
      visit: 'แตะเพื่อไปหา',
      makeUp: 'แตะเพื่อไปง้อ',
    },
  },
  explore: {
    withFriends: 'กับเพื่อน',
    solo: 'คนเดียว',
    soon: 'เร็วๆ นี้',
    lockedSuffix: ' (เร็วๆ นี้)',
  },
  tools: {
    createMeetup: { title: 'ชวนนัด', desc: 'ตั้งนัด โหวตเวลา แชร์ลง LINE' },
    quickVote: { title: 'โหวตด่วน', desc: 'เครื่องเดียวก็โหวตได้' },
    restaurantVote: { title: 'ห้องโหวตร้าน', desc: 'ให้แก๊งช่วยเลือก' },
    splitBill: { title: 'หารบิล', desc: 'ทำ QR ให้ทุกคน' },
    randomRestaurant: { title: 'สุ่มร้าน', desc: 'หิวแต่คิดไม่ออก' },
    playPet: { title: 'เล่นกับน้อง', desc: 'ป้อนขนม ลูบหัว' },
    luckyColor: { title: 'สีมงคลวันนี้', desc: 'ดูเพื่อความบันเทิง' },
    myMeetups: { title: 'นัดของฉัน', desc: 'ทุกนัดในที่เดียว' },
    gradeCalculator: { title: 'คำนวณเกรด', desc: 'เกรดเทอมและ GPAX' },
    focusTimer: { title: 'จับเวลาอ่านหนังสือ', desc: 'อ่านไปพร้อมเพื่อน' },
    flashcards: { title: 'แฟลชการ์ด', desc: 'ทวนก่อนสอบ' },
  },
  colors: {
    red: 'แดง',
    orange: 'ส้ม',
    yellow: 'เหลือง',
    green: 'เขียว',
    blue: 'ฟ้า',
    purple: 'ม่วง',
    pink: 'ชมพู',
    black: 'ดำ',
    white: 'ขาว',
    gray: 'เทา',
  },
  pages: {
    gangs: { title: 'แก๊ง', placeholder: 'รายชื่อแก๊งจะอยู่ตรงนี้ (M1)' },
    explore: {
      title: 'ทำอะไรดี',
      subtitle: 'เลือกได้ทั้งทำกับเพื่อนและทำคนเดียว',
    },
    pet: { title: 'น้อง', placeholder: 'ห้องของแมวก้อน (M5)' },
    me: {
      title: 'ฉัน',
      subtitle: 'โปรไฟล์และการตั้งค่า',
      theme: 'ธีม',
      themeHint: 'โหมดสว่าง/มืดเปลี่ยนตามเครื่องอัตโนมัติ',
      chooseTheme: 'เลือกธีม',
      themeDefault: 'ค่าเริ่มต้น',
      themeCute: 'น่ารัก',
      language: 'ภาษา',
      chooseLanguage: 'เลือกภาษา',
    },
    notFound: { title: 'ไม่เจอหน้านี้', subtitle: 'ลิงก์อาจผิด หรือหน้านี้ถูกย้ายไปแล้ว' },
  },
}

/** Same shape as `th`, every value a string. */
export type Messages = typeof th
