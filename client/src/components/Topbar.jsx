import { Bell, Menu, Search, X } from 'lucide-react'
import './Topbar.css'

function Topbar({ isMenuOpen, onMenuClick }) {
  return (
    <header className="topbar">
      <button
        className="topbar__menu"
        type="button"
        aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isMenuOpen}
        aria-controls="leadflow-sidebar"
        onClick={onMenuClick}
      >
        {isMenuOpen ? (
          <X size={20} aria-hidden="true" />
        ) : (
          <Menu size={20} aria-hidden="true" />
        )}
      </button>
      <label className="topbar__search">
        <Search
          className="topbar__search-icon"
          size={18}
          strokeWidth={1.8}
          aria-hidden="true"
        />
        <input
          aria-label="Search"
          type="search"
          placeholder="Search leads, contacts, deals, tickets..."
        />
      </label>

      <div className="topbar__actions">
        <button
          className="topbar__notifications"
          type="button"
          aria-label="Notifications, 3 unread"
        >
          <Bell size={20} strokeWidth={1.8} aria-hidden="true" />
          <span className="topbar__notification-indicator" aria-hidden="true" />
        </button>

        <div className="topbar__profile">
          <span className="topbar__avatar" aria-hidden="true">
            SS
          </span>
          <div className="topbar__profile-details">
            <span className="topbar__name">Sri Sarvesh</span>
            <span className="topbar__role">Sales Manager</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Topbar