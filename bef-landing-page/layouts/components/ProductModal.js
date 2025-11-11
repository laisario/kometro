import React, { useEffect, useState } from 'react'
import { MessageCircle, X } from "lucide-react"
import MediaGallery from './MediaGallery'

function ProductModal({ open, onClose, product }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  useEffect(() => {
    setCurrentImageIndex(0)
  }, [product])
  
  const handleWhatsAppClick = () => {
    const message = `Olá, gostaria de mais informações sobre ${product.nome}`
    const whatsappLink = `https://api.whatsapp.com/send?phone=5524988095115&text=${encodeURIComponent(message)}`
    
    window.open(whatsappLink, "_blank")
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div className="relative z-50 bg-white rounded-xl shadow-xl
        w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 
        [&::-webkit-scrollbar]:w-2
        [&::-webkit-scrollbar-track]:rounded-full
        [&::-webkit-scrollbar-track]:bg-gray-100
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb]:bg-gray-300"
      >
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold mb-6 text-gray-900 pr-8">{product.nome}</h2>

        <MediaGallery product={product} currentImageIndex={currentImageIndex} setCurrentImageIndex={setCurrentImageIndex} />

        {/* Product Description */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-2 text-gray-900">Descrição</h3>
            <p className="text-gray-700 leading-relaxed">{product.descricao}</p>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-lg font-bold mb-3 text-gray-900">Características</h3>
            <ul className="space-y-2">
              {product.caracteristicas.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-gray-700">
                  <span className="text-orange-500 mt-1.5 flex-shrink-0">•</span>
                  <span className="leading-relaxed">{feature?.descricao}</span>
                </li>
              ))}
            </ul>
          </div>

          {!!product.manual_url && (
            <a
              href={product.manual_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 pl-4 border-l-4 border-orange-400 text-orange-600 font-medium hover:text-orange-800 transition"
            >
              📄 Abrir Manual
            </a>
          )}

          {/* WhatsApp CTA */}
          <button
            onClick={handleWhatsAppClick}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 text-lg rounded-lg flex items-center justify-center gap-2"
          >
            <MessageCircle className="h-5 w-5" />
            Falar via WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductModal