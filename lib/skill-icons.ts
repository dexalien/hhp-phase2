/**
 * Skill icon library — maps skill names to visual icons.
 *
 * Icons sourced from https://github.com/tandpfun/skill-icons (Dark variants).
 * Skills without a matching icon get an emoji fallback.
 */

const ICON_BASE =
  "https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons"

function icon(file: string): string {
  return `${ICON_BASE}/${file}-Dark.svg`
}

export interface SkillDef {
  /** Display label */
  label: string
  /** URL to SVG icon or single emoji */
  icon: string
  /** true when icon is an emoji fallback */
  emoji: boolean
  /** Grouping for the picker UI */
  category: SkillCategory
}

export type SkillCategory =
  | "Frontend"
  | "Backend"
  | "Blockchain"
  | "DevOps"
  | "Design"
  | "AI / ML"
  | "Mobile"
  | "Database"
  | "Business"
  | "Other"

export const SKILL_CATEGORIES: SkillCategory[] = [
  "Frontend",
  "Backend",
  "Blockchain",
  "DevOps",
  "Database",
  "AI / ML",
  "Mobile",
  "Design",
  "Business",
  "Other",
]

/**
 * Canonical skill library.
 * Key = lowercase identifier used in DB.
 * Order within each category = display order in picker.
 */
