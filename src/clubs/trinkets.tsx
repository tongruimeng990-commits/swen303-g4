import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { DeskObjectProps } from './useDesk'

/**
 * Trinkets: the small things on each club's desk that are only that
 * club's. A paddle and a river gauge for the canoe club, a drum and bachi
 * for taiko, a chord card for the ukulele club. Drawn as simple SVG so they
 * can move: every one is draggable like the rest of the desk, and a click
 * (or Enter) gets a small reaction. Scattered among them are a few bits of
 * text, kaomoji mostly, that set the mood. Iteration 2 review (Iris): the
 * six pages looked the same; the photos differ but the shape didn't.
 */

export type ArtId =
  | 'paddle' | 'gauge' | 'helmet'
  | 'fiddle' | 'whistle' | 'steps'
  | 'boot' | 'taco' | 'hut'
  | 'timer' | 'poi' | 'trophy'
  | 'drum' | 'bachi' | 'rhythm'
  | 'uke' | 'chord' | 'pick'

/* Free spots on the desk (the nine fixed objects sit at the edges and the
   words take the middle band). Positioned in desktop.css under
   `.trinket[data-spot]`, so the laptop breakpoint can move them:
     a · left of centre, a third of the way down
     b · right of centre, just below the words
     c · top, middle-right (wide desks only)
     d · bottom edge, under the words
     f · bottom edge, right of d (wide desks only) */
type Place = 'a' | 'b' | 'c' | 'd' | 'f'

interface BaseSpec {
  place: Place
  /** degrees; the desk's usual slight tilt */
  tilt?: number
  /** only on wide desks (> 1240px): laptops already carry nine objects */
  wide?: boolean
}

export interface ArtSpec extends BaseSpec {
  kind: 'art'
  id: ArtId
}

export interface TextSpec extends BaseSpec {
  kind: 'text'
  text: string
}

export type TrinketSpec = ArtSpec | TextSpec

const art = (id: ArtId, place: Place, tilt = 0, wide = false): ArtSpec => ({ kind: 'art', id, place, tilt, wide })
const note = (value: string, place: Place, tilt = 0, wide = false): TextSpec => ({ kind: 'text', text: value, place, tilt, wide })

const spotA: Place = 'a'
const spotB: Place = 'b'
const spotC: Place = 'c'
const spotD: Place = 'd'
const spotF: Place = 'f'

export const deskTrinkets: Record<string, TrinketSpec[]> = {
  vucc: [
    art('paddle', spotA, -8),
    art('gauge', spotB, 2),
    art('helmet', spotC, 4, true),
    note('〜〜 (ᵔ‿ᵔ) 〜〜', spotD, -2),
    note('never paddle alone', spotF, 1, true),
  ],
  vicfolk: [
    art('fiddle', spotA, -6),
    art('steps', spotB, 2),
    art('whistle', spotC, 12, true),
    note('♪(´▽｀) kay-lee!', spotD, -2),
    note('doors 6 · tunes 6:10', spotF, 1, true),
  ],
  vuwtc: [
    art('boot', spotA, -4),
    art('hut', spotB, 3),
    art('taco', spotC, -6, true),
    note('⛰ (ง •̀_•́)ง', spotD, -2),
    note('5:30 fri · hunter carpark', spotF, 1, true),
  ],
  debsoc: [
    art('timer', spotA, -3),
    art('poi', spotB, 2),
    art('trophy', spotC, 3, true),
    note('( •̀ᴗ•́ )و on that point…', spotD, -1),
    note('since 1899', spotF, 1, true),
  ],
  'mukume-taiko': [
    art('drum', spotA, -3),
    art('rhythm', spotB, 2),
    art('bachi', spotC, -14, true),
    note('(۶•̀ᴗ•́)۶ DON!', spotD, -2),
    note('it’s loud (⁎˃ᆺ˂)', spotF, 1, true),
  ],
  vicuke: [
    art('uke', spotA, -10),
    art('chord', spotB, 2),
    art('pick', spotC, 20, true),
    note('♫ (◠‿◠) ♫', spotD, -2),
    note('picking it up today? same.', spotF, 1, true),
  ],
}

/* ------------------------------------------------------------------------ */

const REACT_MS = 1100

