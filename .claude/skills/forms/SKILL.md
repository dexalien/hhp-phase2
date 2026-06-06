---
name: forms
description: Form implementation rules for Hacker House Protocol. Use before writing any form — covers react-hook-form + Zod patterns, field wrappers, validation, multi-step wizards, toggle pills, and common bugs.
---

# Forms — Hacker House Protocol

All forms use **react-hook-form 7** + **@hookform/resolvers 3** + **Zod v3**.

> Version lock: Do NOT upgrade resolvers to v5 or Zod to v4 — intentionally locked, incompatible.

---

## Architecture — pure presentation forms

Forms are **pure presentation components**. They receive data and callbacks — they never own mutations or API calls.

```tsx
// ✅ Form component — presentation only
interface MyFormProps {
  defaultValues?: Partial<MyInput>
  onFormSubmit: (values: MyInput) => Promise<void>
  submitLabel: string
  submittingLabel: string
}

export function MyForm({ defaultValues, onFormSubmit, submitLabel, submittingLabel }: MyFormProps) {
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<MyInput>({
    resolver: zodResolver(mySchema),
    defaultValues: { field: "", ...defaultValues },
  })

  async function onSubmit(values: MyInput) {
    try {
      await onFormSubmit(values)
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong"
      toast.error(message)
    }
  }

  return <form onSubmit={handleSubmit(onSubmit)}>...</form>
}
```

```tsx
// ✅ Page component — owns the mutation
export default function CreateThingPage() {
  const router = useRouter()
  const createThing = useCreateThing()

  async function handleSubmit(values: MyInput) {
    const result = await createThing.mutateAsync(values)
    toast.success("Thing created")
    router.push(`/dashboard/things/${result.id}`)
  }

  return <MyForm onFormSubmit={handleSubmit} submitLabel="Create →" submittingLabel="Creating..." />
}
```

This pattern lets one form component serve both create and edit pages — each page passes its own mutation via `onFormSubmit`.

---

## Schema rules

Schemas always go in `lib/schemas/<domain>.ts`. Never inline `z.object()` in a component or page. Export both schema and inferred type:

```ts
export const mySchema = z.object({ ... })
export type MyInput = z.infer<typeof mySchema>
```

For update schemas, use `.partial()` on the create schema:

```ts
export const updateMySchema = mySchema.partial().extend({
  status: z.enum(["open", "closed"]).optional(),
})
export type UpdateMyInput = z.infer<typeof updateMySchema>
```

**Never use `.default()` on Zod fields used with `useForm`** — it splits Zod's input/output types and breaks the `Resolver` type:

```ts
// ❌ breaks resolver typing
skills: z.array(z.string()).default([])

// ✅ correct — put defaults in useForm defaultValues
skills: z.array(z.string()).optional()
```

---

## useForm setup

Always pass the type generic explicitly:

```ts
import { mySchema, type MyInput } from "@/lib/schemas/my-domain"

const { control, handleSubmit, formState } = useForm<MyInput>({
  resolver: zodResolver(mySchema),
  defaultValues: { skills: [], bio: "", ...defaultValues },
})
```

---

## Field pattern — always use Controller + Field wrapper

**Label convention:** never use `*` for required fields. Only mark optional fields using the `optional` prop on `FieldLabel`:

```tsx
<FieldLabel>City</FieldLabel>              // required — no marker
<FieldLabel optional>Neighborhood</FieldLabel>  // optional — shows "(optional)"
```

