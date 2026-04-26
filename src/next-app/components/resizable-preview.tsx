"use client"

import { useCallback, useRef, useState, useEffect } from "react"

const STORAGE_KEY = "preview-height"
const DEFAULT_HEIGHT_DESKTOP = 384
const DEFAULT_HEIGHT_MOBILE = 600
const MIN_HEIGHT = 200
const MAX_HEIGHT = 1000

function getDefaultHeight(): number {
  if (typeof window === "undefined") return DEFAULT_HEIGHT_DESKTOP
  return window.matchMedia("(max-width: 767px)").matches
    ? DEFAULT_HEIGHT_MOBILE
    : DEFAULT_HEIGHT_DESKTOP
}

function getStoredHeight(): number {
  if (typeof window === "undefined") return DEFAULT_HEIGHT_DESKTOP
  const stored = sessionStorage.getItem(STORAGE_KEY)
  if (stored) {
    const n = Number(stored)
    if (!isNaN(n)) return Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, n))
  }
  return getDefaultHeight()
}

export function ResizablePreview({ children }: { children: React.ReactNode }) {
  const [height, setHeight] = useState(getStoredHeight)
  // Tracked in state (not just a ref) so we can flip a CSS class that
  // disables iframe pointer events while dragging — without it, the
  // cursor crossing into a child iframe interrupts the document-level
  // mousemove/mouseup handlers (events fire inside the iframe instead)
  // and the drag silently dies, especially when shrinking the preview.
  const [isDragging, setIsDragging] = useState(false)
  const dragging = useRef(false)
  const startY = useRef(0)
  const startH = useRef(0)

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, String(height))
  }, [height])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    setIsDragging(true)
    startY.current = e.clientY
    startH.current = height
    document.body.style.cursor = "row-resize"
    document.body.style.userSelect = "none"

    function onMouseMove(ev: MouseEvent) {
      if (!dragging.current) return
      const newH = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, startH.current + (ev.clientY - startY.current)))
      setHeight(newH)
    }

    function onMouseUp() {
      dragging.current = false
      setIsDragging(false)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
    }

    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
  }, [height])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return
    dragging.current = true
    setIsDragging(true)
    startY.current = e.touches[0].clientY
    startH.current = height

    function onTouchMove(ev: TouchEvent) {
      if (!dragging.current || ev.touches.length !== 1) return
      ev.preventDefault()
      const newH = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, startH.current + (ev.touches[0].clientY - startY.current)))
      setHeight(newH)
    }

    function onTouchEnd() {
      dragging.current = false
      setIsDragging(false)
      document.removeEventListener("touchmove", onTouchMove)
      document.removeEventListener("touchend", onTouchEnd)
    }

    document.addEventListener("touchmove", onTouchMove, { passive: false })
    document.addEventListener("touchend", onTouchEnd)
  }, [height])

  return (
    <div data-resize-dragging={isDragging || undefined}>
      <div style={{ height }} className="relative">
        {children}
        {/* Transparent overlay while dragging — sits on top of any iframe
            child so mousemove keeps firing on the document and the drag
            survives the cursor crossing into the iframe. The overlay's
            cursor matches the resize handle so feedback is consistent. */}
        {isDragging && (
          <div
            className="absolute inset-0 z-10 cursor-row-resize"
            aria-hidden="true"
          />
        )}
      </div>
      <div
        className="h-3 md:h-2 cursor-row-resize flex items-center justify-center hover:bg-primary/10 active:bg-primary/10 transition-colors group touch-none"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        <div className="w-8 h-0.5 rounded-full bg-border group-hover:bg-primary transition-colors" />
      </div>
    </div>
  )
}
