import { useEffect, useState } from 'react'

/**
 * 첫 방문자용 스플래시 화면
 * - localStorage 'visited' 체크
 * - 첫 방문자만 1.5초 표시 후 사라짐
 * - 재방문자는 즉시 본 화면
 */
export default function SplashScreen({ onFinish }) {
  const [show, setShow] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // 첫 방문자만 표시
    const visited = localStorage.getItem('visited')
    if (visited) {
      setShow(false)
      onFinish?.()
      return
    }

    // 1.2초 후 페이드아웃 시작, 1.5초 후 완전 종료
    const fadeTimer = setTimeout(() => setFadeOut(true), 1200)
    const endTimer = setTimeout(() => {
      localStorage.setItem('visited', '1')
      setShow(false)
      onFinish?.()
    }, 1500)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(endTimer)
    }
  }, [onFinish])

  if (!show) return null

  return (
    <div className={`splash ${fadeOut ? 'splash--fade' : ''}`}>
      <div className="splash__inner">
        <div className="splash__icon">🍜</div>
        <h1 className="splash__title">후쿠오카같이오까</h1>
        <div className="splash__divider"></div>
        <p className="splash__sub">한국인 여행자를 위한</p>
        <p className="splash__sub">따뜻한 정보 공유</p>
      </div>
    </div>
  )
}
