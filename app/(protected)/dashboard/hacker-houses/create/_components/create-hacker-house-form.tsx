"use client"

import { Fragment, useEffect, useRef, useState } from "react"
import { useForm, useWatch, Controller, type Control, type UseFormSetValue } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { X, MapPin, Lock, Check, Wallet } from "lucide-react"
import { ARCHETYPES, LANGUAGES } from "@/lib/onboarding"
import { useEvents } from "@/services/api/events"
import {
  createHackerHouseSchema,
  type CreateHackerHouseInput,
  APPLICATION_TYPES,
  EVENT_TIMINGS,
  HOUSE_MODALITIES,
  CONTRACT_TYPES,

  YIELD_MODES,
  YIELD_DESTS,
} from "@/lib/schemas/hacker-house"
import { useUploadHackerHouseImage } from "@/services/api/hacker-houses"
import { useCommunities } from "@/services/api/communities"
import type { Community } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Field,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import {
  REGIONS,
  getCountriesForRegion,
  getCitiesForCountry,
} from "@/lib/constants/location"


const APPLICATION_TYPE_LABELS: Record<string, { title: string; description: string; color: string; comingSoon?: boolean }> = {
  open: { title: "Open", description: "Anyone can apply", color: "text-builder-archetype" },
  invite_only: { title: "Invite only", description: "You invite builders directly", color: "text-primary" },
  curated: { title: "Curated", description: "You review each applicant manually", color: "text-amber", comingSoon: true },
}

const EVENT_TIMING_LABELS: Record<string, string> = {
  before: "Before",
  during: "During",
  after: "After",
}

const MODALITY_OPTIONS: { value: string; title: string; description: string; color: string; comingSoon?: boolean }[] = [
  { value: "paid", title: "Co-Payment", description: "Split costs between all members", color: "text-builder-archetype" },
  { value: "staking", title: "Staking", description: "Stake crypto to reserve your spot", color: "text-amber" },
  { value: "free", title: "Sponsored", description: "A sponsor covers the stay", color: "text-primary", comingSoon: true },
]

const CONTRACT_TYPE_OPTIONS: { value: string; title: string; description: string; disabled?: boolean; comingSoon?: boolean }[] = [
  { value: "multisig", title: "Multisig", description: "Coming soon", disabled: true, comingSoon: true },
  { value: "admin_wallet", title: "House Creator Wallet", description: "Funds controlled by the house creator" },
]

const AMENITY_OPTIONS: { key: keyof CreateHackerHouseInput; label: string; description: string }[] = [
  { key: "includes_private_room", label: "Private room", description: "Each member gets their own room" },
  { key: "includes_shared_room", label: "Shared room", description: "Members share bedrooms" },
  { key: "includes_meals", label: "Meals included", description: "Breakfast, lunch or dinner" },
  { key: "includes_workspace", label: "Workspace", description: "Dedicated desk/co-working area" },
  { key: "includes_internet", label: "Internet", description: "High-speed WiFi included" },
]

const STEPS = ["House", "Amenities", "Community", "Access", "Payment", "Check-in"] as const
type Step = (typeof STEPS)[number]

const STEP_FIELDS: Record<Step, (keyof CreateHackerHouseInput)[]> = {
  House: ["name", "modality", "price_per_person", "region", "country", "city", "address", "lat", "lng"],
  Amenities: ["start_date", "end_date", "capacity"],
  Community: ["profile_sought", "language"],
  Access: ["application_type", "application_deadline"],
  Payment: ["deposit_amount_usdc", "withdraw_date", "house_type"],
  "Check-in": [],
}

const FIELD_TO_STEP: Partial<Record<keyof CreateHackerHouseInput, Step>> = {
  name: "House",
  modality: "House",
  sponsor_name: "House",
  region: "House",
  country: "House",
  city: "House",
  neighborhood: "House",
  address: "House",
  start_date: "Amenities",
  end_date: "Amenities",
  capacity: "Amenities",
  images: "Amenities",
  profile_sought: "Community",
  language: "Community",
  house_rules: "Community",
  has_event: "Community",
  event_name: "Community",
  event_url: "Community",
  event_start_date: "Community",
  event_end_date: "Community",
  event_timing: "Community",
  application_type: "Access",
  application_deadline: "Access",
  deposit_amount_usdc: "Payment",
  withdraw_date: "Payment",
  house_type: "Payment",
  yield_mode: "Payment",
  yield_dest: "Payment",
  host_safe: "Payment",
  checkin_wifi_password: "Check-in",
  checkin_room_info: "Check-in",
  checkin_lockbox: "Check-in",
  checkin_notes: "Check-in",
}


const YIELD_DEST_OPTIONS: { value: (typeof YIELD_DESTS)[number]; title: string; description: string; detail: string }[] = [
  { value: "host", title: "To host", description: "Deposit + yield go to the host on release", detail: "Host receives principal - 0.5% fee + all accrued yield." },
  { value: "builders", title: "To builders", description: "Deposit goes to host, yield split among builders", detail: "Host receives principal - 0.5% fee (zero yield). Yield distributed equally among depositors." },
]

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full bg-card border border-border rounded-xl p-6 flex flex-col gap-5">
      {children}
    </div>
  )
}

