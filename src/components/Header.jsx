import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../lib/AuthContext'

/**
 * 상단 고정 헤더
 * - 좌측: 앱 이름 "후쿠오카같이오까" (Jua 폰트, 빨강)
 * - 우측: MY 버튼 (로그인 시 아바타, 비로그인 시 👤)
 */
export default function Header() {
  const navigate = useNavigate()
  const { isLoggedIn, profile } = useAuthContext()

  return (
    <header className="app-header">
      <button 
        className="app-header__brand"
        onClick={() => navigate('/')}
        aria-label="홈으로"
      >
        <span className="app-header__icon">🍜</span>
        <span className="app-header__title">후쿠오카같이오까</span>
      </button>

      <button 
        className="app-header__my"
        onClick={() => navigate('/my')}
        aria-label="MY 페이지"
      >
        {isLoggedIn && profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="app-header__avatar" />
        ) : (
          <div className="app-header__avatar app-header__avatar--placeholder">
            👤
          </div>
        )}
      </button>
    </header>
  )
}
