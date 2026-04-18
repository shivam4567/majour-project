import { getAdmin } from "@/actions/admin";
import Header from "@/components/Header";
import { notFound } from "next/navigation";
import Sidebar from "../components/Sidebar";


const AdminLayout = async ({ children }) => {
    //GET SERVER ACTION (you dont require fetch or useEffect)
    const admin = await getAdmin()
    if (!admin.authorized) return notFound();

    return (
        <div className="h-full bg-background text-foreground">
            <Header isAdminPage={true} />
            <div className="flex h-full w-56 flex-col top-20 fixed inset-y-0 z-50">
                <Sidebar />
            </div>

            <main className="md:pl-56 pt-[80px] h-full bg-background text-foreground">
                {children}
            </main>
        </div>
    )
}

export default AdminLayout;
