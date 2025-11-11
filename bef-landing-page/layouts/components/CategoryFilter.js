
export function CategoryFilter({ categories, selectedCategories, onCategoryChange, content }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-6">Filtrar por categoria</h2>
      <div className="flex flex-wrap gap-3">
        {categories?.map((category) => {
          const isSelected = selectedCategories === category.id || 
          (selectedCategories === "todas" && category.nome === "todas")
          return (
            <button
              key={category.id}
              variant={isSelected ? "default" : "outline"}
              onClick={() => onCategoryChange(category)}
              className={`px-4 py-2 rounded capitalize ${
                selectedCategories === category.id || (selectedCategories === "todas" && category.nome === "todas")
                  ? "bg-black text-white"
                  : "bg-gray-200"
              }`}
            >
              {category.nome}
              {!!category[content]?.length && <span className="ml-2 text-sm opacity-75">({category[content]?.length})</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
