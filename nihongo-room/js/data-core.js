/* Nihongo Room — ค่าตั้งต้น: ธีม คำศัพท์ประจำฤดู ชื่อของในห้อง */
window.NR_CORE = {
  version: 1,
  pixel: { w: 320, h: 212 },          // ขนาดภาพห้องจริง (พิกเซล) ก่อนขยาย
  themes: {
    sakura: {
      name: 'ซากุระ', icon: '🌸', fx: 'petal',
      ui: { bg1: '#ffe1ee', bg2: '#e9ddff', dot: '#ffffff', panel: '#fff6fa', bar1: '#ffb8d4', bar2: '#c9b4ff', ink: '#4a2440', inkSoft: '#7a4b6c', accent: '#e05a92' },
      room: { wall: '#fbe3ec', wallSh: '#efc8d8', trim: '#d98fb0', floor: '#efd3b8', floorSh: '#dfbb98', slab: '#c79a78', wood: '#d7a07b', wood2: '#b97c58',
        accent: '#f59ab8', accent2: '#b9a2e8', rug: '#cdbaf5', rug2: '#ab95e6', sky: '#d4ecff', sky2: '#ffffff', leaf: '#f7a8c6', leaf2: '#fbd0e0', brick: '#e3a493', fire: true, night: false }
    },
    spring: {
      name: 'ใบไม้ผลิ', icon: '🌿', fx: 'leaf',
      ui: { bg1: '#dcf7ec', bg2: '#ddefff', dot: '#ffffff', panel: '#f6fffb', bar1: '#9fe3c7', bar2: '#a8d8ff', ink: '#1f4436', inkSoft: '#3f6b5a', accent: '#2f9e74' },
      room: { wall: '#e6f7ee', wallSh: '#cdebdc', trim: '#7cc7a4', floor: '#f3e5c2', floorSh: '#e2cd9f', slab: '#c4a674', wood: '#d3ae7a', wood2: '#b28a55',
        accent: '#86d6b4', accent2: '#9fd0f5', rug: '#fff1b8', rug2: '#f2d97c', sky: '#bfe6ff', sky2: '#ffffff', leaf: '#7fcf6e', leaf2: '#b5e6a3', brick: '#e6b8a0', fire: false, night: false }
    },
    autumn: {
      name: 'ใบไม้ร่วง', icon: '🍁', fx: 'maple',
      ui: { bg1: '#ffe5d2', bg2: '#fff3dc', dot: '#ffffff', panel: '#fffaf3', bar1: '#ffb98f', bar2: '#f3d08a', ink: '#4f2a14', inkSoft: '#7b4d2e', accent: '#c4581f' },
      room: { wall: '#fde8d4', wallSh: '#f2cfb0', trim: '#d98d5f', floor: '#dcae84', floorSh: '#c99468', slab: '#9f6c45', wood: '#a96b42', wood2: '#87512f',
        accent: '#f2a074', accent2: '#e8c27a', rug: '#ea9563', rug2: '#cf7445', sky: '#ffd9b0', sky2: '#fff3e0', leaf: '#ee7d3a', leaf2: '#f6b14a', brick: '#d0806a', fire: true, night: false }
    },
    christmas: {
      name: 'คริสต์มาส', icon: '🎄', fx: 'snow',
      ui: { bg1: '#e3f1ff', bg2: '#fbe4ea', dot: '#ffffff', panel: '#fffaf6', bar1: '#f08a9a', bar2: '#8fd0b5', ink: '#43161f', inkSoft: '#6d3a45', accent: '#c23650' },
      room: { wall: '#f7ebdc', wallSh: '#ead6bf', trim: '#c95a68', floor: '#cfa07a', floorSh: '#b98a63', slab: '#8a5c3d', wood: '#94603f', wood2: '#734528',
        accent: '#d6455d', accent2: '#3f8f6b', rug: '#4f9e79', rug2: '#357a5a', sky: '#2c3e6b', sky2: '#ffffff', leaf: '#2f7a55', leaf2: '#4f9e79', brick: '#c8735f', fire: true, night: true }
    }
  },
  seasonal: {
    sakura: [{ jp: '桜', kana: 'さくら', th: 'ดอกซากุระ' }, { jp: '花見', kana: 'はなみ', th: 'ชมดอกไม้' }],
    spring: [{ jp: '春', kana: 'はる', th: 'ฤดูใบไม้ผลิ' }, { jp: '新緑', kana: 'しんりょく', th: 'ใบไม้ผลิใหม่' }],
    autumn: [{ jp: '紅葉', kana: 'こうよう', th: 'ใบไม้เปลี่ยนสี' }, { jp: '秋', kana: 'あき', th: 'ฤดูใบไม้ร่วง' }],
    christmas: [{ jp: '雪', kana: 'ゆき', th: 'หิมะ' }, { jp: '冬', kana: 'ふゆ', th: 'ฤดูหนาว' }]
  },
  objects: {
    shelf: { th: 'ชั้นหนังสือ · เลือกบทเรียน', jp: 'ほんだな' },
    armchair: { th: 'อาร์มแชร์ · ไวยากรณ์', jp: 'いす' },
    table: { th: 'กล่องการ์ด · แฟลชการ์ด', jp: 'カード' },
    wreath: { th: 'พวงหรีด · คันจิ', jp: 'かんじ' },
    headphones: { th: 'หูฟัง · ฟังและพูดตาม', jp: 'ヘッドホン' },
    windowR: { th: 'หน้าต่างขวา · แพลนเนอร์', jp: 'まど' },
    fireplace: { th: 'เตาผิง · กลางวัน/กลางคืน', jp: 'だんろ' },
    tree: { th: 'ต้นไม้ · จับเวลาโพโมโดโร่', jp: 'き' },
    cat: { th: 'แมว · ลูบแมว', jp: 'ねこ' },
    windowL: { th: 'หน้าต่างซ้าย · คำศัพท์ประจำฤดู', jp: 'まど' },
    corner: { th: 'ของมุมห้อง', jp: '' },
    garland: { th: 'ไฟประดับ', jp: 'かざり' }
  },
  lessons: [
    { n: 1, th: 'แนะนำตัว', jp: 'はじめまして' }, { n: 2, th: 'นี่คืออะไร', jp: 'これは 何ですか' },
    { n: 3, th: 'สถานที่และราคา', jp: 'ここは どこですか' }, { n: 4, th: 'เวลาและกิจวัตร', jp: '今 何時ですか' },
    { n: 5, th: 'ไป มา กลับ', jp: 'どこへ 行きますか' }, { n: 6, th: 'กิน ดื่ม และชวน', jp: 'いっしょに 食べませんか' },
    { n: 7, th: 'ให้และได้รับ', jp: 'あげます・もらいます' }, { n: 8, th: 'คำคุณศัพท์', jp: 'きれいな 町ですね' },
    { n: 9, th: 'ชอบ เก่ง เข้าใจ', jp: '好きですか' }, { n: 10, th: 'มีอะไร อยู่ที่ไหน', jp: 'あります・います' },
    { n: 11, th: 'การนับและระยะเวลา', jp: 'いくつ ありますか' }, { n: 12, th: 'อดีตและการเปรียบเทียบ', jp: 'どちらが 好きですか' }
  ]
};
