import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { AppProps } from "next/app";
import { Toaster } from "react-hot-toast";
import "react-lazy-load-image-component/src/effects/opacity.css";
import "../styles/globals.css";
import NextNProgress from "nextjs-progressbar";

interface Props {
  session: Session;
}
export default function MyApp({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps<Props>) {
  return (
    <SessionProvider session={session}>
      <NextNProgress options={{ showSpinner: false }} />
      <Toaster />
      <Component {...pageProps} />
    </SessionProvider>
  );
}
