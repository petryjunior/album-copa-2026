import { useState } from 'react'
import { teamCodeToFlagEmoji, teamCodeToFlagSlug } from '@/lib/teamFlags'

type Props = {
  code: string
  /** Tooltip / a11y name */
  title?: string
  /** Extra classes for the `<img>` or emoji fallback (defaults include size `h-6 w-8`). */
  className?: string
}

export function TeamFlag({ code, title, className }: Props) {
  const slug = teamCodeToFlagSlug(code)
  const emoji = teamCodeToFlagEmoji(code)
  const [imgFailed, setImgFailed] = useState(false)

  if (slug == null || imgFailed) {
    return (
      <span
        className={`text-2xl leading-none select-none ${className ?? ''}`}
        aria-hidden
        title={title}
      >
        {emoji}
      </span>
    )
  }

  return (
    <img
      src={`https://flagcdn.com/h24/${slug}.png`}
      srcSet={`https://flagcdn.com/h48/${slug}.png 2x`}
      alt=""
      width={32}
      height={24}
      loading="lazy"
      decoding="async"
      draggable={false}
      title={title}
      referrerPolicy="no-referrer"
      className={`h-6 w-8 shrink-0 rounded-sm object-cover shadow-sm ring-1 ring-slate-200/90 ${className ?? ''}`}
      onError={() => setImgFailed(true)}
    />
  )
}
