import CloudUpload from "src/icons/CloudUpload";

type Props = {
  onVideoFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function SelectVideo({ onVideoFileChange}: Props) {
  return (
    <div>
      <input onChange={onVideoFileChange} hidden type="file" id="videoFileInput" />
      <div className="hidden md:block">
        <div className="flex w-full justify-center">
          <CloudUpload />
        </div>

        <div className="mt-6">
          <h3 className="text-[16px] font-semibold">Select video to upload</h3>
          <p className="mt-3 text-[13px] font-normal text-[rgba(255,255,255,0.75)]">
            Or drag and drop a file
          </p>
        </div>

        <div className="mt-6">
          <p className="my-2 text-[13px] font-normal text-[rgba(255,255,255,0.75)]">
            MP4 or WebM
          </p>
          <p className="my-2 text-[13px] font-normal text-[rgba(255,255,255,0.75)]">
            720x1280 resolution or higher
          </p>
          <p className="my-2 text-[13px] font-normal text-[rgba(255,255,255,0.75)]">
            Up to 30 minutes
          </p>
          <p className="my-2 text-[13px] font-normal text-[rgba(255,255,255,0.75)]">
            Less than 30 MB
          </p>
        </div>
      </div>

      <label
        htmlFor="videoFileInput"
        className="block w-full cursor-pointer rounded-[2px] bg-primary px-4 py-2 text-center text-sm font-semibold text-white md:mt-6"
      >
        Select file
      </label>
    </div>
  );
}
