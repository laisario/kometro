import Store from '@layouts/Store';

function loja({categories}) {
  return (
    <Store categories={categories} />
  )
}

export const getStaticProps = async () => {
  const resCategories = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categorias-equipamentos/`)
  const categories = await resCategories.json();

  return {
    props: {
      categories
    },
    revalidate: 60, 
  };
  return {

  }
};

export default loja