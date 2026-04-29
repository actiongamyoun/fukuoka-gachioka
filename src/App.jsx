import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import Layout from './components/Layout'
import Spots from './pages/Spots'
import SpotDetail from './pages/SpotDetail'
import Chat from './pages/Chat'
import Transport from './pages/Transport'
import RouteDetail from './pages/RouteDetail'
import My from './pages/My'
import AuthCallback from './pages/AuthCallback'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/spots" replace />} />
            <Route path="/spots" element={<Spots />} />
            <Route path="/spots/:id" element={<SpotDetail />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/transport" element={<Transport />} />
            <Route path="/transport/:slug" element={<RouteDetail />} />
            <Route path="/my" element={<My />} />
            <Route path="*" element={<Navigate to="/spots" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
