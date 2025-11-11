import React, { useEffect, useMemo, useState } from 'react'
import Base from '@layouts/Baseof';
import { CategoryFilter } from '@layouts/components/CategoryFilter';
import EquipmentCard from '@layouts/components/EquipmentCard';
import Pagination from '@layouts/components/Pagination';
import ProductModal from '@layouts/components/ProductModal';
import xss from "xss";

const ITEMS_PER_PAGE = 9

function Store({categories}) {
  const [equipment, setEquipment] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("todas");
  const [loading, setLoading] = useState(false);
  const totalPages = Math.ceil(equipment?.count / ITEMS_PER_PAGE)
  
  const handleCategoryChange = (cat) => {
    setCategory(cat?.nome?.toLowerCase() === "todas" ? "todas" : cat?.id)
    setPage(1)
  }
  
  const handleProductClick = (product) => {
    setSelectedProduct(product)
    setModalOpen(true)
  }
  
  const handleCloseModal = () => {
    setModalOpen(false)
    setTimeout(() => setSelectedProduct(null), 300)
  }
  
  const handlePageChange = (page) => {
    setPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  
  const categoryData = useMemo(() => categories?.find((c) => c?.id === category), [category])
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/equipamentos/`);
        url.searchParams.append("page", page);
        if (category !== "todas") {
          url.searchParams.append("categoria", category);
        }

        const res = await fetch(url);
        const data = await res.json();
        setEquipment(data);
      } catch (error) {
        console.error("Erro ao buscar posts", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [page, category]);


  return (
    <Base title="Equipamentos">
      <div className="container flex-grow mb-16" >
        <section className="section">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-center">Catálogo de Equipamentos de Metrologia</h1>
          <p className="text-lg text-center max-w-2xl mx-auto text-pretty">
          A exatidão que transforma seu negócio. Equipamentos de metrologia que garantem a qualidade.
          </p>
        </section>

        <CategoryFilter
          categories={categories}
          selectedCategories={category}
          onCategoryChange={handleCategoryChange}
          content="equipamentos"
        />

        {!!category && categoryData?.explicacao && (
          <div className="mt-8 mb-4 mx-auto max-w-5xl">
            <div 
              dangerouslySetInnerHTML={{ __html: xss(categoryData.explicacao) }} 
              className="pl-6 border-l-4 border-orange-400 text-gray-700 leading-relaxed prose text-sm tracking-tight max-w-none"
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {loading ? (<p className="text-center">Carregando...</p>) : equipment?.results?.map((product) => (
            <EquipmentCard key={product.id} product={product} onClick={() => handleProductClick(product)} />
          ))}
        </div>

        {totalPages > 1 && (
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
        )}

        {!equipment?.results?.length && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">Nenhum equipamento nesta categoria.</p>
          </div>
        )}

        <ProductModal product={selectedProduct} open={modalOpen} onClose={handleCloseModal} />
      </div>
    </Base>
  )
}

export default Store