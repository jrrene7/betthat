import { GetServerSideProps } from "next";

// The upload flow is now a modal. Redirect anyone who lands here directly.
export default function UploadPage() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: { destination: "/", permanent: false },
    props: {},
  };
};