function TogglePill({
  selected,
  onClick,
  children,
  className,
  disabled,
}: {
  selected: boolean
  onClick?: (() => void) | undefined
  children: React.ReactNode
  className?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "text-xs px-3 py-1.5 rounded-md border font-mono transition-all",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer",
        selected
          ? "border-primary text-primary bg-primary/10"
          : !disabled && "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  )
}

function SponsorField({
  control,
  setValue,
  communities,
}: {
  control: Control<CreateHackerHouseInput>
  setValue: UseFormSetValue<CreateHackerHouseInput>
  communities: Community[]
}) {
  const sponsorCommunityId = useWatch({ control, name: "sponsor_community_id" })
  const sponsorName = useWatch({ control, name: "sponsor_name" })
  const selectedCommunity = communities.find((c) => c.id === sponsorCommunityId)

  return (
    <Field>
      <FieldLabel optional>Sponsor</FieldLabel>
      <FieldDescription>Select a community sponsor or type a name manually.</FieldDescription>
      <div className="flex flex-col gap-2">
        <select
          value={sponsorCommunityId ?? ""}
          onChange={(e) => {
            const val = e.target.value
            if (val) {
              const found = communities.find((c) => c.id === val)
              setValue("sponsor_community_id", val)
              setValue("sponsor_name", found?.name ?? "")
            } else {
              setValue("sponsor_community_id", undefined)
            }
          }}
          className="w-full px-3 py-2 rounded-lg border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          style={{ background: "var(--card)" }}
        >
          <option value="">— Type a name manually —</option>
          {communities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {c.category}
            </option>
          ))}
        </select>

        {selectedCommunity ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg">
            {selectedCommunity.image_url && (
              <img src={selectedCommunity.image_url} alt="" className="size-6 rounded-full object-cover" />
            )}
            <span className="text-sm text-foreground font-medium">{selectedCommunity.name}</span>
            <span className="text-xs text-muted-foreground font-mono ml-auto">{selectedCommunity.member_count} members</span>
          </div>
        ) : (
          <Controller
            name="sponsor_name"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="e.g. Ethereum Foundation"
                maxLength={100}
              />
            )}
          />
        )}
      </div>
    </Field>
  )
}

interface CreateHackerHouseFormProps {
  defaultValues?: Partial<CreateHackerHouseInput>
  onFormSubmit: (values: CreateHackerHouseInput) => Promise<void>
  submitLabel: string
  submittingLabel: string
  editMode?: boolean
  contractDeployed?: boolean
}

