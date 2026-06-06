"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
  REGIONS,
  getCitiesForCountry,
  getCountriesForRegion,
} from "@/lib/constants/location"
import type { ArchetypeId } from "@/lib/onboarding"
import {
  ALL_SKILLS,
  ARCHETYPES,
  LANGUAGES,
  SKILLS_BY_ARCHETYPE,
} from "@/lib/onboarding"
import {
  patchProfileSchema,
  type PatchProfileInput,
} from "@/lib/schemas/profile"
import type { UserProfile } from "@/lib/types"
import { cn } from "@/lib/utils"
import { usePatchProfile } from "@/services/api/profile"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { KittenSelector } from "./kitten-selector"

interface ProfileEditFormProps {
  profile: UserProfile
  onCancel: () => void
  onSaved: () => void
}

type ButtonVariant =
  | "visionary"
  | "strategist"
  | "builder"
  | "visionary-outline"
  | "strategist-outline"
  | "builder-outline"
  | "default"
  | "outline"

const ARCHETYPE_VARIANT: Record<
  ArchetypeId,
  { filled: ButtonVariant; outline: ButtonVariant }
> = {
  visionary: { filled: "visionary", outline: "visionary-outline" },
  strategist: { filled: "strategist", outline: "strategist-outline" },
  builder: { filled: "builder", outline: "builder-outline" },
}

