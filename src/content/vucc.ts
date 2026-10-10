// VUCC (Victoria University Canoe Club), collected 8 Oct 2026.
// Copy is quoted or summarised from the club's own pages; images live in /public/clubs/vucc.
//
// Sources:
//   https://www.wgtn.ac.nz/recreation/clubs-and-societies/directory/victoria-uni-canoe-club  (pool session, photos, contact)
//   https://vucc.nz/  (river gauges + safety note)
//   https://homepages.ecs.vuw.ac.nz/~duncan/vucc/about.html  (older club site)
//   https://www.youtube.com/channel/UCEVGnk-KDP1gjB0Ds7yaOIQ  (videos and their descriptions)

import type { ClubDesktopContent } from './types'

export const vuccDesktop: ClubDesktopContent = {
  slug: 'vucc',
  name: 'VUCC',
  fullName: 'Victoria University Canoe Club',
  hello:
    'hello, we’re vucc. white-water kayaking out of wellington. pool sessions on thursdays, rivers on the weekend. open to everyone, not just students.',
  meets: {
    line: 'thursdays 7:45pm',
    room: 'Freyberg Pool, Oriental Parade',
    caveat: 'pool sessions run during the university year · last checked oct 2026',
    directions:
      'Freyberg Pool is on Oriental Parade on the waterfront. The weekly pool session is where beginners start.',
  },
  thisWeek: {
    subject: 'this week at vucc: thursday pool session',
    lines: [
      'kia ora paddlers,',
      'pool session thursday 7:45pm at freyberg. new to kayaking? this is where you start — “we’ll get you ready to send it down a river in no time.”',
      'river trips depend on flow. the club site has live river gauges for the region, so check before you plan anything.',
      'beginners trips run on the hutt river, usually from the akatarawa confluence down to maoribank.',
      'see you in the pool,',
      'the vucc committee',
    ],
  },
  firstTime: [
    'start at the thursday pool session at freyberg pool. that’s where they teach you.',
    'open to students and non-students alike.',
    'beginners trips are on the hutt river. the club also surfs kayaks at lyall bay.',
    'the local grade 3 run is the hutt gorge, from kaitoke regional park down to te marua.',
    'the club celebrated its 40th anniversary in 2020 with a run of the mangahao white water park.',
    'the river gauges on their site are a guide only. never paddle a river alone.',
  ],
  watch: {
    file: 'beginners-trip.mov',
    lead: 'all shot by the club. watch the beginners trips first — that’s what your first weekend on the river looks like.',
  },
  quotesFile: 'in-their-words.txt',
  quotes: [
    {
      text: 'VUCC is a kayak and canoe club based at Victoria University of Wellington, but is open to everyone, students and non-students alike.',
      by: 'vucc, in the vuw clubs directory',
    },
    {
      text: 'We are a white-water kayak club, spending our time chucking boats down the Hutt Gorge or having a cheeky kayak surf at Lyall Bay.',
      by: 'vucc, in the vuw clubs directory',
    },
    {
      text: 'Lots of sun, and some paddling fun on the Hutt River for this year’s beginners trip.',
      by: 'vucc, 2021 beginners trip video',
    },
    {
      text: 'Do not paddle a river alone, make sure that you tell a friend or family member of your trip details, only paddle a river within your capabilities.',
      by: 'vucc, river gauges page',
    },
    {
      text: 'In other words, we encourage people to get out and paddle!',
      by: 'vucc, club site',
    },
  ],
  comingUp: [
    { name: 'Pool session', when: 'every thursday 7:45pm', where: 'Freyberg Pool' },
    { name: 'Beginners Trip', when: 'march', where: 'Hutt River, Akatarawa confluence to Maoribank' },
    { name: 'Waitangi weekend trip', when: 'waitangi weekend, february', where: 'Tongariro, Whangaehu and Waihohonu rivers' },
    { name: 'Hutt Gorge runs', when: 'when the river is up', where: 'Kaitoke to Te Marua' },
    { name: 'River Valley trip', when: 'november', where: 'River Valley Lodge, Rangitīkei' },
  ],
  comingUpNote: 'worked out from the club’s trip videos (2019–2022). ask them for this year’s dates.',
  sayHiNote: 'their youtube channel is the best preview. or just turn up on a thursday night.',
  contact: {
    email: 'admin@vucc.nz',
    website: 'https://vucc.nz/',
    facebook: 'https://www.facebook.com/vucc.nz',
    instagram: 'https://www.instagram.com/vucc_nz/',
    instagramHandle: '@vucc_nz',
  },
  logo: '/clubs/vucc/badge.png',
  sticker: { src: '/clubs/vucc/badge.png', alt: 'VUCC badge' },
  poster: { src: '/clubs/vucc/40th-mangahao.jpg', alt: 'VUCC 40th anniversary run of the Mangahao White Water Park' },
  photos: [
    { src: '/clubs/vucc/whitewater.jpg', alt: 'A yellow kayak punching through white water' },
    { src: '/clubs/vucc/drop.jpg', alt: 'A kayaker dropping into a rapid between boulders' },
    { src: '/clubs/vucc/boats-on-the-bank.jpg', alt: 'A row of colourful kayaks lined up in the shallows' },
    { src: '/clubs/vucc/gear-up.jpg', alt: 'Members in helmets gearing up beside the rafts' },
    { src: '/clubs/vucc/beginners-2022.jpg', alt: 'Beginners spread along the Hutt River, seen from above' },
    { src: '/clubs/vucc/beginners-2021.jpg', alt: 'Paddlers sitting in their boats on the gravel, 2021 beginners trip' },
    { src: '/clubs/vucc/hutt-gorge.jpg', alt: 'A paddler in red on the Hutt Gorge' },
    { src: '/clubs/vucc/waitangi-2020.jpg', alt: 'Looking over a drop on the Tongariro, Waitangi weekend 2020' },
  ],
  videos: [
    { youtubeId: 'IdiUpbTKyjE', title: 'VUCC Beginners Trip, March 2022', file: 'beginners-2022.mov', duration: '3:27', credit: 'Victoria University Canoe Club' },
    { youtubeId: 'YZNyLb_YWo8', title: '2021 Beginners Trip, Hutt River', file: 'beginners-2021.mov', duration: '3:55', credit: 'Victoria University Canoe Club' },
    { youtubeId: 'wYTiS_Aj3c0', title: 'VUCC 40th Anniversary, Mangahao', file: '40th-anniversary.mov', duration: '3:56', credit: 'Victoria University Canoe Club' },
    { youtubeId: 'TkKeTas0L5k', title: 'Hutt Gorge, October 2019', file: 'hutt-gorge.mov', duration: '11:57', credit: 'Victoria University Canoe Club' },
    { youtubeId: 'wY8tiTsUnnw', title: 'Highlights, Waitangi weekend 2020', file: 'waitangi-2020.mov', duration: '6:18', credit: 'Victoria University Canoe Club' },
  ],
}
