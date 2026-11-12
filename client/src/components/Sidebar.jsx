import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  Briefcase,
  CalendarCheck,
  Contact,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Users,
} from 'lucide-react'
import './Sidebar.css'

const navigationItems = [
  { label: 'Dashboard', to: '/dashboard', Icon: LayoutDashboard },
  { label: 'Leads', to: '/leads', Icon: Users },
  { label: 'Contacts & Accounts', to: '/customers', Icon: Contact },
  { label: 'Deals Pipeline', to: '/deals', Icon: Briefcase },
  { label: 'Tasks & Calendar', to: '/tasks', Icon: CalendarCheck },
  { label: 'Support Tickets', to: '/tickets', Icon: LifeBuoy },
  { label: 'Quotes & Invoices', to: '/invoices', Icon: FileText },
  { label: 'Reports', to: '/reports', Icon: BarChart3 },
]

function Sidebar({ isOpen = false, onNavigate }) {
  return (
    <aside
      id="leadflow-sidebar"
      className={`sidebar${isOpen ? ' sidebar--open' : ''}`}
    >
      <a
        className="sidebar__brand"
        href="/dashboard"
        aria-label="LeadFlow CRM home"
        onClick={onNavigate}
      >
        <span className="sidebar__logo" aria-hidden="true">
          L
        </span>
        <span className="sidebar__brand-name">LeadFlow CRM</span>
      </a>

      <p className="sidebar__section-label">Workspace</p>

      <nav className="sidebar__navigation" aria-label="Main">
        {navigationItems.map(({ label, to, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
            }
            onClick={onNavigate}
          >
            <Icon className="sidebar__icon" size={18} strokeWidth={1.8} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <a className="sidebar__link" href="/login" onClick={onNavigate}>
          <LogOut className="sidebar__icon" size={18} strokeWidth={1.8} aria-hidden="true" />
          <span>Sign out</span>
        </a>
      </div>
    </aside>
  )
}

export default Sidebar