// Mukume Taiko Drummers, collected 8 Oct 2026.
// Copy is quoted or summarised from the club's own listings; images live in /public/clubs/taiko.
// The club does not publish a weekly practice time online, so none is shown here.
//
// Sources:
//   https://www.wgtn.ac.nz/recreation/clubs-and-societies/directory/mukume-taiko-drummers  (blurb, photos, contact)
//   https://events.humanitix.com/mukumetaikoheartbeat  (Heartbeat concert, 6 Oct 2024, Memorial Theatre)
//   https://events.humanitix.com/pride-taiko  (Loud and Proud workshop with UniQ, 15 Jul 2025, SU229)
//   https://www.youtube.com/@MukumeTaiko  (performance videos)

import type { ClubDesktopContent } from './types'

export const taikoDesktop: ClubDesktopContent = {
  slug: 'mukume-taiko',
  name: 'Mukume Taiko',
  fullName: 'Mukume Taiko Drummers',
  hello:
    'hello, we’re mukume taiko. japanese drumming out of vuw since 1994. loud, beginner-friendly, and we play all over wellington and the kāpiti coast.',
  meets: {
    line: 'weekly practice, beginner-friendly',
    room: 'Kelburn campus · day & time not published',
    caveat: 'the club doesn’t post its practice time online — message them on instagram or email · last checked oct 2026',
    directions:
      'Their recent workshops and concerts were in the Student Union Building on Kelburn Parade (SU229 and the Memorial Theatre).',
  },
  thisWeek: {
    subject: 'this week at mukume taiko: come and try the drums',
    lines: [
      'kia ora,',
      'practice is beginner-friendly: “no experience needed.” wear comfy clothes. it is loud.',
      'the club doesn’t publish a weekly time online, so dm them on instagram (@mukumetaiko) or email for this week’s practice.',
      'gigs come up around the region. recent ones were christmas at cedarwood, the paekākāriki christmas fête and a lunar new year show at viet hub.',
      'mukume taiko',
    ],
  },
  firstTime: [
    'no experience needed. practices are beginner-friendly.',
    'it’s loud. their own workshop listing warns it may not suit people with noise sensitivity.',
    'they play traditional and contemporary pieces taught by people from aotearoa and japan.',
    'going since 1994. the 30th-anniversary concert, heartbeat, was in the memorial theatre in october 2024.',
    'performances are around wellington and the kāpiti coast: markets, festivals, christmas events.',
    'they ran a free pride fest drumming workshop with uniq in su229.',
  ],
  watch: {
    file: 'heartbeat.mov',
    lead: 'their own recordings from recent gigs — four pieces (utsu hachijo, nicho, gaina, humiko) — plus the kāpiti council’s festival clip.',
  },
  quotesFile: 'in-their-words.txt',
  quotes: [
    {
      text: 'Energetic and vibrant, Taiko is an ancient form of Japanese drumming and a musical performing art.',
      by: 'mukume taiko, in the vuw clubs directory',
    },
    {
      text: 'Come join us for a beginner-friendly practice and learn to drum. No experience needed.',
      by: 'mukume taiko, in the vuw clubs directory',
    },
    {
      text: 'Since 1994, the Mukume Taiko Drummers have brought the rhythm of Japanese drumming to the Wellington Region.',
      by: 'mukume taiko, heartbeat concert listing',
    },
    {
      text: 'We play a mix of traditional and contemporary Taiko songs taught to us by people from both Aotearoa and Japan.',
      by: 'mukume taiko, in the vuw clubs directory',
    },
    {
      text: 'Feel the rhythm, feel the pride! No experience needed, just wear comfy clothes and get ready to learn something new.',
      by: 'loud and proud workshop, with uniq te herenga waka',
    },
  ],
  comingUp: [
    { name: 'Pride Fest taiko workshop (with UniQ)', when: 'july', where: 'SU229, Kelburn' },
    { name: 'Christmas at Cedarwood', when: 'early december' },
    { name: 'Paekākāriki Christmas Fête', when: 'mid december', where: 'Paekākāriki' },
    { name: 'Lunar New Year, Viet Hub', when: 'january' },
    { name: 'Kāpiti Multicultural Festival', when: 'date varies', where: 'Kāpiti Coast' },
  ],
  comingUpNote: 'these are where they played in 2024–25. this year’s gigs go up on instagram.',
  sayHiNote: 'no practice time online yet, so instagram dm is the way in. tell them you’re a beginner.',
  contact: {
    email: 'mukumetaikovuw@gmail.com',
    website: 'https://www.youtube.com/@MukumeTaiko',
    facebook: 'https://www.facebook.com/mukumetaiko/',
    instagram: 'https://www.instagram.com/mukumetaiko/',
    instagramHandle: '@mukumetaiko',
  },
  logo: '/clubs/taiko/badge.png',
  sticker: { src: '/clubs/taiko/badge.png', alt: 'Mukume Taiko badge' },
  poster: { src: '/clubs/taiko/poster-heartbeat-2024.jpg', alt: 'Heartbeat: a concert for our 30th anniversary, 6 October 2024' },
  photos: [
    { src: '/clubs/taiko/arms-up.jpg', alt: 'Drummers with arms raised over the drums' },
    { src: '/clubs/taiko/market-day.jpg', alt: 'Performing at a market day in front of a crowd' },
    { src: '/clubs/taiko/team.jpg', alt: 'The team posing behind their drums' },
    { src: '/clubs/taiko/lawn-drums.jpg', alt: 'Drumming on a lawn in red and black' },
    { src: '/clubs/taiko/crowd.jpg', alt: 'Drummers mid-stroke with the audience behind' },
    { src: '/clubs/taiko/kapiti-festival.jpg', alt: 'Playing on the grass at the Kāpiti Multicultural Festival' },
    { src: '/clubs/taiko/paekakariki-gaina.jpg', alt: 'Playing Gaina at the Paekākāriki Christmas Fête' },
    { src: '/clubs/taiko/cedarwood-nicho.jpg', alt: 'Nicho at Christmas at Cedarwood, 2024' },
    { src: '/clubs/taiko/lunar-new-year-humiko.jpg', alt: 'Humiko at the Viet Hub Lunar New Year, 2025' },
  ],
  videos: [
    { youtubeId: 'iAjr8BynJYA', title: 'Utsu Hachijo — Christmas at Cedarwood, Dec 2024', file: 'utsu-hachijo.mov', duration: '3:29', credit: 'Mukume Taiko Drummers' },
    { youtubeId: 'IXzzHogjsN8', title: 'Gaina — Paekākāriki Christmas Fête, Dec 2024', file: 'gaina.mov', duration: '3:45', credit: 'Mukume Taiko Drummers' },
    { youtubeId: 'Z-D5KYqsEIc', title: 'Nicho — Christmas at Cedarwood, Dec 2024', file: 'nicho.mov', duration: '3:22', credit: 'Mukume Taiko Drummers' },
    { youtubeId: '4_qhlo8w3Rk', title: 'Humiko — Viet Hub Lunar New Year, Jan 2025', file: 'humiko.mov', duration: '4:01', credit: 'Mukume Taiko Drummers' },
    { youtubeId: '55s80pkSRwo', title: 'Mukume Taiko at the Kāpiti Multicultural Festival', file: 'kapiti-festival.mov', duration: '1:46', credit: 'Kāpiti Coast District Council' },
  ],
}
