"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Copy, Check, Trash2, Loader2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

interface ImageData {
  id: string
  fileName: string
  fileUrl: string
  width: number
  height: number
  createdAt: string
}

interface ImageGalleryProps {
  images?: ImageData[] // 从服务器端传入的图片，现在可能为空
}

export function ImageGallery({ images: serverImages = [] }: ImageGalleryProps) {
  const router = useRouter()
  const [copied, setCopied] = useState<{ id: string; type: string } | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null)
  const [images, setImages] = useState<ImageData[]>(serverImages)
  const isMobile = useMediaQuery("(max-width: 640px)")

  // 在客户端加载图片
  useEffect(() => {
    const savedImages = localStorage.getItem("images")
    if (savedImages) {
      try {
        setImages(JSON.parse(savedImages))
      } catch (e) {
        console.error("Error parsing saved images:", e)
      }
    }
  }, [])

  const copyToClipboard = (url: string, id: string, type = "url") => {
    let textToCopy = url
    let fileName = url.split('/').pop() || 'image'

    if (type === "markdown") {
      textToCopy = `![${fileName}](${url})`
    }

    // 兼容移动端的复制方法
    const copyText = (text: string) => {
      // 创建临时文本区域
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-9999px'
      document.body.appendChild(textArea)
      
      // 选择并复制文本
      textArea.select()
      try {
        const successful = document.execCommand('copy')
        if (successful) {
          // 可以添加复制成功的提示
          toast.success(type === "url" ? "链接已复制" : "Markdown 已复制", {
            description: type === "url" ? "图片链接已复制到剪贴板" : "Markdown 格式已复制到剪贴板",
          })
        } else {
          toast.error('复制失败')
        }
      } catch (err) {
        toast.error('复制出错')
      }
      
      // 移除临时文本区域
      document.body.removeChild(textArea)
    }

    // 优先使用现代剪贴板API
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          toast.success(type === "url" ? "链接已复制" : "Markdown 已复制", {
            description: type === "url" ? "图片链接已复制到剪贴板" : "Markdown 格式已复制到剪贴板",
          })
        })
        .catch(() => {
          // 如果现代API失败，回退到传统方法
          copyText(textToCopy)
        })
    } else {
      // 对于不支持现代API的环境，使用传统方法
      copyText(textToCopy)
    }

    setCopied({ id, type })
    setTimeout(() => setCopied(null), 2000)
  }

  const handleDelete = async (id: string) => {
    try {
      setDeleting(id)

      // 从本地存储中删除
      const savedImages = localStorage.getItem("images")
      if (savedImages) {
        const parsedImages = JSON.parse(savedImages)
        const filteredImages = parsedImages.filter((img: ImageData) => img.id !== id)
        localStorage.setItem("images", JSON.stringify(filteredImages))
        setImages(filteredImages)
      }

      toast.success("删除成功", {
        description: "图片已成功删除",
      })
    } catch (error) {
      console.error("Error deleting image:", error)
      toast.error("删除失败", {
        description: "删除过程中发生意外错误",
      })
    } finally {
      setDeleting(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-16 border rounded-lg bg-muted/20">
        <div className="space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <ImageIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">暂无图片</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">您还没有上传任何图片。请切换到上传标签页开始上传。</p>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image) => (
          <Card key={image.id} className="overflow-hidden group hover:shadow-md transition-shadow">
            <div className="aspect-video relative bg-muted cursor-pointer" onClick={() => setSelectedImage(image)}>
              <Image
                src={image.fileUrl || "/placeholder.svg"}
                alt={image.fileName}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                unoptimized
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium truncate" title={image.fileName}>
                    {image.fileName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(image.createdAt)}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {image.width} × {image.height}
                </Badge>
              </div>

              <div className="grid grid-cols-12 gap-2">
                {/* 左侧：复制 URL 按钮 */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="col-span-5"
                      onClick={() => copyToClipboard(image.fileUrl, image.id, "url")}
                    >
                      {copied?.id === image.id && copied?.type === "url" ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          <span className="truncate">已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy className={copyButtonClass} />
                          <span className="truncate">复制链接</span>
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="hidden sm:block">
                    复制图片URL
                  </TooltipContent>
                </Tooltip>

                {/* 中间：复制 Markdown 按钮 */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="col-span-5"
                      onClick={() => copyToClipboard(image.fileUrl, image.id, "markdown")}
                    >
                      {copied?.id === image.id && copied?.type === "markdown" ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          <span className="truncate">已复制</span>
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-1" />
                          <span className="truncate">复制MD</span>
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="hidden sm:block">
                    复制Markdown格式
                  </TooltipContent>
                </Tooltip>

                {/* 右侧：删除按钮 */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="col-span-2 h-9 w-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(image.id)
                      }}
                      disabled={deleting === image.id}
                    >
                      {deleting === image.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="hidden sm:block">
                    删除图片
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl w-[90vw]">
          <DialogHeader>
            <DialogTitle className="text-lg">{selectedImage?.fileName}</DialogTitle>
          </DialogHeader>
          <div className="relative aspect-auto max-h-[70vh] overflow-hidden rounded-md mx-auto">
            {selectedImage && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={selectedImage.fileUrl || "/placeholder.svg"}
                alt={selectedImage.fileName}
                className="object-contain w-full h-full"
              />
            )}
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-sm text-muted-foreground">
              {selectedImage?.width} × {selectedImage?.height} 像素
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-initial"
                onClick={() => selectedImage && copyToClipboard(selectedImage.fileUrl, selectedImage.id, "url")}
              >
                <Copy className={copyButtonClass} />
                复制链接
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-initial"
                onClick={() => selectedImage && copyToClipboard(selectedImage.fileUrl, selectedImage.id, "markdown")}
              >
                <FileText className="h-4 w-4 mr-2" />
                复制MD
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}

function ImageIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  )
}

// 在现有的样式中添加
const copyButtonClass = cn(
  "h-8 w-8 md:h-4 md:w-4 mr-1 touch-manipulation", // 增加触摸目标大小
  "active:scale-95 transition-transform", // 添加触摸反馈
  "hover:bg-gray-100 rounded-full p-1" // 增加可点击区域
)
