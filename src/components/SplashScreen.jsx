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

    return () => anim.destroy()
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
