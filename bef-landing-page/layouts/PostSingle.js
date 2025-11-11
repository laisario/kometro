import { markdownify } from "@lib/utils/textConverter";
import shortcodes from "@shortcodes/all";
import { MDXRemote } from "next-mdx-remote";
import Image from "next/image";
import Base from "./Baseof";
import Cta from "./components/Cta";

const PostSingle = ({ frontmatter, content, mdxContent }) => {
  let { description, title, image, call_to_action } = frontmatter;
  description = description ? description : content.slice(0, 120);

  return (
    <Base title={title} description={description}>
      <section className="section">
        <div className="container">
          <article className="col-12 mx-auto text-center md:col-8">
            <div className="flex items-center">
              <Image
                className="rounded-lg"
                src={image}
                alt={title}
                width={"30"}
                height={"30"}
              />
              {markdownify(title, "h1", "h2 ml-2 mb-6 mt-6 text-left")}
            </div>

            <div className="content mb-16 text-left">
              <MDXRemote {...mdxContent} components={shortcodes} />
            </div>
            {call_to_action && (<Cta cta={call_to_action} />)}
          </article>
        </div>
      </section>
    </Base>
  );
};

export default PostSingle;
