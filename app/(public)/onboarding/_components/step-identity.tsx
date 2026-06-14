"use client"

import { useState } from "react"
import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { handleSchema, type HandleInput } from "@/lib/schemas/onboarding"
import { CYPHER_KITTENS } from "@/lib/onboarding"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field"
import { cn } from "@/lib/utils"

interface StepIdentityProps {
  onNext: (handle: string, avatarUrl: string) => void
  onBack: () => void
  loading: boolean
  error: string | null
}

export function StepIdentity({ onNext, onBack, loading, error }: StepIdentityProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)

  const { control, handleSubmit, formState, setValue } = useForm<HandleInput>({
    resolver: zodResolver(handleSchema),
    defaultValues: { handle: "" },
  })

  const currentHandle = useWatch({ control, name: "handle" })

  function onSubmit(values: HandleInput) {
    if (!selectedAvatar) return
    onNext(values.handle, selectedAvatar)
  }

  const canSubmit = !formState.isSubmitting && !loading && selectedAvatar !== null

  return (
    <div className="flex flex-col gap-10 w-full">
      {/* Step header */}
      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-[0.15em]">
          02 — Identity
        </p>
        <h1 className="font-display font-bold text-foreground text-4xl leading-tight">
          Who are you in the Protocol?
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed max-w-md">
          Choose your handle — it&apos;s permanent. Then pick your Cypher Kitten. It travels with you everywhere.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-10">
        {/* Handle field */}
        <Controller
          name="handle"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>
                Handle{" "}
                <span className="text-muted-foreground font-normal">(required, permanent)</span>
              </FieldLabel>
              <div
                className="flex items-center rounded-lg border bg-transparent dark:bg-input/30 transition-[border-color,box-shadow]"
                style={{
                  borderColor: fieldState.invalid ? "var(--destructive)" : "var(--border)",
                }}
              >
                <span className="pl-3 pr-1 text-muted-foreground font-mono text-sm select-none">
                  @
                </span>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder="your_handle"
                  maxLength={20}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                    )
                  }
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0 font-mono pl-0"
                />
              </div>
              <FieldDescription>
                3–20 chars. Lowercase, numbers and underscores only.
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Cypher Kitten grid */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-[0.15em] shrink-0">
              Cypher Kitten
            </p>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {CYPHER_KITTENS.map((kitten) => {
              const isSelected = selectedAvatar === kitten.src

              return (
                <button
                  key={kitten.id}
                  type="button"
                  onClick={() => setSelectedAvatar(kitten.src)}
                  disabled={loading}
                  className={cn(
                    "group relative flex flex-col items-center gap-3 rounded-2xl border-2 p-4",
                    "transition-all duration-200 cursor-pointer",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                  style={{
                    borderColor: isSelected ? "var(--primary)" : "var(--border)",
                    background: isSelected
                      ? "color-mix(in oklch, var(--primary) 8%, var(--card))"
                      : "var(--card)",
                    boxShadow: isSelected
                      ? "0 0 32px color-mix(in oklch, var(--primary) 25%, transparent)"
                      : "none",
                  }}
                >
                  {/* Selected badge */}
                  {isSelected && (
                    <div
                      className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold"
                      style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                    >
                      ✓
                    </div>
                  )}

                  {/* GIF */}
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden">
                    <img
                      src={kitten.src}
                      alt={kitten.label}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {loading && isSelected && (
                      <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                        <Spinner className="size-6 text-primary" />
                      </div>
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className="text-sm font-mono font-medium transition-colors"
                    style={{ color: isSelected ? "var(--primary)" : "var(--muted-foreground)" }}
                  >
                    {kitten.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {error && (
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-mono text-destructive border border-destructive/30 rounded-lg px-4 py-2.5 bg-destructive/5">
              {error}
            </p>
            {(error.toLowerCase().includes("taken") || error.toLowerCase().includes("already")) &&
              currentHandle && (
                <p className="text-xs font-mono text-muted-foreground px-1">
                  Try{" "}
                  <button
                    type="button"
                    className="text-primary underline underline-offset-2 cursor-pointer"
                    onClick={() => setValue("handle", `${currentHandle}_2`)}
                  >
                    @{currentHandle}_2
                  </button>
                </p>
              )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onBack}
            disabled={loading}
            className="rounded-xl font-mono"
          >
            ← Back
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={!canSubmit}
            className="rounded-xl font-mono font-semibold px-6"
          >
            {loading ? (
              <>
                <Spinner className="mr-2" /> Saving...
              </>
            ) : (
              "Continue →"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
