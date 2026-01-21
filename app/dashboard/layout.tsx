import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#050505]">
        <DashboardSidebar />
        <SidebarInset className="bg-[#050505] flex flex-col min-h-screen">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

export default layout