import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../lib/AuthContext'

export default function Chat() {
  const { isLoggedIn, profile, signInWithKakao } = useAuthContext()
  const [areas, setAreas] = useState([])
  const [selectedArea, setSelectedArea] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef(null)

  // 지역 목록 로드
  useEffect(() => {
    supabase.from('areas')
      .select('*').eq('is_active', true).order('display_order')
      .then(({ data }) => {
        setAreas(data ?? [])
        if (data?.length && !selectedArea) setSelectedArea(data[0])
      })
  }, [])

  // 채팅 메시지 로드 + Realtime 구독
  useEffect(() => {
    if (!selectedArea || !isLoggedIn) return

    let channel
    const init = async () => {
      // 최근 50개 로드
      const { data } = await supabase
        .from('chat_messages')
        .select('id, content, created_at, user_id, profile:profiles(nickname, avatar_url)')
        .eq('area_id', selectedArea.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(50)
      setMessages((data ?? []).reverse())

      // Realtime 구독
      channel = supabase
        .channel(`chat:${selectedArea.slug}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `area_id=eq.${selectedArea.id}`
        }, async (payload) => {
          // 메시지 작성자 프로필 join
          const { data: profile } = await supabase
            .from('profiles')
            .select('nickname, avatar_url')
            .eq('id', payload.new.user_id)
            .single()
          setMessages(prev => [...prev, { ...payload.new, profile }])
        })
        .subscribe()
    }
    init()

    return () => { if (channel) supabase.removeChannel(channel) }
  }, [selectedArea, isLoggedIn])

  // 자동 스크롤
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || !selectedArea || sending) return
    setSending(true)
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        area_id: selectedArea.id,
        user_id: profile.id,
        content: text
      })
    if (!error) setInput('')
    else alert('전송 실패: ' + error.message)
    setSending(false)
  }

  // 비로그인 - 가입 유도
  if (!isLoggedIn) {
    return (
      <div className="page page--center">
        <div className="login-card">
          <h2>실시간 채팅 💬</h2>
          <p>지역별 한국인 여행자들과 실시간으로 정보 공유</p>
          <button className="btn btn--kakao" onClick={signInWithKakao}>
            카카오로 시작하기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page page--chat">
      <header className="page__header">
        <h1 className="page__title">채팅</h1>
      </header>

      <div className="chip-row">
        {areas.map(a => (
          <button
            key={a.id}
            className={`chip ${selectedArea?.id === a.id ? 'is-active' : ''}`}
            onClick={() => setSelectedArea(a)}
          >{a.name_ko}</button>
        ))}
      </div>

      <ul className="chat-list" ref={listRef}>
        {messages.length === 0
          ? <li className="empty">첫 메시지를 남겨보세요</li>
          : messages.map(m => (
              <li
                key={m.id}
                className={`chat-msg ${m.user_id === profile?.id ? 'chat-msg--mine' : ''}`}
              >
                <div className="chat-msg__nick">{m.profile?.nickname ?? '익명'}</div>
                <div className="chat-msg__bubble">{m.content}</div>
              </li>
            ))}
      </ul>

      <form className="chat-input" onSubmit={sendMessage}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`${selectedArea?.name_ko ?? '지역'}에 메시지 보내기`}
          maxLength={500}
          disabled={sending}
        />
        <button type="submit" disabled={!input.trim() || sending}>전송</button>
      </form>
    </div>
  )
}