export const SKILL_LIBRARY: Record<string, SkillDef> = {
  // ── Frontend ────────────────────────────────────────────
  react:        { label: "React",         icon: icon("React"),        emoji: false, category: "Frontend" },
  nextjs:       { label: "Next.js",       icon: icon("NextJS"),       emoji: false, category: "Frontend" },
  typescript:   { label: "TypeScript",    icon: `${ICON_BASE}/TypeScript.svg`,  emoji: false, category: "Frontend" },
  javascript:   { label: "JavaScript",    icon: `${ICON_BASE}/JavaScript.svg`,  emoji: false, category: "Frontend" },
  vuejs:        { label: "Vue.js",        icon: icon("VueJS"),        emoji: false, category: "Frontend" },
  angular:      { label: "Angular",       icon: icon("Angular"),      emoji: false, category: "Frontend" },
  svelte:       { label: "Svelte",        icon: `${ICON_BASE}/Svelte.svg`, emoji: false, category: "Frontend" },
  html:         { label: "HTML",          icon: `${ICON_BASE}/HTML.svg`,    emoji: false, category: "Frontend" },
  css:          { label: "CSS",           icon: `${ICON_BASE}/CSS.svg`,     emoji: false, category: "Frontend" },
  tailwindcss:  { label: "Tailwind CSS",  icon: icon("TailwindCSS"),  emoji: false, category: "Frontend" },
  threejs:      { label: "Three.js",      icon: icon("ThreeJS"),      emoji: false, category: "Frontend" },
  graphql:      { label: "GraphQL",       icon: icon("GraphQL"),      emoji: false, category: "Frontend" },
  frontend:     { label: "Frontend",      icon: "🎨",                 emoji: true,  category: "Frontend" },

  // ── Backend ─────────────────────────────────────────────
  nodejs:       { label: "Node.js",       icon: icon("NodeJS"),       emoji: false, category: "Backend" },
  python:       { label: "Python",        icon: icon("Python"),       emoji: false, category: "Backend" },
  rust:         { label: "Rust",          icon: "🦀",                 emoji: true,  category: "Backend" },
  go:           { label: "Go",            icon: `${ICON_BASE}/GoLang.svg`,  emoji: false, category: "Backend" },
  java:         { label: "Java",          icon: icon("Java"),         emoji: false, category: "Backend" },
  expressjs:    { label: "Express",       icon: icon("ExpressJS"),    emoji: false, category: "Backend" },
  nestjs:       { label: "NestJS",        icon: icon("NestJS"),       emoji: false, category: "Backend" },
  django:       { label: "Django",        icon: `${ICON_BASE}/Django.svg`,  emoji: false, category: "Backend" },
  flask:        { label: "Flask",         icon: icon("Flask"),        emoji: false, category: "Backend" },
  laravel:      { label: "Laravel",       icon: icon("Laravel"),      emoji: false, category: "Backend" },
  ruby:         { label: "Ruby",          icon: `${ICON_BASE}/Ruby.svg`,    emoji: false, category: "Backend" },
  php:          { label: "PHP",           icon: icon("PHP"),          emoji: false, category: "Backend" },
  scala:        { label: "Scala",         icon: icon("Scala"),        emoji: false, category: "Backend" },
  elixir:       { label: "Elixir",        icon: icon("Elixir"),       emoji: false, category: "Backend" },
  backend:      { label: "Backend",       icon: icon("NodeJS"),       emoji: false, category: "Backend" },

  // ── Blockchain / Web3 ───────────────────────────────────
  solidity:         { label: "Solidity",          icon: `${ICON_BASE}/Solidity.svg`,  emoji: false, category: "Blockchain" },
  "smart contracts":{ label: "Smart Contracts",   icon: `${ICON_BASE}/Solidity.svg`,  emoji: false, category: "Blockchain" },
  ethereum:         { label: "Ethereum",          icon: "🔷",  emoji: true,  category: "Blockchain" },
  ipfs:             { label: "IPFS",              icon: icon("IPFS"),                 emoji: false, category: "Blockchain" },
  "protocol design":{ label: "Protocol Design",  icon: "📐",  emoji: true,  category: "Blockchain" },
  "token design":   { label: "Token Design",     icon: "💰", emoji: true, category: "Blockchain" },
  defi:             { label: "DeFi",              icon: "🏦", emoji: true, category: "Blockchain" },
  "zero knowledge": { label: "Zero Knowledge",   icon: "🔐", emoji: true, category: "Blockchain" },
  mev:              { label: "MEV",               icon: "⚡", emoji: true, category: "Blockchain" },
  auditing:         { label: "Auditing",          icon: "🛡️", emoji: true, category: "Blockchain" },
  "security / auditing": { label: "Security / Auditing", icon: "🛡️", emoji: true, category: "Blockchain" },

  // ── DevOps / Cloud ──────────────────────────────────────
  docker:       { label: "Docker",        icon: `${ICON_BASE}/Docker.svg`,      emoji: false, category: "DevOps" },
  kubernetes:   { label: "Kubernetes",    icon: `${ICON_BASE}/Kubernetes.svg`,  emoji: false, category: "DevOps" },
  aws:          { label: "AWS",           icon: icon("AWS"),          emoji: false, category: "DevOps" },
  gcp:          { label: "GCP",           icon: icon("GCP"),          emoji: false, category: "DevOps" },
  azure:        { label: "Azure",         icon: icon("Azure"),        emoji: false, category: "DevOps" },
  terraform:    { label: "Terraform",     icon: icon("Terraform"),    emoji: false, category: "DevOps" },
  cloudflare:   { label: "Cloudflare",    icon: icon("Cloudflare"),   emoji: false, category: "DevOps" },
  vercel:       { label: "Vercel",        icon: icon("Vercel"),       emoji: false, category: "DevOps" },
  linux:        { label: "Linux",         icon: icon("Linux"),        emoji: false, category: "DevOps" },
  bash:         { label: "Bash",          icon: icon("Bash"),         emoji: false, category: "DevOps" },
  git:          { label: "Git",           icon: `${ICON_BASE}/Git.svg`,  emoji: false, category: "DevOps" },
  github:       { label: "GitHub",        icon: icon("Github"),       emoji: false, category: "DevOps" },
  githubactions:{ label: "GitHub Actions",icon: icon("GithubActions"),emoji: false, category: "DevOps" },
  jenkins:      { label: "Jenkins",       icon: icon("Jenkins"),      emoji: false, category: "DevOps" },
  grafana:      { label: "Grafana",       icon: icon("Grafana"),      emoji: false, category: "DevOps" },
  devops:       { label: "DevOps",        icon: `${ICON_BASE}/Docker.svg`, emoji: false, category: "DevOps" },

  // ── Database ────────────────────────────────────────────
  postgresql:   { label: "PostgreSQL",    icon: icon("PostgreSQL"),   emoji: false, category: "Database" },
  mysql:        { label: "MySQL",         icon: icon("MySQL"),        emoji: false, category: "Database" },
  mongodb:      { label: "MongoDB",       icon: `${ICON_BASE}/MongoDB.svg`, emoji: false, category: "Database" },
  redis:        { label: "Redis",         icon: icon("Redis"),        emoji: false, category: "Database" },
  supabase:     { label: "Supabase",      icon: icon("Supabase"),     emoji: false, category: "Database" },
  firebase:     { label: "Firebase",      icon: icon("Firebase"),     emoji: false, category: "Database" },
  dynamodb:     { label: "DynamoDB",      icon: icon("DynamoDB"),     emoji: false, category: "Database" },
  elasticsearch:{ label: "Elasticsearch", icon: icon("Elasticsearch"),emoji: false, category: "Database" },

  // ── AI / ML ─────────────────────────────────────────────
  pytorch:       { label: "PyTorch",       icon: icon("PyTorch"),      emoji: false, category: "AI / ML" },
  tensorflow:    { label: "TensorFlow",    icon: icon("TensorFlow"),   emoji: false, category: "AI / ML" },
  opencv:        { label: "OpenCV",        icon: icon("OpenCV"),       emoji: false, category: "AI / ML" },
  scikitlearn:   { label: "scikit-learn",  icon: icon("ScikitLearn"),  emoji: false, category: "AI / ML" },
  "ai / ml":     { label: "AI / ML",       icon: icon("PyTorch"),      emoji: false, category: "AI / ML" },
  openai:        { label: "OpenClaw",      icon: "🦞",                  emoji: true,  category: "AI / ML" },
  "ai agents":   { label: "AI Agents",     icon: "🤖",                  emoji: true,  category: "AI / ML" },

  // ── Mobile ──────────────────────────────────────────────
  flutter:      { label: "Flutter",       icon: icon("Flutter"),      emoji: false, category: "Mobile" },
  "react native":{ label: "React Native", icon: icon("React"),        emoji: false, category: "Mobile" },
  swift:        { label: "Swift",         icon: `${ICON_BASE}/Swift.svg`,   emoji: false, category: "Mobile" },
  kotlin:       { label: "Kotlin",        icon: icon("Kotlin"),       emoji: false, category: "Mobile" },
  dart:         { label: "Dart",          icon: icon("Dart"),         emoji: false, category: "Mobile" },
  android:      { label: "Android",       icon: icon("AndroidStudio"),emoji: false, category: "Mobile" },
  mobile:       { label: "Mobile",        icon: icon("Flutter"),      emoji: false, category: "Mobile" },

  // ── Design ──────────────────────────────────────────────
  figma:        { label: "Figma",         icon: icon("Figma"),        emoji: false, category: "Design" },
  blender:      { label: "Blender",       icon: icon("Blender"),      emoji: false, category: "Design" },
  photoshop:    { label: "Photoshop",     icon: `${ICON_BASE}/Photoshop.svg`, emoji: false, category: "Design" },
  illustrator:  { label: "Illustrator",   icon: `${ICON_BASE}/Illustrator.svg`, emoji: false, category: "Design" },
  "ui / ux design": { label: "UI / UX Design", icon: icon("Figma"),  emoji: false, category: "Design" },

  // ── Business / Strategy ─────────────────────────────────
  "product strategy":  { label: "Product Strategy",  icon: "📊", emoji: true, category: "Business" },
  fundraising:         { label: "Fundraising",        icon: "💰", emoji: true, category: "Business" },
  storytelling:        { label: "Storytelling",        icon: "📖", emoji: true, category: "Business" },
  community:           { label: "Community",           icon: "👥", emoji: true, category: "Business" },
  "vision & narrative":{ label: "Vision & Narrative",  icon: "🔮", emoji: true, category: "Business" },
  "go-to-market":      { label: "Go-to-Market",       icon: "🚀", emoji: true, category: "Business" },
  operations:          { label: "Operations",          icon: "⚙️", emoji: true, category: "Business" },
  "partnerships & bd": { label: "Partnerships & BD",  icon: "🤝", emoji: true, category: "Business" },
  marketing:           { label: "Marketing",           icon: "📣", emoji: true, category: "Business" },
  "legal & compliance":{ label: "Legal & Compliance",  icon: "⚖️", emoji: true, category: "Business" },
  finance:             { label: "Finance",             icon: "💹", emoji: true, category: "Business" },
}

