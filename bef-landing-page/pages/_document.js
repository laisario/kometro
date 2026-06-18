import config from "@config/config.json";
import { Head, Html, Main, NextScript } from "next/document";

const Document = () => {
  const { favicon } = config.site;
  return (
    <Html lang="en">
      <Head>
        <link
          rel="shortcut icon"
          type="image/png"
          sizes="32x32"
          href={favicon}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-TPCXNHT6');`,
          }}
        />
        {/* theme meta */}
        <meta name="theme-name" content="next-boilerplate" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: light)"
          content="#fff"
        />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: dark)"
          content="#000"
        />
      </Head>
      <body>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TPCXNHT6"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <Main />
        {/* <TwSizeIndicator /> */}
        <NextScript />
      </body>
    </Html>
  );
};

export default Document;
