import NotFound from "@layouts/404";
import Base from "@layouts/Baseof";
import Contato from "@layouts/Contato";
import Default from "@layouts/Default";
import Lgpd from "@layouts/Lgpd";
import { getRegularPage, getSinglePage } from "@lib/contentParser";

const RegularPages = ({ data }) => {
  const { title, meta_title, description, image, noindex, canonical, layout } = data.frontmatter;
  const { content } = data;

  return (
    <Base
      title={title}
      description={description ? description : content.slice(0, 120)}
      meta_title={meta_title}
      image={image}
      noindex={noindex}
      canonical={canonical}
    >
      {layout === "404" ? (
        <NotFound data={data} />
      ) : layout === "contato" ? (
        <Contato data={data} />
      ) : layout === "lgpd" ? (
        <Lgpd data={data} />
      ) :
      (<Default data={data} />)}
    </Base>
  );
};
export default RegularPages;

export const getStaticPaths = async () => {
  const allslugs = getSinglePage("content");
  const slugs = allslugs.map((item) => item.slug);
  const paths = slugs.map((slug) => ({
    params: {
      regular: slug,
    },
  }));

  return {
    paths,
    fallback: false,
  };
};

// for regular page data
export const getStaticProps = async ({ params }) => {
  const { regular } = params;
  const regularPage = await getRegularPage(regular);

  return {
    props: {
      slug: regular,
      data: regularPage,
    },
  };
};
