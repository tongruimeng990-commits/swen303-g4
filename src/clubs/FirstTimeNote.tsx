import type { ClubDesktopContent } from '../content/types'

/**
 * first-time.note: the three or four things to know before turning up, as
 * one short list. What to bring (or not) joins the same list with a ✓/✗
 * marker; when/where and costs are a line each underneath. The longer
 * background (`goodToKnow`) stays in the data but isn't on the desk; the
 * Iteration 2 review found the full block too long to read as a note.
 */
export function FirstTimeNote({ club }: { club: ClubDesktopContent }) {
  return (
    <div className="note-sheet">
      <ul className="note-points">
        {club.essentials.map((point) => <li key={point}>{point}</li>)}
        {club.bring.yes.map((item) => <li key={`yes:${item}`} data-mark="yes"><span aria-hidden="true">✓</span><span className="visually-hidden">bring </span>{item}</li>)}
        {club.bring.no.map((item) => <li key={`no:${item}`} data-mark="no"><span aria-hidden="true">✗</span>{item}</li>)}
      </ul>
      <dl className="note-lines">
        <div>
          <dt>when</dt>
          <dd>{club.meets.line} · {club.meets.room}</dd>
        </div>
        <div>
          <dt>costs</dt>
          <dd>
            {club.costs.length
              ? club.costs.map((cost) => (
                  <span key={cost.label}>
                    {cost.label.toLowerCase()} <b>{cost.price.toLowerCase()}</b>
                  </span>
                ))
              : 'not published. ask the club.'}
          </dd>
        </div>
      </dl>
    </div>
  )
}
