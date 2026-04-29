import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * 인증 상태 + 프로필 관리 훅
 * - 카카오 OAuth 세션 추적
 * - profiles 테이블 자동 조회
 */
export function useAuth() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // 프로필 로드
  const loadProfile = useCallback(async (userId) => {
    if (!userId) { setProfile(null); return }
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nickname, avatar_url, role, visit_count')
      .eq('id', userId)
      .single()
    if (!error) setProfile(data)
  }, [])

  useEffect(() => {
    // 초기 세션
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) loadProfile(session.user.id)
      setLoading(false)
    })

    // 세션 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        if (session?.user) loadProfile(session.user.id)
        else setProfile(null)
      }
    )

    return () => subscription.unsubscribe()
  }, [loadProfile])

  const signInWithKakao = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) console.error('[Auth] 카카오 로그인 실패:', error)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return {
    session,
    profile,
    loading,
    isLoggedIn: !!session,
    isAdmin: profile?.role === 'admin',
    signInWithKakao,
    signOut,
    refreshProfile: () => session?.user && loadProfile(session.user.id)
  }
}
