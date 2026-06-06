---
name: ui-components
description: Complete UI component reference for Hacker House Protocol. Use before building any UI — covers all shadcn components, variants, custom components, and design system tokens.
---

# UI Component Reference — Hacker House Protocol

Always dark. Never add a light mode class or `light:` variant. The `.dark` class is fixed on `<html>`.

## Required components — never use raw HTML equivalents

| Need | Component | Import | Rule |
|---|---|---|---|
| Button | `Button` | `@/components/ui/button` | Never raw `<button>` with manual Tailwind. Use `variant` + `size` props. |
| Card / panel / section | `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardFooter` | `@/components/ui/card` | Never `<div className="bg-card border border-border rounded-xl">`. |
| Badge / chip / tag | `Badge` | `@/components/ui/badge` | Never raw `<span>` with manual border styles. |
| Loading spinner | `Spinner` | `@/components/ui/spinner` | Never manual `animate-spin` div. |
| Text input | `Input` | `@/components/ui/input` | Always inside `Field` + `FieldLabel` wrapper. |
| Textarea | `Textarea` | `@/components/ui/textarea` | Same as Input. |
| Select dropdown | `Select`, `SelectTrigger`, `SelectContent`, `SelectItem` | `@/components/ui/select` | Never native `<select>`. |
| Tabs / segmented toggle | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | `@/components/ui/tabs` | Never hand-rolled `<button>` toggles with manual active-state classes. Use `<TabsList variant="pill">` for the full-width purple-pill segmented toggle (active = `bg-primary`). |
| Form field wrapper | `Field`, `FieldLabel`, `FieldError`, `FieldDescription` | `@/components/ui/field` | Wrap every form control. |
| Divider | `Separator` | `@/components/ui/separator` | Never `<div className="h-px bg-border">` or `style={{ background: "var(--border)" }}`. |
| Date field | `DatePicker` | `@/components/ui/date-picker` | Never `<Input type="date">`. Accepts `value: string` (ISO `YYYY-MM-DD`), `onChange`, `placeholder`, `fromDate`. Works with react-hook-form `Controller`. |
| Page content wrapper | `PageContainer` | `@/app/(protected)/dashboard/_components/page-container` | Use in every dashboard page for consistent `max-w-6xl` width. |
| Skeleton | `Skeleton` | `@/components/ui/skeleton` | Always use for loading states — never manual `animate-pulse` divs. |

**Cursor rule:** Tailwind v4 preflight sets `cursor: default` on `<button>`. Any custom clickable element that isn't the `Button` component must include `cursor-pointer` in its className.

## Button variants

| Variant | When to use |
|---|---|
| `default` | Primary CTA — filled with `bg-primary` |
| `pill` | Rounded-full primary CTA — "Create X", swipe Connect, hero actions |
| `pill-outline` | Rounded-full purple border + text — secondary actions ("Join", "View event") |
| `pill-builder` | Soft green pill — membership/success states ("Joined", "Connected"). `disabled` renders at opacity-60 (keeps semantic color, clearly non-clickable) |
| `pill-muted` | Muted filled pill — waiting states ("Pending"). `disabled` renders at opacity-60 |
| `pill-ghost` | Rounded-full neutral border — tertiary actions ("Cancel", "Decline") |
| `pill-destructive` | Soft red pill — destructive confirmations ("Remove") |

**Pill on a `<Link>`:** don't wrap with `<Button asChild>` — apply the styles directly with `buttonVariants`:

```tsx
import { buttonVariants } from "@/components/ui/button"

<Link href="..." className={cn(buttonVariants({ variant: "pill" }), "px-5")}>
  Create Community
</Link>
```
| `outline` | Secondary / Back actions |
| `ghost` | Tertiary / Skip actions — no border |
| `destructive` | Destructive actions |
| `visionary` | Filled magenta — Visionary archetype context |
| `visionary-outline` | Magenta border + text |
| `strategist` | Filled lavender — Strategist archetype context |
| `strategist-outline` | Lavender border + text |
| `builder` | Filled green — Builder archetype context |
| `builder-outline` | Green border + text |

**Archetype rule:** map `profile.archetype` → variant. `visionary` → `variant="visionary"`, etc.

Button sizes: `size="lg"` (main form actions), `size="default"` (standard), `size="sm"` (compact).

## Badge variants

Same archetype logic as Button. `variant="secondary"` for neutral chips, `variant="outline"` for bordered, `variant="destructive"` for errors.

## Card variants

