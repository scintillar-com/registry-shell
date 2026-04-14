import { SidebarLayout } from "@shell/components/sidebar-layout"
import { getAllDocs } from "@shell/lib/docs"
import { getAllComponents } from "@shell/lib/components-nav"

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const docs = getAllDocs()
  const components = getAllComponents()

  return (
    <SidebarLayout docs={docs} components={components}>
      {children}
    </SidebarLayout>
  )
}
