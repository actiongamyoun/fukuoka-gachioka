import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../lib/AuthContext'
import LoginPromptModal from '../components/LoginPromptModal'

/**
 * 스팟 상세 페이지
 * - 한국인 특화 정보(가는 길, 카드결제, 한국어 메뉴) 표시
 * - 찜(좋아요) 토글
 * - 비로그인 시 찜 누르면 로그인 유도 모달
 */
export default function SpotDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isLoggedIn, profile, signInWithKakao } = useAuthContext()

  const [spot, setSpot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isFavorited, setIsFavorited] = useState(false)
  const [favLoading, setFavLoading] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [copyToast, setCopyToast] = useState(false)

  // 스팟 데이터 로드
  useEffect(() => {
    let alive = true
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('spots')
        .select(`
          id, name, description, status,
          latitude, longitude, address,
          cover_image_url, business_hours, price_level, tags,
          favorite_count, is_featured, illustration_svg,
          korean_menu, card_payment, nearest_station, walk_time_minutes,
          walking_directions, recommended_menu, korean_tip, korean_review,
          category:categories(id, name_ko, icon, slug),
          area:areas(id, name_ko, slug)
        `)
        .eq('id', id)
        .eq('status', 'approved')
        .maybeSingle()

      if (!alive) return
      if (error || !data) {
        setSpot(null)
      } else {
        setSpot(data)
      }
      setLoading(false)
    }
    load()
    return () => { alive = false }
  }, [id])

  // 찜 상태 확인
  useEffect(() => {
    if (!isLoggedIn || !spot?.id || !profile?.id) return
    let alive = true
    supabase
      .from('favorites')
      .select('user_id')
      .eq('user_id', profile.id)
      .eq('spot_id', spot.id)
      .maybeSingle()
      .then(({ data }) => { if (alive) setIsFavorited(!!data) })
    return () => { alive = false }
  }, [isLoggedIn, spot?.id, profile?.id])

  const toggleFavorite = async () => {
    if (!isLoggedIn) {
      setShowLoginModal(true)
      return
    }
    if (favLoading) return
    setFavLoading(true)

    if (isFavorited) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', profile.id)
        .eq('spot_id', spot.id)
      if (!error) {
        setIsFavorited(false)
        setSpot(prev => ({ ...prev, favorite_count: Math.max((prev.favorite_count ?? 1) - 1, 0) }))
      }
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: profile.id, spot_id: spot.id })
      if (!error) {
        setIsFavorited(true)
        setSpot(prev => ({ ...prev, favorite_count: (prev.favorite_count ?? 0) + 1 }))
      }
    }
    setFavLoading(false)
  }

  const copyAddress = () => {
    if (!spot?.address) return
    navigator.clipboard.writeText(spot.address).then(() => {
      setCopyToast(true)
      setTimeout(() => setCopyToast(false), 1800)
    })
  }

  const shareSpot = async () => {
    const url = window.location.href
    const title = `${spot.name} - 후쿠오카같이오까`
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
      } catch (_) {}
    } else {
      navigator.clipboard.writeText(url)
      setCopyToast(true)
      setTimeout(() => setCopyToast(false), 1800)
    }
  }

  if (loading) {
    return <div className="page page--center"><div className="empty">불러오는 중…</div></div>
  }

  if (!spot) {
    return (
      <div className="page page--center">
        <div className="empty">
          <p>스팟을 찾을 수 없어요</p>
          <button className="btn btn--ghost" onClick={() => navigate('/spots')}>스팟 목록으로</button>
        </div>
      </div>
    )
  }

  const priceLabel = { low: '₩', mid: '₩₩', high: '₩₩₩' }[spot.price_level]
  const directionLines = spot.walking_directions
    ? spot.walking_directions.split('\n').filter(Boolean)
    : []

  return (
    <div className="detail">
      {/* 상단 이미지/약도 영역 */}
      <header className="detail__hero">
        <button className="detail__back" onClick={() => navigate(-1)} aria-label="뒤로">←</button>

        {spot.illustration_svg ? (
          <div className="detail__illustration"
               dangerouslySetInnerHTML={{ __html: spot.illustration_svg }} />
        ) : spot.cover_image_url ? (
          <img className="detail__cover" src={spot.cover_image_url} alt={spot.name} />
        ) : (
          <div className="detail__cover detail__cover--placeholder">
            <span>{spot.category?.icon ?? '📍'}</span>
          </div>
        )}
      </header>

      {/* 기본 정보 */}
      <section className="detail__head">
        <div className="detail__meta">
          <span>{spot.category?.icon} {spot.category?.name_ko}</span>
          <span>· {spot.area?.name_ko}</span>
          {spot.is_featured && <span className="badge-featured">★ 추천</span>}
        </div>
        <h1 className="detail__name">{spot.name}</h1>
        {spot.description && <p className="detail__desc">{spot.description}</p>}

        <div className="detail__stats">
          <span>❤️ {spot.favorite_count ?? 0}</span>
          {priceLabel && <span className="price-level">{priceLabel}</span>}
        </div>
      </section>

      {/* 액션 버튼 */}
      <section className="detail__actions">
        <button
          className={`action-btn ${isFavorited ? 'is-active' : ''}`}
          onClick={toggleFavorite}
          disabled={favLoading}
        >
          <span className="action-btn__icon">{isFavorited ? '❤️' : '🤍'}</span>
          <span>{isFavorited ? '찜 완료' : '찜하기'}</span>
        </button>
        <button className="action-btn" onClick={copyAddress} disabled={!spot.address}>
          <span className="action-btn__icon">📋</span>
          <span>주소 복사</span>
        </button>
        <button className="action-btn" onClick={shareSpot}>
          <span className="action-btn__icon">📤</span>
          <span>공유</span>
        </button>
      </section>

      {/* 가는 길 */}
      {(spot.nearest_station || directionLines.length > 0) && (
        <section className="detail__section">
          <h2 className="detail__section-title">🚶 가는 길</h2>

          {spot.nearest_station && (
            <div className="info-row">
              <span className="info-row__icon">🚇</span>
              <div className="info-row__body">
                <strong>{spot.nearest_station}</strong>
                {spot.walk_time_minutes != null && (
                  <span className="info-row__sub">에서 도보 약 {spot.walk_time_minutes}분</span>
                )}
              </div>
            </div>
          )}

          {directionLines.length > 0 && (
            <ol className="direction-steps">
              {directionLines.map((line, i) => (
                <li key={i} className="direction-step">
                  <span className="direction-step__num">{i + 1}</span>
                  <span className="direction-step__text">{line}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {/* 기본 정보 */}
      <section className="detail__section">
        <h2 className="detail__section-title">ℹ️ 정보</h2>

        {spot.business_hours && (
          <div className="info-row">
            <span className="info-row__icon">⏰</span>
            <div className="info-row__body">{spot.business_hours}</div>
          </div>
        )}

        {spot.address && (
          <div className="info-row">
            <span className="info-row__icon">📍</span>
            <div className="info-row__body">{spot.address}</div>
          </div>
        )}

        <div className="info-row">
          <span className="info-row__icon">💳</span>
          <div className="info-row__body">
            카드 결제 {spot.card_payment 
              ? <strong className="ok">가능</strong> 
              : <strong className="warn">현금만</strong>}
          </div>
        </div>

        <div className="info-row">
          <span className="info-row__icon">🇰🇷</span>
          <div className="info-row__body">
            한국어 메뉴 {spot.korean_menu 
              ? <strong className="ok">있음</strong> 
              : <strong className="muted">없음</strong>}
          </div>
        </div>
      </section>

      {/* 추천 메뉴 */}
      {spot.recommended_menu?.length > 0 && (
        <section className="detail__section">
          <h2 className="detail__section-title">🍽️ 추천 메뉴</h2>
          <ul className="menu-list-detail">
            {spot.recommended_menu.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </section>
      )}

      {/* 한국인 후기 */}
      {spot.korean_review && (
        <section className="detail__section">
          <h2 className="detail__section-title">💬 한국인 후기</h2>
          <blockquote className="review-quote">
            "{spot.korean_review}"
          </blockquote>
        </section>
      )}

      {/* 꿀팁 */}
      {spot.korean_tip && (
        <section className="detail__section detail__section--tip">
          <h2 className="detail__section-title">🔥 꿀팁</h2>
          <p className="tip-body">{spot.korean_tip}</p>
        </section>
      )}

      {/* 태그 */}
      {spot.tags?.length > 0 && (
        <section className="detail__section">
          <div className="tag-list">
            {spot.tags.map((t, i) => (
              <span key={i} className="tag">#{t}</span>
            ))}
          </div>
        </section>
      )}

      {/* Toast */}
      {copyToast && <div className="toast">복사되었어요</div>}

      {/* 로그인 유도 모달 */}
      {showLoginModal && (
        <LoginPromptModal
          message="찜하려면 로그인이 필요해요"
          onClose={() => setShowLoginModal(false)}
          onLogin={signInWithKakao}
        />
      )}
    </div>
  )
}
