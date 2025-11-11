import React from 'react'
import { markdownify } from "@lib/utils/textConverter";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper';
import 'swiper/css';
import 'swiper/css/pagination';

function Feedbacks({feedbacks}) {
  return (
    <div className='container'>
      <div className="text-center mb-16">
        <h2>{markdownify("Clientes que fazem parte da nossa história")}</h2>
      </div>
      <Swiper
        slidesPerView={3}
        spaceBetween={20}
        modules={[Autoplay, Pagination]}
        autoplay={{
          delay: 2500,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
        }}
        breakpoints={{
          0: {
            slidesPerView: 1,
          },
          768: {
            slidesPerView: 2,
          },
          1024: {
            slidesPerView: 3,
          },
        }}
      >
        {feedbacks?.map(({ nome, empresa, comentario }, i) => {
          const iniciais = (empresa || nome)
          .split(" ")
          .map(p => p[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();
        
          return (
            <SwiperSlide
              key={nome + i}
              className="px-8 mb-16 flex items-center justify-center"
            >
              <div className="rounded-2xl  p-6 w-full max-w-sm h-[320px] flex flex-col justify-center">
                <div className="flex items-center gap-4 mb-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-md">
                    {iniciais}
                  </div>
                  <div>
                    <div className="mb-1 text-base text-gray-800 font-semibold">
                      {nome}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      {empresa}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 italic text-lg leading-relaxed overflow-hidden text-ellipsis line-clamp-10 text-center">
                  "{comentario}"
                </p>
              </div>
            </SwiperSlide>
          )
        })}

      </Swiper>
    </div>
  )
}

export default Feedbacks