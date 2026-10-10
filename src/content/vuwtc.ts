// VUWTC (Victoria University of Wellington Tramping Club), collected 8 Oct 2026.
// Copy is quoted or summarised from the club's own pages; images live in /public/clubs/vuwtc.
//
// Sources:
//   https://www.vuwtc.org.nz/  (meetings, membership, upcoming trips as of 8 Oct 2026)
//   https://www.vuwtc.org.nz/about/what-we-do
//   https://www.vuwtc.org.nz/about/vuwtc-trips
//   https://www.vuwtc.org.nz/contact/find-us
//   https://www.wgtn.ac.nz/recreation/clubs-and-societies/directory/tramping-club  (photos, contact)
//   https://www.youtube.com/@vuwtc1124  (videos)

import type { ClubDesktopContent } from './types'

export const vuwtcDesktop: ClubDesktopContent = {
  slug: 'vuwtc',
  name: 'VUWTC',
  fullName: 'Victoria University of Wellington Tramping Club',
  hello:
    'hello, we’re vuwtc. tramping, climbing and tacos since 1921. a trip every weekend, graded for every level, with club gear you can borrow.',
  meets: {
    line: 'tuesdays 6pm',
    room: 'Kelburn campus · room changes weekly',
    caveat: 'the room is posted on their facebook/instagram story each week · holidays: Welsh Dragon Bar, Cambridge Tce · last checked oct 2026',
    directions:
      'Trips usually leave at 5:30pm on Fridays from the Hunter carpark, round the back of the Hunter Building between Salamanca Road and Kelburn Parade.',
  },
  thisWeek: {
    subject: 'this week at vuwtc: bush rave (spooky edition) + agm',
    lines: [
      'kia ora trampers,',
      'meeting tuesday 6pm on kelburn campus. check the facebook or instagram story for the room.',
      'this weekend, 10–11 october: bush rave, spooky edition. no walking or skill required, just expect a blast.',
      'tuesday 13 october: agm 2026.',
      '14–16 october: te matawai mish, for tramps week.',
      'taco tuesday after the meeting as always. the flat is announced at the meeting.',
      'see you tuesday,',
      'the vuwtc committee',
    ],
  },
  firstTime: [
    'trips every weekend, graded for all levels. day walks round the wellington hills up to week-long trips in the southern alps.',
    'membership: $15 for six months ($20 non-students) or $20 a year ($30 non-students). it includes club gear, fmc membership and shop discounts.',
    'freshers is the first and biggest trip of the year. graded easy / social, the best way to meet people.',
    '“whether it’s your first night sleeping in the bush or you just summited aoraki, we have trips for your skill level.”',
    'trips leave 5:30pm fridays from the hunter carpark.',
    'taco tuesday after every meeting, potluck style at someone’s flat.',
    'not just tramping: climbing (hangdog indoors, pukerua bay outdoors), snowcraft, canyoning and conservation trips.',
  ],
  watch: {
    file: 'trip-vibes.mov',
    lead: 'all their own footage, from a 40-second trip edit to an 8-minute story about what a year in the club looks like.',
  },
  quotesFile: 'in-their-words.txt',
  quotes: [
    {
      text: 'VUWTC is one of the busiest, largest, sexiest, and most exciting clubs on campus. We offer huge amounts of thrilling pursuits to distract you from your studies and work!',
      by: 'vuwtc, on its website',
    },
    {
      text: 'Whether it’s your first night sleeping in the bush or you just summited Aoraki, we have trips and adventures perfect for your skill level.',
      by: 'vuwtc, in the vuw clubs directory',
    },
    {
      text: 'Not only does VUWTC like to walk on stuff, float down stuff, ride down stuff and fall down stuff but we particularly like to climb stuff.',
      by: 'vuwtc, “what we do”',
    },
    {
      text: 'World’s best ball in New Zealand’s finest bush.',
      by: 'vuwtc, on bushball',
    },
    {
      text: 'Besides tramping and climbing VUWTC has a strong taco culture. Every Tuesday after the meeting the club gathers for a potluck style Taco Tuesday Extravaganza.',
      by: 'vuwtc, “what we do”',
    },
  ],
  comingUp: [
    { name: 'Bush Rave, Spooky Edition', when: '10–11 october 2026', note: 'no walking or skill required' },
    { name: 'AGM 2026', when: '13 october 2026' },
    { name: 'Te Matawai mish (Tramps Week)', when: '14–16 october 2026' },
    { name: 'Freshers', when: 'early trimester 1', note: 'the first and largest trip of the year, graded easy / social' },
    { name: 'RockCraft', when: 'a week or two after freshers', where: 'Pukerua Bay' },
    { name: 'BushBall', when: 'after the mid-trimester break', where: 'somewhere in the Tararua Ranges' },
    { name: 'Snowcraft', when: 'after week 12, trimester 1', note: 'crampons, ice axes, avalanche basics' },
    { name: 'Midwinter Xmas', when: 'first weeks of trimester 2' },
  ],
  comingUpNote: 'the three dated ones are from vuwtc.org.nz on 8 oct 2026. the rest happen around the same time every year.',
  sayHiNote: 'they also post on tiktok (@vuwtc). or just turn up on a tuesday — the room is on their story.',
  contact: {
    email: 'vuwtramping@gmail.com',
    website: 'https://www.vuwtc.org.nz/',
    facebook: 'https://www.facebook.com/VUWTC',
    instagram: 'https://www.instagram.com/vuwtc/',
    instagramHandle: '@vuwtc',
    mailingList: 'email list, sign up on the club site',
  },
  logo: '/clubs/vuwtc/logo.png',
  sticker: { src: '/clubs/vuwtc/badge.png', alt: 'VUWTC badge' },
  poster: { src: '/clubs/vuwtc/poster-bushball-2019.jpg', alt: 'BushBall 2019 teaser title card' },
  photos: [
    { src: '/clubs/vuwtc/snack-break.jpg', alt: 'Trampers sitting in the tussock for a snack break, mountains behind' },
    { src: '/clubs/vuwtc/scramble.jpg', alt: 'A group in rain jackets scrambling over rocks' },
    { src: '/clubs/vuwtc/hut.jpg', alt: 'The group lined up on the deck of a backcountry hut' },
    { src: '/clubs/vuwtc/snow-ridge.jpg', alt: 'Walking a snowy ridge above the cloud' },
    { src: '/clubs/vuwtc/snow-helmets.jpg', alt: 'Two members in helmets on a snow slope' },
    { src: '/clubs/vuwtc/field.jpg', alt: 'Walking across tussock flats towards the mountains' },
    { src: '/clubs/vuwtc/forest.jpg', alt: 'Walking into mossy beech forest' },
    { src: '/clubs/vuwtc/sunset-saddle.jpg', alt: 'A tramper in deep snow over Sunset Saddle, Nelson Lakes' },
    { src: '/clubs/vuwtc/freshers-2016.jpg', alt: 'Freshers trip near Totara Flats, 2016' },
    { src: '/clubs/vuwtc/taco-tuesdays.png', alt: 'Taco Tuesdays 4 Lyfe badge' },
  ],
  videos: [
    { youtubeId: 'ePoI31FZ3B0', title: 'Living a Life Full of Adventures — My VUWTC Story', file: 'my-vuwtc-story.mov', duration: '8:01', credit: 'VUWTC' },
    { youtubeId: 'JYL7xu21elk', title: 'VUWTC Trip Vibes', file: 'trip-vibes.mov', duration: '0:40', credit: 'footage Dominic Oberhumer, VUWTC' },
    { youtubeId: 'YC5Zc3F51yo', title: 'BushBall 2019 teaser', file: 'bushball-teaser.mov', duration: '1:53', credit: 'VUWTC' },
    { youtubeId: 'dAIW3WLhQQ0', title: 'Deep Snow over Sunset Saddle', file: 'sunset-saddle.mov', duration: '0:44', credit: 'VUWTC' },
    { youtubeId: 'iKFauul--gk', title: 'Freshers 2016', file: 'freshers-2016.mov', duration: '3:46', credit: 'VUWTC' },
  ],
}
