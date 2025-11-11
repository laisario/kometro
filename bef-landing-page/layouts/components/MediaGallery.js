import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Player from "./Player"

function MediaGallery({ product, currentImageIndex, setCurrentImageIndex }) {
  const [loading, setLoading] = useState(true)
  
  const media = product?.midia?.[currentImageIndex]

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? product.midia.length - 1 : prev - 1
    )
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === product.midia.length - 1 ? 0 : prev + 1
    )
  }

  if (!media) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-100 rounded-lg">
        <span className="text-gray-500">Carregando mídia...</span>
      </div>
    )
  }

  return (
    <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden mb-6 flex items-center justify-center">
      {media?.type === "image" ? (
        <>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
              <div className="w-20 h-20 bg-gray-300 rounded-full" />
            </div>
          )}
          <img
            src={media.url || "/placeholder.svg"}
            alt={`${product?.name} - Image ${currentImageIndex + 1}`}
            className="object-contain w-full h-full"
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
          />
        </>
      ) : media.type === "video_url" ? (
        <div className="w-full max-w-4xl mx-auto">
          <iframe
            width="100%"
            height="500"
            src={media.url.replace("watch?v=", "embed/")}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-lg"
          ></iframe>
        </div>
      ) : (
        <Player videoSrc={media.url} />
      )}

      {!!product?.midia?.length && product.midia.length > 1 && (
        <>
          {/* Prev */}
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 shadow hover:bg-orange-500 hover:text-white"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Next */}
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 shadow hover:bg-orange-500 hover:text-white"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {product.midia.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentImageIndex
                    ? "bg-orange-500 w-6"
                    : "bg-gray-400/50 w-2"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default MediaGallery