```tsx
<Controller
  name="fieldName"
  control={control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor={field.name}>Label</FieldLabel>
      <Input
        {...field}
        id={field.name}
        aria-invalid={fieldState.invalid}
        placeholder="..."
      />
      <FieldDescription>Helper text.</FieldDescription>
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

`aria-invalid={fieldState.invalid}` is required on every `Input` and `Textarea` — triggers error styles.

---

## Textarea with character count

```tsx
<Controller
  name="description"
  control={control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor={field.name}>Description *</FieldLabel>
      <Textarea
        {...field}
        id={field.name}
        aria-invalid={fieldState.invalid}
        placeholder="..."
        maxLength={500}
        rows={4}
        className="resize-none"
      />
      <FieldDescription>{(field.value ?? "").length}/500</FieldDescription>
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

---

## Watching field values — useWatch, never watch()

```tsx
// ❌ wrong — causes stale UI (React Compiler warning)
const { watch } = useForm<MyInput>()
const value = watch("fieldName")

// ✅ correct
import { useWatch } from "react-hook-form"
const value = useWatch({ control, name: "fieldName" })
```

---

## Optional array fields — always nullish coalesce

When a field is `.optional()`, `field.value` is `T[] | undefined`. Never call array methods directly:

```ts
// ❌ crashes at runtime
const selected = field.value.includes(item)

// ✅ correct
const value = field.value ?? []
const selected = value.includes(item)
```

---

## Toggle pill — single select

For enum-like single-select fields, use `TogglePill` buttons. Define the pill component once per form file (colocated, not shared):

```tsx
function TogglePill({
  selected, onClick, children, className,
}: {
  selected: boolean; onClick: () => void; children: React.ReactNode; className?: string
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
        className,
      )}
    >
      {children}
    </button>
  )
}
```

Usage for single select:

```tsx
<Controller
  name="stage"
  control={control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel>Stage *</FieldLabel>
      <div className="flex gap-2 flex-wrap">
        {STAGES.map((s) => (
          <TogglePill key={s} selected={field.value === s} onClick={() => field.onChange(s)}>
            {STAGE_LABELS[s]}
          </TogglePill>
        ))}
      </div>
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

**Display label constants** (`STAGE_LABELS`, `TRACK_EMOJIS`, `APPLICATION_TYPE_LABELS`, etc.) are defined **locally inside each form file** — they are not shared utilities and should NOT be imported from `lib/` or elsewhere. Define them at the top of the form file:

```ts
const STAGE_LABELS: Record<Stage, string> = {
  idea: "Idea",
  building: "Building",
  launched: "Launched",
}

const TRACK_EMOJIS: Record<Track, string> = {
  defi: "💸",
  nft: "🎨",
  dao: "🏛️",
}
```

---

## Toggle pill — multi select (array fields)

For multi-select arrays, use the same `TogglePill` with array toggle logic:

```tsx
<Controller
  name="skills_needed"
  control={control}
  render={({ field }) => {
    const value = field.value ?? []
    return (
      <Field>
        <FieldLabel>Skills needed</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {ALL_SKILLS.map((skill) => {
            const selected = value.includes(skill)
            return (
              <TogglePill
                key={skill}
                selected={selected}
                onClick={() =>
                  field.onChange(selected ? value.filter((s) => s !== skill) : [...value, skill])
                }
              >
                {selected ? "✓ " : ""}{skill}
              </TogglePill>
            )
          })}
        </div>
      </Field>
    )
  }}
/>
```

Alternative: use `<Button>` with `variant` for toggles when you need archetype-colored or themed pills:

```tsx
<Button
  type="button"
  size="sm"
  variant={isSelected ? archetypeVariants.filled : archetypeVariants.outline}
  onClick={() => toggleItem(item)}
  className="rounded-md font-mono"
>
  {isSelected ? "✓ " : ""}{item}
</Button>
```

---

## Number stepper (− N +)

For numeric fields with a continuous range, use a stepper with − and + buttons. Never hardcode a discrete array of values — it's not scalable and limits the user unnecessarily.

```tsx
<Controller
  name="capacity"
  control={control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel>Capacity *</FieldLabel>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => field.onChange(Math.max(MIN, (field.value ?? DEFAULT) - 1))}
          disabled={(field.value ?? DEFAULT) <= MIN}
          className="w-10 h-10 rounded-md border border-border font-mono text-lg transition-all cursor-pointer hover:border-primary/40 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground"
        >
          −
        </button>
        <span className="w-10 text-center font-mono text-xl font-semibold tabular-nums">
          {field.value ?? DEFAULT}
        </span>
        <button
          type="button"
          onClick={() => field.onChange(Math.min(MAX, (field.value ?? DEFAULT) + 1))}
          disabled={(field.value ?? DEFAULT) >= MAX}
          className="w-10 h-10 rounded-md border border-border font-mono text-lg transition-all cursor-pointer hover:border-primary/40 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground"
        >
          +
        </button>
        <span className="text-xs text-muted-foreground font-mono">(min {MIN}, max {MAX})</span>
      </div>
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

Set the default value in `useForm` `defaultValues`, not in the stepper logic.

---

## RadioGroup card pattern

For exclusive selection with descriptions (e.g. application type):

```tsx
<Controller
  name="application_type"
  control={control}
  render={({ field }) => (
    <Field>
      <FieldLabel>Application type *</FieldLabel>
      <RadioGroup value={field.value} onValueChange={field.onChange} className="gap-2">
        {APPLICATION_TYPES.map((t) => (
          <label
            key={t}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-lg border transition-all cursor-pointer",
              field.value === t
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40",
            )}
          >
            <RadioGroupItem value={t} />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">{LABELS[t].title}</span>
              <span className="text-xs text-muted-foreground font-mono">{LABELS[t].description}</span>
            </div>
          </label>
        ))}
      </RadioGroup>
    </Field>
  )}
/>
```

---

## Checkbox toggle card

For boolean fields that toggle a section of conditional fields:

```tsx
<Controller
  name="has_event"
  control={control}
  render={({ field }) => (
    <label
      className={cn(
        "w-full flex items-start gap-4 p-4 rounded-lg border transition-all cursor-pointer",
        field.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
      )}
    >
      <Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} className="mt-0.5" />
      <div className="flex flex-col gap-0.5">
        <p className="text-foreground text-sm font-medium">Title</p>
        <p className="text-muted-foreground text-xs">Description</p>
      </div>
    </label>
  )}
/>
```

---

## Conditional fields

Use `useWatch` for the condition, then render conditionally. Indent with a left border:

```tsx
const hasEvent = useWatch({ control, name: "has_event" })

// In JSX:
{hasEvent && (
  <div className="flex flex-col gap-4 pl-3 border-l-2 border-primary/30">
    {/* conditional fields */}
  </div>
)}
```

---

## Combobox field (searchable dropdown)

For fields with many options, use `Combobox` from `@/components/ui/combobox`:

```tsx
<Controller
  name="region"
  control={control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel>Region</FieldLabel>
      <Combobox
        items={REGIONS}
        value={field.value ?? ""}
        onValueChange={field.onChange}
      >
        <ComboboxInput placeholder="Search region..." showClear />
        <ComboboxContent>
          <ComboboxEmpty>No region found.</ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item} className="font-mono text-sm">
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

---

## Cascading field resets

When one field's value invalidates downstream fields, use `setValue` to reset them:

```tsx
onValueChange={(val) => {
  field.onChange(val)
  setValue("country", "")
  setValue("city", "")
  setValue("timezone", "")
}}
```

---

## Date fields

Always use `DatePicker` from `@/components/ui/date-picker` — never `<Input type="date">`:

```tsx
<Controller
  name="deadline"
  control={control}
  render={({ field }) => (
    <Field>
      <FieldLabel>Deadline</FieldLabel>
      <DatePicker
        value={field.value ?? ""}
        onChange={field.onChange}
        placeholder="Pick a date"
        disableBefore={new Date()}
      />
    </Field>
  )}
/>
```

DatePicker props: `value`, `onChange`, `placeholder`, `className`, `disabled`, `disableBefore`, `startMonth`, `endMonth`.

---

## SectionCard — grouping fields

Wrap logically related fields in a card. **`SectionCard` is defined locally inside each form file — it is NOT a shared component and should NOT be imported from elsewhere:**

```tsx
function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full bg-card border border-border rounded-xl p-6 flex flex-col gap-5">
      {children}
    </div>
  )
}
```

Inside each card, add a header:

```tsx
<SectionCard>
  <div>
    <h2 className="font-display font-bold text-foreground text-xl">Section title</h2>
    <p className="text-muted-foreground text-sm mt-1">Section subtitle</p>
  </div>
  {/* fields */}
