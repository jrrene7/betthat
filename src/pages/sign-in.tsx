import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Feedback from "src/icons/Feedback";
// import Logo from "src/icons/Logo";
import { signInMethods } from "src/utils/constants";
import { authOptions } from "./api/auth/[...nextauth]";

export default function SignInPage() {
  return (
    <div className="h-screen text-white">
      <div className="flex items-center justify-between p-4">
        <Link href="/">
          LOGO
        </Link>

        <button className="flex items-center text-sm font-medium text-white hover:underline">
          <Feedback />{" "}
          <span className="ml-2 inline-block">Feedback and help</span>
        </button>
      </div>

      <div>
        <div className="mx-auto w-[375px] max-w-[calc(100%-32px)] text-center">
          <h4 className="my-4 text-[32px] font-bold">Log in to Bet That</h4>
          <p className="mb-[32px] mt-3 text-[15px] font-normal text-[rgba(255,255,255,0.75)]">
            Manage your account, check notifications, comment on challenges, and
            more.
          </p>
          <div>
            {signInMethods.map((item) => (
              <button
                key={item.provider}
                onClick={() => signIn(item.provider)}
                className="relative mb-4 flex w-full items-center justify-center border border-gray-600 px-4 py-2.5 last:mb-0"
              >
                <div className="absolute left-4 top-[50%] translate-y-[-50%]">
                  <item.icons />
                </div>{" "}
                <span className="text-[15px]">{item.content}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  console.log("++++++++++++: ", context);
  console.log(context.req.headers);
  const session = await getServerSession(context.req, context.res, authOptions);
  const redirect = context.query.redirect || "/";

  if (session?.user) {
    return {
      redirect: {
        destination: redirect,
        permanent: false,
      },
      props: {},
    };
  } else {
    return {
      props: {
        session,
        redirect,
      },
    };
  }
};