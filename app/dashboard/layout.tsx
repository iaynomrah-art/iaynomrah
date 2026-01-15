import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'


const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="min-h-screen flex flex-col">
      <DashboardHeader />
      <div className="flex-1 w-full flex">
        <DashboardSidebar />
        <div className="flex-1 overflow-auto ml-64 pt-16">
          {children}
        </div>
      </div>
    </main>
  )
}

export default layout