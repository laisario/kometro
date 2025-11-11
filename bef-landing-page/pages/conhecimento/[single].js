import Base from "@layouts/Baseof";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import CarouselVideo from "@layouts/components/CarouselVideo";
import xss from "xss";
import Image from "next/image";


export default function KnowledgePost({ post }) {
  return (
    <Base title={post.titulo}>
      <div className="container max-w-4xl mx-auto px-4 py-10 space-y-8">
        <h1 className="text-3xl md:text-5xl font-bold text-left">
          {post.titulo}
        </h1>

        {!!post?.midia?.length && (
          <CarouselVideo videos={post?.midia} />
        )}

        {post.texto && (
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: xss(post?.texto) }}
          />
        )}

        {!!post?.imagens_adicionais?.length && (
          <div className="w-full flex justify-center">
            <Swiper
              spaceBetween={16}
              slidesPerView={1}
              breakpoints={{
                768: { slidesPerView: post?.imagens_adicionais?.length > 1 ? 2 : 1 },
              }}
              className="w-full max-w-4xl my-8"
            >
              {post.imagens_adicionais.map((img) => (
                <SwiperSlide key={img.id}>
                  <div className="w-full rounded-lg overflow-hidden shadow-md">
                    <div className="relative w-full">
                      <Image
                        src={img.imagem}
                        alt={`Imagem adicional ${img.id}`}
                        width={800}
                        height={600}
                        className="w-full h-auto rounded-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </div>
    </Base>
  );
}

export const getStaticPaths = async () => {
  let allPosts = [];
  let nextUrl = `${process.env.NEXT_PUBLIC_API_URL}/posts/`;

  while (nextUrl) {
    const res = await fetch(nextUrl);
    const data = await res.json();

    allPosts = [...allPosts, ...data.results];
    nextUrl = data.next;
  }

  const paths = allPosts?.map((post) => ({
    params: { single: post?.id?.toString() },
  }));

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps = async ({ params }) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${params?.single}/`);
  const post = await res.json();

  return {
    props: {
      post,
    },
    revalidate: 60,
  };
};
