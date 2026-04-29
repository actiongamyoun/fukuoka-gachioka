import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * 교통 팁 탭
 * - categories.slug = 'transport' 인 스팟만 노출
 * - JR Pass, 지하철 1일권, 공항버스 등의 정보를 큐레이션
 */
export default function Transport() {
  const [tips, setTips] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: cat } = await supabase
        .from('categories').select('id').eq('slug', 'transport').single()
      if (!cat) { setLoading(false); return }

      const { data } = await supabase
        .from('spots')
        .select('id, name, description, cover_image_url, area:areas(name_ko)')
        .eq('status', 'approved')
        .eq('category_id', cat.id)
        .order('favorite_count', { ascending: false })
      setTips(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="page">
      <header className="page__header">
        <h1 className="page__title">🚃 교통</h1>
        <p className="page__subtitle">JR Pass · 지하철 · 공항버스</p>
      </header>

      {loading ? (
        <div className="empty">불러오는 중…</div>
      ) : tips.length === 0 ? (
        <div className="empty">
          <p>아직 등록된 팁이 없어요</p>
          <small>곧 채워집니다 🚉</small>
        </div>
      ) : (
        <ul className="tip-list">
          {tips.map(t => (
            <li key={t.id} className="tip-card">
              <h3>{t.name}</h3>
              {t.area?.name_ko && <span className="tip-card__area">{t.area.name_ko}</span>}
              {t.description && <p>{t.description}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
