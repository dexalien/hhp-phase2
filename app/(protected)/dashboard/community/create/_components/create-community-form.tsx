"use client"

import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  createCommunitySchema,
  COMMUNITY_CATEGORIES,
  type CreateCommunityInput,
} from "@/lib/schemas/community"
import { useUploadCommunityImage } from "@/services/api/communities"
import { LOCATION_DATA } from "@/lib/constants/location"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { cn } from "@/lib/utils"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Upload, X, BadgeCheck, Star, Globe } from "lucide-react"

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const ALL_COUNTRIES = LOCATION_DATA.flatMap((r) =>
  r.countries.map((c) => c.name),
).sort((a, b) => a.localeCompare(b))

function getCitiesForCountryName(country: string): string[] {
  for (const region of LOCATION_DATA) {
    const match = region.countries.find((c) => c.name === country)
    if (match) return match.cities.map((city) => city.name)
  }
  return []
}

function TogglePill({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer",
        selected
          ? "bg-primary text-primary-foreground"
          : "border border-border text-muted-foreground hover:border-primary hover:text-primary",
      )}
    >
      {children}
    </button>
  )
}

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
    handleSubmit,
    control,
    setValue,
    formState: { isSubmitting },
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
  const [pendingFile, setPendingFile] = useState<{ file: File; preview: string } | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const imageUrl = useWatch({ control, name: "image_url" })
  const isWorldwide = useWatch({ control, name: "is_worldwide" })
  const watchedCountry = useWatch({ control, name: "country" })
  const availableCities = watchedCountry
    ? getCitiesForCountryName(watchedCountry)
    : []

  useEffect(() => {
    return () => {
      if (pendingFile) URL.revokeObjectURL(pendingFile.preview)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleFileAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Invalid file type. Use JPEG, PNG, WebP or GIF")
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Image exceeds 5MB")
      return
    }

    setPendingFile((prev) => {
      if (prev) URL.revokeObjectURL(prev.preview)
      return { file, preview: URL.createObjectURL(file) }
    })
  }

  function removeImage() {
    if (pendingFile) URL.revokeObjectURL(pendingFile.preview)
    setPendingFile(null)
    setValue("image_url", "")
  }

  async function onSubmit(values: CreateCommunityInput) {
    setServerError(null)
    try {
      let finalImageUrl = values.image_url
      if (pendingFile) {
        const result = await uploadImage.mutateAsync(pendingFile.file)
        finalImageUrl = result.image_url
      }
      await onFormSubmit({ ...values, image_url: finalImageUrl })
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong"
      setServerError(message)
      toast.error(message)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
    >
      {/* Name */}
      <Controller
        name="name"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Community name</FieldLabel>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="e.g. DeFi Builders Guild"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Description */}
      <Controller
        name="description"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Description</FieldLabel>
            <Textarea
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="What is this community about?"
              maxLength={500}
              rows={4}
              className="resize-none"
            />
            <FieldDescription>{(field.value ?? "").length}/500</FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Category */}
      <Controller
        name="category"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Category</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {COMMUNITY_CATEGORIES.map((cat) => (
                <TogglePill
                  key={cat}
                  selected={field.value === cat}
                  onClick={() => field.onChange(cat)}
                >
                  {cat}
                </TogglePill>
              ))}
            </div>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Location (optional) */}
      <Field>
        <FieldLabel optional>Location</FieldLabel>
        <FieldDescription>
          Add a location to show your community on the interactive map.
        </FieldDescription>
        <Controller
          name="is_worldwide"
          control={control}
          render={({ field }) => (
            <label className="flex items-center gap-2.5 cursor-pointer w-fit">
              <Checkbox
                checked={field.value ?? false}
                onCheckedChange={(checked) => {
                  field.onChange(checked === true)
                  if (checked === true) {
                    setValue("city", "")
                    setValue("country", "")
                  }
                }}
              />
              <span className="flex items-center gap-1.5 text-sm text-foreground">
                <Globe className="size-4 text-primary" />
                Worldwide — no specific location
              </span>
            </label>
          )}
        />
        {!isWorldwide && (
          <div className="flex flex-col gap-3">
            <Controller
              name="country"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Combobox
                    items={ALL_COUNTRIES}
                    value={field.value ?? ""}
                    onValueChange={(val) => {
                      field.onChange(val)
                      setValue("city", "")
                    }}
                  >
                    <ComboboxInput placeholder="Search country..." showClear />
                    <ComboboxContent>
                      <ComboboxEmpty>No country found.</ComboboxEmpty>
                      <ComboboxList>
                        {(name: string) => (
                          <ComboboxItem
                            key={name}
                            value={name}
                            className="font-mono text-sm"
                          >
                            {name}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            {watchedCountry && availableCities.length > 0 && (
              <Controller
                name="city"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <Combobox
                      items={availableCities}
                      value={field.value ?? ""}
                      onValueChange={(val) => field.onChange(val)}
                    >
                      <ComboboxInput placeholder="Search city..." showClear />
                      <ComboboxContent>
                        <ComboboxEmpty>No city found.</ComboboxEmpty>
                        <ComboboxList>
                          {(name: string) => (
                            <ComboboxItem
                              key={name}
                              value={name}
                              className="font-mono text-sm"
                            >
                              {name}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            )}
          </div>
        )}
        {isWorldwide && (
          <p className="text-xs text-muted-foreground font-mono">This community won&apos;t appear on the map.</p>
        )}
      </Field>

      {/* Cover Image */}
      <Field>
        <FieldLabel>Cover image</FieldLabel>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileAdd}
        />
        {pendingFile || imageUrl ? (
          <div className="relative h-40 rounded-lg overflow-hidden border border-border">
            <img
              src={pendingFile?.preview ?? imageUrl}
              alt="Cover preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-background cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="h-40 border border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
          >
            <Upload className="w-6 h-6" />
            <span className="text-sm">Upload cover image</span>
          </button>
        )}
      </Field>

      {/* Request verification */}
      <Controller
        name="verification_requested"
        control={control}
        render={({ field }) => (
          <label
            className={cn(
              "flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer",
              field.value
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40",
            )}
          >
            <Checkbox
              checked={field.value ?? false}
              onCheckedChange={(checked) => field.onChange(checked === true)}
              className="mt-0.5"
            />
            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <BadgeCheck className="size-4 text-builder-archetype" />
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
          <label
            className={cn(
              "flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer",
              field.value
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40",
            )}
          >
            <Checkbox
              checked={field.value ?? false}
              onCheckedChange={(checked) => field.onChange(checked === true)}
              className="mt-0.5"
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

      {/* Server error */}
      {serverError && (
        <p className="text-sm font-mono text-destructive border border-destructive/30 rounded-lg px-4 py-2.5 bg-destructive/5">
          {serverError}
        </p>
      )}

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
