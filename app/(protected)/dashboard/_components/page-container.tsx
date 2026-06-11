interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export function PageContainer({
  children,
  className = "",
}: PageContainerProps) {
  return (
    <main className={`max-w-7xl mx-auto px-4 lg:px-8 pt-6 pb-24 lg:py-8 w-full ${className}`}>
      {children}
    </main>
  )
}
