import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './About.css'

const PALETTE_GROUPS = [
  {
    id: 'hypColorBasic',
    label: 'basic',
    options: [
      'prettyPink', 'cherryRed', 'tangyOrange', 'glitterGold',
      'leafyGreen', 'seafoamTeal', 'berryBlue', 'perfectPurple',
    ],
  },
  {
    id: 'hypColorPremium',
    label: 'premium',
    options: [
      'bubblegumCrisis', 'pinkLemonade', 'hatsuneMiku', 'unicornDust',
      'appleOrchard', 'retroGamer', 'summerSunshine', 'citrusTwist',
      'goldfishPond', 'lightningBolt', 'mayFlowers', 'melonSlice',
      'blindJustice', 'greenerGrass', 'circusTent', 'popsicleStick',
      'blueberryLemonade', 'gamecubeController', 'mulberryBush',
      'jokerBaby', 'dixieCup',
    ],
  },
  {
    id: 'hypColorSpecial',
    label: 'special',
    options: [
      'preciousMetals', 'cyberPunk', 'cyberPink', 'sourCandies',
      'coffeeCake', 'neaPolitan', 'pikaPika', 'camoGear',
      'peppermintPatty',
    ],
  },
  {
    id: 'hypColorMonochrome',
    label: 'monochrome',
    monochrome: true,
    options: [
      'pastelGoth', 'vampireBlood', 'jackoLantern', 'bumbleBee',
      'getSlimed', 'winterNight', 'brutalistBlue', 'witchingHour',
      'doberMann', 'newsPrint', 'paintBlack',
    ],
  },
  {
    id: 'hypColorHoliday',
    label: 'holiday',
    options: [
      'thanksGiving', 'halloWeen', 'stPatrick', 'easTer', 'newYear',
      'kwanZaa', 'valentinesDay', 'hanuKkah',
    ],
  },
]

function prettyLabel(value) {
  return value.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()
}

function read(key, fallback) {
  const v = localStorage.getItem(key)
  return v === null ? fallback : v
}

function isDarkTheme() {
  return document.documentElement.classList.contains('dark-theme')
}

