"use client"

import Link from "next/link"
import { ARCHETYPES } from "@/lib/onboarding"
import { Shield } from "lucide-react"
import type { UserProfile } from "@/lib/types"

interface CypherIdentityCardProps {
  profile: UserProfile
}

export function CypherIdentityCard({ profile }: CypherIdentityCardProps) {
  const archetypeData = ARCHETYPES.find((a) => a.id === profile.archetype)

  return (
    <div className="bg-card border border-border rounded-lg p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.handle ?? "Avatar"}
              className="size-12 rounded-full object-cover border-2 border-border shrink-0"
            />
          ) : (
            <div className="size-12 rounded-full bg-muted border-2 border-border shrink-0" />
          )}
          <div className="flex flex-col gap-1">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              Cypher Identity
            </p>
            <h2 className="font-display font-bold text-foreground text-xl">
              @{profile.handle ?? "—"}
            </h2>
          </div>
        </div>
        {archetypeData && (
          <div
            className="px-3 py-1.5 rounded-sm border text-xs font-mono"
            style={{
              borderColor: `var(${archetypeData.colorVar})`,
              color: `var(${archetypeData.colorVar})`,
              backgroundColor: `color-mix(in oklch, var(${archetypeData.colorVar}) 10%, transparent)`,
            }}
          >
            {archetypeData.label}
          </div>
        )}
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-muted-foreground text-sm leading-relaxed">
          {profile.bio}
        </p>
      )}

      {/* Skills */}
      {profile.skills && profile.skills.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            Skills
          </p>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="text-xs px-2.5 py-1 rounded-sm border border-border text-muted-foreground font-mono"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Credentials */}
      <div className="flex flex-col gap-2 pt-1 border-t border-border">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          Credentials
        </p>
        <div className="flex flex-col gap-1">
          {profile.wallet_address && (
            <p className="text-xs font-mono text-muted-foreground">
              <span className="text-foreground">wallet</span>{" "}
              {profile.wallet_address.slice(0, 6)}…{profile.wallet_address.slice(-4)}
            </p>
          )}
          {profile.email && (
            <p className="text-xs font-mono text-muted-foreground">
              <span className="text-foreground">email</span>{" "}
              {profile.email}
            </p>
          )}
        </div>
      </div>

      {/* On-chain */}
      {profile.wallet_address ? (
        <div className="flex items-center gap-4 px-3 py-2.5 rounded-sm border border-border">
          {profile.talent_protocol_score != null && (
            <div className="flex flex-col items-center gap-0.5">
              <span
                className="text-lg font-display font-bold"
                style={{ color: "var(--primary)" }}
              >
                {profile.talent_protocol_score}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">Talent Score</span>
            </div>
          )}
          {(profile.poaps ?? []).length > 0 && (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-lg font-display font-bold text-foreground">
                {profile.poaps.length}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">POAPs</span>
            </div>
          )}
          {profile.is_verified && (
            <div className="flex items-center gap-1 ml-auto">
              <Shield className="size-3.5 text-primary" />
              <span className="text-[10px] font-mono text-primary">Verified</span>
            </div>
          )}
        </div>
      ) : (
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-2 px-3 py-2.5 rounded-sm border border-dashed border-border text-xs font-mono text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
        >
          <span>Link wallet in profile</span>
        </Link>
      )}
    </div>
  )
}
