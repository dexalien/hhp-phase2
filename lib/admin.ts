// Admin user IDs — superadmins, always have access regardless of DB
export const ADMIN_USER_IDS: string[] = [
  "048c5f94-d50b-4330-bd8f-eaad6f3efb96", // Dex / d3xtr0.eth
]

export function isAdmin(userId: string): boolean {
  return ADMIN_USER_IDS.includes(userId)
}
