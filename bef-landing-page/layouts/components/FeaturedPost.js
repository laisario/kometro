import React from 'react'
import Image from "next/image"
import Link from "next/link"
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/autoplay";
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { Autoplay, Pagination } from 'swiper';

function FeaturedPost({posts}) {
  return (
    <div className="mb-16">
      <h2 className="text-2xl font-semibold text-foreground mb-8">Artigo em destaque</h2>

      <Swiper
        modules={[Autoplay, Pagination]}
        spaceBetween={24}
        slidesPerView={1}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        loop={posts?.length > 1}
        pagination={{ clickable: true }} 
        style={{
          "--swiper-pagination-bullet-size": "10px",
          "--swiper-theme-color": "#FD7622",
      }}
      >
        {posts?.map((post) => (
          <SwiperSlide key={post.id}>
            <Link href={`/conhecimento/${post?.id}`} className="group block">
              <article className="bg-card rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300 group-hover:border-accent">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="relative aspect-[4/3] md:aspect-auto">
                    <Image
                      src={post.imagem_destaque || "/placeholder.svg"}
                      alt={post.titulo}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-8 flex flex-col justify-center">
                    <div>
                      <span
                        className="inline-block mb-3 px-2 py-1 text-sm font-medium rounded-full bg-[#DDDDDD] text-[#424242] capitalize"
                      >
                        {post?.categoria?.nome}
                      </span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4 text-balance group-hover:text-primary transition-colors">
                      {post.titulo}
                    </h3>
                    <p className="text-muted-foreground text-lg leading-relaxed text-pretty">{post.resumo}</p>
                    <div className="mt-6">
                      <span className="text-primary font-medium group-hover:underline">Ler artigo completo →</span>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}

export default FeaturedPost