interface TrinketProps {
  spec: TrinketSpec
  desk: DeskObjectProps
  /** drop-in animation order on the desk */
  slot: number
}

export function Trinket({ spec, desk, slot }: TrinketProps) {
  const [reacting, setReacting] = useState(false)
  const [step, setStep] = useState(0)
  const timer = useRef<number | null>(null)

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
  }, [])

  const react = () => {
    setStep((value) => value + 1)
    if (timer.current !== null) window.clearTimeout(timer.current)
    const arm = () => {
      setReacting(true)
      timer.current = window.setTimeout(() => setReacting(false), REACT_MS)
    }
    if (!reacting) {
      arm()
      return
    }
    // A click mid-reaction: drop the attribute for a frame so the CSS
    // animations start over instead of carrying on.
    setReacting(false)
    requestAnimationFrame(arm)
  }

  const style = {
    ...desk.style,
    '--tilt': `${spec.tilt ?? 0}deg`,
    '--slot': slot,
  } as CSSProperties

  if (spec.kind === 'text') {
    return (
      <button
        type="button"
        className="trinket trinket--text"
        data-spot={spec.place}
        data-wide={spec.wide || undefined}
        data-react={reacting || undefined}
        aria-label={`${spec.text} (a note on the desk)`}
        {...desk}
        style={style}
        onClick={react}
      >
        <span aria-hidden="true">{spec.text}</span>
      </button>
    )
  }

  const { label, caption, art: picture } = draw(spec.id, step)
  return (
    <button
      type="button"
      className="trinket"
      data-trinket={spec.id}
      data-spot={spec.place}
      data-wide={spec.wide || undefined}
      data-react={reacting || undefined}
      data-step={step % 4}
      aria-label={label}
      {...desk}
      style={style}
      onClick={react}
    >
      <span className="trinket__art" aria-hidden="true">{picture}</span>
      <span className="trinket__caption" aria-hidden="true">{caption}</span>
    </button>
  )
}

/* ------------------------------------------------------------------------ */

interface Drawing {
  label: string
  caption: ReactNode
  art: ReactNode
}

const GAUGE = [
  { reading: '38 m³/s', note: 'go', pos: 0.42 },
  { reading: '71 m³/s', note: 'too high', pos: 0.86 },
  { reading: '12 m³/s', note: 'low', pos: 0.14 },
]

const CHORDS: { name: string; dots: [string, number][] }[] = [
  { name: 'C', dots: [['a', 3]] },
  { name: 'F', dots: [['g', 2], ['e', 1]] },
  { name: 'G7', dots: [['c', 2], ['e', 1], ['a', 2]] },
  { name: 'Am', dots: [['g', 2]] },
]

const TIMER = ['7:00', '3:30', '0:30', 'time!']
const POI = ['POI?', 'declined.', 'POI?', 'accepted!']

