/**
 * 로그인 유도 모달
 * - 찜/채팅/제보 등 로그인 필요한 기능 시도 시 표시
 * - 카카오 로그인 진입점
 */
export default function LoginPromptModal({ message, onClose, onLogin }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose} aria-label="닫기">×</button>
        <div className="modal__icon">🔒</div>
        <h3 className="modal__title">{message ?? '로그인이 필요해요'}</h3>
        <p className="modal__desc">카카오 계정으로 1초 만에 시작</p>
        <button className="btn btn--kakao" onClick={onLogin}>
          카카오로 시작하기
        </button>
        <button className="modal__cancel" onClick={onClose}>나중에</button>
      </div>
    </div>
  )
}
