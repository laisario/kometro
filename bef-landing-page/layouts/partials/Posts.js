import config from "@config/config.json";
import { plainify } from "@lib/utils/textConverter";
import Image from "next/image";
import Link from "next/link";


const Posts = ({ posts, frontmatter }) => {
  const { service_folder, summary_length } = config.settings;
  return (
    <div className="section column">
      <div className="">
        <h2 className="h3 mb-2">
          {frontmatter?.subtitle}
        </h2>
        <p>
          {frontmatter?.description}
        </p>
        <Link
          className="btn btn-primary mt-4"
          href="/contato"
        >
          Entre em contato
        </Link>
      </div>
      <div className="section flex flex-col lg:flex-row gap-y-10 lg:gap-x-8">
        {posts?.filter(({ slug }) => slug !== 'service-5')?.map((post, i) => (
          <div key={`key-${i}`} className="bg-[#F5F5F5] flex flex-col items-center justify-evenly col-12 lg:col-4 rounded-xl shadow-lg p-8 text-center ">
            <Image
              className="rounded-lg"
              src={post?.frontmatter?.image}
              alt={post?.frontmatter?.title}
              width={"30"}
              height={"30"}
            />
            <h3>{post?.frontmatter?.title}</h3>
            <p className="text-text">
              {plainify(
                post.content?.slice(0, Number(summary_length)),
                "div"
              )}...
            </p>
            <Link
              className="text-[#FD7622] hover:text-[#FFA373]"
              href={`/${service_folder}/${post.slug}`}
              rel=""
            >
              Saiba mais
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Posts;
