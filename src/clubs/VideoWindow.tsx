import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type MouseEvent,
  type PointerEvent,
} from 'react'
import type { ClubVideo } from '../content/types'
import type { DeskObjectProps } from './useDesk'
import { createPlayer, posterUrl, YT_STATE, type YTPlayer } from './youtube'

const BAR_HEIGHT = 30
const CAPTION_HEIGHT = 22
const VIEWPORT_MARGIN = 12
const HEADER_CLEARANCE = 72
const MIN_PLAYER_HEIGHT = 200 // YouTube's embedded player minimum
const STALL_AFTER_MS = 8000
const SOUND_BLOCKED_AFTER_MS = 1500

type LoadState = 'idle' | 'creating' | 'ready' | 'error'

interface VideoWindowProps {
  id: string
  video: ClubVideo
  active: boolean
  dimmed: boolean
  maxScale?: number
  style?: CSSProperties
  /** Drag props from useDesk; the title bar is the handle. */
  desk?: DeskObjectProps
  onFocus: (id: string) => void
  onRelease: (id: string) => void
  onDismiss: () => void
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function VideoWindow({
  id,
  video,
  active,
  dimmed,
  maxScale = 1.5,
  style,
  desk,
  onFocus,
  onRelease,
  onDismiss,
}: VideoWindowProps) {
  const aspect = video.aspect ?? 16 / 9
  const slotRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const wantPlayRef = useRef(false)
  const stallTimer = useRef<number | null>(null)
  const pollTimer = useRef<number | null>(null)

  const [slotWidth, setSlotWidth] = useState(0)
  const [scale, setScale] = useState(1)
  const [anchorH, setAnchorH] = useState<'left' | 'right' | 'center'>('left')
  const [anchorV, setAnchorV] = useState<'top' | 'bottom'>('top')

  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [wantPlay, setWantPlay] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasFrame, setHasFrame] = useState(false)
  const [stalled, setStalled] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(100)
  const [progress, setProgress] = useState({ current: 0, duration: 0 })
  const [posterLarge, setPosterLarge] = useState(false)
  const [posterSrc, setPosterSrc] = useState(() => posterUrl(video.youtubeId, 'small'))
  // Hovering starts playback with sound; `preview` marks the muted fallback
  // used before the visitor's first click, where the first click turns sound on.
  const [preview, setPreview] = useState(false)
  const hoverRef = useRef(false)
  const previewArmed = useRef(false)
  const mutedFallbackTimer = useRef<number | null>(null)

  // Keep the slot's measured width as the collapsed size.
  useLayoutEffect(() => {
    const slot = slotRef.current
    if (!slot) return
    const measure = () => setSlotWidth(slot.getBoundingClientRect().width)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(slot)
    return () => observer.disconnect()
  }, [])

  const clearStallTimer = () => {
    if (stallTimer.current !== null) {
      window.clearTimeout(stallTimer.current)
      stallTimer.current = null
    }
  }

  const armStallTimer = () => {
    clearStallTimer()
    stallTimer.current = window.setTimeout(() => {
      stallTimer.current = null
      if (wantPlayRef.current) setStalled(true)
    }, STALL_AFTER_MS)
  }

  const setWant = (value: boolean) => {
    wantPlayRef.current = value
    setWantPlay(value)
    if (!value) {
      clearStallTimer()
      setStalled(false)
    }
  }

  const ensurePlayer = useCallback((): Promise<YTPlayer> => {
    if (playerRef.current) return Promise.resolve(playerRef.current)
    const host = hostRef.current
    if (!host) return Promise.reject(new Error('player host missing'))
    setLoadState((state) => (state === 'ready' ? state : 'creating'))
    const mount = document.createElement('div')
    host.replaceChildren(mount)
    return createPlayer(mount, video.youtubeId, {
      onStateChange: (event) => {
        const state = event.data
        if (state === YT_STATE.PLAYING) {
          setIsPlaying(true)
          setHasFrame(true)
          setStalled(false)
          clearStallTimer()
        } else if (state === YT_STATE.PAUSED) {
          setIsPlaying(false)
        } else if (state === YT_STATE.ENDED) {
          setIsPlaying(false)
          setWant(false)
          setProgress((p) => ({ ...p, current: p.duration }))
        }
      },
      onError: () => {
        setLoadState('error')
        setIsPlaying(false)
        setWant(false)
      },
    })
      .then((player) => {
        playerRef.current = player
        setLoadState('ready')
        setMuted(player.isMuted())
        setVolume(player.getVolume())
        return player
      })
      .catch((error: unknown) => {
        setLoadState('error')
        throw error
      })
  }, [video.youtubeId])

