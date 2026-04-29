import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

/**
 * 교통 탭
 * - 한국인 자주 가는 동선 카드 (transport_routes)
 * - 카테고리별 필터 (공항/관광/당일치기/시내)
 * - 교통 꿀팁 (categories.slug='transport' 인 spots)
 */
export default function Transport() {
  const navigate = useNavigate()
  const [routes, setRoutes] = useState([])
  const [tips, setTips] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      // 동선 가이드
      const { data: routeData } = await supabase
        .from('transport_routes')
        .select('*')
        .eq('is_active', true)
        .order('display_order')

      // 교통 꿀팁 (spots 카테고리 transport)
      const { data: catData } = await supabase
        .from('categories').select('id').eq('slug', 'transport').single()

      let tipData = []
      if (catData) {
        const { data } = await supabase
          .from('spots')
          .select('id, name, description, korean_tip')
          .eq('status', 'approved')
          .eq('category_id', catData.id)
          .order('favorite_count', { ascending: false })
        tipData = data ?? []
      }

      setRoutes(routeData ?? [])
      setTips(tipData)
      setLoading(false)
    }
    load()
  }, [])

  const categories = [
    { value: null, label: '전체' },
    { value: 'airport', label: '✈️ 공항' },
    { value: 'sightseeing', label: '🗾 관광지' },
    { value: 'daytrip', label: '🏯 당일치기' },
    { value: 'city', label: '🏙️ 시내' }
  ]

  const filteredRoutes = selectedCategory
    ? routes.filter(r => r.category === selectedCategory)
    : routes

  const difficultyLabel = {
    easy: { text: '쉬움', color: '#059669' },
    medium: { text: '보통', color: '#f59e0b' },
    hard: { text: '어려움', color: '#dc2626' }
  }

  return (
    <div className="page">
      <header className="page__header">
        <h1 className="page__title">🚃 교통</h1>
        <p className="page__subtitle">한국인이 자주 가는 동선 가이드</p>
      </header>

      {/* 카테고리 필터 */}
      <div className="chip-row">
        {categories.map(c => (
          <button
            key={c.label}
            className={`chip ${selectedCategory === c.value ? 'is-active' : ''}`}
            onClick={() => setSelectedCategory(c.value)}
          >{c.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="empty">불러오는 중…</div>
      ) : (
        <>
          {/* 동선 카드 목록 */}
          {filteredRoutes.length === 0 ? (
            <div className="empty">
              <p>해당 카테고리 동선이 없어요</p>
            </div>
          ) : (
            <ul className="route-list">
              {filteredRoutes.map(r => {
                const diff = difficultyLabel[r.difficulty] ?? difficultyLabel.easy
                return (
                  <li
                    key={r.id}
                    className="route-card"
                    onClick={() => navigate(`/transport/${r.slug}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/transport/${r.slug}`) }}
                  >
                    <div className="route-card__header">
                      <div className="route-card__path">
                        <span className="route-card__from">
                          <span className="route-card__emoji">{r.from_emoji}</span>
                          {r.from_label}
                        </span>
                        <span className="route-card__arrow">→</span>
                        <span className="route-card__to">
                          <span className="route-card__emoji">{r.to_emoji}</span>
                          {r.to_label}
                        </span>
                      </div>
                      <span 
                        className="route-card__difficulty"
                        style={{ background: diff.color + '15', color: diff.color }}
                      >{diff.text}</span>
                    </div>

                    {r.description && (
                      <p className="route-card__desc">{r.description}</p>
                    )}

                    <div className="route-card__meta">
                      <span>⏱️ {r.duration_minutes}분</span>
                      {r.cost_yen > 0 && <span>💴 {r.cost_yen.toLocaleString()}엔</span>}
                      {r.cost_yen === 0 && <span className="route-card__free">무료</span>}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {/* 교통 꿀팁 (구분선 후) */}
          {tips.length > 0 && (
            <>
              <h2 className="section-divider">🎫 교통 꿀팁</h2>
              <ul className="tip-list">
                {tips.map(t => (
                  <li 
                    key={t.id} 
                    className="tip-card"
                    onClick={() => navigate(`/spots/${t.id}`)}
                    role="button"
                  >
                    <h3>{t.name}</h3>
                    {t.description && <p>{t.description}</p>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  )
}
