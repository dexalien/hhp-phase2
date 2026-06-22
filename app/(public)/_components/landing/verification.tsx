export function Verification() {
  return (
    <section
      className="px-4 py-20 relative"
      style={{ backgroundImage: "url('/bg-features-v1.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="absolute inset-0 bg-[#180149]/60" />
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h2 className="font-display font-bold text-3xl md:text-4xl text-white mb-6">
          Your Web3 history matters.
        </h2>
        <p className="text-[#7B7A8E] text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
          Bring your on-chain reputation, skills, NFTs and POAPs to
          your profile. No manual forms. No LinkedIn.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          {[
            { label: "On-chain reputation", color: "#6B00C9" },
            { label: "Skills", color: "#8B78E6" },
            { label: "NFTs & POAPs", color: "#990070" },
            { label: "Wallet history", color: "#6EE76E" },
          ].map((item) => (
            <div
              key={item.label}
              className="px-5 py-3 rounded-lg border text-sm font-medium"
              style={{
                borderColor: `${item.color}50`,
                backgroundColor: `${item.color}10`,
                color: item.color,
              }}
            >
              {item.label}
            </div>
          ))}
        </div>

        <p className="text-[#7B7A8E] text-sm mt-8">
          Your identity lives on the protocol. Not on a platform.
        </p>
      </div>
    </section>
  )
}