  const play = useCallback(() => {
    setWant(true)
    armStallTimer()
    ensurePlayer()
      .then((player) => {
        if (wantPlayRef.current) player.playVideo()
      })
      .catch(() => {
        setWant(false)
      })
  }, [ensurePlayer])

  const pause = useCallback(() => {
    setWant(false)
    playerRef.current?.pauseVideo()
    setIsPlaying(false)
  }, [])

  const togglePlay = () => {
    if (isPlaying || wantPlay) pause()
    else play()
  }

  const retry = () => {
    const player = playerRef.current
    playerRef.current = null
    try {
      player?.destroy()
    } catch {
      // ignore
    }
    setLoadState('idle')
    setHasFrame(false)
    play()
  }

  // Measure anchor and clamp the scale whenever the window becomes active.
  useLayoutEffect(() => {
    if (!active) return
    const slot = slotRef.current
    if (!slot) return
    const rect = slot.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const centerX = rect.left + rect.width / 2
    const roomLeftAnchored = vw - rect.left - VIEWPORT_MARGIN
    const roomRightAnchored = rect.right - VIEWPORT_MARGIN
    const roomCentered = 2 * Math.min(centerX - VIEWPORT_MARGIN, vw - centerX - VIEWPORT_MARGIN)
    const wantedWidth = rect.width * maxScale
    // Grow away from the nearer viewport edge; on narrow screens, where neither
    // side has room, grow from the centre so the player can reach its minimum size.
    let h: 'left' | 'right' | 'center' = centerX > vw / 2 ? 'right' : 'left'
    const sideRoom = h === 'left' ? roomLeftAnchored : roomRightAnchored
    if (sideRoom < wantedWidth && roomCentered > sideRoom) h = 'center'
    const v: 'top' | 'bottom' = rect.top + rect.height / 2 > vh / 2 ? 'bottom' : 'top'
    const availableWidth = h === 'left' ? roomLeftAnchored : h === 'right' ? roomRightAnchored : roomCentered
    const availableHeight =
      v === 'top' ? vh - rect.top - VIEWPORT_MARGIN : rect.bottom - HEADER_CLEARANCE - VIEWPORT_MARGIN
    const byWidth = availableWidth / rect.width
    const byHeight = ((availableHeight - BAR_HEIGHT - CAPTION_HEIGHT) * aspect) / rect.width
    // Aim for YouTube's 200px minimum player height, but never grow past the viewport.
    const minForPlayer = (MIN_PLAYER_HEIGHT * aspect) / rect.width
    const wanted = Math.max(maxScale, Math.min(minForPlayer, maxScale))
    const next = Math.max(1, Math.min(wanted, byWidth, byHeight))
    setAnchorH(h)
    setAnchorV(v)
    setScale(Number.isFinite(next) ? next : 1)
    setPosterLarge(true)
  }, [active, aspect, maxScale])

  // Upgrade the poster once the window has ever been focused.
  useEffect(() => {
    if (!posterLarge) return
    const large = posterUrl(video.youtubeId, 'large')
    const probe = new Image()
    probe.onload = () => setPosterSrc(large)
    probe.src = large
  }, [posterLarge, video.youtubeId])

  // Losing focus pauses playback but keeps the player (and its position).
  useEffect(() => {
    if (active) return
    if (playerRef.current && (wantPlayRef.current || isPlaying)) {
      playerRef.current.pauseVideo()
    }
    setWant(false)
    setIsPlaying(false)
    setPreview(false)
    previewArmed.current = false
    if (mutedFallbackTimer.current !== null) {
      window.clearTimeout(mutedFallbackTimer.current)
      mutedFallbackTimer.current = null
    }
  }, [active, isPlaying])

  // Prepare the player as soon as a window is focused so the first click starts faster.
  useEffect(() => {
    if (!active || loadState !== 'idle') return
    ensurePlayer().catch(() => undefined)
  }, [active, loadState, ensurePlayer])

