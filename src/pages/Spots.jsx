import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Spots() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [areas, setAreas] = useState([])
  const [spots, setSpots] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedArea, setSelectedArea] = useState(null)
  const [loading, setLoading] = useState(true)

  // 마스터 데이터 로드
  useEffect(() => {
    Promise.all([
      supabase.from('categories').select('*').eq('is_active', true).order('display_order'),
      supabase.from('areas').select('*').eq('is_active', true).order('display_order')
    ]).then(([c, a]) => {
      setCategories(c.data ?? [])
      setAreas(a.data ?? [])
    })
  }, [])

  // 스팟 목록 (필터 변경 시 재조회)
  useEffect(() => {
    setLoading(true)
    let q = supabase
      .from('spots')
      .select(`
        id, name, description, cover_image_url, price_level, favorite_count, is_featured,
        korean_menu, card_payment, nearest_station,
        category:categories(id, name_ko, icon),
        area:areas(id, name_ko)
      `)
      .eq('status', 'approved')
      .order('is_featured', { ascending: false })
      .order('favorite_count', { ascending: false })
      .limit(50)

    if (selectedCategory) q = q.eq('category_id', selectedCategory)
    if (selectedArea) q = q.eq('area_id', selectedArea)

    q.then(({ data, error }) => {
      if (!error) setSpots(data ?? [])
      setLoading(false)
    })
  }, [selectedCategory, selectedArea])

  return (
    <div className="page">
      <header className="page__header">
        <h1 className="page__title">스팟</h1>
        <p className="page__subtitle">한국인 여행자를 위한 큐레이션</p>
      </header>

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
        {areas.map(a => (
          <button
            key={a.id}
            className={`chip chip--small ${selectedArea === a.id ? 'is-active' : ''}`}
            onClick={() => setSelectedArea(a.id)}
          >{a.name_ko}</button>
        ))}
      </div>

      {/* 스팟 카드 목록 */}
      {loading ? (
        <div className="empty">불러오는 중…</div>
      ) : spots.length === 0 ? (
        <div className="empty">
          <p>아직 등록된 스팟이 없어요</p>
          <small>곧 채워집니다 🍜</small>
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

                {/* 한국인 친화 뱃지 */}
                <div className="spot-card__korean-badges">
                  {s.korean_menu && <span className="kbadge kbadge--korean">🇰🇷 한국어</span>}
                  {s.card_payment && <span className="kbadge kbadge--card">💳 카드</span>}
                  {s.nearest_station && <span className="kbadge kbadge--station">🚇 {s.nearest_station}</span>}
                </div>

                <div className="spot-card__footer">
                  <span>❤️ {s.favorite_count}</span>
                  {s.price_level && <span className="price-level">{
                    { low: '₩', mid: '₩₩', high: '₩₩₩' }[s.price_level]
                  }</span>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
