import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

/**
 * 카카오 OAuth 콜백 페이지
 * Supabase가 detectSessionInUrl로 자동 처리하지만,
 * 명시적으로 세션 확인 후 리다이렉트
 */
export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      navigate(session ? '/spots' : '/my', { replace: true })
    })
  }, [navigate])

  return (
    <div className="page page--center">
      <div className="empty">로그인 처리 중…</div>
    </div>
  )
}