export default function About() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [dark, setDark] = useState(isDarkTheme)
  const [contrast, setContrast] = useState(
    () => read('nuelnexus-contrast', 'false') === 'true',
  )
  const [palette, setPalette] = useState('defaultPalette')
  const [fontSize, setFontSize] = useState(() =>
    Number(read('nuelnexus-font', 14)),
  )
  const [lineHeight, setLineHeight] = useState(() =>
    Number(read('nuelnexus-lh', 22)),
  )

  useEffect(() => {
    const onThemeChange = (e) => setDark(e.detail.dark)
    window.addEventListener('themechange', onThemeChange)
    return () => window.removeEventListener('themechange', onThemeChange)
  }, [])

  useEffect(
    () => localStorage.setItem('nuelnexus-contrast', String(contrast)),
    [contrast],
  )
  useEffect(() => localStorage.setItem('nuelnexus-font', String(fontSize)), [
    fontSize,
  ])
  useEffect(
    () => localStorage.setItem('nuelnexus-lh', String(lineHeight)),
    [lineHeight],
  )

  useEffect(() => {
    document.title = 'About — Emmanuel Okuntade · NuelNexus'
    return () => {
      document.title = 'Emmanuel Okuntade · NuelNexus'
    }
  }, [])

  function applyPalette(value, monochrome) {
    setPalette(
      value === 'default'
        ? 'defaultPalette'
        : monochrome
          ? `${value} monochrome`
          : value,
    )
  }

  function nudgeFont(delta) {
    setFontSize((f) => Math.min(32, Math.max(8, f + delta)))
  }

  function nudgeLineHeight(delta) {
    setLineHeight((l) => Math.min(41, Math.max(17, l + delta)))
  }

  function resetFont() {
    setFontSize(14)
    setLineHeight(22)
  }

  return (
    <section
      id="about"
      className={`about ${dark ? 'darkmode' : ''}`}
      style={{
        '--fontSize': `${fontSize}px`,
        '--lineHeight': `${lineHeight}px`,
      }}
      aria-label="About Emmanuel Okuntade"
    >
      <div className={`hyp ${palette} ${contrast ? 'contrastmode' : ''}`}>
        <div className="hyp-menu">
          <input
            type="checkbox"
            id="hyp-main-menu"
            checked={menuOpen}
            onChange={(e) => setMenuOpen(e.target.checked)}
          />
          <label htmlFor="hyp-main-menu" className="hyp-menu-click">
            <div className="hyp-menu-click1">
              <div className="hyp-menu-click2">
                <div>
                  <i className="ph-duotone ph-hand-pointing" />
                </div>
              </div>
            </div>
            <div className="hyp-menu-click3">menu</div>
          </label>

          <div className="hyp-main-menu">
            <label htmlFor="hyp-main-menu">get me outta here!</label>
            <br />
            <br />
            <p className="hyp-menu-blurb">
              welcome to my corner of the web — make yourself at home.
              tweak the look, pick a palette, and set your reading comfort.
              your choices are saved on this device.
            </p>
            <br />
            <span className="hyp-menu-section">appearance</span>
            <br />
            low contrast mode:{' '}
            <span
              id="contrastmode"
              role="button"
              tabIndex={0}
              onClick={() => setContrast((c) => !c)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setContrast((c) => !c)
                }
              }}
            >
              click me!
            </span>
            <br />
            <br />
            <span className="hyp-menu-section">text</span>
            <br />
            font size
            <button
              id="font-up"
              onClick={() => {
                nudgeFont(1)
                nudgeLineHeight(1)
              }}
            >
              +
            </button>
            <button id="font-reset" onClick={resetFont}>
              /
            </button>
            <button
              id="font-down"
              onClick={() => {
                nudgeFont(-1)
                nudgeLineHeight(-1)
              }}
            >
              -
            </button>
            <br />
            <br />
            <span className="hyp-menu-section">palette</span>
            {PALETTE_GROUPS.map((group) => (
              <div key={group.id}>
                <select
                  id={group.id}
                  name={group.id}
                  defaultValue="default"
                  onChange={(e) =>
                    applyPalette(e.target.value, group.monochrome)
                  }
                >
                  <option value="default">default</option>
                  {group.options.map((option) => (
                    <option key={option} value={option}>
                      {prettyLabel(option)}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <div className="hyp-main-menu-colors">
              <div />
              <div />
            </div>
          </div>

          <div className="hyp-menu-divide">
            <div />
          </div>
          <div className="hyp-menu-links">
            <a href="#hypTop" title="Back to top"><i className="ph ph-arrow-circle-up" /></a>
            <Link to="/" className="home" title="Home"><i className="ph ph-house" /></Link>
            <Link to="/#achievements" title="Achievements"><i className="ph ph-trophy" /></Link>
            <Link to="/#contact" title="Contact"><i className="ph ph-paper-plane-tilt" /></Link>
            <Link to="/#skills" title="Skills"><i className="ph ph-wrench" /></Link>
            <a href="#hypBot" title="To the bottom"><i className="ph ph-arrow-circle-down" /></a>
          </div>
          <div className="hyp-menu-divide">
            <div />
          </div>

          <Link to="/" className="hyp-menu-topr">
            <div className="hyp-banner-topr2">
              NUEL<b>NEXUS</b>
            </div>
          </Link>
        </div>
        <div className="hyp-slant" />

        <div className="hyp-body">
          <div id="hypTop" />

          <div className="hyp-wrapper">
            <div className="hyp-ban">
              <div className="hyp-banner">
                <div className="hyp-banner-top">
                  <div className="hyp-banner-top1">
                    <div className="hyp-banner-sub">
                      <i />
                      <b>creative</b>developer
                    </div>
                    <div className="hyp-banner-sub">
                      <i />
                      <b>web</b>experiences
                    </div>
                    <div className="hyp-banner-sub">
                      <i />
                      <b>open</b>to work
                    </div>
                    <div className="hyp-banner-topr">
                      <div className="hyp-banner-icon">
                        <div className="hyp-banner-icon1">
                          <div style={{ backgroundImage: 'url(/char.png)' }} />
                        </div>
                      </div>
                      <div className="hyp-banner-topr2">
                        NUEL<b>NEXUS</b>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="hyp-banner-left">
                  <div className="hyp-banner-name">
                    NUEL<b>NEXUS</b>
                    <div className="hyp-banner-tag">emmanuel okuntade</div>
                  </div>
                  <div className="hyp-banner-blurb">
                    <div>
                      Hi, I&apos;m <b>Emmanuel Okuntade</b> — better known
                      online as <i>NuelNexus</i>. I&apos;m a creative developer
                      who believes the web should be <b>fun</b>: playful,
                      <i> interactive</i> experiences, one scroll at a time.
                    </div>
                  </div>
                  <Link to="/#contact" className="hyp-banner-event">
                    <div className="hyp-banner-event-icon">
                      <i className="ph-duotone ph-bookmark-simple" />
                    </div>
                    <div className="hyp-banner-event-img" />
                    <div className="hyp-banner-event-left">
                      available
                      <br />
                      for work
                      <div>say hello &rarr;</div>
                    </div>
                    <div className="hyp-banner-event-right">
                      <i className="ph-duotone ph-cursor-click" />
                    </div>
                  </Link>
                  <div className="hyp-banner-event2" />
                </div>
                <div className="hyp-banner-divide">
                  <div />
                </div>
                <div className="hyp-banner-img">
                  <div className="hyp-banner-render-text">
                    <b>nuel</b>
                    <b>nexus</b>
                  </div>
                  <div className="hyp-banner-render" />
                  <div className="hyp-banner-img2">
                    <div />
                  </div>
                  <div className="hyp-banner-img3" />
                </div>
              </div>
            </div>
            <div className="hyp-banner-bot">
              <div />
            </div>

            <div className="hyp-cat">
              <a href="#hypTop" className="hyp-cat1-name">
                <div>
                  nuel<b>nexus</b>
                </div>
                about
              </a>
              <div className="hyp-cat1-links">
                <Link to="/">
                  <div>hello</div>
                  <i className="ph ph-hand-waving" />
                </Link>
                <a href="#frontend">
                  <div>skills</div>
                  <i className="ph ph-ruler" />
                </a>
                <a href="#design">
                  <div>craft</div>
                  <i className="ph ph-palette" />
                </a>
                <a href="#play">
                  <div>code</div>
                  <i className="ph ph-code" />
                </a>
                <Link to="/#contact">
                  <div>contact</div>
                  <i className="ph ph-smiley" />
                </Link>
              </div>
              <div className="hyp-cat1-divide" />
            </div>
            <div className="hyp-cat2">
              <div className="hyp-cat2-left">
                <div />
              </div>
              <span />
              <div className="hyp-cat2-right">
                <div />
              </div>
            </div>

            <div className="hyp-updates">
              <span className="hyp-updates-label">currently</span>
              <ul>
                <li>building this portfolio</li>
                <li>learning three.js</li>
                <li>open to freelance work</li>
              </ul>
            </div>

            <div className="hyp-genres" id="skills">
              <div className="hyp-genres-left">
                <div className="hyp-genres-anchor">
                  <a href="#frontend">frontend</a>
                  <a href="#design">design</a>
                  <a href="#play">play</a>
                </div>
              </div>
              <div className="hyp-genres-right">
                <div className="hyp-genre" id="frontend">
                  <div className="hyp-genre-left" />
                  <div className="hyp-genre-right">
                    <div className="hyp-genre-top">
                      <div className="hyp-genre-icon">
                        <i className="ph-duotone ph-code" />
                      </div>
                      <a href="#frontend" className="hyp-genre-name">
                        frontend
                      </a>
                      <div className="hyp-genre-desc">
                        I care about the details — layout, motion, and the
                        little interactions that make a site feel
                        <b> alive</b>. Modern, accessible, and a little{' '}
                        <i>playful</i>.
                      </div>
                    </div>
                    <div className="hyp-genre-bot">
                      <input
                        type="radio"
                        name="about-subs-frontend"
                        id="about-sub-frontend-1"
                        defaultChecked
                      />
                      <label className="hyp-subgenre-label" htmlFor="about-sub-frontend-1">
                        react
                      </label>
                      <input
                        type="radio"
                        name="about-subs-frontend"
                        id="about-sub-frontend-2"
                      />
                      <label className="hyp-subgenre-label" htmlFor="about-sub-frontend-2">
                        css
                      </label>
                      <input
                        type="radio"
                        name="about-subs-frontend"
                        id="about-sub-frontend-3"
                      />
                      <label className="hyp-subgenre-label" htmlFor="about-sub-frontend-3">
                        three.js
                      </label>

                      <div className="hyp-subgenre about-sub-frontend-1">
                        Component-driven interfaces with React — fast, clean,
                        and fun to build.
                      </div>
                      <div className="hyp-subgenre about-sub-frontend-2">
                        Scroll-driven animation, layout systems, and design
                        that moves with the user.
                      </div>
                      <div className="hyp-subgenre about-sub-frontend-3">
                        3D scenes and WebGL in the browser — like this very
                        portfolio.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hyp-genre" id="design">
                  <div className="hyp-genre-left" />
                  <div className="hyp-genre-right">
                    <div className="hyp-genre-top">
                      <div className="hyp-genre-icon">
                        <i className="ph-duotone ph-palette" />
                      </div>
                      <a href="#design" className="hyp-genre-name">
                        design
                      </a>
                      <div className="hyp-genre-desc">
                        Good code deserves good looks. I sweat the visual
                        details — type, colour, and spacing — until the whole
                        thing <b>clicks</b>.
                      </div>
                    </div>
                    <div className="hyp-genre-bot">
                      <input
                        type="radio"
                        name="about-subs-design"
                        id="about-sub-design-1"
                        defaultChecked
                      />
                      <label className="hyp-subgenre-label" htmlFor="about-sub-design-1">
                        ui
                      </label>
                      <input
                        type="radio"
                        name="about-subs-design"
                        id="about-sub-design-2"
                      />
                      <label className="hyp-subgenre-label" htmlFor="about-sub-design-2">
                        motion
                      </label>

                      <div className="hyp-subgenre about-sub-design-1">
                        Interfaces that are clear, consistent, and pleasant to
                        use.
                      </div>
                      <div className="hyp-subgenre about-sub-design-2">
                        Subtle animation that guides the eye and tells the
                        story.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hyp-genre" id="play">
                  <div className="hyp-genre-left" />
                  <div className="hyp-genre-right">
                    <div className="hyp-genre-top">
                      <div className="hyp-genre-icon">
                        <i className="ph-duotone ph-smiley" />
                      </div>
                      <a href="#play" className="hyp-genre-name">
                        play
                      </a>
                      <div className="hyp-genre-desc">
                        The web should be <b>fun</b>. Experiments, toys, and
                        side projects are where I learn the most.
                      </div>
                    </div>
                    <div className="hyp-genre-bot">
                      <input
                        type="radio"
                        name="about-subs-play"
                        id="about-sub-play-1"
                        defaultChecked
                      />
                      <label className="hyp-subgenre-label" htmlFor="about-sub-play-1">
                        experiments
                      </label>
                      <input
                        type="radio"
                        name="about-subs-play"
                        id="about-sub-play-2"
                      />
                      <label className="hyp-subgenre-label" htmlFor="about-sub-play-2">
                        games
                      </label>
                      <input
                        type="radio"
                        name="about-subs-play"
                        id="about-sub-play-3"
                      />
                      <label className="hyp-subgenre-label" htmlFor="about-sub-play-3">
                        open source
                      </label>

                      <div className="hyp-subgenre about-sub-play-1">
                        Small demos and prototypes — the weirder the better.
                      </div>
                      <div className="hyp-subgenre about-sub-play-2">
                        Tiny browser games and interactive stories.
                      </div>
                      <div className="hyp-subgenre about-sub-play-3">
                        Giving back, one pull request at a time.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="hyp-signoff">
            <div className="hyp-signoff-line">
              <div />
            </div>
            <p>
              thanks for stopping by — <b>nuel nexus</b>
            </p>
          </div>
          <div id="hypBot" />
        </div>
      </div>
    </section>
  )
}
