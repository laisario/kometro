import config from "@config/config.json";
import Base from "@layouts/Baseof";
import "swiper/swiper.min.css";
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { getListPage } from "../lib/contentParser";
import Services from "@layouts/components/Services";
import History from "@layouts/components/History";
import Pillars from "@layouts/components/Pillars";
import Clients from "@layouts/components/Clients";
import Feedbacks from "@layouts/components/Feedbacks";


const Home = ({ frontmatter, feedbacks, }) => {
  const { banner, service, timeline, call_to_action, videos, pillars, client } = frontmatter;
  const { title } = config.site;
  return (
    <Base title={title}>
      <section className="section pt-6 pb-8 md:pt-8 md:pb-10">
        <div className="container flex flex-col items-center text-center">
          <div className="mx-auto mb-5 max-w-3xl md:mb-6">
            <h1 className="font-primary text-2xl font-bold leading-tight md:text-3xl lg:text-4xl">
              {banner?.title}
            </h1>
            <p className="mx-auto mt-2 max-w-2xl text-base leading-relaxed text-text md:mt-3 md:text-lg">
              {banner?.content}
            </p>
          </div>
          <picture className="relative mx-auto block aspect-[1122/1402] w-full max-w-[1000px] overflow-hidden rounded-lg sm:aspect-video">
            <source media="(max-width: 539px)" srcSet={banner?.mobile_image} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={banner?.image}
              alt="Serviços de calibração e metrologia da Kometro"
              width="1600"
              height="900"
              loading="eager"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </picture>
        </div>
      </section>

      <section className="section flex flex-col items-center text-center">
       <History timeline={timeline}/>
      </section>

      <section className="section">
        <Services service={service} cta={call_to_action} videos={videos} />
      </section>

      <section className="section">
        <Pillars pillars={pillars}/>
      </section>

      <section className="section">
        <Clients client={client} />
      </section>

      {!!feedbacks?.length && <section className="section">
        <Feedbacks feedbacks={feedbacks} />
      </section>}
    </Base>
  );
};

export const getStaticProps = async () => {
  const homePage = await getListPage("content/_index.md");
  const feedbacksRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/avaliacoes/`);
  const postsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/`);
  const feedbacks = await feedbacksRes.json();
  const posts = await postsRes.json();
  const { frontmatter } = homePage;
  return {
    props: {
      frontmatter,
      feedbacks,
      posts,
    },
  };
};

export default Home;
