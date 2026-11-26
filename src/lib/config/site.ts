export const SITE_ORIGIN = "https://www.jingledecor.com.ua"

export function getSiteOrigin(): string {
  // The public canonical identity must not change with a preview/deployment env.
  return SITE_ORIGIN
}

export function siteUrl(path = "/"): string {
  return new URL(path, SITE_ORIGIN).toString()
}
