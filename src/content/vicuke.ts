// Vic Uke (Victoria University of Wellington Ukulele Club), collected 8 Oct 2026.
// Copy is quoted or summarised from the club's own listings; images live in /public/clubs/vicuke
// (stills are frames from the club's own YouTube videos).
// The club does not publish a weekly meeting time or room online, so none is shown here.
// Only the email address is published as a contact; the facebook/instagram URLs could not be verified.
//
// Sources:
//   https://www.wgtn.ac.nz/recreation/clubs-and-societies/directory/vic-uke  (blurb, email)
//   https://www.youtube.com/@vicuke2837  (channel blurb, promo video, lockdown cover)
//   https://events.humanitix.com/mukumetaikoheartbeat  (guest spot at Mukume Taiko's Heartbeat, Oct 2024)
//   Newstalk ZB, 19 Mar 2024  (CubaDupa ukulele extravaganza with NZ Ukulele)

import type { ClubDesktopContent } from './types'

export const vicukeDesktop: ClubDesktopContent = {
  slug: 'vicuke',
  name: 'Vic Uke',
  fullName: 'Victoria University of Wellington Ukulele Club',
  tags: ["ukulele", "all skill levels", "songs together"],
  intro: "a weekly ukulele hang for every level.",
  letter: {
    "subject": "a note from vicuke",
    "greeting": "kia ora,",
    "body": "share tips, learn songs together, and sometimes play a gig. all skill levels are welcome, whether you are experienced or picking up the ukulele today.",
    "signoff": "vic uke"
  },
  costs: []
,
  bring: {
    "yes": [],
    "no": []
  },
  essentials: [
    'all skill levels, including picking one up today.',
    'email them for this week’s room and time. it isn’t posted online.',
    'it’s a social club first: share tips, learn songs together. performing is optional.',
  ],
  goodToKnow: [
    "all skill levels: “whether you’re an experienced ukulele player or just picking it up today.”",
    "it’s a social club first. share tips, learn songs together.",
    "performance opportunities come up around the university and elsewhere. optional.",
    "they kept jamming through lockdown: the lazy song cover was recorded from everyone’s bedrooms in 2020.",
    "they were one of 23 groups in the ukulele extravaganza at cubadupa 2024.",
    "they guested at mukume taiko’s 30th-anniversary concert in the memorial theatre."
  ],
  meets: {
    line: 'weekly',
    room: 'Kelburn campus · day & time not published',
    caveat: 'they don’t post the meeting time online — email them for this week’s session · last checked oct 2026',
    directions: 'Ask the club for this week’s room when you email them.',
  },
  watch: {
    file: 'lazy-song-cover.mov',
    lead: 'two clips from their own channel: the 2020 promo, and a lockdown cover recorded from everyone’s bedrooms.',
  },
  quotes: [
    {
      text: 'We are a social club of ukulele enthusiasts of all levels who meet weekly to share knowledge, tips, and learn songs together.',
      by: 'vic uke, in the vuw clubs directory',
    },
    {
      text: 'Here you can find our performances, jam sessions, tutorials, and of course memes!',
      by: 'vic uke, on youtube',
    },
    {
      text: 'Whether your an experienced ukulele player or just picking it up today, there is something here for everyone.',
      by: 'vic uke, on youtube',
    },
    {
      text: 'Just because the coronavirus has isolated us doesn’t mean its an excuse to stop practicing.',
      by: 'vic uke, the lazy song cover',
    },
    {
      text: 'This is the kind of fame you’ll expect from joining up with Vic Uke!',
      by: 'vic uke, promo video',
    },
  ],
  events: [
    { name: 'Weekly session', when: 'weekly, time not published', where: 'Kelburn campus' },
    { name: 'CubaDupa ukulele extravaganza (with NZ Ukulele)', when: 'march', where: 'Cuba Street' },
    { name: 'Performances around the university', when: 'through the year' },
  ],
  comingUpNote: 'vic uke doesn’t publish a calendar. these are the gigs we could verify (2024).',
  sayHiNote: 'email is the one contact they publish. they also have facebook and instagram — search “vic uke”.',
  contact: {
    email: 'vicukulele@gmail.com',
    website: 'https://www.youtube.com/@vicuke2837',
  },
  logo: '/clubs/vicuke/badge.png',
  sticker: { src: '/clubs/vicuke/badge.png', alt: 'Vic Uke badge' },
  poster: { src: '/clubs/vicuke/poster-promo.jpg', alt: 'Vic Uke promo title card over a festival crowd' },
  photos: [
    { src: '/clubs/vicuke/on-stage-wide.jpg', alt: 'A line of ukulele players on stage' },
    { src: '/clubs/vicuke/on-stage.jpg', alt: 'The club on stage under blue lights' },
    { src: '/clubs/vicuke/lazy-song-grid.jpg', alt: 'Everyone’s bedroom squares in the lockdown cover' },
    { src: '/clubs/vicuke/on-stage-bow.jpg', alt: 'Taking a bow after a performance' },
    { src: '/clubs/vicuke/strum.jpg', alt: 'Close-up of a hand strumming a ukulele' },
    { src: '/clubs/vicuke/lazy-song-lounge.jpg', alt: 'Two members playing from a living room' },
  ],
  videos: [
    { youtubeId: 'Qkt4ZlL013E', title: 'Ukulele Club promotional video', file: 'promo.mov', duration: '1:31', credit: 'Vic Uke' },
    { youtubeId: 'yQP_0izfC_M', title: 'The Lazy Song (cover), lockdown 2020', file: 'lazy-song-cover.mov', duration: '3:32', credit: 'Vic Uke' },
  ],
}
