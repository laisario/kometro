import Social from "@components/Social";
import config from "@config/config.json";
import menu from "@config/menu.json";
import social from "@config/social.json";
import { markdownify } from "@lib/utils/textConverter";
import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  const { copyright, footer_content } = config.params;
  const { footer } = menu;

  return (
    <footer className="section bg-theme-light  pb-0 b-0 mt-auto">
      <div className="flex flex-col md:flex-row container justify-between">
        <div className="md-12 sm:col-6 lg:col-3">
          <Link href="/">
            <Image
              src={config.site.logo}
              width={config.site.logo_width}
              height={config.site.logo_height}
              alt=""
            />
          </Link>
          {markdownify(footer_content, "p", "mt-3 mb-6")}
          <Social source={social} className="social-icons mb-8" />
        </div>
        <div className="row">
          {footer.map((col) => {
            return (
              <div className="sm:col-6 lg:col-4" key={col.name}>
                <Link href="/lgpd">
                  <strong>Encarregado LGPD</strong>
                </Link>

              </div>
            );
          })}
        </div>
      </div>
      <div className="container border-t border-border py-6">
        {markdownify(copyright, "p", "text-sm text-center")}
      </div>

    </footer>
  );
};

export default Footer;
