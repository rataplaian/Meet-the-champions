const COMMONS_PREFIX = "/wikipedia/commons/";
const COMMONS_HOST = "upload.wikimedia.org";
const COMMONS_REDIRECT = "https://commons.wikimedia.org/wiki/Special:Redirect/file";

export function championCardPhotoUri(sourceUrl: string, width = 400): string {
  try {
    const parsed = new URL(sourceUrl);
    if (
      parsed.hostname !== COMMONS_HOST ||
      !parsed.pathname.startsWith(COMMONS_PREFIX) ||
      parsed.pathname.startsWith(`${COMMONS_PREFIX}thumb/`)
    ) {
      return sourceUrl;
    }

    const relativePath = parsed.pathname.slice(COMMONS_PREFIX.length);
    const filename = relativePath.slice(relativePath.lastIndexOf("/") + 1);
    return `${COMMONS_REDIRECT}/${filename}?width=${width}`;
  } catch {
    return sourceUrl;
  }
}
