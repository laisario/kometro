import React from 'react'
import { markdownify } from "@lib/utils/textConverter";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper';
import 'swiper/css';
import 'swiper/css/pagination';

function Clients({ client }) {
  return (
    <div className='container'>
      <div className="text-center mb-16">
        <h2>{markdownify(client?.title)}</h2>
      </div>
      <Swiper
        slidesPerView={3}
        spaceBetween={50}
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
            slidesPerView: 2,
          },
          768: {
            slidesPerView: 2,
          },
          1024: {
            slidesPerView: 3,
          },
        }}
      >
        {client?.clients?.map(({ name, image }, i) => (
          <SwiperSlide key={name + i} className='flex flex-col justify-center items-center mb-16'>
            <img src={image} alt={`Logo ${name}`} width="120px" />
            <p className='font-bold text-gray-700'>{name}</p>
          </SwiperSlide>
        ))}

      </Swiper>
    </div>
  )
}

export default Clients
