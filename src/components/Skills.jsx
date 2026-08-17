import { useEffect, useRef } from 'react'
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
  { name: 'Cybersecurity · Pen Testing', slug: 'kalilinux' },
  { name: 'Machine Learning', slug: 'tensorflow' },
  { name: 'Embedded Systems', slug: 'arduino' },
  { name: 'Hardware', slug: 'hardware' },
  { name: 'Minecraft Modding', slug: 'minecraft', img: '/lang/minecraft.png' },
]

export default function Skills() {
  const gridRef = useRef(null)

  useEffect(() => {
    const cubes = Array.from(gridRef.current.querySelectorAll('.cube'))
    const toggle = (el) => el.classList.toggle('active')
    const onClick = (e) => toggle(e.currentTarget)
    const onKeyUp = (e) => {
      if (e.key === 'Enter') toggle(e.currentTarget)
    }

    cubes.forEach((el) => {
      el.addEventListener('click', onClick)
      el.addEventListener('keyup', onKeyUp)
    })

    return () => {
      cubes.forEach((el) => {
        el.removeEventListener('click', onClick)
        el.removeEventListener('keyup', onKeyUp)
      })
    }
  }, [])

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
        My tools of the trade — click a book to lift it up.
      </p>

      <div className="books-grid" ref={gridRef}>
        {books.map((book, i) => (
          <div className="book" key={book.name}>
            <div
              className="cube"
              tabIndex="0"
              role="button"
              aria-label={`${book.name} book`}
              style={{
                '--book-color': `hsl(${(i * 37) % 360} 55% 42%)`,
                '--book-title': `"${book.name}"`,
              }}
            >
              <div className="cube front face">
                <img
                  width="100"
                  height="100"
                  src={book.img ?? `/lang/${book.slug}.svg`}
                  alt={`${book.name} logo`}
                />
              </div>
              <div className="cube back face" />
              <div className="cube right face" />
              <div className="cube left face" />
              <div className="cube top face" />
              <div className="cube bottom face" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
