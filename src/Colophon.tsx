/**
 * The line at the bottom of every page that says where this is from: a
 * line drawing of the Hunter Building clock tower on Kelburn campus and the
 * university's name in both languages. The pages above are about the clubs;
 * this is the only place the university itself appears, apart from the home
 * page title.
 */
export function Colophon({ children }: { children?: React.ReactNode }) {
  return (
    <div className="colophon">
      <HunterBuilding />
      <p className="colophon__text">
        <span className="colophon__uni">
          Te Herenga Waka · Victoria University of Wellington
        </span>
        <span>the hunter building, kelburn campus · te whanganui-a-tara / wellington</span>
        {children ? <span>{children}</span> : null}
      </p>
    </div>
  )
}

/** The Hunter Building (1904), drawn in a few lines: the clock tower with its
 *  steep roof, and the two gabled wings. */
export function HunterBuilding() {
  return (
    <svg className="colophon__art" viewBox="0 0 176 64" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        {/* ground */}
        <path d="M2 60h172" />
        {/* tower */}
        <path d="M70 60V20h36v40" />
        <path d="M66 20h44L88 4z" />
        <path d="M88 4V1" />
        {/* clock */}
        <circle cx="88" cy="31" r="6" />
        <path d="M88 31V27.5M88 31l2.6 1.8" />
        {/* tower windows: two pointed arches */}
        <path d="M80 60V48a3 3 0 0 1 6 0v12M90 60V48a3 3 0 0 1 6 0v12" />
        {/* left wing: roof, gable, parapet */}
        <path d="M70 34H26L14 22 2 34V60" />
        <path d="M26 34V60M14 22V18" />
        <path d="M70 40H2" strokeWidth="0.8" />
        {/* left wing windows */}
        <path d="M36 60V49a2.5 2.5 0 0 1 5 0v11M48 60V49a2.5 2.5 0 0 1 5 0v11M60 60V49a2.5 2.5 0 0 1 5 0v11" />
        <path d="M11 60V50a3 3 0 0 1 6 0v10" />
        {/* right wing, mirrored */}
        <path d="M106 34h44l12-12 12 12V60" />
        <path d="M150 34V60M162 22V18" />
        <path d="M106 40h68" strokeWidth="0.8" />
        <path d="M111 60V49a2.5 2.5 0 0 1 5 0v11M123 60V49a2.5 2.5 0 0 1 5 0v11M135 60V49a2.5 2.5 0 0 1 5 0v11" />
        <path d="M159 60V50a3 3 0 0 1 6 0v10" />
      </g>
    </svg>
  )
}
