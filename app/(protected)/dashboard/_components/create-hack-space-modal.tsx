"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useCreateHackSpace } from "@/services/api/hack-spaces"
import { ARCHETYPES, ALL_SKILLS } from "@/lib/onboarding"
import {
  createHackSpaceSchema,
  type CreateHackSpaceInput,
} from "@/lib/schemas/hack-space"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field"
import { cn } from "@/lib/utils"

interface CreateHackSpaceModalProps {
  onCreated: () => void
  onClose: () => void
}

export function CreateHackSpaceModal({
  onCreated,
  onClose,
}: CreateHackSpaceModalProps) {
  const createHackSpace = useCreateHackSpace()

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<CreateHackSpaceInput>({
    resolver: zodResolver(createHackSpaceSchema),
    defaultValues: {
      title: "",
      description: "",
      looking_for: [],
      skills_needed: [],
    },
  })

  async function onSubmit(values: CreateHackSpaceInput) {
    await createHackSpace.mutateAsync(values)
    onCreated()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-card border border-border rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-foreground text-xl">
            Create Hack Space
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
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
                  placeholder="What are you building?"
                  maxLength={80}
                />
                <FieldDescription>
                  A concise name for your project.
                </FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

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
                  placeholder="Describe your project and what you're looking to build..."
                  maxLength={500}
                  rows={4}
                  className="resize-none"
                />
                <FieldDescription>
                  {(field.value ?? "").length}/500
                </FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="looking_for"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Looking for</FieldLabel>
                <div className="flex gap-2 flex-wrap">
                  {ARCHETYPES.map((a) => {
                    const selected = field.value.includes(a.id)
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() =>
                          field.onChange(
                            selected
                              ? field.value.filter((v) => v !== a.id)
                              : [...field.value, a.id],
                          )
                        }
                        className={cn(
                          "text-xs px-3 py-1.5 rounded-sm border font-mono transition-all cursor-pointer",
                        )}
                        style={
                          selected
                            ? {
                                borderColor: `var(${a.colorVar})`,
                                color: `var(${a.colorVar})`,
                                backgroundColor: `color-mix(in oklch, var(${a.colorVar}) 15%, transparent)`,
                              }
                            : {
                                borderColor: "var(--border)",
                                color: "var(--muted-foreground)",
                              }
                        }
                      >
                        {a.name}
                      </button>
                    )
                  })}
                </div>
                <FieldDescription>
                  Select the archetypes you need on your team.
                </FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="skills_needed"
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel>
                  Skills needed{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {ALL_SKILLS.map((skill) => {
                    const value = field.value ?? []
                    const selected = value.includes(skill)
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() =>
                          field.onChange(
                            selected
                              ? value.filter((s) => s !== skill)
                              : [...value, skill],
                          )
                        }
                        className={cn(
                          "text-xs px-2.5 py-1 rounded-sm border font-mono transition-all cursor-pointer",
                          selected
                            ? "border-primary text-primary bg-primary/10"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        {selected ? "✓ " : ""}
                        {skill}
                      </button>
                    )
                  })}
                </div>
              </Field>
            )}
          />

          {createHackSpace.error && (
            <p className="text-sm text-destructive">
              {createHackSpace.error.message}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="pill"
              disabled={isSubmitting}
              className="px-6"
            >
              {isSubmitting ? "Creating..." : "Create Space →"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
