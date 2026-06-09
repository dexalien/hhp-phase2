"use client"

import { useRef, useState, useCallback } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
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
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field"
import { LOCATION_DATA } from "@/lib/constants/location"
import type { ZodType } from "zod"
import {
  createMiniEventSchema,
  type CreateMiniEventInput,
} from "@/lib/schemas/mini-event"

const LOCATION_LABELS: Record<"online" | "in_person", string> = {
  online: "Online",
  in_person: "In person",
}

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
        "text-xs px-3 py-1.5 rounded-md border font-mono transition-all cursor-pointer",
        selected
          ? "border-primary text-primary bg-primary/10"
          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

// Convert an ISO timestamp to the value a <input type="datetime-local"> expects (local time).
function isoToLocalInput(iso?: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const tzOffsetMs = d.getTimezoneOffset() * 60_000
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 16)
}

// Convert a datetime-local value (local time, no tz) into an ISO UTC string.
function localInputToIso(value: string): string {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString()
}

interface CommunityEventFormProps {
  defaultValues?: Partial<CreateMiniEventInput>
  onFormSubmit: (values: CreateMiniEventInput) => Promise<void>
  submitLabel: string
  submittingLabel: string
  onCancel: () => void
  // Validation schema — create uses the future-start check, edit does not.
  schema?: ZodType<CreateMiniEventInput>
}

