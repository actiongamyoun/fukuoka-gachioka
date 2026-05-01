import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/spots',   label: '핫스팟',  icon: '🔥' },
  { to: '/chat',    label: '채팅',    icon: '💬' },
  { to: '/transport', label: '교통',  icon: '🚃' }
]

export default function TabBar() {
  return (
    <nav className="tabbar">
      {tabs.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `tabbar__item ${isActive ? 'is-active' : ''}`}
        >
          <span className="tabbar__icon" aria-hidden>{icon}</span>
          <span className="tabbar__label">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
