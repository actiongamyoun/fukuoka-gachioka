import { Outlet } from 'react-router-dom'
import Header from './Header'
import TabBar from './TabBar'
import SplashScreen from './SplashScreen'

export default function Layout() {
  return (
    <>
      <SplashScreen />
      <div className="app">
        <Header />
        <main className="app__main">
          <Outlet />
        </main>
        <TabBar />
      </div>
    </>
  )
}