| Variant | When to use |
|---|---|
| `variant="default"` | Standard card — `bg-card` + `ring-1 ring-foreground/10` |
| `variant="primary"` | Hero/highlight card — purple gradient `#6B00C9→#8B78E6` with matching border |
| `variant="builder"` | Builder archetype card — green gradient |

## Design system tokens

```css
/* Surfaces */
--background   /* page canvas */
--card         /* cards, panels */
--muted        /* subdued backgrounds */
--border       /* borders */

/* Text */
--foreground          /* primary text */
--muted-foreground    /* labels, metadata */

/* Brand */
--primary      /* purple — CTAs, focus rings */

/* Archetypes */
--visionary          /* magenta */
--strategist         /* lavender */
--builder-archetype  /* green */
```

Never use hardcoded hex/rgb values. Always use CSS variable tokens.

## Typography

- `font-display` — headings (Space Grotesk)
- `font-mono` — labels, metadata, badges, wallet addresses (JetBrains Mono)
- default sans — body text (Inter)

## Archetypes

`ARCHETYPES` in `lib/onboarding.ts` has **no `emoji` field**. Each archetype has:
- `id` — `"visionary" | "strategist" | "builder"`
- `name` — full name: `"The Visionary"` (use for headings/descriptions)
- `label` — short name: `"Visionary"` (use for badges, chips, pills)
- `colorVar` — CSS var: `"--visionary"` / `"--strategist"` / `"--builder-archetype"`

**Archetype badge with dynamic color (inline style):**

```tsx
<span
  className="text-xs px-2 py-0.5 rounded-sm border font-mono"
  style={{
    borderColor: `var(${archetype.colorVar})`,
    color: `var(${archetype.colorVar})`,
    backgroundColor: `color-mix(in oklch, var(${archetype.colorVar}) 10%, transparent)`,
  }}
>
  {archetype.label}
</span>
```

Use `color-mix(in oklch, var(--token) 10%, transparent)` for all transparent archetype/status backgrounds — never hardcoded rgba.

## Images

Use plain `<img>` tags. `next/image` is not used (`@next/next/no-img-element` ESLint rule is disabled).

## Next.js 16 — async route params

In dynamic route pages, `params` is a `Promise`. Use `use()` to unwrap it:

```tsx
import { use } from "react"

export default function DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  // ...
}
```

Never `await params` in a Client Component.

## URL-synced filter state — nuqs

For filterable list pages, use `nuqs` to sync filters to the URL:

```tsx
import { useQueryStates, parseAsString } from "nuqs"

const [filters, setFilters] = useQueryStates({
  track: parseAsString.withDefault(""),
  status: parseAsString.withDefault(""),
  q: parseAsString.withDefault(""),
})

// Toggle a filter (toggle off if already selected):
void setFilters({ track: filters.track === t ? "" : t })

// Clear all:
void setFilters({ track: "", status: "", q: "" })
```

## Debounced search input

For search inputs that trigger API calls, debounce the value before passing it to the query:

```tsx
import { useDebounce } from "@/hooks/use-debounce"

const [searchInput, setSearchInput] = useState(filters.q)
const debouncedSearch = useDebounce(searchInput)
// Pass debouncedSearch to the query hook, not searchInput
```

## Filter bar pattern

Filterable list pages use rows of pill buttons. Each row has a label + horizontally scrollable chips:

```tsx
<div className="flex items-center gap-3">
  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest shrink-0">
    Track
  </span>
  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
    {OPTIONS.map((opt) => (
      <button
        key={opt}
        type="button"
        onClick={() => void setFilters({ track: filters.track === opt ? "" : opt })}
        className={cn(
          "text-xs px-3 py-1 rounded-full border font-mono transition-all cursor-pointer whitespace-nowrap shrink-0",
          filters.track === opt
            ? "border-primary text-primary bg-primary/10"
            : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
        )}
      >
        {opt}
      </button>
    ))}
  </div>
</div>
```

## Empty state pattern

When a list has no results:

```tsx
<div className="bg-card border border-dashed border-border rounded-xl p-16 flex flex-col items-center gap-4 text-center">
  <span className="text-4xl">{emoji}</span>
  <div className="flex flex-col gap-1">
    <p className="font-display font-semibold text-foreground">No items found.</p>
    <p className="text-muted-foreground text-sm">
      {hasActiveFilters ? "Try clearing filters." : "Be the first to create one."}
    </p>
  </div>
  {!hasActiveFilters && <Button ...>Create →</Button>}
</div>
```

## Infinite scroll / load more

For paginated lists using `useInfiniteQuery`:

