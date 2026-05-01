import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../lib/AuthContext'
import AreaMap from '../components/AreaMap'

/**
 * 통합 홈 + 핫스팟 페이지
 * - 환영 영역
 * - 오늘의 추천 TOP 3
 * - 인기 동선 (transport_routes)
 * - 또쿠오카 통계
 * - 카테고리 빠른 진입
 * - 핫스팟 전체 보기 (필터 + 약도 + 목록)
 */
export default function Spots() {
  const navigate = useNavigate()
  const { isLoggedIn, profile } = useAuthContext()

  const [categories, setCategories] = useState([])
  const [areas, setAreas] = useState([])
  const [spots, setSpots] = useState([])
  const [topSpots, setTopSpots] = useState([])
  const [popularRoutes, setPopularRoutes] = useState([])
  const [stats, setStats] = useState({ totalSpots: 0, totalUsers: 0, totalChats: 0 })
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedArea, setSelectedArea] = useState(null)
  const [loading, setLoading] = useState(true)

  const AREAS_WITH_MAP = ['hakata', 'tenjin', 'nakasu', 'dazaifu', 'yufuin']

  // 마스터 + 홈 콘텐츠 로드
  useEffect(() => {
    const loadAll = async () => {
      // is_active=true인 카테고리만 (교통 제외됨)
      const [c, a, top, routes, statsRes] = await Promise.all([
        supabase.from('categories').select('*').eq('is_active', true).order('display_order'),
        supabase.from('areas').select('*').eq('is_active', true).order('display_order'),
        supabase.from('spots').select(`
          id, name, description, cover_image_url, favorite_count, is_featured,
          category:categories(name_ko, icon),
          area:areas(name_ko)
        `).eq('status', 'approved').eq('is_featured', true).order('favorite_count', { ascending: false }).limit(3),
        supabase.from('transport_routes').select('*').eq('is_active', true).order('view_count', { ascending: false }).limit(3),
        supabase.from('spots').select('*', { count: 'exact', head: true }).eq('status', 'approved')
      ])

      setCategories(c.data ?? [])
      setAreas(a.data ?? [])
      setTopSpots(top.data ?? [])
      setPopularRoutes(routes.data ?? [])
      setStats(prev => ({ ...prev, totalSpots: statsRes.count ?? 0 }))
    }
    loadAll()
  }, [])

  // 스팟 목록 (필터 변경 시)
  useEffect(() => {
    setLoading(true)
    let q = supabase
      .from('spots')
      .select(`
        id, name, description, cover_image_url, price_level, favorite_count, is_featured,
        korean_menu, card_payment, nearest_station,
        category:categories(id, name_ko, icon, slug),
        area:areas(id, name_ko, slug)
      `)
      .eq('status', 'approved')
      .order('is_featured', { ascending: false })
      .order('favorite_count', { ascending: false })
      .limit(50)

    if (selectedCategory) q = q.eq('category_id', selectedCategory)
    if (selectedArea) q = q.eq('area_id', selectedArea.id)

    q.then(({ data, error }) => {
      // 교통 카테고리는 추가 보호 (is_active=false라 categories 조인에서 빠짐)
      const filtered = (data ?? []).filter(s => s.category?.slug !== 'transport')
      if (!error) setSpots(filtered)
      setLoading(false)
    })
  }, [selectedCategory, selectedArea])

  return (
    <div className="page">
      {/* ===== 환영 영역 ===== */}
      <section className="welcome">
        <div className="welcome__greeting">
          {isLoggedIn && profile ? (
            <>
              <h2 className="welcome__title">
                안녕하세요, <strong>{profile.nickname}</strong>님!
              </h2>
              {profile.visit_count > 0 && (
                <p className="welcome__sub">
                  또쿠오카 <strong>{profile.visit_count}회차</strong> ⭐
                </p>
              )}
            </>
          ) : (
            <>
              <h2 className="welcome__title">후쿠오카, 같이 가요 🍜</h2>
              <p className="welcome__sub">한국인 여행자를 위한 정보 + 채팅</p>
            </>
          )}
        </div>
      </section>

      {/* ===== 오늘의 추천 TOP 3 ===== */}
      {topSpots.length > 0 && (
        <section className="home-section">
          <h2 className="home-section__title">🔥 오늘의 추천</h2>
          <div className="top-scroll">
            {topSpots.map((s, i) => (
              <button
                key={s.id}
                className="top-card"
                onClick={() => navigate(`/spots/${s.id}`)}
              >
                <div className="top-card__rank">{i + 1}</div>
                <div className="top-card__icon">{s.category?.icon ?? '📍'}</div>
                <div className="top-card__name">{s.name}</div>
                <div className="top-card__meta">
                  {s.area?.name_ko} · ❤️ {s.favorite_count}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ===== 인기 동선 ===== */}
      {popularRoutes.length > 0 && (
        <section className="home-section">
          <div className="home-section__head">
            <h2 className="home-section__title">🚃 인기 동선</h2>
            <button 
              className="home-section__more" 
              onClick={() => navigate('/transport')}
            >더보기 →</button>
          </div>
          <div className="route-scroll">
            {popularRoutes.map(r => (
              <button
                key={r.id}
                className="route-mini-card"
                onClick={() => navigate(`/transport/${r.slug}`)}
              >
                <div className="route-mini-card__path">
                  <span>{r.from_emoji} {r.from_label}</span>
                  <span className="route-mini-card__arrow">→</span>
                  <span>{r.to_emoji} {r.to_label}</span>
                </div>
                <div className="route-mini-card__meta">
                  ⏱️ {r.duration_minutes}분 · {r.cost_yen === 0 ? '무료' : `¥${r.cost_yen.toLocaleString()}`}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ===== 또쿠오카 통계 ===== */}
      <section className="home-section">
        <h2 className="home-section__title">📊 또쿠오카 인증</h2>
        <div className="stats-grid">
          <div className="stat-mini">
            <div className="stat-mini__value">{stats.totalSpots}</div>
            <div className="stat-mini__label">등록 스팟</div>
          </div>
          <div className="stat-mini">
            <div className="stat-mini__value">{popularRoutes.length > 0 ? '12' : '-'}</div>
            <div className="stat-mini__label">교통 동선</div>
          </div>
          <div className="stat-mini">
            <div className="stat-mini__value">5</div>
            <div className="stat-mini__label">지역 약도</div>
          </div>
        </div>
      </section>

      {/* ===== 카테고리 빠른 진입 ===== */}
      {categories.length > 0 && (
        <section className="home-section">
          <h2 className="home-section__title">📍 카테고리별 둘러보기</h2>
          <div className="category-grid">
            {categories.map(c => (
              <button
                key={c.id}
                className={`category-tile ${selectedCategory === c.id ? 'is-active' : ''}`}
                onClick={() => {
                  setSelectedCategory(c.id)
                  // 핫스팟 목록 섹션으로 스크롤
                  setTimeout(() => {
                    document.getElementById('spot-list-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }, 100)
                }}
              >
                <span className="category-tile__icon">{c.icon}</span>
                <span className="category-tile__label">{c.name_ko}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ===== 핫스팟 목록 ===== */}
      <section id="spot-list-section" className="home-section">
        <h2 className="home-section__title">🔥 전체 핫스팟</h2>

        {/* 카테고리 필터 */}
        <div className="chip-row">
          <button
            className={`chip ${!selectedCategory ? 'is-active' : ''}`}
            onClick={() => setSelectedCategory(null)}
          >전체</button>
          {categories.map(c => (
            <button
              key={c.id}
              className={`chip ${selectedCategory === c.id ? 'is-active' : ''}`}
              onClick={() => setSelectedCategory(c.id)}
            >
              <span>{c.icon}</span> {c.name_ko}
            </button>
          ))}
        </div>

        {/* 지역 필터 */}
        <div className="chip-row chip-row--small">
          <button
            className={`chip chip--small ${!selectedArea ? 'is-active' : ''}`}
            onClick={() => setSelectedArea(null)}
          >전체 지역</button>
          {areas.map(a => {
            const hasMap = AREAS_WITH_MAP.includes(a.slug)
            return (
              <button
                key={a.id}
                className={`chip chip--small ${selectedArea?.id === a.id ? 'is-active' : ''}`}
                onClick={() => setSelectedArea(a)}
              >
                {a.name_ko} {hasMap && <span className="chip__map-badge">🗺️</span>}
              </button>
            )
          })}
        </div>

        {/* 약도 (지역 선택 시) */}
        {selectedArea && AREAS_WITH_MAP.includes(selectedArea.slug) && (
          <div className="area-map-section">
            <h3 className="area-map-section__title">🗺️ {selectedArea.name_ko} 약도</h3>
            <p className="area-map-section__sub">핀을 누르면 상세 정보로 이동</p>
            <AreaMap areaSlug={selectedArea.slug} />
          </div>
        )}

        {/* 스팟 카드 목록 */}
        {loading ? (
          <div className="empty">불러오는 중…</div>
        ) : spots.length === 0 ? (
          <div className="empty">
            <p>해당 조건의 스팟이 없어요</p>
            <small>다른 카테고리/지역을 선택해보세요</small>
          </div>
        ) : (
          <ul className="spot-list">
            {spots.map(s => (
              <li
                key={s.id}
                className="spot-card spot-card--clickable"
                onClick={() => navigate(`/spots/${s.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/spots/${s.id}`) }}
              >
                {s.cover_image_url
                  ? <img className="spot-card__img" src={s.cover_image_url} alt={s.name} loading="lazy" />
                  : <div className="spot-card__img spot-card__img--placeholder">{s.category?.icon ?? '📍'}</div>}
                <div className="spot-card__body">
                  <div className="spot-card__meta">
                    <span>{s.category?.icon} {s.category?.name_ko}</span>
                    <span>· {s.area?.name_ko}</span>
                    {s.is_featured && <span className="badge-featured">★</span>}
                  </div>
                  <h3 className="spot-card__name">{s.name}</h3>
                  {s.description && <p className="spot-card__desc">{s.description}</p>}

                  <div className="spot-card__korean-badges">
                    {s.korean_menu && <span className="kbadge kbadge--korean">🇰🇷 한국어</span>}
                    {s.card_payment && <span className="kbadge kbadge--card">💳 카드</span>}
                    {s.nearest_station && <span className="kbadge kbadge--station">🚇 {s.nearest_station}</span>}
                  </div>

                  <div className="spot-card__footer">
                    <span>❤️ {s.favorite_count}</span>
                    {s.price_level && <span className="price-level">{
                      { low: '¥', mid: '¥¥', high: '¥¥¥' }[s.price_level]
                    }</span>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
