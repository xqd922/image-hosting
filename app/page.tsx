import { ImageUploader } from "@/components/image-uploader"
import { ImageGallery } from "@/components/image-gallery"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="container mx-auto py-4 px-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">图床服务</h1>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="upload">上传图片</TabsTrigger>
            <TabsTrigger value="gallery">图片库</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <div className="max-w-2xl mx-auto">
              <div className="text-center space-y-4 mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">上传您的图片</h2>
                <p className="text-muted-foreground">支持JPG、PNG、GIF等格式，单张图片最大10MB</p>
              </div>

              <ImageUploader />
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-6">
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">图片库</h2>
              <p className="text-muted-foreground">管理您上传的所有图片</p>
            </div>

            <ImageGallery />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 py-6 mt-10">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          &copy; {new Date().getFullYear()} 图床服务 | 基于 Next.js 和 ChatGLM API
        </div>
      </footer>
    </div>
  )
}
