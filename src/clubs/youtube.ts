// Minimal, lazily loaded wrapper around the YouTube IFrame Player API.
// The script is only requested the first time a video window is focused.

export const YT_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const

export interface YTPlayer {
  playVideo(): void
  pauseVideo(): void
  seekTo(seconds: number, allowSeekAhead: boolean): void
  mute(): void
  unMute(): void
  isMuted(): boolean
  setVolume(volume: number): void
  getVolume(): number
  getCurrentTime(): number
  getDuration(): number
  getPlayerState(): number
  destroy(): void
}

interface YTPlayerEvent {
  target: YTPlayer
  data: number
}

interface YTPlayerOptions {
  host?: string
  videoId: string
  width?: string | number
  height?: string | number
  playerVars?: Record<string, string | number>
  events?: {
    onReady?: (event: YTPlayerEvent) => void
    onStateChange?: (event: YTPlayerEvent) => void
    onError?: (event: YTPlayerEvent) => void
  }
}

interface YTNamespace {
  Player: new (element: HTMLElement, options: YTPlayerOptions) => YTPlayer
}

declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

let apiPromise: Promise<YTNamespace> | null = null

export function loadYouTubeApi(): Promise<YTNamespace> {
  if (apiPromise) return apiPromise
  apiPromise = new Promise<YTNamespace>((resolve, reject) => {
    if (window.YT?.Player) {
      resolve(window.YT)
      return
    }
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      if (window.YT) resolve(window.YT)
      else reject(new Error('YouTube API loaded without YT namespace'))
    }
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true
    script.onerror = () => {
      apiPromise = null
      reject(new Error('Could not load the YouTube player script'))
    }
    document.head.appendChild(script)
  })
  return apiPromise
}

export function createPlayer(
  element: HTMLElement,
  videoId: string,
  events: NonNullable<YTPlayerOptions['events']>,
): Promise<YTPlayer> {
  return loadYouTubeApi().then(
    (YT) =>
      new Promise<YTPlayer>((resolve) => {
        const player = new YT.Player(element, {
          host: 'https://www.youtube-nocookie.com',
          videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            controls: 0,
            rel: 0,
            playsinline: 1,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              events.onReady?.(event)
              resolve(event.target)
            },
            onStateChange: events.onStateChange,
            onError: events.onError,
          },
        })
      }),
  )
}

export function posterUrl(videoId: string, size: 'small' | 'large') {
  return size === 'small'
    ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
    : `https://i.ytimg.com/vi/${videoId}/hq720.jpg`
}