function draw(id: ArtId, step: number): Drawing {
  switch (id) {
    case 'paddle':
      return {
        label: 'a kayak paddle. click to dip it',
        caption: 'paddle',
        art: (
          <svg viewBox="0 0 90 90">
            <g className="tk-ripples">
              <circle cx="22" cy="72" r="6" fill="none" stroke="var(--accent)" strokeWidth="1.5" />
              <circle cx="22" cy="72" r="11" fill="none" stroke="var(--accent)" strokeWidth="1" />
            </g>
            <g className="tk-rock">
              <path d="M14 78 L76 12" stroke="#5a3b1e" strokeWidth="4" strokeLinecap="round" />
              <path d="M72 8c8-4 14 2 10 10l-10 10-8-8z" fill="var(--accent)" stroke="#141414" strokeWidth="1.2" strokeLinejoin="round" />
              <path d="M18 82c-8 4-14-2-10-10l10-10 8 8z" fill="var(--accent)" stroke="#141414" strokeWidth="1.2" strokeLinejoin="round" />
            </g>
          </svg>
        ),
      }
    case 'gauge': {
      const g = GAUGE[step % GAUGE.length]
      return {
        label: `river gauge: hutt river ${g.reading}, ${g.note}. click for another reading`,
        caption: <>hutt <b>{g.reading}</b> · {g.note}</>,
        art: (
          <svg viewBox="0 0 120 56" className="tk-card">
            <rect x="1" y="1" width="118" height="54" rx="8" fill="#fff" stroke="#141414" strokeWidth="1.2" />
            <text x="12" y="18" fontSize="9" fill="#5c5c5a" fontFamily="inherit">flow</text>
            <rect x="12" y="26" width="96" height="10" rx="5" fill="#ebebe8" />
            <rect x="12" y="26" width="40" height="10" rx="5" fill="var(--accent)" opacity="0.35" />
            <rect x="52" y="26" width="30" height="10" fill="#f0b429" opacity="0.4" />
            <rect x="82" y="26" width="26" height="10" rx="5" fill="#e8333a" opacity="0.35" />
            <g className="tk-needle" style={{ '--pos': `${12 + 96 * g.pos}px` } as CSSProperties}>
              <path d="M0 22 L0 42" stroke="#141414" strokeWidth="2" strokeLinecap="round" />
              <circle cx="0" cy="22" r="3" fill="#141414" />
            </g>
            <text x="12" y="50" fontSize="8" fill="#8f8f8c" fontFamily="inherit">low</text>
            <text x="108" y="50" fontSize="8" fill="#8f8f8c" fontFamily="inherit" textAnchor="end">high</text>
          </svg>
        ),
      }
    }
    case 'helmet':
      return {
        label: 'a whitewater helmet. click to knock it',
        caption: 'helmet',
        art: (
          <svg viewBox="0 0 80 70">
            <g className="tk-wobble">
              <path d="M10 40a30 30 0 0 1 60 0v8a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4z" fill="var(--accent)" stroke="#141414" strokeWidth="1.2" />
              <path d="M18 38h44" stroke="#fff" strokeWidth="2" opacity="0.7" />
              <path d="M22 52v10M58 52v10M22 62h36" stroke="#141414" strokeWidth="2" strokeLinecap="round" fill="none" />
              <circle cx="40" cy="22" r="3" fill="#fff" opacity="0.8" />
            </g>
          </svg>
        ),
      }
    case 'fiddle':
      return {
        label: 'a fiddle. click to bow it',
        caption: 'fiddle',
        art: (
          <svg viewBox="0 0 90 90">
            <g className="tk-notes">
              <text x="60" y="22" fontSize="14" fill="var(--accent)">♪</text>
              <text x="72" y="36" fontSize="11" fill="var(--accent)">♫</text>
            </g>
            <path d="M44 10v40" stroke="#5a3b1e" strokeWidth="4" strokeLinecap="round" />
            <path d="M30 46c-10 2-12 14-4 18-8 6-6 20 8 20h20c14 0 16-14 8-20 8-4 6-16-4-18z" fill="#c8732a" stroke="#141414" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M38 52v26M44 52v26M50 52v26" stroke="#141414" strokeWidth="0.8" />
            <path d="M34 60c0-4 2-6 2-6M54 60c0-4-2-6-2-6" stroke="#141414" strokeWidth="1" fill="none" />
            <path className="tk-bow" d="M12 76 L78 30" stroke="#141414" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        ),
      }
    case 'whistle':
      return {
        label: 'a tin whistle. click to play a note',
        caption: 'whistle',
        art: (
          <svg viewBox="0 0 40 110">
            <g className="tk-notes">
              <text x="18" y="12" fontSize="12" fill="var(--accent)">♪</text>
            </g>
            <rect x="14" y="14" width="12" height="90" rx="3" fill="#d9d9d4" stroke="#141414" strokeWidth="1.2" />
            <rect x="12" y="14" width="16" height="14" rx="3" fill="var(--accent)" stroke="#141414" strokeWidth="1.2" />
            {[40, 50, 60, 72, 82, 92].map((y) => <circle key={y} cx="20" cy={y} r="2" fill="#141414" />)}
          </svg>
        ),
      }
    case 'steps':
      return {
        label: 'ceilidh steps card: one two three, swing. click to walk it through',
        caption: '1 · 2 · 3 · swing',
        art: (
          <svg viewBox="0 0 120 56" className="tk-card">
            <rect x="1" y="1" width="118" height="54" rx="8" fill="#fff" stroke="#141414" strokeWidth="1.2" />
            {[0, 1, 2, 3].map((i) => (
              <g key={i} className="tk-step" style={{ '--i': i } as CSSProperties} transform={`translate(${16 + i * 28} ${i % 2 ? 30 : 14}) rotate(${i % 2 ? -14 : 14})`}>
                <ellipse cx="6" cy="8" rx="5" ry="8" fill="var(--accent)" stroke="#141414" strokeWidth="1" />
                <ellipse cx="6" cy="19" rx="3.5" ry="3" fill="var(--accent)" stroke="#141414" strokeWidth="1" />
              </g>
            ))}
          </svg>
        ),
      }
    case 'boot':
      return {
        label: 'a tramping boot. click to stomp',
        caption: 'boot',
        art: (
          <svg viewBox="0 0 90 80">
            <g className="tk-mud">
              <circle cx="18" cy="70" r="2.5" fill="#6b4a2b" />
              <circle cx="74" cy="72" r="2" fill="#6b4a2b" />
              <circle cx="46" cy="76" r="1.8" fill="#6b4a2b" />
            </g>
            <g className="tk-stomp">
              <path d="M26 10h22v30l18 8c8 4 10 8 10 14H14V38c0-6 4-8 12-8z" fill="#8a5a2b" stroke="#141414" strokeWidth="1.2" strokeLinejoin="round" />
              <path d="M14 56h62v6a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4z" fill="#141414" />
              <path d="M30 16h14M30 24h14M30 32h14" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
              <path d="M26 40c6 4 14 6 22 6" stroke="#141414" strokeWidth="1" fill="none" />
            </g>
          </svg>
        ),
      }
    case 'taco':
      return {
        label: 'a taco: taco tuesday after every meeting. click it',
        caption: step % 2 ? 'tuesday!' : 'taco tuesday',
        art: (
          <svg viewBox="0 0 90 70">
            <g className="tk-wiggle">
              <path d="M8 56a37 30 0 0 1 74 0z" fill="#f0b429" stroke="#141414" strokeWidth="1.2" />
              <path d="M16 54c6-14 16-20 29-20s23 6 29 20" fill="#6aa84f" stroke="#141414" strokeWidth="1" />
              <path d="M22 54c5-8 12-12 23-12s18 4 23 12" fill="#c0392b" stroke="#141414" strokeWidth="1" />
              <path d="M30 54c3-4 8-6 15-6s12 2 15 6" fill="#f6e27a" stroke="#141414" strokeWidth="1" />
              <path d="M8 56a37 30 0 0 0 74 0" fill="none" stroke="#141414" strokeWidth="1.2" />
            </g>
          </svg>
        ),
      }
    case 'hut':
      return {
        label: 'a track sign: hut, 2 hours 30. click to swing it',
        caption: 'hut 2h30 →',
        art: (
          <svg viewBox="0 0 110 70">
            <path d="M12 10v58" stroke="#5a3b1e" strokeWidth="4" strokeLinecap="round" />
            <g className="tk-swing">
              <path d="M12 14h74l14 12-14 12H12z" fill="#f28c28" stroke="#141414" strokeWidth="1.2" strokeLinejoin="round" />
              <text x="20" y="31" fontSize="11" fontWeight="700" fill="#141414" fontFamily="inherit">HUT 2h30</text>
            </g>
            <path d="M12 44h40l8 8-8 8H12z" fill="#fff" stroke="#141414" strokeWidth="1.2" strokeLinejoin="round" />
            <text x="18" y="56" fontSize="8" fill="#141414" fontFamily="inherit">tacos ←</text>
          </svg>
        ),
      }
    case 'timer': {
      const t = TIMER[step % TIMER.length]
      return {
        label: `speech clock reading ${t}. click to move it on`,
        caption: t === 'time!' ? 'sit down.' : 'speaking time',
        art: (
          <svg viewBox="0 0 80 80">
            <circle cx="40" cy="44" r="30" fill="#fff" stroke="#141414" strokeWidth="1.5" />
            <path d="M34 8h12M40 8v6" stroke="#141414" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="40" cy="44" r="25" fill="none" stroke="var(--accent)" strokeWidth="3" strokeDasharray="157" strokeDashoffset={157 - 157 * ([1, 0.5, 0.07, 0][step % 4])} className="tk-ring" />
            <text x="40" y="49" fontSize={t === 'time!' ? 13 : 16} fontWeight="700" textAnchor="middle" fill="#141414" fontFamily="inherit" className="tk-pop">{t}</text>
          </svg>
        ),
      }
    }
    case 'poi': {
      const p = POI[step % POI.length]
      return {
        label: `a raised hand: point of information. ${p === 'POI?' ? 'click to offer one' : p}`,
        caption: p,
        art: (
          <svg viewBox="0 0 80 90">
            <g className="tk-raise">
              <path d="M30 86V50c0-8 4-12 10-12h4v-26a4 4 0 0 1 8 0v22" fill="#f6d6b8" stroke="#141414" strokeWidth="1.2" strokeLinejoin="round" />
              <path d="M44 38v-10a4 4 0 0 0-8 0v12M36 40v-6a4 4 0 0 0-8 0v10M52 34v-4a4 4 0 0 1 8 0v22c0 16-8 28-20 34" fill="#f6d6b8" stroke="#141414" strokeWidth="1.2" strokeLinejoin="round" />
              <path d="M30 86h30" stroke="#141414" strokeWidth="1.2" />
            </g>
            <g className="tk-bubble">
              <rect x="2" y="4" width="34" height="18" rx="9" fill="var(--accent)" />
              <text x="19" y="17" fontSize="9" fontWeight="700" fill="#fff" textAnchor="middle" fontFamily="inherit">{p}</text>
            </g>
          </svg>
        ),
      }
    }
    case 'trophy':
      return {
        label: 'a trophy: australs grand finals, worlds semi-finals. click to polish it',
        caption: 'australs · worlds',
        art: (
          <svg viewBox="0 0 80 90">
            <path d="M22 10h36v22c0 12-8 20-18 20s-18-8-18-20z" fill="#e2b93b" stroke="#141414" strokeWidth="1.2" />
            <path d="M22 16h-8c-2 12 4 18 10 18M58 16h8c2 12-4 18-10 18" fill="none" stroke="#141414" strokeWidth="1.2" />
            <path d="M36 52h8v10h-8zM26 62h28v8H26z" fill="#141414" />
            <text x="40" y="82" fontSize="8" textAnchor="middle" fill="#5c5c5a" fontFamily="inherit">debsoc</text>
            <path className="tk-shine" d="M28 14l-8 30" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0" />
          </svg>
        ),
      }
    case 'drum':
      return {
        label: 'a taiko drum. click to hit it',
        caption: 'chū-daiko',
        art: (
          <svg viewBox="0 0 100 100">
            <g className="tk-rings">
              <circle cx="50" cy="48" r="34" fill="none" stroke="var(--accent)" strokeWidth="1.5" />
              <circle cx="50" cy="48" r="44" fill="none" stroke="var(--accent)" strokeWidth="1" />
            </g>
            <g className="tk-hit">
              <path d="M18 34c0-8 14-14 32-14s32 6 32 14v30c0 8-14 14-32 14S18 72 18 64z" fill="#8b4a1f" stroke="#141414" strokeWidth="1.2" />
              <ellipse cx="50" cy="34" rx="32" ry="14" fill="#f3e3c3" stroke="#141414" strokeWidth="1.2" />
              {Array.from({ length: 10 }, (_, i) => {
                const a = (i / 10) * Math.PI * 2
                return <circle key={i} cx={50 + Math.cos(a) * 28} cy={34 + Math.sin(a) * 12} r="1.6" fill="#141414" />
              })}
              <path d="M28 52v12M72 52v12" stroke="#141414" strokeWidth="1" />
            </g>
            <text className="tk-don" x="50" y="22" fontSize="16" fontWeight="800" textAnchor="middle" fill="var(--accent)" fontFamily="inherit" opacity="0">DON!</text>
          </svg>
        ),
      }
    case 'bachi':
      return {
        label: 'a pair of bachi, drumsticks. click to strike',
        caption: 'bachi',
        art: (
          <svg viewBox="0 0 90 90">
            <path className="tk-stick tk-stick--a" d="M14 76 L72 14" stroke="#e8d9b5" strokeWidth="7" strokeLinecap="round" />
            <path className="tk-stick tk-stick--a" d="M14 76 L72 14" stroke="#141414" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5" />
            <path className="tk-stick tk-stick--b" d="M18 14 L76 76" stroke="#e8d9b5" strokeWidth="7" strokeLinecap="round" />
            <path className="tk-stick tk-stick--b" d="M18 14 L76 76" stroke="#141414" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5" />
          </svg>
        ),
      }
    case 'rhythm':
      return {
        label: 'a rhythm card: don doko don. click to play it',
        caption: 'don · doko · don',
        art: (
          <svg viewBox="0 0 120 56" className="tk-card">
            <rect x="1" y="1" width="118" height="54" rx="8" fill="#fff" stroke="#141414" strokeWidth="1.2" />
            {['DON', 'DO', 'KO', 'DON'].map((syl, i) => (
              <g key={i} className="tk-beat" style={{ '--i': i } as CSSProperties}>
                <circle cx={20 + i * 27} cy="24" r={syl === 'DON' ? 9 : 6} fill="var(--accent)" />
                <text x={20 + i * 27} y="48" fontSize="8" fontWeight="700" textAnchor="middle" fill="#141414" fontFamily="inherit">{syl}</text>
              </g>
            ))}
          </svg>
        ),
      }
    case 'uke':
      return {
        label: 'a ukulele. click to strum',
        caption: 'uke',
        art: (
          <svg viewBox="0 0 70 120">
            <g className="tk-notes">
              <text x="48" y="24" fontSize="13" fill="var(--accent)">♫</text>
              <text x="56" y="40" fontSize="10" fill="var(--accent)">♪</text>
            </g>
            <rect x="29" y="6" width="12" height="16" rx="3" fill="#5a3b1e" stroke="#141414" strokeWidth="1" />
            <path d="M32 20h6v40h-6z" fill="#8a5a2b" stroke="#141414" strokeWidth="1" />
            <path d="M35 58c-14 0-20 10-18 20 2 6-4 8-4 18 0 14 10 20 22 20s22-6 22-20c0-10-6-12-4-18 2-10-4-20-18-20z" fill="var(--accent)" stroke="#141414" strokeWidth="1.2" strokeLinejoin="round" />
            <circle cx="35" cy="82" r="7" fill="#141414" />
            <rect x="26" y="104" width="18" height="4" rx="1" fill="#141414" />
            <g className="tk-strings">
              {[31, 33.6, 36.4, 39].map((x) => <path key={x} d={`M${x} 20v86`} stroke="#fff" strokeWidth="0.9" />)}
            </g>
          </svg>
        ),
      }
    case 'chord': {
      const c = CHORDS[step % CHORDS.length]
      const strings = ['g', 'c', 'e', 'a']
      return {
        label: `chord card showing ${c.name}. click for the next chord`,
        caption: <>chord · <b>{c.name}</b></>,
        art: (
          <svg viewBox="0 0 90 90" className="tk-card">
            <rect x="1" y="1" width="88" height="88" rx="8" fill="#fff" stroke="#141414" strokeWidth="1.2" />
            <path d="M24 22h42" stroke="#141414" strokeWidth="3" />
            {[0, 1, 2, 3].map((f) => <path key={f} d={`M24 ${36 + f * 14}h42`} stroke="#141414" strokeWidth="1" />)}
            {strings.map((s, i) => <path key={s} d={`M${24 + i * 14} 22v56`} stroke="#141414" strokeWidth="1" />)}
            {strings.map((s, i) => {
              const fret = c.dots.find(([name]) => name === s)?.[1]
              return fret
                ? <circle key={s} className="tk-dot" cx={24 + i * 14} cy={22 + fret * 14 - 7} r="5" fill="var(--accent)" />
                : <circle key={s} cx={24 + i * 14} cy="14" r="2.5" fill="none" stroke="#141414" strokeWidth="1" />
            })}
            <text x="76" y="86" fontSize="9" fontWeight="700" textAnchor="end" fill="#141414" fontFamily="inherit">{c.name}</text>
          </svg>
        ),
      }
    }
    case 'pick':
      return {
        label: 'a felt pick. click to flip it',
        caption: 'felt pick',
        art: (
          <svg viewBox="0 0 60 70">
            <g className="tk-spin">
              <path d="M8 14c0-8 44-8 44 0 0 22-14 44-22 50C22 58 8 36 8 14z" fill="var(--accent)" stroke="#141414" strokeWidth="1.2" strokeLinejoin="round" />
              <circle cx="30" cy="22" r="2" fill="#fff" opacity="0.8" />
            </g>
          </svg>
        ),
      }
  }
}
