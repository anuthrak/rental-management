function capitalizeEmailPrefix(email: string): string {
  const prefix = email.split("@")[0] || email
  const firstSegment = prefix.split(/[._+-]/)[0] || prefix
  return firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1)
}

export function getDisplayName(user: { name: string | null; email: string }): string {
  return user.name?.trim() || capitalizeEmailPrefix(user.email)
}
