import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html>
      <Head />
      <body>
        <Main />
        <NextScript />
        {/* Honeypot: hidden from real users, crawled by bots */}
        {/* eslint-disable-next-line jsx-a11y/anchor-has-content */}
        <a
          href="/api/trap"
          aria-hidden="true"
          tabIndex={-1}
          style={{ display: "none" }}
        />
      </body>
    </Html>
  );
}
