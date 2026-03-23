interface Props {
  src?: string | null;
  className?: string;
  alt?: string;
}

export default function Avatar({ src, className = "h-8 w-8 rounded-full", alt = "" }: Props) {
  if (!src) {
    return (
      <div
        className={`${className} flex-shrink-0 bg-[#2f2f2f]`}
        aria-hidden="true"
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`${className} flex-shrink-0 object-cover`}
      referrerPolicy="no-referrer"
    />
  );
}
