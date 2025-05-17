"use server"

// 不再使用文件系统存储，改用 Vercel KV 或客户端存储
import { cookies } from "next/headers"

// 获取所有图片
export async function getImages() {
  try {
    // 从 cookie 中获取图片列表的 ID
    const imageListCookie = cookies().get("image-list")

    if (!imageListCookie || !imageListCookie.value) {
      return []
    }

    try {
      // 尝试解析 cookie 值
      return JSON.parse(decodeURIComponent(imageListCookie.value)) || []
    } catch (e) {
      console.error("Error parsing image list cookie:", e)
      return []
    }
  } catch (error) {
    console.error("Error reading images:", error)
    return []
  }
}

// 保存图片元数据
export async function saveImage(imageData: any) {
  try {
    // 获取现有图片列表
    const images = await getImages()

    // 添加新图片
    const updatedImages = [imageData, ...images]

    // 只保留最近的 100 张图片，防止 cookie 过大
    const limitedImages = updatedImages.slice(0, 100)

    // 将更新后的列表保存到 cookie
    cookies().set({
      name: "image-list",
      value: encodeURIComponent(JSON.stringify(limitedImages)),
      path: "/",
      // 设置较长的过期时间
      maxAge: 60 * 60 * 24 * 365, // 1 年
      httpOnly: true,
      sameSite: "strict",
    })

    return true
  } catch (error) {
    console.error("Error saving image:", error)
    return false
  }
}

// 删除图片元数据
export async function removeImage(id: string) {
  try {
    // 获取现有图片列表
    const images = await getImages()

    // 过滤掉要删除的图片
    const filteredImages = images.filter((image: any) => image.id !== id)

    // 将更新后的列表保存到 cookie
    cookies().set({
      name: "image-list",
      value: encodeURIComponent(JSON.stringify(filteredImages)),
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 年
      httpOnly: true,
      sameSite: "strict",
    })

    return true
  } catch (error) {
    console.error("Error removing image:", error)
    return false
  }
}