/** Resolve a skill name (lowercase) to its icon definition. Falls back to emoji. */
export function resolveSkill(name: string): SkillDef {
  const key = name.toLowerCase().trim()
  if (SKILL_LIBRARY[key]) return SKILL_LIBRARY[key]

  // Try partial match
  const partial = Object.entries(SKILL_LIBRARY).find(
    ([k]) => k.includes(key) || key.includes(k),
  )
  if (partial) return partial[1]

  // Emoji fallback based on keywords
  const fallbackEmoji = guessEmoji(key)
  return { label: name, icon: fallbackEmoji, emoji: true, category: "Other" }
}

function guessEmoji(name: string): string {
  if (/secur|audit|hack/.test(name)) return "🛡️"
  if (/design|ui|ux|art/.test(name)) return "🎨"
  if (/data|analy/.test(name)) return "📊"
  if (/market|growth|gtm/.test(name)) return "📣"
  if (/fund|invest|financ/.test(name)) return "💰"
  if (/chain|block|web3|crypto|nft|defi/.test(name)) return "⛓️"
  if (/ai|ml|machine|deep|neural/.test(name)) return "🤖"
  if (/mobile|ios|android|app/.test(name)) return "📱"
  if (/cloud|devops|infra|deploy/.test(name)) return "☁️"
  if (/front|react|vue|angular|ui/.test(name)) return "🖥️"
  if (/back|server|api|node/.test(name)) return "⚙️"
  if (/db|database|sql|mongo/.test(name)) return "🗄️"
  if (/legal|law|compli/.test(name)) return "⚖️"
  if (/communit|social|people/.test(name)) return "👥"
  if (/write|content|story/.test(name)) return "✍️"
  if (/ops|operat|manage/.test(name)) return "🔧"
  return "💡"
}

/** All skill keys sorted by category then label. */
export function getAllSkillKeys(): string[] {
  return Object.entries(SKILL_LIBRARY)
    .sort((a, b) => {
      const catOrder = SKILL_CATEGORIES.indexOf(a[1].category) - SKILL_CATEGORIES.indexOf(b[1].category)
      if (catOrder !== 0) return catOrder
      return a[1].label.localeCompare(b[1].label)
    })
    .map(([key]) => key)
}
