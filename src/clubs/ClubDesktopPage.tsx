import { useCallback, useRef, useState, type CSSProperties } from 'react'
import type { ClubDesktopContent } from '../content/types'
import { DesktopIcon } from './DesktopIcon'
import { Lightbox } from './Lightbox'
import { MacWindow } from './MacWindow'
import { VideoWindow } from './VideoWindow'
import { useActiveVideo } from './useActiveVideo'
import { useDesk, type DeskObjectProps } from './useDesk'
import { usePins } from '../lib/pins'
import { Shortlist } from '../shortlist/Shortlist'

type Opened =
  | { kind: 'photo'; index: number }
  | { kind: 'poster' }
  | { kind: 'gallery' }
  | null

const navigation = [
  { label: 'what’s on', href: '#this-week' },
  { label: 'watch', href: '#watch' },
  { label: 'first time?', href: '#first-time' },
  { label: 'say hi', href: '#say-hi' },
]

export function ClubDesktopPage({ club }: { club: ClubDesktopContent }) {
  const [opened, setOpened] = useState<Opened>(null)
  const close = useCallback(() => setOpened(null), [])
  const videoFocus = useActiveVideo()
  const pins = usePins()
  const pinned = pins.isPinned(club.slug)
  const objectsRef = useRef<HTMLDivElement>(null)
  const desk = useDesk(club.slug, objectsRef)

  const heroPhotos = club.photos.slice(0, 3)
  const heroVideos = club.videos.slice(0, 2)

  const videoWindow = (
    scope: 'hero' | 'grid',
    video: ClubDesktopContent['videos'][number],
    style?: CSSProperties,
    deskProps?: DeskObjectProps,
  ) => {
    const id = `${scope}:${video.youtubeId}`
    return (
      <VideoWindow
        key={id}
        id={id}
        video={video}
        active={videoFocus.activeId === id}
        dimmed={videoFocus.activeId !== null && videoFocus.activeId !== id}
        maxScale={scope === 'hero' ? 1.5 : 1.4}
        style={style}
        desk={deskProps}
        onFocus={videoFocus.focus}
        onRelease={videoFocus.release}
        onDismiss={videoFocus.dismiss}
      />
    )
  }

  return (
    <main className="desk" data-club={club.slug} data-video-active={videoFocus.activeId !== null || undefined}>
      <header className="desk-header">
        <a className="desk-brand" href="/" aria-label="vuw clubs home">
          <span>vuw</span>
          <span>clubs.</span>
          <span className="desk-brand__crumb">/ {club.slug}</span>
        </a>
        <nav aria-label="Club page sections">
          {navigation.map((item) => (
            <a key={item.href} href={item.href}>{item.label}</a>
          ))}
        </nav>
      </header>

      <section className="desk-hero" aria-labelledby="club-title">
        <div
          ref={objectsRef}
          className="desk-hero__objects"
          aria-label="Desktop files"
          data-dragging={desk.dragging || undefined}
        >
          <button
            type="button"
            className="name-sticker"
            {...desk.objectProps('name', { style: { '--slot': 0 } as CSSProperties })}
            onClick={() => setOpened({ kind: 'photo', index: 0 })}
            aria-label={`Open ${club.name} group photo`}
          >
            <span className="name-sticker__head">
              <b>hello</b>
              <small>my name is</small>
            </span>
            <span className="name-sticker__name">{club.name}</span>
          </button>

          <DesktopIcon
            kind="sticker"
            label="badge.png"
            image={club.sticker.src}
            {...desk.objectProps('badge', { style: { '--slot': 1 } as CSSProperties })}
            onOpen={() => setOpened({ kind: 'gallery' })}
          />

          {club.poster ? (
            <DesktopIcon
              kind="jpg"
              label="poster.jpg"
              image={club.poster.src}
              {...desk.objectProps('poster', { style: { '--slot': 2 } as CSSProperties })}
              onOpen={() => setOpened({ kind: 'poster' })}
            />
          ) : null}

          {heroVideos.map((video, index) =>
            videoWindow(
              'hero',
              video,
              undefined,
              desk.objectProps(`video:${video.youtubeId}`, {
                handle: '.vwin__bar',
                style: { '--slot': 3 + index } as CSSProperties,
              }),
            ),
          )}

          {heroPhotos.map((photo, index) => (
            <DesktopIcon
              key={photo.src}
              kind="jpg"
              label={photo.src.split('/').pop() ?? 'photo.jpg'}
              image={photo.src}
              {...desk.objectProps(`photo:${photo.src}`, { style: { '--slot': 5 + index } as CSSProperties })}
              onOpen={() => setOpened({ kind: 'photo', index })}
            />
          ))}

          <DesktopIcon
            kind="folder"
            label="photos"
            {...desk.objectProps('folder', { style: { '--slot': 8 } as CSSProperties })}
            onOpen={() => setOpened({ kind: 'gallery' })}
          />
        </div>

        <div className="desk-hero__copy">
          <h1 id="club-title" className="desk-hero__title">{club.hello}</h1>
          <p className="desk-meets">
            <span className="desk-meets__line">{club.meets.line}</span>
            <span className="desk-meets__dot" aria-hidden="true">·</span>
            <span className="desk-meets__room">{club.meets.room}</span>
          </p>
          <p className="desk-meets__caveat">{club.meets.caveat}</p>
          <div className="desk-hero__actions">
            <a className="desk-button desk-button--primary" href="#this-week">what’s on this week</a>
            <a className="desk-button" href="#say-hi">say hi</a>
            <button
              type="button"
              className="desk-button desk-button--pin"
              aria-pressed={pinned}
              onClick={() => pins.toggle(club.slug)}
            >
              <span className="desk-button__pin" aria-hidden="true" />
              {pinned ? 'pinned to my desk' : 'pin to my desk'}
            </button>
          </div>
          <p className="desk-pin-note" aria-live="polite">
            {pinned
              ? `${club.name} comes up first on the clubs page now · saved in this browser only`
              : 'pinned clubs come up first on the clubs page · saved in this browser only'}
          </p>
          {desk.moved ? (
            <button type="button" className="desk-tidy" onClick={desk.reset}>
              tidy desk
            </button>
          ) : null}
        </div>
      </section>

      <div className="desk-windows">
        <MacWindow id="this-week" title="this-week.txt" className="desk-window--mail">
          <p className="mail-subject">
            <span>subject</span>
            {club.thisWeek.subject}
          </p>
          {club.thisWeek.lines.map((line, index) => (
            <p key={index}>{line}</p>
          ))}
          <p className="mail-footer">
            <span>where</span>
            {club.meets.room}. {club.meets.directions}
          </p>
        </MacWindow>

        <MacWindow id="first-time" title="first-time.note" className="desk-window--note">
          <ul className="note-list">
            {club.firstTime.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </MacWindow>

        <MacWindow id="watch" title={club.watch.file} className="desk-window--videos">
          <p className="desk-lead">{club.watch.lead}</p>
          <div className="video-desk">
            {club.videos.map((video) => videoWindow('grid', video))}
          </div>
        </MacWindow>


        <MacWindow id="members" title={club.quotesFile} className="desk-window--wall">
          <div className="quote-wall">
            {club.quotes.map((quote, index) => (
              <blockquote key={index} className="quote-card" style={{ '--n': index } as CSSProperties}>
                <p>“{quote.text}”</p>
                <footer>{quote.by}</footer>
              </blockquote>
            ))}
          </div>
        </MacWindow>

        <MacWindow id="coming-up" title="coming-up.ics" className="desk-window--events">
          <ol className="event-list">
            {club.comingUp.map((event) => (
              <li key={event.name}>
                <span className="event-list__when">{event.when}</span>
                <span className="event-list__name">{event.name}</span>
                {event.where ? <span className="event-list__where">{event.where}</span> : null}
                {event.note ? <span className="event-list__note">{event.note}</span> : null}
              </li>
            ))}
          </ol>
          <p className="desk-fine">{club.comingUpNote}</p>
        </MacWindow>

        <MacWindow id="say-hi" title="say-hi.mail" className="desk-window--contact">
          <ul className="contact-list">
            <li>
              <span>email</span>
              <a href={`mailto:${club.contact.email}`}>{club.contact.email}</a>
            </li>
            {club.contact.mailingList ? (
              <li>
                <span>mailing list</span>
                <a href={club.contact.website} target="_blank" rel="noreferrer">{club.contact.mailingList}</a>
              </li>
            ) : null}
            {club.contact.facebook ? (
              <li>
                <span>facebook</span>
                <a href={club.contact.facebook} target="_blank" rel="noreferrer">{club.fullName}</a>
              </li>
            ) : null}
            {club.contact.instagram ? (
              <li>
                <span>instagram</span>
                <a href={club.contact.instagram} target="_blank" rel="noreferrer">{club.contact.instagramHandle ?? 'instagram'}</a>
              </li>
            ) : null}
            {club.contact.website ? (
              <li>
                <span>website</span>
                <a href={club.contact.website} target="_blank" rel="noreferrer">{club.contact.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a>
              </li>
            ) : null}
          </ul>
          <p className="desk-fine">{club.sayHiNote}</p>
        </MacWindow>
      </div>

      <footer className="desk-footer">
        <a href="/">← back to all clubs</a>
        <span>photos and videos belong to {club.name} and the people credited.</span>
      </footer>

      <Shortlist tone="light" />

      {opened?.kind === 'photo' ? (
        <Lightbox title={club.photos[opened.index].src.split('/').pop() ?? 'photo'} onClose={close}>
          <img className="lightbox__image" src={club.photos[opened.index].src} alt={club.photos[opened.index].alt} />
        </Lightbox>
      ) : null}
      {opened?.kind === 'poster' && club.poster ? (
        <Lightbox title="poster.jpg" onClose={close}>
          <img className="lightbox__image" src={club.poster.src} alt={club.poster.alt} />
        </Lightbox>
      ) : null}
      {opened?.kind === 'gallery' ? (
        <Lightbox title="photos" onClose={close}>
          <div className="gallery-grid">
            {club.photos.map((photo, index) => (
              <button
                key={photo.src}
                type="button"
                className="gallery-grid__item"
                data-portrait={photo.portrait || undefined}
                aria-label={`Open ${photo.alt}`}
                onClick={() => setOpened({ kind: 'photo', index })}
              >
                <img src={photo.src} alt={photo.alt} loading="lazy" />
              </button>
            ))}
          </div>
        </Lightbox>
      ) : null}
    </main>
  )
}
