// VicFolk (VUW Folk Music Club) source material, collected 8 Oct 2026.
// Copy is quoted from the club's own pages; images live in /public/clubs/vicfolk.

import type { ClubDesktopContent } from './types'

export const vicfolkSources = {
  clubSite: 'https://vicfolkmusic.wordpress.com/',
  events: 'https://vicfolkmusic.wordpress.com/vicfolk-gigs-and-sessions/',
  meetups: 'https://vicfolkmusic.wordpress.com/regular-practices-and-workshops/',
  gallery: 'https://vicfolkmusic.wordpress.com/gallery/',
  vuwDirectory: 'https://www.wgtn.ac.nz/recreation/clubs-and-societies/directory/folk-music',
  humanitix: 'https://events.humanitix.com/host/630d69ec6224440b07df190c',
}

export const vicfolk = {
  name: 'VicFolk',
  fullName: 'Victoria University of Wellington Folk Music Club',
  directoryName: 'Folk Music (Vic Folk)',
  founded: 2017,
  category: 'Performing Arts',
  tagline:
    'Vic Folk offers opportunities for students to learn, play and dance to traditional Irish and Scottish music.',
  about: [
    'Vic Folk was founded in 2017 to offer opportunities to learn about and get involved with Celtic folk music and dance. The club is led by students and alumni of Victoria University of Wellington, but participation is open to anyone who’s interested.',
    'If you’re of a musical inclination, we hold relaxed weekly meetups during term time to play music, learn tunes and dances, and sing songs. At these, we teach tunes from the ground up, serving as a gateway into the weekly Wellington Irish Session and Vicfolk’s very own ceilidh band. We also dance a couple of ceilidh dances, and sing a few traditional songs, so there’s something for everyone.',
    'For those who just want to dance we hold regular dance workshops and our ever-popular public ceilidhs. Ceilidh dancing (pronounced kay-lee) is fun, lively, and social, and also incredibly easy; you need never have danced before! Bring as many left feet as you want; our capable callers will guide you through every step of the way.',
  ],
  extras: [
    'We welcome folk musicians who’d like to put on participatory folk music events.',
    'You can also book our band to play at your event.',
  ],

  weeklyMeetup: {
    day: 'Thursday',
    time: '7–9pm',
    when: 'During the VUW teaching period',
    room: 'Student Union SU217/218',
    directions:
      'Head upstairs from Mauri Ora, or from the main floor through the doors past the vending machines. Take a right and head straight ahead through the doors.',
    activities: ['Learn and play tunes', 'Dance ceilidh dances', 'Sing traditional songs'],
    pastWorkshopTopics: [
      'Accordion', 'Uilleann pipes', 'Tin whistle', 'Fiddle', 'Guitar and accompaniment',
      'Morris dancing', 'Shanty singing', 'Balfolk dancing', 'Dance calling',
      'Playing tunes in a group',
    ],
  },

  newcomer: {
    experience: 'Absolutely no experience required — bring along your two left feet.',
    howDancesWork: 'All dances are taught and walked through before the band starts.',
    openTo: 'Open to anyone, not only VUW students.',
    pronunciation: 'Ceilidh is pronounced “kay-lee”.',
  },

  // The club's events page still lists late-2025 dates, so these two have passed.
  recentEvents: [
    {
      title: 'Vicfolk Midwinter Ceilidh 2026',
      date: '2026-07-18',
      time: '7pm–10pm (doors 6:30pm)',
      venue: 'Northland Memorial Community Centre',
      address: '5 Woburn Road, Northland, Wellington 6012',
      transport:
        'The number 4 bus stops just around the corner; the 2, 18 and 21 are within a 15-minute walk. Some parking outside the hall and on nearby streets.',
      price: { student: 10, general: 15, currency: 'NZD', note: 'Students and unwaged $10. Cash-only door sales available.' },
      refunds: 'Refunds available up to 1 day before. Please stay home if you are sick.',
      description:
        'Come on out of the cold and warm up with a night of Ceilidh dancing! No experience required. All dances will be taught and walked through before we start up the music with our very own Ceilidh band. There will be breaks between dances and an intermission for snacks partway through.',
      ticketUrl: 'https://events.humanitix.com/vicfolk-midwinter-ceilidh-2026',
      image: '/clubs/vicfolk/poster-midwinter-ceilidh-2026.webp',
    },
    {
      title: 'Irish Set Dancing Workshops + Ceilidh',
      date: '2026-04-18',
      time: 'Workshops 10am–4:30pm, ceilidh 7:30pm',
      venue: 'St Michael’s Community Hall',
      host: 'Taught by Helen Stonehouse',
    },
  ],

  recurringEvents: [
    { name: 'St Patrick’s Day Ceilidh', when: 'March' },
    { name: 'Ceol Aneas Ceilidh (Nelson)', when: 'Queen’s/King’s Birthday weekend, early June' },
    { name: 'Gaylidh with Te Herenga Waka Pride Festival', when: 'July', note: 'Profits donated to UniQ' },
    { name: 'Mid-Year / Winter Ceilidh', when: 'July–August' },
    { name: 'Wellyfest (Wellington Folk Festival)', when: 'Labour Weekend, late October' },
    { name: 'End of Year Ceilidh', when: 'Late November', venue: 'Northland Memorial Community Centre' },
  ],

  nearbyScene: [
    { name: 'Wellington Irish Session', when: 'Every Tuesday, slow session 7:30pm, regular session ~8:45pm', where: 'Welsh Dragon Bar, 10/12 Cambridge Terrace' },
    { name: 'Singing Session', when: '4th Monday monthly, gather 6:45pm, singing ~7pm', where: 'Welsh Dragon Bar' },
    { name: 'Pōneke Shanty Club', when: '1st and 3rd Thursdays, 7pm', where: 'Welsh Dragon Bar' },
    { name: 'Wellington Gaelic Club Ceilidh', when: '2nd Saturday monthly (not January)', where: 'City of Wellington Pipe Band Hall, Hanson St & Stoke St' },
    { name: 'Balfolk Wellington', when: 'Wednesdays 6pm', where: 'Newtown Community Centre' },
  ],

  contact: {
    email: 'vicfolkmusic@gmail.com',
    website: 'https://vicfolkmusic.wordpress.com/',
    facebook: 'https://www.facebook.com/VicFolkMusic',
    instagram: 'https://www.instagram.com/vicfolkmusic/',
    instagramHandle: '@vicfolkmusic',
    mailingList: 'Weekly updates via the mailing list on the club site',
  },

  images: {
    logoWhite: '/clubs/vicfolk/logo-white.jpg',
    logoGreen: '/clubs/vicfolk/logo-green.webp',
    poster: '/clubs/vicfolk/poster-midwinter-ceilidh-2026.webp',
    photos: [
      { src: '/clubs/vicfolk/group-photo.jpg', alt: 'VicFolk members posing together in costume' },
      { src: '/clubs/vicfolk/band-on-stage.jpg', alt: 'The VicFolk ceilidh band performing on stage' },
      { src: '/clubs/vicfolk/dance-group.jpg', alt: 'Dancers spinning in a busy hall during a ceilidh' },
      { src: '/clubs/vicfolk/dancing.jpg', alt: 'Couples dancing in lines at a community hall' },
      { src: '/clubs/vicfolk/ceilidh-2023-a.jpg', alt: 'A full hall of dancers in rings' },
      { src: '/clubs/vicfolk/ceilidh-2023-b.jpg', alt: 'A caller leading the dance', portrait: true },
      { src: '/clubs/vicfolk/ceol-aneas-2023-5314.jpg', alt: 'Musicians under purple stage light' },
      { src: '/clubs/vicfolk/ceol-aneas-2023-5465.jpg', alt: 'Band and dancers under pink stage light' },
      { src: '/clubs/vicfolk/ceol-aneas-2023-5732.jpg', alt: 'Fiddles and cello on a lit stage' },
      { src: '/clubs/vicfolk/meetup-2021-5327.jpg', alt: 'Crowd dancing at a ceilidh' },
      { src: '/clubs/vicfolk/meetup-2021-9052.jpg', alt: 'Fiddle and cello players under blue light' },
      { src: '/clubs/vicfolk/meetup-2021-9113.jpg', alt: 'Dancers in lines in a hall', portrait: true },
      { src: '/clubs/vicfolk/session-2023.jpg', alt: 'A large group of musicians on a blue-lit stage' },
      { src: '/clubs/vicfolk/band-2018.jpg', alt: 'Two musicians playing at a session' },
      { src: '/clubs/vicfolk/st-pats-ceilidh-2019-27.jpg', alt: 'Dancers in motion blur at a St Patrick’s ceilidh' },
      { src: '/clubs/vicfolk/st-pats-ceilidh-2019-36.jpg', alt: 'Accordion and fiddle players in black and white', portrait: true },
      { src: '/clubs/vicfolk/st-pats-ceilidh-2019-72.jpg', alt: 'Black-and-white photo of dancers turning' },
      { src: '/clubs/vicfolk/wellyfest-2019.jpg', alt: 'Evening dance in a festival tent at Wellyfest' },
      { src: '/clubs/vicfolk/whistles.jpg', alt: 'A row of tin whistles' },
    ],
  },
} as const

