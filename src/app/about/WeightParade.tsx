'use client'

import { useEffect, useRef, useState } from 'react'

const SEQUENCE = [
  { weight: 300, style: 'normal' },
  { weight: 300, style: 'italic' },
  { weight: 400, style: 'normal' },
  { weight: 400, style: 'italic' },
  { weight: 500, style: 'normal' },
  { weight: 500, style: 'italic' },
  { weight: 600, style: 'normal' },
  { weight: 600, style: 'italic' },
  { weight: 700, style: 'normal' },
  { weight: 700, style: 'italic' },
  { weight: 600, style: 'normal' },
] as const

type WeightParadeProps = {
  children?: React.ReactNode
  className?: string
}

export function WeightParade({
  children = 'Cormorant Garamond',
  className = 'font-display text-background',
}: WeightParadeProps) {
  const ref = useRef<HTMLHeadingElement>(null)
  const [step, setStep] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasAnimated) return

        setHasAnimated(true)
        observer.disconnect()

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          setStep(SEQUENCE.length - 1)
          return
        }

        let nextStep = 1
        const intervalId = window.setInterval(() => {
          setStep(nextStep)
          nextStep += 1

          if (nextStep >= SEQUENCE.length) {
            window.clearInterval(intervalId)
          }
        }, 400)
      },
      { threshold: 0.35 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasAnimated])

  const current = SEQUENCE[step]

  return (
    <h2
      ref={ref}
      className={`${className} text-[clamp(4rem,12vw,10rem)] leading-none`}
      style={{
        fontWeight: current.weight,
        fontStyle: current.style,
        transition: 'font-weight 180ms ease-out, font-style 180ms ease-out',
      }}
    >
      {children}
    </h2>
  )
}
