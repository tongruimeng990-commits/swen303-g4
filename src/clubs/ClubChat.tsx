import type { ClubDesktopContent } from '../content/types'

export function ClubChat({ club }: { club: ClubDesktopContent }) {
  return (
    <div className="club-chat">
      {club.quotes.map((quote, index) => {
        const initials = quote.by.split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase()
        const fromClub = /website|directory/.test(quote.by.toLowerCase()) || quote.by.toLowerCase().includes(club.name.toLowerCase())
        return (
          <div className="chat-reveal" key={`${quote.by}-${index}`}><div className="chat-reveal__inner"><figure className="chat-message" data-alternate={index % 2 === 1 || undefined}>
            <span className="chat-avatar" aria-hidden="true">{fromClub ? <img src={club.sticker.src} alt="" loading="lazy" /> : initials}</span>
            <div>
              <figcaption>{quote.by}</figcaption>
              <blockquote>{quote.text}</blockquote>
            </div>
          </figure></div></div>
        )
      })}
    </div>
  )
}
