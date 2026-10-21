import { useState } from 'react'
import './hero.css'

/** Reference lockup: the rotating lead above VUW and club on one line. */
export function HeroTitle() {
  const [paused, setPaused] = useState(false)

  return (
    <>
      <div className="hero-heading">
        <h1 id="hero-title" className="hero-title" data-search-anchor aria-label="Find your VUW club.">
          <span className="hero-title__lead" aria-hidden="true">
            <span className="hero-title__intro">
              <span className="hero-word" data-paused={paused || undefined}>
                <span className="hero-word__track">
                  <span>find</span>
                  <span>share</span>
                  <span>find</span>
                </span>
              </span>
              <span>your</span>
            </span>
            <span className="hero-title__line">
              <span className="hero-title__vuw">VUW</span>
              <span className="hero-title__club">club.</span>
            </span>
          </span>
        </h1>
      </div>
      <button
        className="hero-motion-toggle"
        type="button"
        aria-pressed={paused}
        onClick={() => setPaused((current) => !current)}
      >
        {paused ? 'resume title' : 'pause title'}
      </button>
    </>
  )
}