export function ProfileEditForm({
  profile,
  onCancel,
  onSaved,
}: ProfileEditFormProps) {
  const patchProfile = usePatchProfile()
  const [serverError, setServerError] = useState<string | null>(null)

  const { control, handleSubmit, setValue, formState } =
    useForm<PatchProfileInput>({
      resolver: zodResolver(patchProfileSchema),
      defaultValues: {
        bio: profile.bio ?? "",
        archetype: (profile.archetype as ArchetypeId | null) ?? undefined,
        avatar_url: profile.avatar_url ?? undefined,
        skills: profile.skills ?? [],
        languages: profile.languages ?? [],
        region: profile.region ?? "",
        country: profile.country ?? "",
        city: profile.city ?? "",
        timezone: profile.timezone ?? "",
        github_url: profile.github_url ?? "",
        twitter_url: profile.twitter_url ?? "",
        farcaster_url: profile.farcaster_url ?? "",
      },
    })

  const watchedBio = useWatch({ control, name: "bio" })
  const watchedArchetype = useWatch({ control, name: "archetype" })
  const watchedRegion = useWatch({ control, name: "region" })
  const watchedCountry = useWatch({ control, name: "country" })
  const watchedAvatarUrl = useWatch({ control, name: "avatar_url" })
  const watchedSkills = useWatch({ control, name: "skills" })

  const availableCountries = getCountriesForRegion(watchedRegion ?? "")
  const availableCities = getCitiesForCountry(
    watchedRegion ?? "",
    watchedCountry ?? "",
  )

  const archetypeSkills =
    watchedArchetype && watchedArchetype in SKILLS_BY_ARCHETYPE
      ? SKILLS_BY_ARCHETYPE[watchedArchetype as ArchetypeId]
      : []
  const otherSkills = ALL_SKILLS.filter((s) => !archetypeSkills.includes(s))
  const archetypeVariants =
    watchedArchetype && watchedArchetype in ARCHETYPE_VARIANT
      ? ARCHETYPE_VARIANT[watchedArchetype as ArchetypeId]
      : {
          filled: "default" as ButtonVariant,
          outline: "outline" as ButtonVariant,
        }

  function toggleSkill(skill: string) {
    const current = watchedSkills ?? []
    const next = current.includes(skill)
      ? current.filter((s) => s !== skill)
      : [...current, skill]
    setValue("skills", next)
  }

  async function onSubmit(values: PatchProfileInput) {
    setServerError(null)
    try {
      await patchProfile.mutateAsync(values)
      onSaved()
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Something went wrong",
      )
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
      {/* Kitten + Archetype */}
      <div className="flex flex-col gap-6">
        {/* Kitten selector */}
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-[0.15em]">
            Cypher Kitten
          </p>
          <KittenSelector
            value={watchedAvatarUrl ?? null}
            onChange={(src) => setValue("avatar_url", src)}
          />
        </div>

        {/* Handle — read only */}
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-[0.15em]">
            Handle
          </p>
          <div className="flex items-center gap-2">
            <p className="font-mono text-foreground text-sm">
              {profile.handle}
            </p>
            <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground px-1.5 py-0">
              permanent
            </Badge>
          </div>
        </div>

        {/* Archetype */}
        <Controller
          name="archetype"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-3">
              <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-[0.15em]">
                Archetype
              </p>
              <div className="grid grid-cols-3 gap-3">
                {ARCHETYPES.map((a) => {
                  const isSelected = field.value === a.id
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        field.onChange(a.id)
                        // Reset skills when archetype changes
                        setValue("skills", [])
                      }}
                      className={cn(
                        "flex flex-col gap-1 rounded-xl border p-3 text-left transition-all",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      )}
                      style={{
                        borderColor: isSelected
                          ? `var(${a.colorVar})`
                          : "var(--border)",
                        background: isSelected
                          ? `color-mix(in oklch, var(${a.colorVar}) 10%, var(--card))`
                          : "var(--card)",
                      }}
                    >
                      <span
                        className="text-xs font-display font-semibold"
                        style={{
                          color: isSelected
                            ? `var(${a.colorVar})`
                            : "var(--muted-foreground)",
                        }}
                      >
                        {a.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        />

        {/* Bio */}
        <Controller
          name="bio"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="bio">
                Bio{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </FieldLabel>
              <Textarea
                {...field}
                id="bio"
                value={field.value ?? ""}
                aria-invalid={fieldState.invalid}
                placeholder="What are you building?"
                maxLength={160}
                rows={3}
                className="resize-none font-mono text-sm"
              />
              <FieldDescription className="text-right tabular-nums">
                {(watchedBio ?? "").length} / 160
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      {/* Divider */}
      <Separator />

      {/* Skills */}
      <div className="flex flex-col gap-4">
        <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-[0.15em]">
          Skills
        </p>

        {archetypeSkills.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.12em] shrink-0">
                Suggested
              </p>
              <div
                className="flex-1 h-px"
                style={{ background: "var(--border)" }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {archetypeSkills.map((skill) => {
                const isSelected = (watchedSkills ?? []).includes(skill)
                return (
                  <Button
                    key={skill}
                    type="button"
                    size="sm"
                    variant={
                      isSelected
                        ? archetypeVariants.filled
                        : archetypeVariants.outline
                    }
                    onClick={() => toggleSkill(skill)}
                    className="rounded-md font-mono"
                  >
                    {isSelected ? "✓ " : ""}
                    {skill}
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.12em] shrink-0">
              Other skills
            </p>
            <Separator className="flex-1" />
          </div>
          <div className="flex flex-wrap gap-2">
            {otherSkills.map((skill) => {
              const isSelected = (watchedSkills ?? []).includes(skill)
              return (
                <Button
                  key={skill}
                  type="button"
                  size="sm"
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => toggleSkill(skill)}
                  className="rounded-md font-mono"
                >
                  {isSelected ? "✓ " : ""}
                  {skill}
                </Button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Divider */}
      <Separator />

      {/* Location */}
      <div className="flex flex-col gap-4">
        <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-[0.15em]">
          Location
        </p>

        <Controller
          name="region"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className="text-xs font-mono text-muted-foreground">
                Region
              </FieldLabel>
              <Combobox
                items={REGIONS}
                value={field.value ?? ""}
                onValueChange={(val) => {
                  field.onChange(val)
                  setValue("country", "")
                  setValue("city", "")
                  setValue("timezone", "")
                }}
              >
                <ComboboxInput placeholder="Search region..." showClear />
                <ComboboxContent>
                  <ComboboxEmpty>No region found.</ComboboxEmpty>
                  <ComboboxList>
                    {(r: string) => (
                      <ComboboxItem
                        key={r}
                        value={r}
                        className="font-mono text-sm"
                      >
                        {r}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {watchedRegion && availableCountries.length > 0 && (
          <Controller
            name="country"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className="text-xs font-mono text-muted-foreground">
                  Country
                </FieldLabel>
                <Combobox
                  items={availableCountries.map((c) => c.name)}
                  value={field.value ?? ""}
                  onValueChange={(val) => {
                    field.onChange(val)
                    setValue("city", "")
                    setValue("timezone", "")
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
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        )}

        {watchedCountry && availableCities.length > 0 && (
          <Controller
            name="city"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className="text-xs font-mono text-muted-foreground">
                  City
                </FieldLabel>
                <Combobox
                  items={availableCities.map((c) => c.name)}
                  value={field.value ?? ""}
                  onValueChange={(val) => {
                    field.onChange(val)
                    const cityData = availableCities.find((c) => c.name === val)
                    if (cityData) setValue("timezone", cityData.timezone)
                  }}
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
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        )}
      </div>

      {/* Languages */}
      <Controller
        name="languages"
        control={control}
        render={({ field }) => {
          const value = field.value ?? []
          return (
            <div className="flex flex-col gap-3">
              <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-[0.15em]">
                Languages
              </p>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((lang) => {
                  const active = value.includes(lang)
                  return (
                    <Button
                      key={lang}
                      type="button"
                      size="sm"
                      variant={active ? "default" : "outline"}
                      onClick={() =>
                        field.onChange(
                          active
                            ? value.filter((l) => l !== lang)
                            : [...value, lang],
                        )
                      }
                      className="rounded-md font-mono"
                    >
                      {active ? "✓ " : ""}
                      {lang}
                    </Button>
                  )
                })}
              </div>
            </div>
          )
        }}
      />

      {/* Divider */}
      <Separator />

      {/* Social links */}
      <div className="flex flex-col gap-4">
        <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-[0.15em]">
          Links
        </p>

        {(
          [
            {
              name: "github_url" as const,
              prefix: "github.com/",
              label: "GitHub",
            },
            {
              name: "twitter_url" as const,
              prefix: "x.com/",
              label: "Twitter / X",
            },
            {
              name: "farcaster_url" as const,
              prefix: "warpcast.com/",
              label: "Farcaster",
            },
          ] as const
        ).map(({ name, prefix, label }) => (
          <Controller
            key={name}
            name={name}
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel
                  htmlFor={name}
                  className="text-xs font-mono text-muted-foreground"
                >
                  {label}
                </FieldLabel>
                <div
                  className="flex items-center rounded-lg border bg-transparent dark:bg-input/30 transition-[border-color]"
                  style={{
                    borderColor: fieldState.invalid
                      ? "var(--destructive)"
                      : "var(--border)",
                  }}
                >
                  <span className="pl-3 pr-1 text-xs font-mono text-muted-foreground select-none whitespace-nowrap">
                    {prefix}
                  </span>
                  <Input
                    {...field}
                    id={name}
                    value={field.value ?? ""}
                    placeholder="username"
                    aria-invalid={fieldState.invalid}
                    className="border-0 bg-transparent shadow-none focus-visible:ring-0 font-mono text-sm pl-0"
                  />
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        ))}
      </div>

      {/* Server error */}
      {serverError && (
        <p className="text-sm font-mono text-destructive border border-destructive/30 rounded-lg px-4 py-2.5 bg-destructive/5">
          {serverError}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={onCancel}
          disabled={formState.isSubmitting}
          className="rounded-xl font-mono"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="lg"
          disabled={formState.isSubmitting}
          className="rounded-xl font-mono font-semibold px-6"
        >
          {formState.isSubmitting ? (
            <>
              <Spinner className="mr-2" /> Saving...
            </>
          ) : (
            "Save changes →"
          )}
        </Button>
      </div>
    </form>
  )
}
