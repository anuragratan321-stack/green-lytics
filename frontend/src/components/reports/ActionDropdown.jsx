import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Download, FilePenLine, MoreHorizontal, Printer, Trash2 } from 'lucide-react'

const MENU_WIDTH = 208
const MENU_ESTIMATED_HEIGHT = 188

function ActionDropdown({ isOpen, onOpenChange, onEdit, onDownload, onPrint, onDelete }) {
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const [position, setPosition] = useState({ top: 0, left: 0, openUpward: false })

  const computePosition = () => {
    const trigger = buttonRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const openUpward = spaceBelow < MENU_ESTIMATED_HEIGHT + 12 && rect.top > MENU_ESTIMATED_HEIGHT
    const top = openUpward ? rect.top - MENU_ESTIMATED_HEIGHT - 8 : rect.bottom + 8
    const unclampedLeft = rect.right - MENU_WIDTH
    const left = Math.min(window.innerWidth - MENU_WIDTH - 8, Math.max(8, unclampedLeft))

    setPosition({ top, left, openUpward })
  }

  useEffect(() => {
    if (!isOpen) return
    computePosition()

    const handleOutsideClick = (event) => {
      if (buttonRef.current?.contains(event.target)) return
      if (menuRef.current?.contains(event.target)) return
      onOpenChange(false)
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') onOpenChange(false)
    }

    const closeOnScroll = () => onOpenChange(false)
    const handleResize = () => computePosition()

    window.addEventListener('mousedown', handleOutsideClick)
    window.addEventListener('keydown', handleEscape)
    window.addEventListener('scroll', closeOnScroll, true)
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('mousedown', handleOutsideClick)
      window.removeEventListener('keydown', handleEscape)
      window.removeEventListener('scroll', closeOnScroll, true)
      window.removeEventListener('resize', handleResize)
    }
  }, [isOpen, onOpenChange])

  const menu = useMemo(() => {
    if (!isOpen) return null

    return (
      <div
        ref={menuRef}
        style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
        className='fixed z-[90] rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg dark:border-zinc-700 dark:bg-zinc-900'
      >
        <button
          type='button'
          onClick={() => {
            onOpenChange(false)
            onEdit()
          }}
          className='flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800'
        >
          <FilePenLine size={15} />
          Edit Inputs
        </button>
        <button
          type='button'
          onClick={() => {
            onOpenChange(false)
            onDownload()
          }}
          className='flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800'
        >
          <Download size={15} />
          Download
        </button>
        <button
          type='button'
          onClick={() => {
            onOpenChange(false)
            onPrint()
          }}
          className='flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800'
        >
          <Printer size={15} />
          Print
        </button>
        <button
          type='button'
          onClick={() => {
            onOpenChange(false)
            onDelete()
          }}
          className='mt-1 flex w-full items-center gap-2 rounded-lg bg-rose-50/80 px-2.5 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-100 dark:bg-rose-950/25 dark:text-rose-300 dark:hover:bg-rose-950/45'
        >
          <Trash2 size={15} />
          Delete
        </button>
      </div>
    )
  }, [isOpen, onDelete, onDownload, onEdit, onOpenChange, onPrint, position.left, position.top])

  return (
    <>
      <button
        ref={buttonRef}
        type='button'
        onClick={() => onOpenChange(!isOpen)}
        className='inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
        aria-label='More actions'
      >
        <MoreHorizontal size={16} />
      </button>
      {isOpen ? createPortal(menu, document.body) : null}
    </>
  )
}

export default ActionDropdown
