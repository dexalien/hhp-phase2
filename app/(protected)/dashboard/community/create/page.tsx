"use client"

import { useRouter } from "next/navigation"
import { useCreateCommunity } from "@/services/api/communities"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { PageContainer } from "../../_components/page-container"
import { BackButton } from "../../../_components/back-button"
import { CommunityForm } from "./_components/create-community-form"
import type { CreateCommunityInput } from "@/lib/schemas/community"

export default function CreateCommunityPage() {
  const router = useRouter()
  const createCommunity = useCreateCommunity()

  async function handleSubmit(values: CreateCommunityInput) {
    await createCommunity.mutateAsync(values)
    toast.success("Community created")
    router.push("/dashboard/builders")
  }

  return (
    <PageContainer>
      <div className="w-2xl max-w-full mx-auto flex flex-col gap-8">
        <BackButton href="/dashboard/builders" />
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="font-mono text-xs h-7 px-2 text-muted-foreground"
          >
            &larr; Back
          </Button>
          <span className="text-border">|</span>
          <h1 className="font-display font-bold text-foreground text-xl">
            Create Community
          </h1>
        </div>

        <CommunityForm
          onFormSubmit={handleSubmit}
          submitLabel="Launch Community"
          submittingLabel="Creating..."
        />
      </div>
    </PageContainer>
  )
}
