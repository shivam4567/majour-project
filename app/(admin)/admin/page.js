import { getDashboardData } from "@/actions/admin"
import DashBoard from "../components/DashBoard"

export const metadata = {
    title: 'Dashboard | Vehiql Admin',
    description: 'Admin Dashboard'
}
const AdminPage = async () => {
    const dashboardData = await getDashboardData()
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
            <DashBoard initialData={dashboardData} />
        </div>
    )
}

export default AdminPage
