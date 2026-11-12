import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

function MainLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={isMenuOpen}
        onNavigate={() => setIsMenuOpen(false)}
      />
      {isMenuOpen && (
        <button
          className="app-layout__backdrop"
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
      <div className="app-shell">
        <Topbar
          isMenuOpen={isMenuOpen}
          onMenuClick={() => setIsMenuOpen((open) => !open)}
        />
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout