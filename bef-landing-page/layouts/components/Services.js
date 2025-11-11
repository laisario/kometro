import React from 'react'
import { markdownify } from "@lib/utils/textConverter";
import Cta from './Cta';
import Image from "next/image";
import Link from "next/link";
import config from "@config/config.json";
import CarouselVideo from './CarouselVideo';

function Services({ service, cta, videos }) {
  const { service_folder } = config.settings;

  return (
    <div className='container'>
      <div className="text-center mb-16">
        <h2>{markdownify(service?.title)}</h2>
      </div>
      <div className="flex flex-col md:flex-row gap-y-6 justify-center items-start">
        <div className="col-12 md:col-6 lg:col-5 flex justify-center items-center">
            <CarouselVideo videos={videos} />
        </div>
        <div className="flex flex-col gap-y-10 justify-start items-end">
          {service?.services?.map((item, i) => (
            <div
              className="rounded-xl bg-[#F5F5F5] shadow-lg p-8 text-center col-12 md:col-10 border border-transparent"
              key={`service-${i}`}
            >
              {item.icon && (
                <Image
                  className="mx-auto"
                  src={item.icon}
                  width={50}
                  height={50}
                  alt=""
                />
              )}
              <div className="mt-4">
                  {markdownify(item.name, "h3", "h5")}
                  <p className="mt-3">{item.content}</p>
              </div>
              {item?.button?.enable && (
                <Link
                  href={`/${service_folder}/${item?.button?.slug}`}
                  className="cta-link inline-flex items-center text-primary"
                >
                  {item?.button.label}
                </Link>
              )}
          </div>
          ))}
        </div>
      </div>
      <Cta cta={cta} />
    </div>
  )
}

export default Services