</SectionCard>
```

---

## Multi-step wizard

For complex forms, split into steps with per-step validation.

### Step definition

```tsx
const STEPS = ["Project", "Team", "Event", "Access"] as const
type Step = (typeof STEPS)[number]

const [step, setStep] = useState<Step>("Project")
const stepIndex = STEPS.indexOf(step)
```

### Fields-to-step mapping (for server error routing)

```tsx
const FIELD_TO_STEP: Partial<Record<keyof MyInput, Step>> = {
  title: "Project",
  description: "Project",
  looking_for: "Team",
  // ...
}
```

### Per-step validation fields

```tsx
const STEP_FIELDS: Record<Step, (keyof MyInput)[]> = {
  Project: ["title", "description", "track", "stage"],
  Team: ["looking_for", "max_team_size", "experience_level", "language"],
  Event: [],
  Access: ["application_type"],
}

async function goNext() {
  setServerError(null)
  const valid = await trigger(STEP_FIELDS[step])
  if (valid) setStep(STEPS[stepIndex + 1])
}
```

### Step indicator UI

```tsx
<div className="flex items-center w-full">
  {STEPS.map((s, i) => (
    <Fragment key={s}>
      <div className="flex items-center gap-2 shrink-0">
        <div className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold border transition-all",
          i < stepIndex ? "bg-primary border-primary text-primary-foreground"
            : i === stepIndex ? "border-primary text-primary"
            : "border-border text-muted-foreground",
        )}>
          {i < stepIndex ? "✓" : i + 1}
        </div>
        <span className={cn(
          "text-xs font-mono hidden sm:block",
          i === stepIndex ? "text-foreground font-medium" : "text-muted-foreground",
        )}>
          {s}
        </span>
      </div>
      {i < STEPS.length - 1 && (
        <div className={cn("h-px flex-1 mx-2", i < stepIndex ? "bg-primary" : "bg-border")} />
      )}
    </Fragment>
  ))}
