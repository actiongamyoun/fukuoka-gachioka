import { Outlet } from 'react-router-dom'
import TabBar from './TabBar'

export default function Layout() {
  return (
    <div className="app">
      <main className="app__main">
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}
