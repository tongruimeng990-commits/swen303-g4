// Vic Debsoc (Victoria University of Wellington Debating Society), collected 8 Oct 2026.
// Copy is quoted or summarised from the society's own pages; images live in /public/clubs/debsoc.
//
// Sources:
//   https://www.vicdebsoc.org.nz/  and  https://www.vicdebsoc.org.nz/about/  (meeting, events)
//   https://www.vicdebsoc.org.nz/blog  (squad announcements, used for rough tournament timing)
//   https://www.wgtn.ac.nz/recreation/clubs-and-societies/directory/debating  (history, photos, contact)
//   https://www.youtube.com/@VicDebsoc  and the VUWSA Events channel  (videos)

import type { ClubDesktopContent } from './types'

export const debsocDesktop: ClubDesktopContent = {
  slug: 'debsoc',
  name: 'Vic Debsoc',
  fullName: 'Victoria University of Wellington Debating Society',
  tags: ["debating", "beginner grades", "socials"],
  intro: "learn to speak and convince, with a grade for every level.",
  letter: {
    "subject": "a note from debsoc",
    "greeting": "kia ora debaters,",
    "body": "no experience necessary. internal grades cater to total beginners and experienced speakers. pro-am tournaments pair novices with experienced debaters to learn a new style.",
    "signoff": "the debsoc exec"
  },
  costs: []
,
  bring: {
    "yes": [],
    "no": []
  },
  essentials: [
    'no experience necessary. the internal grades cater to total beginners.',
    'pro-am tournaments pair a novice with an experienced debater.',
    'it’s a social club too: cheap byo dinners, pizza, the regressive.',
  ],
  goodToKnow: [
    "no experience necessary. the internal grades cater to total beginners.",
    "formed in 1899, before victoria college even opened. the same students went on to found the students’ association.",
    "new zealand’s most successful university debating society: australs grand finals, world championship semi-finals (2008), a cambridge union iv win (2007).",
    "pro-am tournaments: a novice pairs with an experienced debater.",
    "a registered charity run by an eleven-person exec. it also organises debating in wellington secondary schools.",
    "it’s a social club too: vic champs at a cheap byo restaurant, the regressive at the kelburn scout hall, pizza at the agm.",
    "AGM means annual general meeting."
  ],
  meets: {
    line: 'wednesdays 6:30pm',
    room: 'KK301, Kirk Building, Kelburn',
    caveat: 'during trimester the wednesday meetings are the internal debating grades · last checked oct 2026',
    directions: 'KK301 is room 301 in the Kirk Building on Kelburn campus.',
  },
  watch: {
    file: 'joynt-scroll-final.mov',
    lead: 'full rounds from the society’s channel — nationals, australs and the in-house vic champs — plus the vuwsa × debsoc politicians-versus-students debate.',
  },
  quotes: [
    {
      text: 'Learn to speak. Learn to convince. Learn to take the W.',
      by: 'vic debsoc, on its website',
    },
    {
      text: 'We meet every Wednesday in KK301 at 6:30pm. Come along, no experience necessary.',
      by: 'vic debsoc, “about us”',
    },
    {
      text: 'Our calendar is filled year round with trips and fun events. *The sights may be visible from the room where you are debating.',
      by: 'vic debsoc, on its website',
    },
    {
      text: 'A regressive debate starts with the adjudication and progresses backwards from there, all the way to the chairperson welcoming everyone to the debate.',
      by: 'vic debsoc, on the regressive',
    },
    {
      text: 'Whether you are running for committee or not, make sure you come along – there’ll be pizza, and possibly political intrigue!',
      by: 'vic debsoc, on the agm',
    },
  ],
  events: [
    { name: 'Wednesday grades', when: 'every wednesday 6:30pm in trimester', time: '6:30pm', weekday: 3, where: 'KK301' },
    { name: 'Joynt Scroll (nationals)', when: 'around april', note: 'squad announced in march' },
    { name: 'Vic Champs', when: 'end of trimester 1', where: 'a cheap wellington byo restaurant', note: 'six first-years tackle a ridiculous motion' },
    { name: 'Officers Cup', when: 'around august', note: 'squad announced late july' },
    { name: 'AGM', when: 'end of year', note: 'pizza, and possibly political intrigue' },
    { name: 'The Regressive', when: 'final event of the year', where: 'Kelburn Village Scout Hall' },
  ],
  comingUpNote: 'from the society’s about page and blog. tournament dates shift each year — the mailing list has the real ones.',
  sayHiNote: 'there’s a mailing list on the site for tournaments and socials. or just turn up on wednesday.',
  contact: {
    email: 'contact@vicdebsoc.org.nz',
    website: 'https://www.vicdebsoc.org.nz/',
    facebook: 'https://www.facebook.com/vicdebsoc',
    instagram: 'https://www.instagram.com/vicdebsoc/',
    instagramHandle: '@vicdebsoc',
    mailingList: 'mailing list, sign up on the society site',
  },
  logo: '/clubs/debsoc/badge.png',
  sticker: { src: '/clubs/debsoc/badge.png', alt: 'Vic Debsoc badge' },
  poster: { src: '/clubs/debsoc/vuwsa-debate.jpg', alt: 'VUWSA × Debsoc debate: do politicians represent students?' },
  photos: [
    { src: '/clubs/debsoc/team-photo.jpg', alt: 'The squad giving thumbs up in front of the Hunter Building columns' },
    { src: '/clubs/debsoc/dinner.jpg', alt: 'Society dinner around a long table' },
    { src: '/clubs/debsoc/trophy.jpg', alt: 'Two members holding a trophy' },
    { src: '/clubs/debsoc/nzbp-2018.jpg', alt: 'A speaker at the lectern between flags, NZ BP 2018' },
    { src: '/clubs/debsoc/joynt-2020.jpg', alt: 'The Joynt Scroll 2020 final in a lecture theatre' },
    { src: '/clubs/debsoc/vic-champs-2016.jpg', alt: 'A Vic Champs speech in a restaurant, 2016' },
    { src: '/clubs/debsoc/vuwsa-debate.jpg', alt: 'A speaker at the VUWSA × Debsoc debate' },
  ],
  videos: [
    { youtubeId: 'bQvOvaRgEOM', title: 'Joynt Scroll 2020 Final', file: 'joynt-scroll-2020.mov', duration: '11:20', credit: 'Vic Debsoc' },
    { youtubeId: '5cDMGJipcjw', title: 'Vic Debsoc at NZ BP, November 2018', file: 'nzbp-2018.mov', duration: '8:48', credit: 'Vic Debsoc' },
    { youtubeId: 'A2msCtulgj0', title: 'Vic Champs 2016', file: 'vic-champs-2016.mov', duration: '2:14', credit: 'Vic Debsoc' },
    { youtubeId: 'LSbe9V0CWtY', title: 'Do politicians represent students? VUWSA × Debsoc', file: 'vuwsa-x-debsoc.mov', duration: '37:07', credit: 'VUWSA Events' },
  ],
}
