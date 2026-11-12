import { Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import AccountProfile from '../pages/AccountProfile'
import Customers from '../pages/Customers'
import Dashboard from '../pages/Dashboard'
import Deals from '../pages/Deals'
import Invoices from '../pages/Invoices'
import LeadProfile from '../pages/LeadProfile'
import Leads from '../pages/Leads'
import Login from '../pages/Login'
import Notifications from '../pages/Notifications'
import Products from '../pages/Products'
import QuoteBuilder from '../pages/QuoteBuilder'
import Reports from '../pages/Reports'
import Tasks from '../pages/Tasks'
import TicketDetails from '../pages/TicketDetails'
import Tickets from '../pages/Tickets'
import UsersSettings from '../pages/UsersSettings'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="leads" element={<Leads />} />
        <Route path="leads/:id" element={<LeadProfile />} />
        <Route path="customers" element={<Customers />} />
        <Route path="deals" element={<Deals />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="tickets" element={<Tickets />} />
        <Route path="tickets/:id" element={<TicketDetails />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="reports" element={<Reports />} />
        <Route path="account" element={<AccountProfile />} />
        <Route path="quotes/new" element={<QuoteBuilder />} />
        <Route path="products" element={<Products />} />
        <Route path="settings/users" element={<UsersSettings />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default AppRoutes