// Content for the desktop-style club page at /editorial/vicfolk.
// Quotes come from the SWEN303 interview with a VicFolk member (Iris);
// other interviewees are not members and are deliberately not quoted.
export const vicfolkDesktop: ClubDesktopContent = {
  slug: 'vicfolk',
  name: 'VicFolk',
  fullName: vicfolk.fullName,
  hello:
    'hello, we’re vicfolk. irish & scottish tunes, dances and songs, every week on campus. no experience needed, bring your two left feet.',
  meets: {
    line: 'thursdays 6–8pm',
    room: 'Student Union SU217/218',
    caveat: 'last checked oct 2026 · double-check this week’s email',
    directions: vicfolk.weeklyMeetup.directions,
  },
  thisWeek: {
    subject: 'this week at vicfolk: dancing + a new reel',
    lines: [
      'kia ora all,',
      'this thursday we’re dancing. we’ll walk through two ceilidh dances from scratch, then learn a reel for the band.',
      'room: SU217/218, student union. doors from 6pm, we start at 6:10.',
      'bring an instrument if you have one. if you don’t, come and dance or sing.',
      'see you there,',
      'the vicfolk committee',
    ],
  },
  firstTime: [
    'you don’t need any experience. none.',
    'every dance is taught and walked through before the music starts.',
    'all ages, students and alumni, and anyone else who’s keen.',
    'can’t play anything? dance or sing. we teach tunes from the ground up.',
    'ceilidh is pronounced “kay-lee”.',
    'ceilidh tickets are usually $10 for students, $15 general.',
  ],
  watch: {
    file: 'watch-a-ceilidh.mov',
    lead: 'this is what a night actually looks like. everyone in these clips was taught the dance about five minutes earlier.',
  },
  quotesFile: 'what-members-say',
  quotes: [
    {
      text: 'They teach each dance before we do it together. People from young children to much older adults can do this kind of dancing, and you are not expected to be good already.',
      by: 'a vicfolk member (from our interviews)',
    },
    {
      text: 'My favourite thing is the email they send every week, a few days before the meeting. It says what we will do and which room we will use.',
      by: 'a vicfolk member (from our interviews)',
    },
    {
      text: 'If it says we are dancing, I will move other commitments because dancing and singing are my favourite activities.',
      by: 'a vicfolk member (from our interviews)',
    },
    {
      text: 'I play the tin whistle badly because I only use it at club meetings. I bought it so I could play along with the tunes taught at the club.',
      by: 'a vicfolk member (from our interviews)',
    },
    {
      text: 'If I go to another folk music event, such as singing at the Welsh Dragon, I look for the people I know from the club and sit with them.',
      by: 'a vicfolk member (from our interviews)',
    },
  ],
  comingUp: [
    { name: 'End of Year Ceilidh', when: 'late november', where: 'Northland Memorial Community Centre' },
    { name: 'St Patrick’s Day Ceilidh', when: 'march' },
    { name: 'Ceol Aneas Ceilidh', when: 'early june', where: 'Trafalgar Hall, Nelson' },
    { name: 'Gaylidh', when: 'july', where: 'with Te Herenga Waka Pride Festival', note: 'profits go to UniQ' },
    { name: 'Midwinter Ceilidh', when: 'july–august', where: 'Northland Memorial Community Centre' },
    { name: 'Wellyfest', when: 'labour weekend, late october', where: 'Brookfields, past Wainuiomata' },
  ],
  comingUpNote: 'dates move around each year. the weekly email has the real ones.',
  sayHiNote: 'no instagram? email works just as well. or just turn up on thursday.',
  contact: {
    email: vicfolk.contact.email,
    website: vicfolk.contact.website,
    facebook: vicfolk.contact.facebook,
    instagram: vicfolk.contact.instagram,
    instagramHandle: vicfolk.contact.instagramHandle,
    mailingList: 'weekly email, sign up on the club site',
  },
  logo: vicfolk.images.logoWhite,
  sticker: { src: vicfolk.images.logoGreen, alt: 'VicFolk badge' },
  poster: { src: vicfolk.images.poster, alt: 'Midwinter Ceilidh 2026 poster' },
  photos: [
    { src: '/clubs/vicfolk/group-photo.jpg', alt: 'VicFolk members posing together in costume' },
    { src: '/clubs/vicfolk/dance-group.jpg', alt: 'Dancers spinning in a busy hall during a ceilidh' },
    { src: '/clubs/vicfolk/band-on-stage.jpg', alt: 'The VicFolk ceilidh band performing on stage' },
    { src: '/clubs/vicfolk/ceol-aneas-2023-5732.jpg', alt: 'Fiddles and cello on a lit stage' },
    { src: '/clubs/vicfolk/whistles.jpg', alt: 'A row of tin whistles' },
    { src: '/clubs/vicfolk/st-pats-ceilidh-2019-72.jpg', alt: 'Black-and-white photo of dancers turning' },
    { src: '/clubs/vicfolk/wellyfest-2019.jpg', alt: 'Evening dance in a festival tent at Wellyfest' },
    { src: '/clubs/vicfolk/meetup-2021-9113.jpg', alt: 'Dancers in lines in a hall', portrait: true },
  ],
  videos: [
    { youtubeId: 'LM4TveUpLKQ', title: 'VicFolk Ceilidh, June 2019', file: 'ceilidh-night.mov', duration: '2:03', credit: 'Jonathan Berkahn' },
    { youtubeId: '2lk82bNFb6U', title: 'Strip the Willow', file: 'strip-the-willow.mov', duration: '0:28', credit: 'Jonathan Berkahn' },
    { youtubeId: 'thOWKe2mVEw', title: 'Session on a hill, Ceol Aneas 2019', file: 'session-on-a-hill.mov', duration: '6:18', credit: 'VicFolk' },
    { youtubeId: 'QWcuitpobx8', title: 'New dance, end of year party', file: 'end-of-year.mov', duration: '1:31', credit: 'Jonathan Berkahn' },
  ],
}