</div>
```

### Server error routing to correct step

When a server error mentions a field name, jump to that step:

```tsx
async function onSubmit(values: MyInput) {
  setServerError(null)
  try {
    await onFormSubmit(values)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Something went wrong"
    toast.error(message)

    const matchedField = (Object.keys(FIELD_TO_STEP) as (keyof MyInput)[])
      .find((field) => message.toLowerCase().includes(field.toLowerCase()))

    if (matchedField && FIELD_TO_STEP[matchedField]) {
      setError(matchedField, { type: "server", message })
      setStep(FIELD_TO_STEP[matchedField]!)
    } else {
      setServerError(message)
    }
  }
}
```

### Navigation footer

```tsx
<div className="flex justify-between pt-2">
  <Button
    type="button"
    variant="ghost"
    onClick={() => stepIndex > 0 ? setStep(STEPS[stepIndex - 1]) : router.back()}
    className="font-mono text-sm"
  >
    ← {stepIndex === 0 ? "Cancel" : "Back"}
  </Button>

  {step === STEPS[STEPS.length - 1] ? (
    <Button type="submit" disabled={isSubmitting} variant="pill"
      className="px-6">
      {isSubmitting ? submittingLabel : submitLabel}
    </Button>
  ) : (
    <Button type="button" onClick={goNext} variant="pill"
      className="px-6">
      Continue →
    </Button>
  )}
</div>
```

---

## Submit button

Always use `isSubmitting` from formState with `Spinner`:

```tsx
import { Spinner } from "@/components/ui/spinner"

<Button type="submit" disabled={isSubmitting}>
  {isSubmitting ? <><Spinner className="mr-2" /> {submittingLabel}</> : submitLabel}
</Button>
```

---

## Button types inside forms

Every `<button>` or `<Button>` inside a `<form>` that is NOT the submit button must have `type="button"`:

```tsx
<Button type="button" onClick={onCancel}>Cancel</Button>
<Button type="submit">Save</Button>
```

---

## Server errors

Server-side errors go into local `useState`, not react-hook-form. Always use the styled box:

```tsx
const [serverError, setServerError] = useState<string | null>(null)

// In onSubmit catch:
setServerError(err instanceof Error ? err.message : "Something went wrong")

