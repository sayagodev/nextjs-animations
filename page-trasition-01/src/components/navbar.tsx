import Link from "next/link"

export function NavBar() {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <div className="navbar-item">
          <Link href="/">Duskfield</Link>
        </div>
      </div>
      <div className="navbar-items">
        <div className="navbar-item">
          <Link href="/">Genesis</Link>
        </div>
        <div className="navbar-item">
          <Link href="/cascade">Cascade</Link>
        </div>
        <div className="navbar-item">
          <Link href="/orbit">Orbit</Link>
        </div>
      </div>
    </nav>
  )
}
