import type { ClubDesktopContent } from '../content/types'
import { eventGroup, nzToday, validDate } from './events'

const groups = ['this week', 'regular sessions', 'upcoming', 'dates to confirm', 'past events']
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function ClubCalendar({ club }: { club: ClubDesktopContent }) {
  const today = nzToday()
  return (
    <div className="club-calendar">
      <p className="desk-fine">Dates and times are from the club’s published information. Confirm details with the club before attending.</p>
      {groups.map((group) => {
        const events = club.events.filter((event) => eventGroup(event, today) === group)
          .sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'))
        if (!events.length) return null
        return (
          <section className="calendar-group" key={group}>
            <h3>{group}</h3>
            <ol className="calendar-events">
              {events.map((event) => {
                const stamp = validDate(event.date)
                const date = stamp === null ? null : new Date(stamp)
                return (
                  <li key={`${event.name}-${event.when}`}>
                    <div className="calendar-tile" aria-hidden="true">
                      {date ? <><strong>{date.getUTCDate()}</strong><small>{date.toLocaleDateString('en-NZ', { month: 'short', timeZone: 'UTC' })}</small></>
                        : <><strong>{event.weekday ? weekdays[event.weekday - 1] : 'TBC'}</strong><small>{event.weekday ? 'regular' : 'date'}</small></>}
                    </div>
                    <div className="calendar-copy">
                      <h4>{event.name}</h4>
                      <p>{event.date ? <time dateTime={event.date}>{event.when}</time> : event.when}</p>
                      {event.where && <p>{event.where}</p>}
                      {event.note && <p className="desk-fine">{event.note}</p>}
                    </div>
                    {event.headline && club.poster && <img className="calendar-poster" src={club.poster.src} alt={club.poster.alt} loading="lazy" />}
                  </li>
                )
              })}
            </ol>
          </section>
        )
      })}
      <p className="desk-fine">{club.comingUpNote}</p>
    </div>
  )
}
