"use client"

import { useEffect, useState } from "react"

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)

    // 初始化匹配状态
    if (media.matches !== matches) {
      setMatches(media.matches)
    }

    // 监听媒体查询变化
    const listener = () => {
      setMatches(media.matches)
    }

    // 添加监听器
    media.addEventListener("change", listener)

    // 清理函数
    return () => {
      media.removeEventListener("change", listener)
    }
  }, [matches, query])

  return matches
}
