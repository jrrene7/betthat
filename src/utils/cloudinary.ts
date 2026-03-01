function isCloudinaryUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes("res.cloudinary.com");
  } catch {
    return false;
  }
}

function injectTransform(url: string, transform: string) {
  if (!isCloudinaryUrl(url)) return url;

  const parsed = new URL(url);
  const parts = parsed.pathname.split("/").filter(Boolean);
  const uploadIndex = parts.findIndex((part) => part === "upload");

  if (uploadIndex === -1) return url;

  const nextSegment = parts[uploadIndex + 1];
  const hasTransform = Boolean(nextSegment && !/^v\d+$/.test(nextSegment));

  if (!hasTransform) {
    parts.splice(uploadIndex + 1, 0, transform);
    parsed.pathname = `/${parts.join("/")}`;
  }

  return parsed.toString();
}

export function getCloudinaryPlaybackUrl(videoUrl: string) {
  return injectTransform(videoUrl, "f_auto,q_auto");
}

export function getCloudinaryPosterUrl(videoUrl: string) {
  const transformed = injectTransform(videoUrl, "so_0,f_jpg,q_auto");
  return transformed.replace(/\.mp4(\?.*)?$/i, ".jpg$1");
}
