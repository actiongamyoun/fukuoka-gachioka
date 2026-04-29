import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

/**
 * 교통 동선 상세 페이지
 * - SVG 노선도 + 단계별 텍스트 안내
 * - 한국인 꿀팁 / 패스 추천 / 식사 / 시간 / 편의시설
 */
export default function RouteDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [route, setRoute] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    const load = async () => {
      const { data, error } = await supabase
        .from('transport_routes')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle()

      if (!alive) return
      setRoute(error ? null : data)
      setLoading(false)

      // 조회수 증가 (실패해도 무시)
      if (data?.id) {
        supabase.from('transport_routes')
          .update({ view_count: (data.view_count ?? 0) + 1 })
          .eq('id', data.id)
          .then(() => {})
      }
    }
    load()
    return () => { alive = false }
  }, [slug])

  if (loading) {
    return <div className="page page--center"><div className="empty">불러오는 중…</div></div>
  }

  if (!route) {
    return (
      <div className="page page--center">
        <div className="empty">
          <p>동선 정보를 찾을 수 없어요</p>
          <button className="btn btn--ghost" onClick={() => navigate('/transport')}>교통으로</button>
        </div>
      </div>
    )
  }

  const stepLines = route.steps_text
    ? route.steps_text.split('\n').filter(Boolean)
    : []

  const difficultyLabel = {
    easy: { text: '쉬움', color: '#059669', desc: '환승 없음, 한국인도 무리 없이' },
    medium: { text: '보통', color: '#f59e0b', desc: '환승 1~2번, 약간 주의' },
    hard: { text: '어려움', color: '#dc2626', desc: '렌터카 또는 복잡한 환승' }
  }
  const diff = difficultyLabel[route.difficulty] ?? difficultyLabel.easy

  return (
    <div className="detail">
      {/* 상단 헤더 */}
      <header className="detail__hero detail__hero--route">
        <button className="detail__back" onClick={() => navigate(-1)}>←</button>
        <div className="route-hero">
          <div className="route-hero__path">
            <div className="route-hero__node">
              <div className="route-hero__emoji">{route.from_emoji}</div>
              <div className="route-hero__label">{route.from_label}</div>
            </div>
            <div className="route-hero__arrow">→</div>
            <div className="route-hero__node">
              <div className="route-hero__emoji">{route.to_emoji}</div>
              <div className="route-hero__label">{route.to_label}</div>
            </div>
          </div>
        </div>
      </header>

      {/* 핵심 메타 */}
      <section className="detail__head">
        {route.description && <p className="detail__desc">{route.description}</p>}
        <div className="route-stats">
          <div className="route-stat">
            <div className="route-stat__label">소요 시간</div>
            <div className="route-stat__value">{route.duration_minutes}<small>분</small></div>
          </div>
          <div className="route-stat">
            <div className="route-stat__label">비용</div>
            <div className="route-stat__value">
              {route.cost_yen === 0 ? <span style={{color:'#059669'}}>무료</span> : <>{route.cost_yen.toLocaleString()}<small>엔</small></>}
            </div>
          </div>
          <div className="route-stat">
            <div className="route-stat__label">난이도</div>
            <div className="route-stat__value" style={{ color: diff.color }}>{diff.text}</div>
          </div>
        </div>
      </section>

      {/* SVG 노선도 */}
      {route.svg_diagram && (
        <section className="detail__section">
          <h2 className="detail__section-title">🗺️ 노선도</h2>
          <div className="route-svg" dangerouslySetInnerHTML={{ __html: route.svg_diagram }} />
          <p className="route-svg__caption">난이도: {diff.desc}</p>
        </section>
      )}

      {/* 단계별 안내 */}
      {stepLines.length > 0 && (
        <section className="detail__section">
          <h2 className="detail__section-title">📋 단계별 안내</h2>
          <ol className="direction-steps">
            {stepLines.map((line, i) => (
              <li key={i} className="direction-step">
                <span className="direction-step__num">{i + 1}</span>
                <span className="direction-step__text">{line}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* 꿀팁 (Featured) */}
      {route.korean_tip && (
        <section className="detail__section detail__section--tip">
          <h2 className="detail__section-title">🔥 한국인 꿀팁</h2>
          <p className="tip-body">{route.korean_tip}</p>
        </section>
      )}

      {/* 패스 추천 */}
      {route.pass_recommendation && (
        <section className="detail__section">
          <h2 className="detail__section-title">🎫 패스 추천</h2>
          <p className="tip-body">{route.pass_recommendation}</p>
        </section>
      )}

      {/* 식사 추천 */}
      {route.food_recommendation && (
        <section className="detail__section">
          <h2 className="detail__section-title">🍱 가는 길 식사</h2>
          <p className="tip-body">{route.food_recommendation}</p>
        </section>
      )}

      {/* 시간대 팁 */}
      {route.time_tip && (
        <section className="detail__section">
          <h2 className="detail__section-title">⏰ 출발 시간</h2>
          <p className="tip-body">{route.time_tip}</p>
        </section>
      )}

      {/* 편의시설 */}
      {route.facility_tip && (
        <section className="detail__section">
          <h2 className="detail__section-title">🚻 편의시설</h2>
          <p className="tip-body">{route.facility_tip}</p>
        </section>
      )}
    </div>
  )
}
