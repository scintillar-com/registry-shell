"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import type { ControlEntry } from "@shell/hooks/use-controls"
import type { CameraState, CanvasPosition } from "@shell/components/preview-canvas"
import { PreviewControls } from "@shell/components/preview-controls"
import { PreviewCanvas } from "@shell/components/preview-canvas"
import { useTranslations } from "@shell/lib/i18n"
import { useMobileSidebar } from "@shell/components/sidebar-provider"

const SnapshotModeContext = createContext(false)

/** Wrap children in this to render PreviewLayout without the canvas chrome. */
export function SnapshotModeProvider({ children }: { children: React.ReactNode }) {
  return <SnapshotModeContext.Provider value={true}>{children}</SnapshotModeContext.Provider>
}

function useIsMobile() {
  const [mobile, setMobile] = useState<boolean | null>(null)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync with external matchMedia API
    setMobile(mq.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])
  return mobile
}

export function PreviewLayout({
  children,
  controls,
}: {
  children: React.ReactNode
  controls?: ControlEntry[]
}) {
  const isSnapshot = useContext(SnapshotModeContext)
  const hasControls = controls && controls.length > 0
  const isMobile = useIsMobile()

  const [showControls, setShowControls] = useState(() => {
    if (typeof window === "undefined") return false
    return sessionStorage.getItem("preview-controls") === "true"
  })
  const [restoredFullscreen] = useState(() => {
    if (typeof window === "undefined") return false
    return sessionStorage.getItem("preview-fullscreen") === "true"
  })
  const [fullscreen, setFullscreen] = useState(restoredFullscreen)
  const [fsVisible, setFsVisible] = useState(restoredFullscreen)
  const t = useTranslations()
  const { setCollapsed } = useMobileSidebar()

  // Shared camera state between inline and fullscreen canvases
  const [camera, setCamera] = useState<CameraState>({ x: 0, y: 0, zoom: 1 })
  const [position, setPosition] = useState<CanvasPosition>({ x: 0, y: 0 })

  // Ref to the inline preview container — used to capture its position
  const inlineRef = useRef<HTMLDivElement>(null)
  // The captured rect of the inline preview when entering/exiting fullscreen
  const [originRect, setOriginRect] = useState({ top: 0, bottom: 0, left: 0, right: 0 })

  // Sync state on mount / mobile change
  useEffect(() => {
    if (isMobile === null) return
    // Restore fullscreen sidebar collapse
    if (fullscreen && !isMobile) setCollapsed(true)
  }, [isMobile]) // eslint-disable-line react-hooks/exhaustive-deps -- intentionally run only on mount/mobile change

  // Animate fullscreen in
  useEffect(() => {
    if (fullscreen) {
      requestAnimationFrame(() => setFsVisible(true))
    }
  }, [fullscreen])

  const enterFullscreen = useCallback(() => {
    if (inlineRef.current) {
      const rect = inlineRef.current.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      setOriginRect({
        top: rect.top,
        bottom: vh - rect.bottom,
        left: rect.left,
        right: vw - rect.right,
      })
    }
    if (!isMobile) setCollapsed(true)
    setCamera({ x: 0, y: 0, zoom: 1 })
    setPosition({ x: 0, y: 0 })
    setFullscreen(true)
    sessionStorage.setItem("preview-fullscreen", "true")
  }, [isMobile, setCollapsed])

  // In snapshot mode, render children directly — no canvas, no controls
  if (isSnapshot) {
    return <>{children}</>
  }

  function toggleControls() {
    if (isMobile) {
      if (fullscreen) {
        setShowControls((s) => {
          sessionStorage.setItem("preview-controls", String(!s))
          return !s
        })
      } else {
        setFullscreen(true)
        setShowControls(true)
        sessionStorage.setItem("preview-controls", "true")
      }
    } else {
      setShowControls((s) => {
        sessionStorage.setItem("preview-controls", String(!s))
        return !s
      })
    }
  }

  function exitFullscreen() {
    // Animate sidebar open + preview shrink simultaneously
    if (!isMobile) {
      setCollapsed(false)
      // Set origin to where the inline preview will land (sidebar width = 16rem = 256px on md+)
      setOriginRect((prev) => ({ ...prev, left: 256 }))
    }
    setFsVisible(false)
    setCamera({ x: 0, y: 0, zoom: 1 })
    setPosition({ x: 0, y: 0 })
    sessionStorage.setItem("preview-fullscreen", "false")
    // After animation, switch to relative
    setTimeout(() => {
      setFullscreen(false)
      if (isMobile) {
        setShowControls(false)
        sessionStorage.setItem("preview-controls", "false")
      }
    }, 300)
  }

  return (
    <>
      {/* Inline placeholder — reserves space in the document flow when fullscreen */}
      {fullscreen && (
        <div ref={inlineRef} className="border-y border-border h-full" />
      )}

      {/* Single preview container — animates between inline and fullscreen */}
      <div
        ref={!fullscreen ? inlineRef : undefined}
        className={`
          bg-background border-y border-border overflow-hidden flex flex-col
          ${fullscreen ? "fixed z-40 transition-[top,bottom,left,right] duration-300 ease-in-out motion-reduce:transition-none" : "relative h-full"}
        `}
        style={fullscreen ? {
          top: fsVisible ? "3.5rem" : originRect.top,
          bottom: fsVisible ? 0 : originRect.bottom,
          left: fsVisible ? 0 : originRect.left,
          right: fsVisible ? 0 : originRect.right,
        } : undefined}
      >
        <div className="flex-1 min-h-0 relative">
          <PreviewCanvas
            showControls={showControls}
            onToggleControls={hasControls ? toggleControls : undefined}
            fullscreen={fullscreen}
            onToggleFullscreen={fullscreen ? exitFullscreen : enterFullscreen}
            camera={camera}
            onCameraChange={setCamera}
            position={position}
            onPositionChange={setPosition}
          >
            {children}
          </PreviewCanvas>

          {/* Desktop props panel — floating card top-right */}
          {hasControls && (
            <aside
              className={`
                hidden md:flex flex-col absolute top-14 right-3 z-50 w-56 rounded-lg border border-border bg-background shadow-xl overflow-hidden transition-all duration-300 ease-in-out motion-reduce:transition-none
                ${showControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}
              `}
              style={{ maxHeight: fullscreen ? "calc(100vh - 10rem)" : "calc(100% - 4.5rem)" }}
            >
              <div className="shrink-0 px-4 pt-4 pb-3">
                <p className="text-xs font-semibold text-foreground">
                  {t("controls.title")}
                </p>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
                <PreviewControls entries={controls} />
              </div>
            </aside>
          )}
        </div>

        {/* Mobile props panel — inline, pushes preview up */}
        {hasControls && (
          <div
            className="md:hidden shrink-0 border-t border-border bg-background transition-[max-height] duration-300 ease-in-out motion-reduce:transition-none overflow-hidden flex flex-col"
            style={{ maxHeight: showControls ? "50vh" : 0 }}
          >
            <div className="shrink-0 px-4 pt-4 pb-3">
              <p className="text-xs font-semibold text-foreground">
                {t("controls.title")}
              </p>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-8">
              <PreviewControls entries={controls} />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
