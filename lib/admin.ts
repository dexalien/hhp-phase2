// Admin user IDs — these users have access to /dashboard/admin
export const ADMIN_USER_IDS: string[] = [
  "048c5f94-d50b-4330-bd8f-eaad6f3efb96", // Dex / d3xtr0.eth
  "b5f077b4-37f4-4e14-8c03-5f82f2272f48", // 0xjm
  "917dc6d5-19d4-4ddf-93f4-78e4a79333d1", // lilnait
]

export function isAdmin(userId: string): boolean {
  return ADMIN_USER_IDS.includes(userId)
}
