import './Skills.css'

const books = [
  { name: 'HTML', slug: 'html5' },
  { name: 'CSS', slug: 'css' },
  { name: 'JavaScript', slug: 'javascript' },
  { name: 'Python', slug: 'python' },
  { name: 'Rust', slug: 'rust' },
  { name: 'Go', slug: 'go' },
  { name: 'C++', slug: 'cplusplus' },
  { name: 'C#', slug: 'csharp' },
  { name: 'C', slug: 'c' },
  { name: 'Java', slug: 'java' },
  { name: 'Cybersecurity', slug: 'kalilinux' },
  { name: 'Machine Learning', slug: 'tensorflow' },
  { name: 'Embedded Systems', slug: 'arduino' },
  { name: 'Hardware', slug: 'hardware' },
  { name: 'Minecraft Modding', slug: 'minecraft', img: '/lang/minecraft.png' },
  { name: 'Git', slug: 'git' },
  { name: 'Automation', slug: 'python' },
  { name: 'Web Dev', slug: 'html5' },
  { name: 'Flask', slug: 'python' },
  { name: 'React', slug: 'javascript' },
  { name: 'Node.js', slug: 'javascript' },
  { name: 'Game Dev', slug: 'cplusplus' },
  { name: 'DaVinci Resolve', slug: 'cplusplus' },
]

const BOOK_COLORS = [
  '#c00000', '#891a21', '#bf3e22', '#0e4326', '#0066cc',
  '#0f7b7e', '#084e6f', '#0b0823', '#38103d', '#443344',
  '#666777', '#735750', '#2a848c', '#8451a6', '#6265b3',
  '#b8860b', '#2d5016', '#1a3a5c', '#8b4513', '#2563eb',
  '#2e7d32', '#6a1b9a', '#c62828',
]

const BOOK_GEO = [
  [2, 11, 14], [4, 11, 15], [6, 10, 16], [8, 10, 14], [10, 11, 15],
  [12, 11, 16], [14, 10, 15], [16, 11, 16], [18, 10, 14], [20, 10, 15],
  [22, 10, 16], [24, 11, 14], [26, 10, 15], [28, 11, 16], [30, 10, 14],
  [32, 11, 15], [34, 10, 16], [36, 11, 14], [38, 10, 15], [40, 11, 16],
  [42, 10, 15], [44, 11, 14], [46, 10, 16],
]

const SHELF = [
  { b: 1, x: 2, y: 1, z: 1, w: 48, d: 14, h: 1 },
  { b: 2, x: 1, y: 14, z: 1, w: 50, d: 1, h: 18 },
  { b: 3, x: 1, y: 1, z: 1, w: 1, d: 13, h: 18 },
  { b: 4, x: 50, y: 1, z: 1, w: 1, d: 13, h: 18 },
  { b: 5, x: 1, y: 1, z: 19, w: 50, d: 14, h: 1 },
]

function blockStyle({ x, y, z, w, d, h }) {
  return {
    '--bx': `${x * 16}px`,
    '--by': `${y * 16}px`,
    '--bz': `${z * 16}px`,
    '--bw': `${w * 16}px`,
    '--bd': `${d * 16}px`,
    '--bh': `${h * 16}px`,
  }
}

function Faces({ book }) {
  return (
    <div className="block-inner">
      <div className="back" />
      <div className="bottom" />
      <div className="front">
        {book && <span className="spine">{book.name}</span>}
      </div>
      <div className="left" />
      <div className="right" data-title={book ? book.name : undefined}>
        {book && (
          <>
            <div className="cover" />
            <div className="contents">
              <img
                width="100"
                height="100"
                src={book.img ?? `/lang/${book.slug}.svg`}
                alt={`${book.name} logo`}
              />
              <strong>{book.name}</strong>
            </div>
          </>
        )}
      </div>
      <div className="top" />
    </div>
  )
}

export default function Skills() {
  return (
    <section
      className="section skills"
      id="skills"
      aria-labelledby="skills-title"
    >
      <h2 className="section__title" id="skills-title">
        Skills
      </h2>
      <p className="section__lede">
        My tools of the trade — click a book to take it off the shelf.
      </p>

      <div className="skills-scene">
        <form className="container">
          {books.map((book, i) => (
            <input
              key={book.name}
              type="radio"
              name="skills-book"
              id={`book${i + 1}`}
              aria-label={`Open ${book.name} book`}
            />
          ))}

          <div className="surface">
            {SHELF.map((s) => (
              <div
                key={s.b}
                className={`block shelf b${s.b}`}
                style={blockStyle(s)}
              >
                <Faces />
              </div>
            ))}

            {books.map((book, i) => {
              const [x, d, h] = BOOK_GEO[i]
              return (
                <label
                  key={book.name}
                  htmlFor={`book${i + 1}`}
                  className={`block book`}
                  style={{
                    ...blockStyle({ x, y: 3, z: 2, w: 2, d, h }),
                    '--bcolor': BOOK_COLORS[i],
                    '--bi': i,
                  }}
                >
                  <Faces book={book} />
                </label>
              )
            })}
          </div>

          <input type="reset" value="Return" />
        </form>
      </div>
    </section>
  )
}
