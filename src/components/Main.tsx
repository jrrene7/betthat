import VideoItem from "src/components/Video/VideoItem";

interface Props {}

export default function Main({}: Props) {
  return (
    <div className="ml-[48px] flex-1 lg:ml-[348px] lg:mt-5">
      <div className="flex flex-col items-center pb-5 md:items-start md:px-5">
        <VideoItem />
      </div>
    </div>
  );
}
