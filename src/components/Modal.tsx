import { useEffect, useState, type ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setVisible(true)
    }
  }, [isOpen])

  const handleTransitionEnd = () => {
    if (!isOpen) {
      setVisible(false)
    }
  }

  const handleBackdropClick = () => {
    onClose()
  }

  const handleSheetClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  if (!visible && !isOpen) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
      onTransitionEnd={handleTransitionEnd}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      />

      {/* Bottom Sheet */}
      <div
        className={`relative w-full max-h-[80vh] rounded-t-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ backgroundColor: '#FFF9F2' }}
        onClick={handleSheetClick}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-9 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Title */}
        {title && (
          <div className="px-5 pb-3">
            <h2 className="text-lg font-bold" style={{ color: '#1A1B3A' }}>
              {title}
            </h2>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom,0px)+72px)]">
          {children}
        </div>
      </div>
    </div>
  )
}