export function CreateHackerHouseForm({
  defaultValues,
  onFormSubmit,
  submitLabel,
  submittingLabel,
  editMode = false,
  contractDeployed = false,
}: CreateHackerHouseFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>("House")
  const [serverError, setServerError] = useState<string | null>(null)
  const [pendingFiles, setPendingFiles] = useState<{ file: File; preview: string }[]>([])
  const [existingImages, setExistingImages] = useState<string[]>(defaultValues?.images ?? [])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadImage = useUploadHackerHouseImage()

  useEffect(() => {
    return () => {
      pendingFiles.forEach((p) => URL.revokeObjectURL(p.preview))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stepIndex = STEPS.indexOf(step)

  const {
    control,
    handleSubmit,
    trigger,
    setError,
    setValue,
    formState: { isSubmitting, errors: formErrors },
  } = useForm<CreateHackerHouseInput>({
    resolver: zodResolver(createHackerHouseSchema),
    defaultValues: {
      name: "",
      modality: "paid",
      sponsor_name: "",
      region: "",
      country: "",
      city: "",
      neighborhood: "",
      booking_url: "",
      address: "",
      checkin_wifi_password: "",
      checkin_room_info: "",
      checkin_lockbox: "",
      checkin_notes: "",
      start_date: "",
      end_date: "",
      capacity: 4,
      includes_private_room: false,
      includes_shared_room: false,
      includes_meals: false,
      includes_workspace: false,
      includes_internet: false,
      images: [],
      profile_sought: [],
      language: ["English"],
      house_rules: "",
      application_type: "open",
      application_deadline: undefined,
      application_form_url: "",
      has_event: false,
      event_name: "",
      event_url: "",
      event_start_date: "",
      event_end_date: "",
      event_timing: [],
      // Web3 escrow defaults
      contract_type: "admin_wallet",
      host_safe: "",
      withdraw_date: "",
      house_type: "co_payment",
      yield_mode: "none",
      yield_dest: "host",
      ...defaultValues,
    },
  })

  const hasEvent = useWatch({ control, name: "has_event" })
  const watchedModality = useWatch({ control, name: "modality" })
  const watchedHouseType = useWatch({ control, name: "house_type" })
  const watchedYieldMode = useWatch({ control, name: "yield_mode" })
  const watchedStartDate = useWatch({ control, name: "start_date" })
  const watchedPricePerPerson = useWatch({ control, name: "price_per_person" })

  useEffect(() => {
    if (watchedModality === "free") {
      setValue("application_type", "invite_only")
    }
  }, [watchedModality, setValue])

  // Auto-derive house_type and yield_mode from modality
  useEffect(() => {
    if (watchedModality === "paid") {
      setValue("house_type", "co_payment")
      setValue("yield_mode", "none")
    } else if (watchedModality === "staking") {
      setValue("house_type", "staking")
      setValue("yield_mode", "gmx")
    }
  }, [watchedModality, setValue])

  // Sync price_per_person → deposit_amount_usdc so there's only one field
  useEffect(() => {
    if (watchedPricePerPerson != null) {
      setValue("deposit_amount_usdc", watchedPricePerPerson)
    }
  }, [watchedPricePerPerson, setValue])
  const watchedRegion = useWatch({ control, name: "region" })
  const watchedCountry = useWatch({ control, name: "country" })
  const watchedCity = useWatch({ control, name: "city" })
  const watchedAddress = useWatch({ control, name: "address" })

  const { data: eventsData } = useEvents()
  const availableEvents = eventsData?.events ?? []

  const { data: communitiesData } = useCommunities()
  const availableCommunities = communitiesData?.communities ?? []

  const availableCountries = watchedRegion ? getCountriesForRegion(watchedRegion) : []
  const availableCities =
    watchedRegion && watchedCountry ? getCitiesForCountry(watchedRegion, watchedCountry) : []

  const [hotelName, setHotelName] = useState("")
  const [lookingUpLocation, setLookingUpLocation] = useState(false)

  async function lookupFromHotel() {
    if (!hotelName || !watchedCity || !watchedCountry) return
    setLookingUpLocation(true)
    try {
      const q = encodeURIComponent(`${hotelName}, ${watchedCity}, ${watchedCountry}`)
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, {
        headers: { "User-Agent": "HackerHouseProtocol/1.0" },
      })
      const results: { display_name: string; lat: string; lon: string }[] = await res.json()
      if (results.length > 0) {
        setValue("address", results[0].display_name)
        setValue("lat", parseFloat(results[0].lat))
        setValue("lng", parseFloat(results[0].lon))
        toast.success("Address & pin set from hotel name")
      } else {
        toast.error("Hotel not found — try a different name or enter address manually")
      }
    } catch {
      toast.error("Location lookup failed")
    } finally {
      setLookingUpLocation(false)
    }
  }

  async function geocodeFromAddress() {
    if (!watchedAddress) return
    setLookingUpLocation(true)
    try {
      const q = encodeURIComponent(watchedAddress)
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, {
        headers: { "User-Agent": "HackerHouseProtocol/1.0" },
      })
      const results: { lat: string; lon: string }[] = await res.json()
      if (results.length > 0) {
        setValue("lat", parseFloat(results[0].lat))
        setValue("lng", parseFloat(results[0].lon))
        toast.success("Map pin set from address")
      } else {
        toast.error("Could not locate this address")
      }
    } catch {
      toast.error("Geocoding failed")
    } finally {
      setLookingUpLocation(false)
    }
  }

  function handleFileAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]
    const slots = 5 - pendingFiles.length

    if (slots <= 0) {
      toast.error("Maximum 5 images allowed")
      e.target.value = ""
      return
    }

    const toAdd = files.slice(0, slots)
    if (files.length > slots) {
      toast.warning(`Only ${slots} slot(s) remaining — adding first ${slots}`)
    }

    const invalid = toAdd.filter((f) => !ALLOWED.includes(f.type))
    if (invalid.length) {
      toast.error("Invalid file type. Use JPEG, PNG, WebP, GIF or AVIF")
      e.target.value = ""
      return
    }
    const oversized = toAdd.filter((f) => f.size > 5 * 1024 * 1024)
    if (oversized.length) {
      toast.error("One or more files exceed 5MB")
      e.target.value = ""
      return
    }

    const newEntries = toAdd.map((f) => ({ file: f, preview: URL.createObjectURL(f) }))
    setPendingFiles((prev) => [...prev, ...newEntries])
    e.target.value = ""
  }

  function removeImage(index: number) {
    setPendingFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  async function goNext() {
    setServerError(null)
    const valid = await trigger(STEP_FIELDS[step])
    if (!valid) {
      toast.error(`Complete all required fields in ${step}`)
      return
    }

    // Manual validation for Amenities step — at least 1 photo
    if (step === "Amenities" && existingImages.length + pendingFiles.length < 1) {
      toast.error("Upload at least 1 photo")
      return
    }

    // Manual validation for House step — price is required for paid/staking
    if (step === "House" && (watchedModality === "paid" || watchedModality === "staking")) {
      if (!watchedPricePerPerson || watchedPricePerPerson < 1) {
        toast.error("Price per person must be at least 1 USDC")
        return
      }
    }

    // Manual validation for Payment step
    if (step === "Payment") {
      const watchedWithdrawDate = control._formValues.withdraw_date
      if (!watchedPricePerPerson || watchedPricePerPerson <= 0) {
        toast.error("Set the price per person in step 1 first")
        setStep("House")
        return
      }
      if (!watchedWithdrawDate) {
        toast.error("Withdraw date is required to deploy the escrow")
        return
      }
    }

    const next = STEPS[stepIndex + 1]
    // Skip Payment step for free/sponsored houses
    if (next === "Payment" && !needsPaymentStep) {
      setStep(STEPS[stepIndex + 2])
    } else {
      setStep(next)
    }
  }

  async function onSubmit(values: CreateHackerHouseInput) {
    setServerError(null)
    try {
      let newUrls: string[] = []
      if (pendingFiles.length > 0) {
        const results = await Promise.all(pendingFiles.map((p) => uploadImage.mutateAsync(p.file)))
        newUrls = results.map((r) => r.image_url)
      }
      const finalImages = editMode
        ? [...existingImages, ...newUrls]
        : newUrls
      await onFormSubmit({ ...values, images: finalImages })
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong"
      toast.error(message)
      const matchedField = (Object.keys(FIELD_TO_STEP) as (keyof CreateHackerHouseInput)[]).find(
        (field) => message.toLowerCase().includes(field.toLowerCase()),
      )
      if (matchedField && FIELD_TO_STEP[matchedField]) {
        setError(matchedField, { type: "server", message })
        setStep(FIELD_TO_STEP[matchedField]!)
      } else {
        setServerError(message)
      }
    }
  }


  // Payment step is skipped entirely for free/sponsored houses
  const needsPaymentStep = watchedModality !== "free"
  const visibleSteps = (needsPaymentStep ? STEPS : STEPS.filter(s => s !== "Payment")) as Step[]
  const visibleStepIndex = visibleSteps.indexOf(step)

  const showStep = (s: Step) => {
    if (s === "Payment") return needsPaymentStep && (editMode || step === "Payment")
    return editMode || step === s
  }

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Step indicator — hidden in edit mode */}
      {!editMode && (
        <div className="flex items-center w-full">
          {visibleSteps.map((s, i) => (
            <Fragment key={s}>
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold border transition-all",
                    i < visibleStepIndex
                      ? "bg-primary border-primary text-primary-foreground"
                      : i === visibleStepIndex
                        ? "border-primary text-primary"
                        : "border-border text-muted-foreground",
                  )}
                >
                  {i < visibleStepIndex ? "✓" : i + 1}
                </div>
                <span
                  className={cn(
                    "text-xs font-mono hidden sm:block",
                    i === visibleStepIndex ? "text-foreground font-medium" : "text-muted-foreground",
                  )}
                >
                  {s}
                </span>
              </div>
              {i < visibleSteps.length - 1 && (
                <div
                  className={cn("h-px flex-1 mx-2", i < visibleStepIndex ? "bg-primary" : "bg-border")}
                />
              )}
            </Fragment>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit, (errors) => {
        const steps = new Set<string>()
        for (const key of Object.keys(errors)) {
          const s = FIELD_TO_STEP[key as keyof CreateHackerHouseInput]
          if (s) steps.add(s)
        }
        const where = steps.size ? ` in ${[...steps].join(", ")}` : ""
        toast.error(`Missing required fields${where}`)
      })} className="w-full flex flex-col gap-4">
        {/* ── STEP 1: HOUSE ── */}
        {showStep("House") && (
          <SectionCard>
            <div>
              <h2 className="font-display font-bold text-foreground text-xl">About the house</h2>
              <p className="text-muted-foreground text-sm mt-1">Where is this Hacker House?</p>
            </div>

            {contractDeployed && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-500/30 bg-amber-500/5">
                <Lock className="size-3.5 text-amber-400 shrink-0" />
                <p className="text-xs text-amber-300 font-mono">
                  Contract deployed — house type, price, and capacity are locked.
                </p>
              </div>
            )}

            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>House name</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}

                    placeholder=""
                    maxLength={80}
                  />

                </Field>
              )}
            />

            <Controller
              name="modality"
              control={control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>House type</FieldLabel>
                  <FieldDescription>How will members pay for the stay?</FieldDescription>
                  <RadioGroup
                    value={field.value}
                    onValueChange={(v) => { if (!contractDeployed) field.onChange(v) }}
                    className="gap-2"
                    disabled={contractDeployed}
                  >
                    {MODALITY_OPTIONS.map((opt) => {
                      const disabled = opt.comingSoon === true || contractDeployed
                      return (
                        <label
                          key={opt.value}
                          className={cn(
                            "w-full flex items-center gap-4 p-4 rounded-lg border transition-all",
                            disabled
                              ? "border-muted-foreground/15 opacity-50 cursor-not-allowed"
                              : "cursor-pointer",
                            !disabled && field.value === opt.value
                              ? "border-primary bg-primary/5"
                              : !disabled && "border-muted-foreground/25 hover:border-primary/40",
                          )}
                        >
                          <RadioGroupItem value={opt.value} disabled={disabled} />
                          <div className="flex flex-col gap-0.5">
                            <span className={cn("text-sm font-medium", !disabled && field.value === opt.value ? opt.color : "text-foreground")}>
                              {opt.title}
                              {disabled && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-strategist/20 text-strategist font-mono">Coming soon</span>}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {opt.description}
                            </span>
                          </div>
                        </label>
                      )
                    })}
                  </RadioGroup>

                </Field>
              )}
            />

            {(watchedModality === "paid" || watchedModality === "staking") && (
              <Controller
                name="price_per_person"
                control={control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      {watchedModality === "staking" ? (
                        <>Stake amount <span className="text-primary">(USDC)</span></>
                      ) : (
                        <>Price per person <span className="text-builder-archetype">(USDC)</span></>
                      )}
                    </FieldLabel>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">$</span>
                      <Input
                        id={field.name}
                        type="number"
                        min={1}
                        step={1}
                        placeholder="100"
                        className="pl-7"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                        disabled={contractDeployed}
                      />
                    </div>
  
                  </Field>
                )}
              />
            )}

            {watchedModality === "free" && (
              <SponsorField
                control={control}
                setValue={setValue}
                communities={availableCommunities}
              />
            )}

            {watchedModality !== "free" && (
            <Controller
              name="contract_type"
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldLabel optional>Contract type</FieldLabel>
                  <FieldDescription>How are funds managed on-chain?</FieldDescription>
                  <RadioGroup
                    value={field.value ?? ""}
                    onValueChange={(val) => field.onChange(val || undefined)}
                    className="gap-2"
                  >
                    {CONTRACT_TYPE_OPTIONS.map((opt) => (
                      <label
                        key={opt.value}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-lg border transition-all",
                          opt.disabled
                            ? "border-border opacity-50 cursor-not-allowed"
                            : "cursor-pointer",
                          !opt.disabled && field.value === opt.value
                            ? "border-primary bg-primary/5"
                            : !opt.disabled
                              ? "border-border hover:border-primary/40"
                              : "",
                        )}
                        onClick={(e) => { if (opt.disabled) e.preventDefault() }}
                      >
                        <RadioGroupItem value={opt.value} disabled={opt.disabled} />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium text-foreground flex items-center gap-2">
                            {opt.title}
                            {opt.comingSoon && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-strategist/20 text-strategist font-mono">
                                Coming soon
                              </span>
                            )}
                          </span>
                          {!opt.comingSoon && <span className="text-xs text-muted-foreground font-mono">{opt.description}</span>}
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                </Field>
              )}
            />
            )}

            <Controller
              name="region"
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>Region</FieldLabel>
                  <Combobox
                    items={REGIONS}
                    value={field.value ?? ""}
                    onValueChange={(val) => {
                      field.onChange(val)
                      setValue("country", "")
                      setValue("city", "")
                    }}
                  >
                    <ComboboxInput placeholder="Select region" showClear />
                    <ComboboxContent>
                      <ComboboxEmpty>No region found.</ComboboxEmpty>
                      <ComboboxList>
                        {(r: string) => (
                          <ComboboxItem key={r} value={r} className="font-mono text-sm">
                            {r}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </Field>
              )}
            />

            {watchedRegion && availableCountries.length > 0 && (
              <Controller
                name="country"
                control={control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Country</FieldLabel>
                    <Combobox
                      items={availableCountries.map((c) => c.name)}
                      value={field.value ?? ""}
                      onValueChange={(val) => {
                        field.onChange(val)
                        setValue("city", "")
                      }}
                    >
                      <ComboboxInput placeholder="Select country" showClear />
                      <ComboboxContent>
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
  
                  </Field>
                )}
              />
            )}

            {watchedCountry && availableCities.length > 0 && (
              <Controller
                name="city"
                control={control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>City</FieldLabel>
                    <Combobox
                      items={availableCities.map((c) => c.name)}
                      value={field.value ?? ""}
                      onValueChange={(val) => field.onChange(val)}
                    >
                      <ComboboxInput placeholder="Select city" showClear />
                      <ComboboxContent>
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
  
                  </Field>
                )}
              />
            )}

            <Controller
              name="neighborhood"
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor={field.name} optional>Neighborhood</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder=""
                  />
                </Field>
              )}
            />

            {/* Airbnb / Booking link (optional) */}
            <Controller
              name="booking_url"
              control={control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel optional>Listing URL</FieldLabel>
                  <Input {...field} placeholder="" type="url" />

                </Field>
              )}
            />

            {/* Hotel name lookup (optional) */}
            <Field>
              <FieldLabel optional>Hotel name</FieldLabel>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                  placeholder=""
                />
                <button
                  type="button"
                  onClick={() => void lookupFromHotel()}
                  disabled={!hotelName || !watchedCity || !watchedCountry || lookingUpLocation}
                  className="shrink-0 flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border hover:opacity-80 disabled:opacity-30 transition-opacity whitespace-nowrap font-mono"
                >
                  <MapPin className="size-3.5" />
                  {lookingUpLocation ? "Looking up…" : "Auto-fill from hotel"}
                </button>
              </div>
            </Field>

            <Controller
              name="address"
              control={control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Exact Address</FieldLabel>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      {...field}
                      id={field.name}
                      placeholder=""
                    />
                    <button
                      type="button"
                      onClick={() => void geocodeFromAddress()}
                      disabled={!watchedAddress || lookingUpLocation}
                      title="Set map pin from this address"
                      className="shrink-0 flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border hover:opacity-80 disabled:opacity-30 transition-opacity whitespace-nowrap font-mono"
                    >
                      <MapPin className="size-3.5" />
                      Set pin
                    </button>
                  </div>

                </Field>
              )}
            />
          </SectionCard>
        )}

        {/* ── STEP 2: AMENITIES ── */}
        {showStep("Amenities") && (
          <SectionCard>
            <div>
              <h2 className="font-display font-bold text-foreground text-xl">Dates & amenities</h2>
              <p className="text-muted-foreground text-sm mt-1">
                When and what does the house include?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller
                name="start_date"
                control={control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Start date</FieldLabel>
                    <DatePicker
                      value={field.value}
                      onChange={(v) => field.onChange(v ?? "")}
                      placeholder="Pick start date"
                      disableBefore={new Date()}
                      className="w-full"
                    />
  
                  </Field>
                )}
              />

              <Controller
                name="end_date"
                control={control}
                render={({ field, fieldState }) => {
                  const minEndDate = watchedStartDate
                    ? new Date(new Date(watchedStartDate).getTime() + 86400000) // start + 1 day
                    : new Date()
                  return (
                    <Field>
                      <FieldLabel>End date</FieldLabel>
                      <DatePicker
                        value={field.value}
                        onChange={(v) => field.onChange(v ?? "")}
                        placeholder="Pick end date"
                        disableBefore={minEndDate}
                        className="w-full"
                      />
    
                    </Field>
                  )
                }}
              />
            </div>

            <Controller
              name="capacity"
              control={control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Capacity</FieldLabel>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => field.onChange(Math.max(2, (field.value ?? 4) - 1))}
                      disabled={contractDeployed || (field.value ?? 4) <= 2}
                      className="w-10 h-10 rounded-md border border-border font-mono text-lg transition-all cursor-pointer hover:border-primary/40 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground"
                    >
                      −
                    </button>
                    <span className="w-10 text-center font-mono text-xl font-semibold tabular-nums">
                      {field.value ?? 4}
                    </span>
                    <button
                      type="button"
                      onClick={() => field.onChange(Math.min(50, (field.value ?? 4) + 1))}
                      disabled={contractDeployed || (field.value ?? 4) >= 50}
                      className="w-10 h-10 rounded-md border border-border font-mono text-lg transition-all cursor-pointer hover:border-primary/40 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground"
                    >
                      +
                    </button>
                    <span className="text-xs text-muted-foreground font-mono">people (min 2, max 50)</span>
                  </div>

                </Field>
              )}
            />

            <Field>
              <FieldLabel>What&apos;s included</FieldLabel>
              <div className="flex flex-col gap-2">
                {AMENITY_OPTIONS.map(({ key, label, description }) => (
                  <Controller
                    key={key}
                    name={key as "includes_private_room" | "includes_shared_room" | "includes_meals" | "includes_workspace" | "includes_internet"}
                    control={control}
                    render={({ field }) => (
                      <label
                        className={cn(
                          "w-full flex items-start gap-4 p-3 rounded-lg border transition-all cursor-pointer",
                          field.value
                            ? "border-primary bg-primary/5"
                            : "border-muted-foreground/25 hover:border-primary/40",
                        )}
                      >
                        <Checkbox
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                          className="mt-0.5"
                        />
                        <div className="flex flex-col gap-0.5">
                          <p className="text-foreground text-sm font-medium">{label}</p>
                          <p className="text-muted-foreground text-xs">{description}</p>
                        </div>
                      </label>
                    )}
                  />
                ))}
              </div>
            </Field>

            {/* Image upload */}
            <Field>
              <FieldLabel optional>Photos</FieldLabel>
              <FieldDescription>Max 5 photos. First one is the cover.</FieldDescription>
              <div className="flex flex-wrap gap-2">
                {/* Existing images (edit mode) */}
                {editMode && existingImages.map((url, index) => (
                  <div key={url} className="relative size-20 rounded-lg overflow-hidden border border-border group">
                    <img src={url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setExistingImages((prev) => prev.filter((_, i) => i !== index))}
                      className="absolute top-1 right-1 size-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="size-3 text-white" />
                    </button>
                  </div>
                ))}
                {/* New pending files */}
                {pendingFiles.map((p, index) => (
                  <div key={p.preview} className="relative size-20 rounded-lg overflow-hidden border border-border group">
                    <img src={p.preview} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 size-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="size-3 text-white" />
                    </button>
                  </div>
                ))}
                {(editMode ? existingImages.length : 0) + pendingFiles.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="size-20 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/40 flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer text-muted-foreground"
                  >
                    <span className="text-xl">+</span>
                    <span className="text-[10px] font-mono">Photo</span>
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                multiple
                className="hidden"
                onChange={handleFileAdd}
              />
            </Field>
          </SectionCard>
        )}

        {/* ── STEP 3: COMMUNITY ── */}
        {showStep("Community") && (
          <SectionCard>
            <div>
              <h2 className="font-display font-bold text-foreground text-xl">Community</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Who is this house for?
              </p>
            </div>

            <Controller
              name="profile_sought"
              control={control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Profiles sought</FieldLabel>
                  <div className="flex gap-2 flex-wrap">
                    {ARCHETYPES.map((a) => {
                      const value = field.value ?? []
                      const selected = value.includes(a.id)
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() =>
                            field.onChange(
                              selected
                                ? value.filter((v) => v !== a.id)
                                : [...value, a.id],
                            )
                          }
                          className={cn(
                            "text-xs px-3 py-1.5 rounded-md border font-mono transition-all cursor-pointer",
                            !selected &&
                              "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                          )}
                          style={
                            selected
                              ? {
                                  borderColor: `var(${a.colorVar})`,
                                  color: `var(${a.colorVar})`,
                                  backgroundColor: `color-mix(in oklch, var(${a.colorVar}) 15%, transparent)`,
                                }
                              : undefined
                          }
                        >
                          {a.label}
                        </button>
                      )
                    })}
                  </div>

                </Field>
              )}
            />

            <Controller
              name="language"
              control={control}
              render={({ field, fieldState }) => {
                const value = field.value ?? []
                return (
                  <Field>
                    <FieldLabel>Working language</FieldLabel>
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGES.map((lang) => {
                        const selected = value.includes(lang)
                        return (
                          <TogglePill
                            key={lang}
                            selected={selected}
                            onClick={() =>
                              field.onChange(
                                selected
                                  ? value.filter((l) => l !== lang)
                                  : [...value, lang],
                              )
                            }
                          >
                            {lang}
                          </TogglePill>
                        )
                      })}
                    </div>
  
                  </Field>
                )
              }}
            />

            <Controller
              name="house_rules"
              control={control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor={field.name} optional>House rules</FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}

                    placeholder="Quiet hours, guest policy, expectations..."
                    maxLength={500}
                    rows={3}
                    className="resize-none"
                  />
                  <FieldDescription>{(field.value ?? "").length}/500</FieldDescription>

                </Field>
              )}
            />

            <Controller
              name="has_event"
              control={control}
              render={({ field }) => (
                <label
                  className={cn(
                    "w-full flex items-start gap-4 p-4 rounded-lg border transition-all cursor-pointer",
                    field.value
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-primary/40",
                  )}
                >
                  <Checkbox
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                    className="mt-0.5"
                  />
                  <div className="flex flex-col gap-0.5">
                    <p className="text-foreground text-sm font-medium">Linked to an event</p>
                    <p className="text-muted-foreground text-xs">
                      Appears highlighted on the map and in event-related feeds.
                    </p>
                  </div>
                </label>
              )}
            />

            {hasEvent && (
              <div className="flex flex-col gap-4 pl-3 border-l-2 border-primary/30">
                {/* Event picker from existing HHP events */}
                {availableEvents.length > 0 && (
                  <Field>
                    <FieldLabel>Pick from HHP Events</FieldLabel>
                    <FieldDescription>Select an event to auto-fill the fields below.</FieldDescription>
                    <select
                      className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                      style={{ background: "var(--card)" }}
                      defaultValue=""
                      onChange={(e) => {
                        const event = availableEvents.find((ev) => ev.id === e.target.value)
                        if (!event) return
                        setValue("event_name", event.name)
                        setValue("event_url", event.website_url ?? "")
                        setValue("event_start_date", event.start_date)
                        setValue("event_end_date", event.end_date)
                      }}
                    >
                      <option value="">— Select an event —</option>
                      {availableEvents.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.name} · {ev.city}, {ev.country}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}

                <Controller
                  name="event_name"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Event name</FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        placeholder="e.g. ETH Global Cannes 2026"
                      />
                    </Field>
                  )}
                />

                <Controller
                  name="event_url"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor={field.name} optional>Event link</FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        placeholder="https://lu.ma/..."
                      />
    
                    </Field>
                  )}
                />

                <Controller
                  name="event_start_date"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Event start date</FieldLabel>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Pick start date"
                        className="w-full"
                      />
                    </Field>
                  )}
                />

                <Controller
                  name="event_end_date"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel optional>Event end date</FieldLabel>
                      <DatePicker
                        value={field.value}
                        onChange={(v) => field.onChange(v ?? "")}
                        placeholder="Pick end date"
                        className="w-full"
                      />
                    </Field>
                  )}
                />

                <Controller
                  name="event_timing"
                  control={control}
                  render={({ field }) => {
                    const value = field.value ?? []
                    return (
                      <Field>
                        <FieldLabel>This house is</FieldLabel>
                        <div className="flex gap-2">
                          {EVENT_TIMINGS.map((t) => {
                            const selected = value.includes(t)
                            return (
                              <TogglePill
                                key={t}
                                selected={selected}
                                onClick={() =>
                                  field.onChange(
                                    selected
                                      ? value.filter((v) => v !== t)
                                      : [...value, t],
                                  )
                                }
                              >
                                {EVENT_TIMING_LABELS[t]} the event
                              </TogglePill>
                            )
                          })}
                        </div>
                      </Field>
                    )
                  }}
                />
              </div>
            )}
          </SectionCard>
        )}

        {/* ── STEP 4: ACCESS ── */}
        {showStep("Access") && (
          <SectionCard>
            <div>
              <h2 className="font-display font-bold text-foreground text-xl">
                Access & applications
              </h2>
              <p className="text-muted-foreground text-sm mt-1">Who can apply and how?</p>
            </div>

            {watchedModality === "free" ? (
              <>
                <Field>
                  <FieldLabel>Application type</FieldLabel>
                  <div className="flex items-center gap-3 p-4 rounded-lg border border-primary/30 bg-primary/5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground">Invite only</span>
                      <span className="text-xs text-muted-foreground font-mono">Sponsored houses are invite only — you invite builders directly</span>
                    </div>
                  </div>
                </Field>
                <Controller
                  name="application_form_url"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel optional>External application form</FieldLabel>
                      <FieldDescription>Link applicants to your own form (e.g. Typeform, Google Forms). If set, applicants will be directed to this URL instead of applying in-app.</FieldDescription>
                      <Input
                        {...field}
                        placeholder="https://forms.example.com/apply"
                        type="url"
                      />
    
                    </Field>
                  )}
                />
              </>
            ) : (
              <Controller
                name="application_type"
                control={control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Application type</FieldLabel>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="gap-2"
                    >
                      {APPLICATION_TYPES.map((t) => {
                        const cfg = APPLICATION_TYPE_LABELS[t]
                        const disabled = cfg.comingSoon === true
                        return (
                          <label
                            key={t}
                            className={cn(
                              "w-full flex items-center gap-4 p-4 rounded-lg border transition-all",
                              disabled
                                ? "border-muted-foreground/15 opacity-50 cursor-not-allowed"
                                : "cursor-pointer",
                              !disabled && field.value === t
                                ? "border-primary bg-primary/5"
                                : !disabled && "border-muted-foreground/25 hover:border-primary/40",
                            )}
                          >
                            <RadioGroupItem value={t} disabled={disabled} />
                            <div className="flex flex-col gap-0.5">
                              <span className={cn("text-sm font-medium", !disabled && field.value === t ? cfg.color : "text-foreground")}>
                                {cfg.title}
                                {disabled && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-strategist/20 text-strategist font-mono">Coming soon</span>}
                              </span>
                              <span className="text-xs text-muted-foreground font-mono">
                                {cfg.description}
                              </span>
                            </div>
                          </label>
                        )
                      })}
                    </RadioGroup>
                  </Field>
                )}
              />
            )}

            <Controller
              name="application_deadline"
              control={control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel optional>Application deadline</FieldLabel>
                  <DatePicker
                    value={field.value}
                    onChange={(v) => field.onChange(v ?? "")}
                    placeholder="Pick a deadline"
                    disableBefore={new Date()}
                    className="w-full"
                  />

                </Field>
              )}
            />
          </SectionCard>
        )}

        {/* ── STEP 5: PAYMENT ── */}
        {showStep("Payment") && (
          <SectionCard>
            <div>
              <h2 className="font-display font-bold text-foreground text-xl">Payment & escrow</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Configure the on-chain escrow for this house.
              </p>
            </div>

            {contractDeployed && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-500/30 bg-amber-500/5">
                <Lock className="size-3.5 text-amber-400 shrink-0" />
                <p className="text-xs text-amber-300 font-mono">
                  Contract deployed — on-chain parameters are locked.
                </p>
              </div>
            )}

            {/* Deposit amount synced from price_per_person (step 1) */}
            <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground font-mono">
              <span>Deposit per builder:</span>
              <span className="text-builder-archetype font-bold">
                {watchedPricePerPerson ? `${watchedPricePerPerson} USDC` : "Set price in step 1"}
              </span>
            </div>

            <Controller
              name="withdraw_date"
              control={control}
              render={({ field, fieldState }) => {
                const tomorrow = new Date()
                tomorrow.setDate(tomorrow.getDate() + 1)
                tomorrow.setHours(0, 0, 0, 0)
                return (
                  <Field>
                    <FieldLabel>Withdraw date</FieldLabel>
                    <FieldDescription>Earliest date the host can <span className="text-builder-archetype">release funds</span>.</FieldDescription>
                    <DatePicker
                      value={field.value}
                      onChange={(v) => { if (!contractDeployed) field.onChange(v ?? "") }}
                      placeholder="Pick a date"
                      disableBefore={tomorrow}
                      className="w-full"
                      disabled={contractDeployed}
                    />
  
                  </Field>
                )
              }}
            />

            {/* Escrow type auto-derived from House type (step 1) */}
            <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground font-mono">
              <span>Escrow mode:</span>
              <span className="text-primary font-bold">
                {watchedHouseType === "staking" ? "Staking" : watchedHouseType === "hybrid" ? "Hybrid" : "Co-payment"}
              </span>
            </div>

            {(watchedHouseType === "staking" || watchedHouseType === "hybrid") && (
              <>
                <Field>
                  <FieldLabel>Yield protocol</FieldLabel>
                  <FieldDescription>
                    Staking deposits generate yield via GMX while locked.
                  </FieldDescription>
                  <span className="text-xs px-3 py-1.5 rounded-md border font-mono border-[#6EE76E]/40 text-[#6EE76E] bg-[#6EE76E]/10">
                    GMX
                  </span>
                </Field>

                {watchedYieldMode === "gmx" && (
                  <Controller
                    name="yield_dest"
                    control={control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Yield destination</FieldLabel>
                        <RadioGroup
                          value={field.value ?? "host"}
                          onValueChange={(v) => { if (!contractDeployed) field.onChange(v) }}
                          className="gap-2"
                          disabled={contractDeployed}
                        >
                          {YIELD_DEST_OPTIONS.map((opt) => (
                            <label
                              key={opt.value}
                              className={cn(
                                "w-full flex items-center gap-4 p-4 rounded-lg border transition-all",
                                contractDeployed ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                                field.value === opt.value
                                  ? "border-primary bg-primary/5"
                                  : "border-muted-foreground/25 hover:border-primary/40",
                              )}
                            >
                              <RadioGroupItem value={opt.value} disabled={contractDeployed} />
                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-medium text-foreground">{opt.title}</span>
                                <span className="text-xs text-muted-foreground font-mono">{opt.description}</span>
                              </div>
                            </label>
                          ))}
                        </RadioGroup>
                        {/* Detail text for selected option */}
                        {YIELD_DEST_OPTIONS.find((o) => o.value === (field.value ?? "host"))?.detail && (
                          <p className="text-[11px] text-muted-foreground font-mono mt-1 px-1">
                            {YIELD_DEST_OPTIONS.find((o) => o.value === (field.value ?? "host"))!.detail}
                          </p>
                        )}
                      </Field>
                    )}
                  />
                )}
              </>
            )}

            {/* Payout info — funds go to kernel wallet */}
            <div className="flex flex-col gap-2 px-1">
              <div className="flex items-center gap-2">
                <Wallet className="size-3.5 text-primary shrink-0" />
                <p className="text-sm text-muted-foreground font-mono">
                  Funds released to your <span className="text-foreground">kernel wallet</span> on Arbitrum
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono pl-6">
                You can withdraw from any compatible platform or dApp.
              </p>
              <div className="flex items-center gap-2 pl-0">
                <Lock className="size-3 text-primary shrink-0" />
                <p className="text-[11px] text-muted-foreground font-mono">
                  <span className="text-primary">Private Bridge</span> for anonymous withdrawals — <span className="text-[#6EE76E]">coming soon</span>
                </p>
              </div>
            </div>
          </SectionCard>
        )}

        {/* ── STEP 6: CHECK-IN ── */}
        {showStep("Check-in") && (
          <SectionCard>
            <div>
              <h2 className="font-display font-bold text-foreground text-xl">Self check-in</h2>
              <p className="text-[11px] text-muted-foreground font-mono mt-1">Only visible to accepted participants. All optional.</p>
            </div>

            <Controller
              name="checkin_wifi_password"
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor={field.name} optional>WiFi</FieldLabel>
                  <Input {...field} id={field.name} placeholder="" />
                </Field>
              )}
            />

            <Controller
              name="checkin_room_info"
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor={field.name} optional>Room / Apartment</FieldLabel>
                  <Input {...field} id={field.name} placeholder="" />
                </Field>
              )}
            />

            <Controller
              name="checkin_lockbox"
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor={field.name} optional>Door Code</FieldLabel>
                  <Input {...field} id={field.name} placeholder="" />
                </Field>
              )}
            />

            <Controller
              name="checkin_notes"
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor={field.name} optional>Notes</FieldLabel>
                  <Textarea {...field} id={field.name} placeholder="" rows={3} className="resize-none" />
                </Field>
              )}
            />
          </SectionCard>
        )}

        {/* Server error */}
        {serverError && (
          <p className="text-sm font-mono text-destructive border border-destructive/30 rounded-lg px-4 py-2.5 bg-destructive/5">
            {serverError}
          </p>
        )}

        {/* Navigation */}
        {editMode ? (
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="pill"
              disabled={isSubmitting}
              className="px-6"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2" /> {submittingLabel}
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </div>
        ) : (
          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                if (stepIndex === 0) { router.back(); return }
                const prev = STEPS[stepIndex - 1]
                // Skip Payment step going back if modality is free
                if (prev === "Payment" && !needsPaymentStep) {
                  setStep(STEPS[stepIndex - 2])
                } else {
                  setStep(prev)
                }
              }}
              className="font-mono text-sm"
            >
              ← {stepIndex === 0 ? "Cancel" : "Back"}
            </Button>

            {step === "Check-in" ? (
              <Button
                key="submit"
                type="submit"
                variant="pill"
                disabled={isSubmitting}
                className="px-6"
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2" /> {submittingLabel}
                  </>
                ) : (
                  submitLabel
                )}
              </Button>
            ) : (
              <Button
                key="continue"
                type="button"
                onClick={goNext}
                variant="pill"
                className="px-6"
              >
                Continue →
              </Button>
            )}
          </div>
        )}
      </form>
    </div>
  )
}