```tsx
const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useFilteredItems(filters)
const items = data?.pages.flatMap((p) => p.items) ?? []
const total = data?.pages[0]?.total ?? 0

// Results count
<p className="text-sm text-muted-foreground">
  Showing {items.length} of {total} item{total !== 1 ? "s" : ""}
</p>

// Load more button
{hasNextPage && (
  <div className="flex justify-center pt-2">
    <Button variant="outline" className="rounded-full font-mono text-sm px-6"
      onClick={() => void fetchNextPage()} disabled={isFetchingNextPage}>
      {isFetchingNextPage ? "Loading..." : "Load more"}
    </Button>
  </div>
)}
{!hasNextPage && items.length > 0 && !isLoading && (
  <p className="text-center text-xs font-mono text-muted-foreground pt-2">
    All {total} item{total !== 1 ? "s" : ""} loaded
  </p>
)}
```

## Detail page layout (main + sidebar)

```tsx
<div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
  <div className="flex flex-col gap-6">{/* main content */}</div>
  <aside className="flex flex-col gap-4">{/* sidebar cards */}</aside>
</div>
```

## SectionLabel — section headers in detail pages

```tsx
function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn("text-xs font-mono text-muted-foreground uppercase tracking-widest", className)}>
      {children}
    </h2>
  )
}
```

## DetailRow — metadata rows in sidebar cards

```tsx
function DetailRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-2 text-muted-foreground font-mono">
        {icon}
        {label}
      </span>
      <span className="text-foreground font-mono text-right">{children}</span>
    </div>
  )
}
```

## Cover image with gradient fallback

```tsx
<div className="relative h-48 w-full overflow-hidden">
  {item.image_url ? (
    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
  ) : (
    <div className="w-full h-full bg-linear-to-br from-primary/20 via-muted to-card" />
  )}
  <div className="absolute inset-0 bg-linear-to-t from-card to-transparent" />
</div>
```

## Status CONFIG pattern

Define a single config object mapping status → all style variants:

```tsx
const STATUS_CONFIG = {
  open: {
    label: "Looking for members",
    badgeCls: "border-primary text-primary bg-primary/10",
    textCls: "text-primary",
    dotCls: "bg-primary",
    colorVar: "--primary",
  },
  full: {
    label: "Team full",
    badgeCls: "border-builder-archetype text-builder-archetype bg-builder-archetype/10",
    textCls: "text-builder-archetype",
    dotCls: "bg-builder-archetype",
    colorVar: "--builder-archetype",
  },
  in_progress: {
    label: "In progress",
    badgeCls: "border-strategist text-strategist bg-strategist/10",
    textCls: "text-strategist",
    dotCls: "bg-strategist",
    colorVar: "--strategist",
  },
  finished: {
    label: "Finished",
    badgeCls: "border-muted-foreground text-muted-foreground bg-muted",
    textCls: "text-muted-foreground",
    dotCls: "bg-muted-foreground",
    colorVar: "--muted-foreground",
  },
} as const

// Usage:
const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.open
```

## Slot/capacity dots

For displaying filled vs empty slots:

```tsx
const slots = Array.from({ length: Math.min(item.max_size, 6) })

<div className="flex items-center gap-1">
  {slots.map((_, i) => (
    <div
      key={i}
      className={cn("size-2 rounded-full transition-colors", i < filledCount ? cfg.dotCls : "bg-border")}
    />
  ))}
  {item.max_size > 6 && (
    <span className="text-[10px] font-mono text-muted-foreground ml-1">+{item.max_size - 6}</span>
  )}
</div>
```

## Ownership check — always use Supabase UUID

To check if the current user owns an entity, compare against the **Supabase UUID** (`profile.id`), not the Privy ID:

```tsx
import { useProfile } from "@/services/api/profile"

const { data: profile } = useProfile({ enabled: true })
const isOwner = profile?.id === entity.creator.id  // ✅ both are Supabase UUIDs
```

Never use `usePrivy().user?.id` for ownership — that's the Privy string ID, which doesn't match `creator_id` in the DB.

## currentUserId prop threading

List pages that render cards must pass the current user's Supabase UUID down so cards can determine ownership locally without a separate query per card:

```tsx
// Page — fetch profile once, pass id to each card
const { data: profile } = useProfile({ enabled: true })

<HackSpaceCard hackSpace={hs} currentUserId={profile?.id} />

// Card — receive as prop
interface HackSpaceCardProps {
  hackSpace: HackSpace
  currentUserId?: string
}

function HackSpaceCard({ hackSpace, currentUserId }: HackSpaceCardProps) {
  const isOwner = currentUserId === hackSpace.creator.id
  // Use isOwner to conditionally show "Manage →" vs "Apply →"
}
```

This avoids N+1 profile queries and keeps ownership logic inside the card.
