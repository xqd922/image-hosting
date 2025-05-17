"use server"

import { revalidatePath } from "next/cache"
import { saveImage } from "@/lib/image-service"

export async function uploadImage(formData: FormData) {
  try {
    const file = formData.get("file") as File

    if (!file) {
      return { success: false, error: "No file provided" }
    }

    // Create a new FormData object for the API request
    const apiFormData = new FormData()
    apiFormData.append("file", file)

    // Make request to ChatGLM API
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
      body: apiFormData,
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.status !== 0) {
      return { success: false, error: data.message || "API error" }
    }

    // Save image metadata to our database
    const imageData = {
      id: data.result.file_id,
      fileName: data.result.file_name,
      fileUrl: data.result.file_url,
      width: data.result.width,
      height: data.result.height,
      createdAt: new Date().toISOString(),
    }

    await saveImage(imageData)

    revalidatePath("/")
    return { success: true, data: imageData }
  } catch (error) {
    console.error("Error uploading image:", error)
    return { success: false, error: "Failed to upload image" }
  }
}

export async function deleteImage(id: string) {
  try {
    // 在服务器端，我们不再需要删除图片，因为存储在客户端
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error deleting image:", error)
    return { success: false, error: "Failed to delete image" }
  }
}
