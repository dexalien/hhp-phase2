import { Users, Map, Home } from "lucide-react"

const features = [
  {
    icon: Users,
    title: "Communities",
    subtitle: "Build your scene. Grow your tribe.",
    body: "Permanent hubs for groups with identity — DAOs, local scenes, builder collectives. Unlimited members, public or private. Spawn Hack Spaces and Hacker Houses directly from your community.",
    tags: ["DAOs", "Local Scenes", "Protocols", "Collectives"],
    color: "#8B78E6",
  },
  {
    icon: Map,
    title: "Hack Spaces",
    subtitle: "Project rooms for teams building in public.",
    body: "Post your project, define the roles you need, and match with builders who complement your skills — not who replicate them. Your on-chain credentials speak for you.",
    tags: ["DeFi", "AI", "Smart Contracts", "DAO"],
    color: "#6B00C9",
  },
  {
    icon: Home,
    title: "Hacker Houses",
    subtitle: "Co-living IRL. Skin in the game.",
    body: "Stake to secure your slot. A Key NFT per room. Physical spaces during events and in active builder cities — coordinated, filtered, and optimized for shipping code.",
    tags: ["Sponsored", "Co-payment", "With Staking"],
    color: "#6EE76E",
  },
]

export function Features() {
  return (
    <section
      id="features"
      className="px-4 py-20 relative"
      style={{
        backgroundImage: "url('/bg-features-v1.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-[#180149]/60" />
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-display font-bold text-3xl md:text-4xl text-white">
            One protocol. Three ways to build.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="bg-[#1A1740] border border-[#2E2A5A] rounded-lg p-6 flex flex-col gap-5 hover:border-[#6B00C9] transition-colors duration-200 group"
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${f.color}20` }}
                >
                  <Icon className="w-6 h-6" style={{ color: f.color }} />
                </div>

                <div className="flex flex-col gap-1">
                  <h3 className="font-display font-bold text-xl text-white">
                    {f.title}
                  </h3>
                  <p className="text-sm font-medium" style={{ color: f.color }}>
                    {f.subtitle}
                  </p>
                </div>

                <p className="text-[#7B7A8E] text-sm leading-relaxed flex-1">
                  {f.body}
                </p>

                <div className="flex flex-wrap gap-2 mt-auto">
                  {f.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-xs rounded"
                      style={{
                        backgroundColor: `${f.color}20`,
                        color: f.color,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
