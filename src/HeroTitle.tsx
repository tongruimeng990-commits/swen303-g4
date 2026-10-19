import { useState } from 'react'
import './hero.css'

/**
 * The title, on a short diagonal through the middle of the screen: "find /
 * share your" over VUW, left of and above the search box (HeroSearch), and
 * "club." just below its right end. No box — the letters are the
 * shape, and green lives only in VUW's misregistered outline. The whole
 * lockup tilts a few degrees against the pointer (--px / --py, written by
 * EditorialPage).
 */
export function HeroTitle() {
  const [paused, setPaused] = useState(false)

  return (
    <>
      <div className="hero-heading">
        <h1 id="hero-title" className="hero-title" aria-label="Find your VUW club.">
          <span className="hero-title__lead" data-search-anchor aria-hidden="true">
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
            <span className="hero-title__vuw" data-text="VUW">
              VUW
            </span>
            <span className="hero-title__uni">
              Te Herenga Waka<span className="hero-title__uni-long"> · Victoria University of Wellington</span>
            </span>
          </span>
          <span className="hero-title__club" aria-hidden="true">club.</span>
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
