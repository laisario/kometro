import Pagination from "@layouts/components/Pagination";
import PostCard from "@layouts/components/PostCard";

const ITEMS_PER_PAGE = 6

const PostGrid = ({ posts, setPage, page }) => {
  const totalPages = Math.ceil(posts?.count / ITEMS_PER_PAGE);

  const handlePageChange = (page) => {
    setPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (posts?.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground text-lg">Nenhum artigo encontrado para as categorias selecionadas.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-foreground mb-8">Mais artigos ({posts?.results?.length})</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts?.results?.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
      )}
    </div>
  )
};

export default PostGrid;
