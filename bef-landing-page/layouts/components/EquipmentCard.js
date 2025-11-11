export default function EquipmentCard({ product, onClick }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] bg-white border border-gray-200 rounded-xl overflow-hidden"
    >
      <div className="p-4">
        <div className="relative w-full h-48 mb-4 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
          <img
            src={product?.imagens[0]?.imagem}
            alt={product.nome}
            className="object-contain h-full p-2"
          />
        </div>

        <div className="space-y-2">
          <h3 className="font-bold text-lg text-gray-800 line-clamp-2 leading-tight">
            {product?.nome}
          </h3>
          {product?.modelo && <p className="text-sm text-gray-600">
            <span className="font-semibold">Modelo:</span> {product?.modelo}
          </p>}

          {product?.fabricante && <p className="text-sm text-gray-600">
            <span className="font-semibold">Fabricante:</span> {product?.fabricante}
          </p>}
        </div>
      </div>
    </div>
  )
}