export function CommunityEventForm({
  defaultValues,
  onFormSubmit,
  submitLabel,
  submittingLabel,
  onCancel,
  schema = createMiniEventSchema,
}: CommunityEventFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [geocoding, setGeocoding] = useState(false)
  // Combobox popups portal into the form so they work inside the Radix Dialog
  // (Base UI portals to body by default, which the modal dialog makes inert).
  const portalRef = useRef<HTMLFormElement>(null)
  const {
    control,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm<CreateMiniEventInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      location_type: "online",
      meeting_url: "",
      country: "",
      city: "",
      venue: "",
      address: "",
      start_at: "",
      end_at: "",
      lat: undefined,
      lng: undefined,
      ...defaultValues,
    },
  })

  const locationType = useWatch({ control, name: "location_type" })
  const watchedCountry = useWatch({ control, name: "country" })
  const watchedCity = useWatch({ control, name: "city" })
  const watchedVenue = useWatch({ control, name: "venue" })
  const watchedAddress = useWatch({ control, name: "address" })
  const availableCities = watchedCountry ? getCitiesForCountryName(watchedCountry) : []

  const geocodeFromVenueName = useCallback(async () => {
    const q = [watchedVenue, watchedCity, watchedCountry].filter(Boolean).join(", ")
    if (!q) return
    setGeocoding(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
        { headers: { "User-Agent": "HackerHouseProtocol/1.0" } },
      )
      const results: { display_name: string; lat: string; lon: string }[] = await res.json()
      if (results.length > 0) {
        setValue("address", results[0].display_name)
        setValue("lat", parseFloat(results[0].lat))
        setValue("lng", parseFloat(results[0].lon))
        toast.success("Address & map pin set from venue name")
      } else {
        toast.error("Venue not found — enter address manually")
      }
    } catch {
      toast.error("Lookup failed")
    } finally {
      setGeocoding(false)
    }
  }, [watchedVenue, watchedCity, watchedCountry, setValue])

  const geocodeFromAddress = useCallback(async () => {
    if (!watchedAddress) return
    setGeocoding(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(watchedAddress)}&format=json&limit=1`,
        { headers: { "User-Agent": "HackerHouseProtocol/1.0" } },
      )
      const results: { lat: string; lon: string }[] = await res.json()
      if (results.length > 0) {
        setValue("lat", parseFloat(results[0].lat))
        setValue("lng", parseFloat(results[0].lon))
        toast.success("Map pin set")
      } else {
        toast.error("Could not locate this address")
      }
    } catch {
      toast.error("Geocoding failed")
    } finally {
      setGeocoding(false)
    }
  }, [watchedAddress, setValue])

  async function onSubmit(values: CreateMiniEventInput) {
    setServerError(null)
    try {
      await onFormSubmit(values)
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong"
      setServerError(message)
      toast.error(message)
    }
  }

  return (
    <form ref={portalRef} onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {/* Title */}
      <Controller
        name="title"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Title</FieldLabel>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="Weekly community call"
              maxLength={80}
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
            <FieldLabel htmlFor={field.name} optional>
              Description
            </FieldLabel>
            <Textarea
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="What's this event about?"
              maxLength={500}
              rows={3}
              className="resize-none"
            />
            <FieldDescription>{(field.value ?? "").length}/500</FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Location type */}
      <Controller
        name="location_type"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Location type</FieldLabel>
            <div className="flex gap-2">
              {(["online", "in_person"] as const).map((lt) => (
                <TogglePill
                  key={lt}
                  selected={field.value === lt}
                  onClick={() => field.onChange(lt)}
                >
                  {LOCATION_LABELS[lt]}
                </TogglePill>
              ))}
            </div>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Conditional location fields */}
      {locationType === "online" ? (
        <div className="flex flex-col gap-4 pl-3 border-l-2 border-primary/30">
          <Controller
            name="meeting_url"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Meeting URL</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder="https://meet.google.com/..."
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4 pl-3 border-l-2 border-primary/30">
          <Controller
            name="country"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Country</FieldLabel>
                <Combobox
                  items={ALL_COUNTRIES}
                  value={field.value ?? ""}
                  onValueChange={(val) => {
                    field.onChange(val)
                    setValue("city", "")
                  }}
                >
                  <ComboboxInput placeholder="Search country..." showClear />
                  <ComboboxContent container={portalRef}>
                    <ComboboxEmpty>No country found.</ComboboxEmpty>
                    <ComboboxList>
                      {(name: string) => (
                        <ComboboxItem key={name} value={name} className="font-mono text-sm">
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
                  <FieldLabel>City</FieldLabel>
                  <Combobox
                    items={availableCities}
                    value={field.value ?? ""}
                    onValueChange={(val) => field.onChange(val)}
                  >
                    <ComboboxInput placeholder="Search city..." showClear />
                    <ComboboxContent container={portalRef}>
                      <ComboboxEmpty>No city found.</ComboboxEmpty>
                      <ComboboxList>
                        {(name: string) => (
                          <ComboboxItem key={name} value={name} className="font-mono text-sm">
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
          <Controller
            name="venue"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name} optional>
                  Venue name
                </FieldLabel>
                <div className="flex gap-2">
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    maxLength={120}
                  />
                  <button
                    type="button"
                    onClick={() => void geocodeFromVenueName()}
                    disabled={!watchedVenue || geocoding}
                    title="Auto-fill address from venue name"
                    className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border hover:opacity-80 disabled:opacity-30 transition-opacity whitespace-nowrap font-mono"
                  >
                    <MapPin className="size-3.5" />
                    {geocoding ? "..." : "Look up"}
                  </button>
                </div>
                <FieldDescription>Enter the venue name and click Look up to auto-fill the address.</FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="address"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  Address
                </FieldLabel>
                <div className="flex gap-2">
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    maxLength={255}
                  />
                  <button
                    type="button"
                    onClick={() => void geocodeFromAddress()}
                    disabled={!watchedAddress || geocoding}
                    title="Set map pin from this address"
                    className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border hover:opacity-80 disabled:opacity-30 transition-opacity whitespace-nowrap font-mono"
                  >
                    <MapPin className="size-3.5" />
                    {geocoding ? "..." : "Set pin"}
                  </button>
                </div>
                <FieldDescription>Or enter the address manually and click Set pin.</FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
      )}

      {/* Start / End */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Controller
          name="start_at"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Start</FieldLabel>
              <Input
                type="datetime-local"
                id={field.name}
                aria-invalid={fieldState.invalid}
                value={isoToLocalInput(field.value)}
                onChange={(e) => field.onChange(localInputToIso(e.target.value))}
                onBlur={field.onBlur}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="end_at"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name} optional>
                End
              </FieldLabel>
              <Input
                type="datetime-local"
                id={field.name}
                aria-invalid={fieldState.invalid}
                value={isoToLocalInput(field.value)}
                onChange={(e) => field.onChange(localInputToIso(e.target.value))}
                onBlur={field.onBlur}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      {/* Capacity */}
      <Controller
        name="capacity"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name} optional>
              Capacity
            </FieldLabel>
            <Input
              type="number"
              id={field.name}
              min={1}
              aria-invalid={fieldState.invalid}
              placeholder="No limit"
              value={field.value ?? ""}
              onChange={(e) => {
                const v = e.target.value
                field.onChange(v === "" ? undefined : Number(v))
              }}
              onBlur={field.onBlur}
              className="max-w-40"
            />
            <FieldDescription>Maximum number of attendees.</FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {serverError && (
        <p className="text-sm font-mono text-destructive border border-destructive/30 rounded-lg px-4 py-2.5 bg-destructive/5">
          {serverError}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="pill-ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="pill" disabled={isSubmitting} className="px-6">
          {isSubmitting ? (
            <>
              <Spinner className="mr-2" /> {submittingLabel}
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  )
}

export { isoToLocalInput, localInputToIso }
