interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export function PageContainer({
  children,
  className = "",
}: PageContainerProps) {
  return (
    <main className={`max-w-6xl mx-auto px-4 pt-6 pb-24 lg:py-8 w-full ${className}`}>
      {children}
    </main>
  )
}
