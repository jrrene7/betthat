import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { AppProps } from "next/app";
import { Toaster } from "react-hot-toast";
import "react-lazy-load-image-component/src/effects/opacity.css";
import "src/styles/globals.css";
import NextNProgress from "nextjs-progressbar";
import { trpc } from "src/utils/trpc";
import { UploadModalProvider } from "src/context/UploadModalContext";
import UploadModal from "src/components/Upload/UploadModal";

interface Props {
  session: Session;
}

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps<Props>) {
  return (
    <SessionProvider session={session}>
      <UploadModalProvider>
        <NextNProgress options={{ showSpinner: false }} />
        <Component {...pageProps} />
        <UploadModal />
        <Toaster />
      </UploadModalProvider>
    </SessionProvider>
  );
}

export default trpc.withTRPC(MyApp);