  // Hovering in with a mouse starts playback once the player is ready — with
  // sound when the browser allows it. Browsers only let a page start audible
  // playback after the visitor has clicked or tapped somewhere; before that we
  // fall back to a muted preview and say so, and the first click turns sound on.
  // One preview per hover: pausing it by hand doesn't restart it.
  useEffect(() => {
    if (!active || loadState !== 'ready' || !hoverRef.current || previewArmed.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (wantPlayRef.current || isPlaying) return
    const player = playerRef.current
    if (!player) return
    previewArmed.current = true

    const startMuted = () => {
      const p = playerRef.current
      if (!p) return
      p.mute()
      setMuted(true)
      setPreview(true)
      play()
    }

    const activation = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation
    const mayUseSound = activation ? activation.hasBeenActive : true
    if (!mayUseSound) {
      startMuted()
      return
    }

    player.unMute()
    if (player.getVolume() === 0) player.setVolume(100)
    setMuted(false)
    setPreview(false)
    play()
    // If the browser refused to start audible playback, retry muted.
    mutedFallbackTimer.current = window.setTimeout(() => {
      mutedFallbackTimer.current = null
      const p = playerRef.current
      if (!p || !hoverRef.current || !wantPlayRef.current) return
      if (p.getPlayerState() === YT_STATE.PLAYING) return
      startMuted()
    }, SOUND_BLOCKED_AFTER_MS)
  }, [active, loadState, isPlaying, play])

  useEffect(() => {
    if (isPlaying && mutedFallbackTimer.current !== null) {
      window.clearTimeout(mutedFallbackTimer.current)
      mutedFallbackTimer.current = null
    }
  }, [isPlaying])

  useEffect(
    () => () => {
      if (mutedFallbackTimer.current !== null) window.clearTimeout(mutedFallbackTimer.current)
    },
    [],
  )

  // Poll progress while playing.
  useEffect(() => {
    if (!isPlaying) return
    const tick = () => {
      const player = playerRef.current
      if (!player) return
      setProgress({ current: player.getCurrentTime(), duration: player.getDuration() })
    }
    tick()
    pollTimer.current = window.setInterval(tick, 250)
    return () => {
      if (pollTimer.current !== null) window.clearInterval(pollTimer.current)
      pollTimer.current = null
    }
  }, [isPlaying])

  useEffect(
    () => () => {
      clearStallTimer()
      try {
        playerRef.current?.destroy()
      } catch {
        // ignore
      }
    },
    [],
  )

  const onPointerEnter = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch') return
    hoverRef.current = true
    onFocus(id)
  }

