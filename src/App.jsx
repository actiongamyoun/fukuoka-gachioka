import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import Layout from './components/Layout'
import Spots from './pages/Spots'
import Chat from './pages/Chat'
import Transport from './pages/Transport'
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
            <Route path="/chat" element={<Chat />} />
            <Route path="/transport" element={<Transport />} />
            <Route path="/my" element={<My />} />
            <Route path="*" element={<Navigate to="/spots" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
