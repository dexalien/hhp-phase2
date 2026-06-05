"use client"

import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  createCommunitySchema,
  COMMUNITY_CATEGORIES,
  type CreateCommunityInput,
} from "@/lib/schemas/community"
import { useUploadCommunityImage } from "@/services/api/communities"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { useState, useRef } from "react"
import { Upload, X, BadgeCheck, Star, Globe } from "lucide-react"

interface CommunityFormProps {
  onFormSubmit: (values: CreateCommunityInput) => Promise<void>
  submitLabel?: string
  submittingLabel?: string
  defaultValues?: Partial<CreateCommunityInput>
}

export function CommunityForm({
  onFormSubmit,
  submitLabel = "Create Community",
  submittingLabel = "Creating...",
  defaultValues,
}: CommunityFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateCommunityInput>({
    resolver: zodResolver(createCommunitySchema),
    defaultValues: {
      name: "",
      description: "",
      category: undefined,
      image_url: "",
      city: "",
      country: "",
      ...defaultValues,
    },
  })

  const uploadImage = useUploadCommunityImage()
  const [previewUrl, setPreviewUrl] = useState<string | null>(defaultValues?.image_url ?? null)
  const fileRef = useRef<HTMLInputElement>(null)
  const imageUrl = watch("image_url")
  const isWorldwide = useWatch({ control, name: "is_worldwide" })

  async function handleImageUpload(file: File) {
    const result = await uploadImage.mutateAsync(file)
    setValue("image_url", result.image_url)
    setPreviewUrl(URL.createObjectURL(file))
  }

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className="flex flex-col gap-6"
    >
      {/* Name */}
      <div className="flex flex-col gap-2">
        <label className="font-display font-bold text-sm text-foreground">
          Community name
        </label>
        <input
          {...register("name")}
          placeholder="e.g. DeFi Builders Guild"
          className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
        />
        {errors.name && (
          <p className="text-destructive text-xs">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        <label className="font-display font-bold text-sm text-foreground">
          Description
        </label>
        <textarea
          {...register("description")}
          rows={4}
          placeholder="What is this community about?"
          className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors resize-none"
        />
        {errors.description && (
          <p className="text-destructive text-xs">{errors.description.message}</p>
        )}
      </div>

      {/* Category */}
      <div className="flex flex-col gap-2">
        <label className="font-display font-bold text-sm text-foreground">
          Category
        </label>
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {COMMUNITY_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => field.onChange(cat)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                    field.value === cat
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground hover:border-primary hover:text-primary",
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        />
        {errors.category && (
          <p className="text-destructive text-xs">{errors.category.message}</p>
        )}
      </div>

      {/* Location (optional) */}
      <div className="flex flex-col gap-2">
        <label className="font-display font-bold text-sm text-foreground">
          Location <span className="text-muted-foreground font-normal">(optional — shows on map)</span>
        </label>
        <Controller
          name="is_worldwide"
          control={control}
          render={({ field }) => (
            <label className="flex items-center gap-2.5 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={field.value ?? false}
                onChange={(e) => {
                  field.onChange(e.target.checked)
                  if (e.target.checked) {
                    setValue("city", "")
                    setValue("country", "")
                  }
                }}
                className="accent-[var(--primary)]"
              />
              <span className="flex items-center gap-1.5 text-sm text-foreground">
                <Globe className="size-4 text-primary" />
                Worldwide — no specific location
              </span>
            </label>
          )}
        />
        {!isWorldwide && (
          <div className="grid grid-cols-2 gap-3">
            <input
              {...register("city")}
              placeholder="City"
              className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
            />
            <input
              {...register("country")}
              placeholder="Country"
              className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
            />
          </div>
        )}
        {isWorldwide && (
          <p className="text-xs text-muted-foreground font-mono">This community won&apos;t appear on the map.</p>
        )}
      </div>

      {/* Cover Image */}
      <div className="flex flex-col gap-2">
        <label className="font-display font-bold text-sm text-foreground">
          Cover image
        </label>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleImageUpload(file)
          }}
        />
        {previewUrl || imageUrl ? (
          <div className="relative h-40 rounded-lg overflow-hidden border border-border">
            <img
              src={previewUrl ?? imageUrl}
              alt="Cover preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setPreviewUrl(null)
                setValue("image_url", "")
              }}
              className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-background"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploadImage.isPending}
            className="h-40 border border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
          >
            {uploadImage.isPending ? (
              <Spinner className="size-6" />
            ) : (
              <>
                <Upload className="w-6 h-6" />
                <span className="text-sm">Upload cover image</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Request verification */}
      <Controller
        name="verification_requested"
        control={control}
        render={({ field }) => (
          <label className="flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={field.value ?? false}
              onChange={(e) => field.onChange(e.target.checked)}
              className="mt-0.5 accent-[var(--primary)]"
            />
            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <BadgeCheck className="size-4 text-[#6EE76E]" />
                Request verified check
              </span>
              <span className="text-xs text-muted-foreground">
                Your community will be reviewed by the HHP team for verification. Verified communities get a badge and featured placement.
              </span>
            </div>
          </label>
        )}
      />

      {/* Request featured */}
      <Controller
        name="featured_requested"
        control={control}
        render={({ field }) => (
          <label className="flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={field.value ?? false}
              onChange={(e) => field.onChange(e.target.checked)}
              className="mt-0.5 accent-[var(--primary)]"
            />
            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Star className="size-4 text-strategist" />
                Request featured placement
              </span>
              <span className="text-xs text-muted-foreground">
                Ask the HHP team to feature your community on the home feed. Featured communities get priority visibility.
              </span>
            </div>
          </label>
        )}
      />

      {/* Submit */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full"
      >
        {isSubmitting ? (
          <>
            <Spinner className="size-4 mr-2" />
            {submittingLabel}
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  )
}
