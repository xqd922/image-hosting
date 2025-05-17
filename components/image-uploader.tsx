"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Upload, Loader2, ImageIcon, X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface FileWithPreview extends File {
  preview?: string
  id: string
}

export function ImageUploader() {
  const router = useRouter()
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [uploading, setUploading] = useState(false)
  const [currentFileIndex, setCurrentFileIndex] = useState(0)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [overallProgress, setOverallProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    const newFiles: FileWithPreview[] = []

    Array.from(selectedFiles).forEach((file) => {
      const reader = new FileReader()
      const fileWithId = Object.assign(file, { id: generateId() }) as FileWithPreview

      reader.onload = (e) => {
        fileWithId.preview = e.target?.result as string
        setFiles((prev) => [...prev])
      }

      reader.readAsDataURL(file)
      newFiles.push(fileWithId)
    })

    setFiles((prev) => [...prev, ...newFiles])
  }

  const generateId = () => {
    return Math.random().toString(36).substring(2, 15)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = e.dataTransfer.files
      const newFiles: FileWithPreview[] = []

      Array.from(droppedFiles).forEach((file) => {
        const reader = new FileReader()
        const fileWithId = Object.assign(file, { id: generateId() }) as FileWithPreview

        reader.onload = (e) => {
          fileWithId.preview = e.target?.result as string
          setFiles((prev) => [...prev])
        }

        reader.readAsDataURL(file)
        newFiles.push(fileWithId)
      })

      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id))
  }

  const clearFiles = () => {
    setFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const uploadFile = async (file: File): Promise<any> => {
    const formData = new FormData()
    formData.append("file", file)

    // 调用 ChatGLM API
    const response = await fetch("https://chatglm.cn/chatglm/backend-api/assistant/file_upload", {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "App-Name": "chatglm",
        Connection: "keep-alive",
        DNT: "1",
        Origin: "https://chatglm.cn",
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("API error response:", errorText)
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.status !== 0) {
      throw new Error(data.message || "API error")
    }

    return data
  }

  const simulateProgress = (callback: (progress: number) => void) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += 5
      if (progress >= 95) {
        clearInterval(interval)
      }
      callback(progress)
    }, 100)
    return interval
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0) return

    try {
      setUploading(true)
      setCurrentFileIndex(0)
      setUploadProgress(0)
      setOverallProgress(0)

      const results = []
      const savedImages = localStorage.getItem("images")
      const existingImages = savedImages ? JSON.parse(savedImages) : []

      for (let i = 0; i < files.length; i++) {
        setCurrentFileIndex(i)
        setUploadProgress(0)

        // 模拟单个文件的上传进度
        const progressInterval = simulateProgress((progress) => {
          setUploadProgress(progress)
          // 更新总体进度
          const overallPercent = ((i + progress / 100) / files.length) * 100
          setOverallProgress(overallPercent)
        })

        try {
          // 上传当前文件
          const result = await uploadFile(files[i])

          // 创建图片数据
          const imageData = {
            id: result.result.file_id,
            fileName: result.result.file_name,
            fileUrl: result.result.file_url,
            width: result.result.width,
            height: result.result.height,
            createdAt: new Date().toISOString(),
          }

          results.push(imageData)

          // 清除进度条定时器
          clearInterval(progressInterval)
          setUploadProgress(100)

          // 更新总体进度
          const overallPercent = ((i + 1) / files.length) * 100
          setOverallProgress(overallPercent)
        } catch (error) {
          clearInterval(progressInterval)
          console.error(`Error uploading file ${files[i].name}:`, error)
          toast({
            title: "上传失败",
            description: `文件 "${files[i].name}" 上传失败: ${error instanceof Error ? error.message : "未知错误"}`,
            variant: "destructive",
          })
        }
      }

      // 保存所有成功上传的图片到本地存储
      if (results.length > 0) {
        localStorage.setItem("images", JSON.stringify([...results, ...existingImages]))

        toast({
          title: "上传成功",
          description: `成功上传 ${results.length} 张图片，失败 ${files.length - results.length} 张。`,
        })

        // 重置表单并刷新页面
        setFiles([])
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        router.refresh()
      }
    } catch (error) {
      console.error("Error during batch upload:", error)
      toast({
        title: "批量上传失败",
        description: error instanceof Error ? error.message : "上传过程中发生错误",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
      setOverallProgress(0)
    }
  }

  return (
    <Card className="w-full border-2 border-dashed">
      <CardContent className="pt-6 pb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div
            className={cn(
              "relative rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer",
              files.length > 0 ? "bg-gray-50 dark:bg-gray-900/50" : "",
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />

            <div className="space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <ImageIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-medium text-gray-900 dark:text-gray-100">点击上传或拖放图片</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">支持 PNG, JPG, GIF 格式，可选择多张图片</p>
              </div>
            </div>
          </div>

          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">已选择 {files.length} 张图片</h3>
                <Button type="button" variant="outline" size="sm" onClick={clearFiles}>
                  清空
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {files.map((file) => (
                  <div key={file.id} className="relative group">
                    <div className="aspect-square rounded-md overflow-hidden border bg-muted">
                      {file.preview ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={file.preview || "/placeholder.svg"}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-6 w-6 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFile(file.id)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <p className="text-xs truncate mt-1" title={file.name}>
                      {file.name}
                    </p>
                  </div>
                ))}
                <div
                  className="aspect-square rounded-md border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    fileInputRef.current?.click()
                  }}
                >
                  <Plus className="h-8 w-8 text-gray-400" />
                </div>
              </div>
            </div>
          )}

          {uploading && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>总进度 ({Math.round(overallProgress)}%)</span>
                  <span>
                    {currentFileIndex + 1} / {files.length}
                  </span>
                </div>
                <Progress value={overallProgress} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>当前文件 ({Math.round(uploadProgress)}%)</span>
                  <span>{files[currentFileIndex]?.name}</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            </div>
          )}

          <Button type="submit" className="w-full h-12 text-base" disabled={files.length === 0 || uploading}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                上传中...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-5 w-5" />
                上传图片 {files.length > 0 ? `(${files.length})` : ""}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
