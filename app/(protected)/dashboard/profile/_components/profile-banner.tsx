"use client"

import { useRef } from "react"
import { ImagePlus } from "lucide-react"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"
import { useUploadBanner } from "@/services/api/profile"
import type { UserProfile } from "@/lib/types"

interface ProfileBannerProps {
  profile: UserProfile
  isOwner: boolean
}

export function ProfileBanner({ profile, isOwner }: ProfileBannerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadBanner = useUploadBanner()
  // Anyone can upload a static banner. Animated GIFs are a verified-only perk.
  const canEdit = isOwner
  const canUploadGif = profile.is_verified
  const acceptTypes = canUploadGif
    ? "image/jpeg,image/png,image/webp,image/gif,image/avif"
    : "image/jpeg,image/png,image/webp,image/avif"

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type === "image/gif" && !canUploadGif) {
      toast.error("Get verified to upload animated GIF banners")
      if (inputRef.current) inputRef.current.value = ""
      return
    }
    try {
      await uploadBanner.mutateAsync(file)
      toast.success("Banner updated")
    } catch {
      toast.error("Failed to upload banner")
    }
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div
      className="relative w-full h-40 rounded-xl overflow-hidden shrink-0"
      style={{
        background: profile.banner_url
          ? `url(${profile.banner_url}) center/cover no-repeat`
          : "linear-gradient(135deg, color-mix(in oklch, var(--primary) 15%, var(--card)), color-mix(in oklch, var(--primary) 5%, var(--card)))",
        borderColor: "var(--border)",
      }}
    >
      {/* Subtle overlay for readability */}
      {!profile.banner_url && (
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: "repeating-linear-gradient(45deg, transparent, transparent 20px, color-mix(in oklch, var(--primary) 5%, transparent) 20px, color-mix(in oklch, var(--primary) 5%, transparent) 40px)",
          }}
        />
      )}

      {/* Edit button */}
      {canEdit && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={acceptTypes}
            onChange={handleFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploadBanner.isPending}
            className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-mono transition-all backdrop-blur-sm z-10"
            style={{
              background: "color-mix(in oklch, var(--card) 70%, transparent)",
              color: "var(--muted-foreground)",
              border: "1px solid var(--border)",
            }}
          >
            {uploadBanner.isPending ? (
              <Spinner className="size-3" />
            ) : (
              <ImagePlus className="size-3" />
            )}
            {uploadBanner.isPending ? "Uploading..." : "Edit banner"}
          </button>
        </>
      )}

      {/* Verified-only GIF hint */}
      {isOwner && !profile.is_verified && !profile.banner_url && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-[10px] font-mono text-muted-foreground/60">
            Upload an image banner — get verified to use animated GIFs
          </p>
        </div>
      )}
    </div>
  )
}
