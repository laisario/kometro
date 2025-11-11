import React from 'react'
import Cta from './Cta';
import Image from "next/image";
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFlip, Pagination } from 'swiper';
import { markdownify } from "@lib/utils/textConverter";
import 'swiper/css';
import 'swiper/css/effect-flip';
import 'swiper/css/pagination';

function Pillars({pillars}) {
  return (
    <div className='container'>
      <h2 className="text-center mb-16">{markdownify(pillars?.title)}</h2>
      <div
        className="flex flex-col md:flex-row justify-between w-full gap-y-16"
      >
        {pillars?.plans?.map((plan, index) => (
          <Swiper
            grabCursor={true}
            effect={'flip'}
            pagination={true}
            modules={[EffectFlip, Pagination]}
            className="flex bg-[#F5F5F5] col-12 md:col-3 h-[450px] md:h-auto hover:scale-105 transform transition-transform duration-100 text-center"
            style={{
                "--swiper-pagination-bullet-size": "10px",
                "--swiper-theme-color": "#FD7622",
            }}
            key={plan.title + index}
          >
            <SwiperSlide className="border border-transparent rounded-xl shadow-lg p-4 flex flex-col justify-center items-center ">
              <h4 className='mb-2'>{plan.title}</h4>
              <Image src={plan.image} alt={plan.title} width={100} height={50} />
            </SwiperSlide>
            <SwiperSlide className="border border-transparent rounded-xl shadow-lg p-4 flex flex-col justify-center items-center">
              <ul className="list-disc list-inside mb-16">
                {plan?.content?.map(({ text }, i) => <li key={text + i}>{text}</li>)}
              </ul>
            </SwiperSlide>
          </Swiper>
        ))}
      </div>
      <Cta cta={pillars?.call_to_action} width={250} download/>
    </div>
  )
}

export default Pillars