  const onPointerLeave = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch') return
    hoverRef.current = false
    onRelease(id)
  }

  const unmuteForReal = () => {
    const player = playerRef.current
    if (player) {
      player.unMute()
      if (player.getVolume() === 0) player.setVolume(100)
    }
    setMuted(false)
    setPreview(false)
  }

  const onFocusCapture = () => onFocus(id)

  const onBlurCapture = (event: FocusEvent<HTMLElement>) => {
    const next = event.relatedTarget as Node | null
    if (next && cardRef.current?.contains(next)) return
    onRelease(id)
  }

  const onSurfaceClick = () => {
    if (!active) {
      onFocus(id)
      play()
      return
    }
    if (preview) {
      // First click on a hover preview: keep it rolling, just turn the sound on.
      unmuteForReal()
      if (!isPlaying && !wantPlay) play()
      return
    }
    togglePlay()
  }

  const onSeek = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation()
    const player = playerRef.current
    if (!player || !progress.duration) return
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    const target = ratio * progress.duration
    player.seekTo(target, true)
    setProgress((p) => ({ ...p, current: target }))
  }

  const toggleMute = () => {
    const player = playerRef.current
    if (!player) return
    if (player.isMuted()) {
      unmuteForReal()
    } else {
      player.mute()
      setMuted(true)
    }
  }

  const onVolume = (value: number) => {
    const player = playerRef.current
    setVolume(value)
    if (!player) return
    player.setVolume(value)
    if (value > 0 && player.isMuted()) {
      player.unMute()
      setMuted(false)
      setPreview(false)
    }
  }

  const showPoster = !(active && hasFrame)
  const loading = wantPlay && !isPlaying && loadState !== 'error'
  const ratio = progress.duration ? progress.current / progress.duration : 0
  const stateLabel = preview && isPlaying
    ? `Turn on sound for ${video.title}`
    : isPlaying
      ? `Pause ${video.title}`
      : `Play ${video.title}, ${video.duration}`

  return (
    <div
      ref={slotRef}
      className="vwin-slot"
      data-active={active || undefined}
      data-dimmed={dimmed || undefined}
      data-dragging={desk?.['data-dragging']}
      data-moved={desk?.['data-moved']}
      onPointerDown={desk?.onPointerDown}
      onClickCapture={desk?.onClickCapture}
      style={
        {
          ...style,
          ...desk?.style,
          '--aspect': aspect,
          '--vwin-h': slotWidth ? `${BAR_HEIGHT + slotWidth / aspect + CAPTION_HEIGHT}px` : undefined,
        } as CSSProperties
      }
    >
      <article
        ref={cardRef}
        className="vwin"
        data-open={active || undefined}
        data-h={anchorH}
        data-v={anchorV}
        data-playing={isPlaying || undefined}
        data-preview={(preview && isPlaying) || undefined}
        style={{ '--w': `${slotWidth}px`, '--scale': active ? scale : 1 } as CSSProperties}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onFocusCapture={onFocusCapture}
        onBlurCapture={onBlurCapture}
        aria-label={`${video.file} video window`}
      >
        <header className="vwin__bar">
          <span className="vwin__lights">
            <button
              type="button"
              className="vwin__close"
              aria-label={`Close ${video.file}`}
              tabIndex={active ? 0 : -1}
              onClick={(event) => {
                event.stopPropagation()
                pause()
                onDismiss()
              }}
            >
              <i />
            </button>
            <i />
            <i />
          </span>
          <span className="vwin__title">{video.title}</span>
        </header>

        <div className="vwin__media">
          <div className="vwin__player" ref={hostRef} aria-hidden="true" />

          <img
            className="vwin__poster"
            src={posterSrc}
            alt=""
            data-hidden={!showPoster || undefined}
            draggable={false}
          />

          <button
            type="button"
            className="vwin__surface"
            aria-label={stateLabel}
            aria-pressed={isPlaying}
            onClick={onSurfaceClick}
          >
            <span className="vwin__badge" data-loading={loading || undefined} aria-hidden="true">
              {loading ? <i className="vwin__spinner" /> : <i className={isPlaying ? 'vwin__glyph-pause' : 'vwin__glyph-play'} />}
            </span>
          </button>

          {preview && isPlaying ? (
            <span className="vwin__hint" aria-hidden="true">muted · click for sound</span>
          ) : null}

          {active && loadState === 'error' ? (
            <div className="vwin__status" role="status">
              <span>couldn’t load this clip</span>
              <button type="button" onClick={(event) => { event.stopPropagation(); retry() }}>retry</button>
            </div>
          ) : null}
          {active && loadState !== 'error' && stalled ? (
            <div className="vwin__status" role="status">
              <span>still loading…</span>
              <button type="button" onClick={(event) => { event.stopPropagation(); retry() }}>retry</button>
            </div>
          ) : null}

          <div className="vwin__controls" data-visible={active || undefined}>
            <button
              type="button"
              className="vwin__mute"
              aria-label={muted ? 'Unmute' : 'Mute'}
              aria-pressed={muted}
              tabIndex={active ? 0 : -1}
              disabled={loadState !== 'ready'}
              onClick={(event) => { event.stopPropagation(); toggleMute() }}
            >
              <i data-muted={muted || undefined} />
            </button>
            <input
              className="vwin__volume"
              type="range"
              min={0}
              max={100}
              value={muted ? 0 : volume}
              aria-label="Volume"
              tabIndex={active ? 0 : -1}
              disabled={loadState !== 'ready'}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => onVolume(Number(event.target.value))}
            />
            <span className="vwin__time">
              {formatTime(progress.current)} / {progress.duration ? formatTime(progress.duration) : video.duration}
            </span>
          </div>

          <div
            className="vwin__progress"
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(ratio * 100)}
            tabIndex={-1}
            onClick={onSeek}
          >
            <i style={{ transform: `scaleX(${ratio})` }} />
          </div>
        </div>

        <footer className="vwin__caption">
          <span>{video.file}</span>
          <span>{video.duration} · {video.credit}</span>
        </footer>
      </article>
    </div>
  )
}
