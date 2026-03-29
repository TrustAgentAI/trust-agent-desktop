/**
 * Resolves the avatar URL for a role based on its slug.
 *
 * Avatars are generated SVGs stored in:
 *   - Local: /avatars/roles/[slug].svg
 *   - CDN:   https://trustagent-prod-downloads.s3.eu-west-2.amazonaws.com/roles/avatars/[slug].svg
 *
 * Falls back to CDN if S3_AVATAR_BASE is defined, otherwise uses local path.
 */

const S3_AVATAR_BASE = 'https://trustagent-prod-downloads.s3.eu-west-2.amazonaws.com/roles/avatars';

export function getRoleAvatarUrl(slug: string): string {
  // In production, serve from S3/CDN for caching. In dev, use local.
  if (import.meta.env.PROD) {
    return `${S3_AVATAR_BASE}/${slug}.svg`;
  }
  return `/avatars/roles/${slug}.svg`;
}

/**
 * Builds a complete RoleListItem-compatible avatarUrl from role data.
 * Use this when mapping server role responses to UI components.
 */
export function resolveRoleAvatar(role: { slug?: string; baseSlug?: string }): string | undefined {
  const slug = role.baseSlug || role.slug;
  if (!slug) return undefined;
  // baseSlug has no gender suffix (e.g. "gcse-maths-tutor" not "gcse-maths-tutor-f")
  // The avatar files are named by the original role slug without gender
  return getRoleAvatarUrl(slug);
}
