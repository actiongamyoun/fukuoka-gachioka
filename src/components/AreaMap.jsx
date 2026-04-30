import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

/**
 * 지역 약도 컴포넌트
 * - DB에서 areas.svg_map 읽어서 렌더링
 * - 핀 클릭 시 해당 스팟 상세 페이지로 이동
 * - data-spot 속성에 스팟 이름이나 slug 저장
 */
export default function AreaMap({ areaSlug }) {
  const containerRef = useRef(null)
  const navigate = useNavigate()
  const [svgMap, setSvgMap] = useState(null)
  const [spots, setSpots] = useState({})  // { name: id }
  const [loading, setLoading] = useState(true)
  const [selectedSpot, setSelectedSpot] = useState(null)

  // 지역 SVG + 스팟 매핑 데이터 로드
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [areaRes, spotsRes] = await Promise.all([
        supabase.from('areas').select('slug, name_ko, svg_map').eq('slug', areaSlug).single(),
        supabase.from('spots').select('id, name').eq('status', 'approved')
      ])

      if (!areaRes.error && areaRes.data) setSvgMap(areaRes.data.svg_map)
      if (!spotsRes.error && spotsRes.data) {
        // name → id 매핑
        const map = {}
        spotsRes.data.forEach(s => { map[s.name] = s.id })
        setSpots(map)
      }
      setLoading(false)
    }
    load()
  }, [areaSlug])

  // SVG 렌더 후 핀에 클릭 리스너 추가
  useEffect(() => {
    if (!svgMap || !containerRef.current) return

    const pins = containerRef.current.querySelectorAll('.pin')
    const handlers = []

    pins.forEach(pin => {
      const handler = () => {
        const spotName = pin.dataset.spot
        const spotId = spots[spotName]
        if (spotId) {
          navigate(`/spots/${spotId}`)
        } else {
          // 매핑 안 된 핀 (역, 신사 등) - 정보만 표시
          setSelectedSpot({
            name: spotName,
            isInfo: true
          })
        }
      }
      pin.addEventListener('click', handler)
      pin.style.cursor = 'pointer'
      handlers.push([pin, handler])
    })

    return () => {
      handlers.forEach(([pin, handler]) => pin.removeEventListener('click', handler))
    }
  }, [svgMap, spots, navigate])

  if (loading) return <div className="map-loading">약도 불러오는 중…</div>
  if (!svgMap) return null

  return (
    <div className="area-map">
      <div 
        ref={containerRef}
        className="area-map__svg"
        dangerouslySetInnerHTML={{ __html: svgMap }}
      />

      <div className="area-map__legend">
        <span className="legend-item"><span className="dot dot--food"></span>맛집</span>
        <span className="legend-item"><span className="dot dot--shop"></span>쇼핑</span>
        <span className="legend-item"><span className="dot dot--stay"></span>숙소</span>
        <span className="legend-item"><span className="dot dot--sight"></span>명소</span>
        <span className="legend-item"><span className="dot dot--station"></span>역</span>
        <span className="legend-item">━━ ★ 추천 코스</span>
      </div>

      {selectedSpot && (
        <div className="map-toast" onClick={() => setSelectedSpot(null)}>
          📍 {selectedSpot.name} (참고 위치)
        </div>
      )}
    </div>
  )
}