// In JSX:
{serverError && (
  <p className="text-sm font-mono text-destructive border border-destructive/30 rounded-lg px-4 py-2.5 bg-destructive/5">
    {serverError}
  </p>
)}
```

Also show a `toast.error(message)` for immediate feedback.

---

## Archetype-colored elements

When rendering archetype data that uses dynamic CSS vars (from `colorVar`), inline `style={{}}` is acceptable since these colors come from data, not design tokens:

```tsx
style={selected ? {
  borderColor: `var(${a.colorVar})`,
  color: `var(${a.colorVar})`,
  backgroundColor: `color-mix(in oklch, var(${a.colorVar}) 15%, transparent)`,
} : undefined}
```

For static archetype references (known at build time), prefer Tailwind classes or Badge variants:

```tsx
const ARCHETYPE_VARIANT: Record<ArchetypeId, { filled: ButtonVariant; outline: ButtonVariant }> = {
  visionary: { filled: "visionary", outline: "visionary-outline" },
  strategist: { filled: "strategist", outline: "strategist-outline" },
  builder: { filled: "builder", outline: "builder-outline" },
}
```

---

## Image upload with local preview (upload on submit)

**Do NOT upload images when the user selects them.** Instead, store `File` objects locally with `URL.createObjectURL` for instant preview, then upload in parallel on submit. This avoids orphaned files in Storage if the user abandons the form.

### State

```tsx
const [pendingFiles, setPendingFiles] = useState<{ file: File; preview: string }[]>([])
const fileInputRef = useRef<HTMLInputElement>(null)
const uploadImage = useUploadImage() // mutation that POSTs to upload API route
```

### Cleanup object URLs on unmount

```tsx
useEffect(() => {
  return () => {
    pendingFiles.forEach((p) => URL.revokeObjectURL(p.preview))
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [])
```

### handleFileAdd — no async, no fetch

```tsx
function handleFileAdd(e: React.ChangeEvent<HTMLInputElement>) {
  const files = Array.from(e.target.files ?? [])
  if (!files.length) return

  const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]
  const slots = 5 - pendingFiles.length

  if (slots <= 0) { toast.error("Maximum 5 images allowed"); e.target.value = ""; return }

  const toAdd = files.slice(0, slots)
  if (files.length > slots) toast.warning(`Only ${slots} slot(s) remaining — adding first ${slots}`)

  if (toAdd.some((f) => !ALLOWED.includes(f.type))) {
    toast.error("Invalid file type. Use JPEG, PNG, WebP, GIF or AVIF")
    e.target.value = ""
    return
  }
  if (toAdd.some((f) => f.size > 5 * 1024 * 1024)) {
    toast.error("One or more files exceed 5MB")
    e.target.value = ""
    return
  }

  setPendingFiles((prev) => [...prev, ...toAdd.map((f) => ({ file: f, preview: URL.createObjectURL(f) }))])
  e.target.value = ""
}
```

### removeImage — revoke URL

```tsx
function removeImage(index: number) {
  setPendingFiles((prev) => {
    URL.revokeObjectURL(prev[index].preview)
    return prev.filter((_, i) => i !== index)
  })
}
```

### onSubmit — upload then create

```tsx
async function onSubmit(values: MyInput) {
  try {
    let imageUrls: string[] = []
    if (pendingFiles.length > 0) {
      const results = await Promise.all(pendingFiles.map((p) => uploadImage.mutateAsync(p.file)))
      imageUrls = results.map((r) => r.image_url)
    }
    await onFormSubmit({ ...values, images: imageUrls })
  } catch (e) { /* error handling */ }
}
```

### Preview UI

```tsx
<div className="flex flex-wrap gap-2">
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
  {pendingFiles.length < 5 && (
    <button
      type="button"
      onClick={() => fileInputRef.current?.click()}
      className="size-20 rounded-lg border-2 border-dashed border-border hover:border-primary/40 flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer text-muted-foreground"
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
```

> Do NOT use `images` from react-hook-form for previews. It stays empty until submit. The schema field (`images: z.array(z.string().url()).optional()`) is populated by `onSubmit` before calling the parent callback.
