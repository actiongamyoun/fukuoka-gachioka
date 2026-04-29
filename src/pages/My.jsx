import { useAuthContext } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { useState } from 'react'

export default function My() {
  const { isLoggedIn, profile, isAdmin, signInWithKakao, signOut, refreshProfile } = useAuthContext()
  const [editing, setEditing] = useState(false)
  const [nickname, setNickname] = useState('')

  if (!isLoggedIn) {
    return (
      <div className="page page--center">
        <div className="login-card">
          <h2>👤 MY</h2>
          <p>로그인하면 채팅·찜·제보 기능을 이용할 수 있어요</p>
          <button className="btn btn--kakao" onClick={signInWithKakao}>
            카카오로 로그인
          </button>
        </div>
      </div>
    )
  }

  const startEdit = () => {
    setNickname(profile?.nickname ?? '')
    setEditing(true)
  }

  const saveNickname = async () => {
    const trimmed = nickname.trim()
    if (!trimmed || trimmed === profile.nickname) { setEditing(false); return }
    const { error } = await supabase
      .from('profiles').update({ nickname: trimmed }).eq('id', profile.id)
    if (error) {
      alert(error.message.includes('unique') ? '이미 사용 중인 닉네임이에요' : error.message)
      return
    }
    await refreshProfile()
    setEditing(false)
  }

  const incrementVisit = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({ visit_count: (profile.visit_count ?? 0) + 1 })
      .eq('id', profile.id)
    if (!error) await refreshProfile()
  }

  return (
    <div className="page">
      <header className="page__header">
        <h1 className="page__title">MY</h1>
      </header>

      <section className="profile-card">
        {profile?.avatar_url
          ? <img src={profile.avatar_url} alt="" className="profile-card__avatar" />
          : <div className="profile-card__avatar profile-card__avatar--placeholder">👤</div>}

        {editing ? (
          <div className="profile-card__edit">
            <input
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              maxLength={20}
              autoFocus
            />
            <button onClick={saveNickname}>저장</button>
            <button onClick={() => setEditing(false)}>취소</button>
          </div>
        ) : (
          <>
            <h2>{profile?.nickname ?? '여행자'}</h2>
            <button className="btn btn--ghost" onClick={startEdit}>닉네임 수정</button>
          </>
        )}

        {isAdmin && <span className="badge badge--admin">ADMIN</span>}
      </section>

      <section className="stat-card">
        <div className="stat-card__label">후쿠오카 방문 횟수</div>
        <div className="stat-card__value">{profile?.visit_count ?? 0}회</div>
        <button className="btn btn--ghost" onClick={incrementVisit}>+1 방문 기록</button>
        <small>또쿠오카 인증 🍜</small>
      </section>

      <section className="menu-list">
        <button className="menu-list__item">❤️ 내가 찜한 스팟</button>
        <button className="menu-list__item">📝 내가 제보한 스팟</button>
        {isAdmin && <button className="menu-list__item">🛡️ 관리자 콘솔</button>}
        <button className="menu-list__item menu-list__item--danger" onClick={signOut}>
          로그아웃
        </button>
      </section>
    </div>
  )
}
