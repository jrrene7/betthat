import VideoSmall from "src/components/Video/VideoSmall";
import AppLayout from "src/layouts/AppLayout";

interface Props {}

export default function SearchPage({}: Props) {
  return (
    <AppLayout>
      <div className="w-full px-4 pb-5">
        <ul className="mt-1 flex w-full items-center justify-center border-b border-[#2f2f2f]">
          <li
            className={`${
              true ? "border-b border-white" : "text-gray-500"
            } cursor-pointer px-4 pb-4 pt-5 text-sm font-semibold`}
          >
            Videos
          </li>
          <li
            className={`${
              true ? "border-b border-white" : "text-gray-500"
            } cursor-pointer px-4 pb-4 pt-5 text-sm font-semibold`}
          >
            Accounts
          </li>
        </ul>

        <>
          <h3 className="mt-5 w-full text-center">
            No videos found by keyword
          </h3>
          <div className="mt-5 grid grid-cols-3 gap-1 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            <VideoSmall />
          </div>
        </>
        {/* <>
              <h3 className="mt-5 w-full text-center">
                No accounts found by keyword
              </h3>
            <div className="mt-5 grid grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                <AccountItem />
            </div>
          </> */}
      </div>
    </AppLayout>
  );
}
