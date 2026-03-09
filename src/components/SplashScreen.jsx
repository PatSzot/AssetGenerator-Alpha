import { useEffect, useRef, useState } from 'react'
import lottie from 'lottie-web'
import './SplashScreen.css'

export default function SplashScreen({ onDone }) {
  const containerRef = useRef(null)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const anim = lottie.loadAnimation({
      container:  containerRef.current,
      renderer:   'svg',
      loop:       false,
      autoplay:   true,
      path:       '/GTMGrabBagLoadingAnimation.json',
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice',
      },
    })

    anim.addEventListener('complete', () => {
      setFading(true)
    })

    anim.addEventListener('data_failed', () => {
      setFading(true)
    })

    // Fallback: if animation hasn't completed within 5s, skip it
    const timeout = setTimeout(() => setFading(true), 5000)

    return () => {
      anim.destroy()
      clearTimeout(timeout)
    }
  }, [])

  return (
    <div
      className={`splash${fading ? ' splash-fade' : ''}`}
      onTransitionEnd={onDone}
    >
      <div ref={containerRef} className="splash-lottie" />
    </div>
  )
}
