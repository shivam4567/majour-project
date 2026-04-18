import { checkUser } from "@/lib/checkUser";
import { redirect } from "next/navigation";
import AddCarForm from "@/app/(admin)/admin/cars/_components/AddCarForm";

export const metadata = {
    title: "Add Car | Vehiql",
    description: "List your car on the Vehiql marketplace",
};

const AddCarPage = async () => {
    const user = await checkUser();

    if (!user) {
        redirect("/sign-in");
    }

    // Admins have their own portal — redirect them there if they somehow end up here
    if (user?.role === "ADMIN") {
        redirect("/admin/cars/create");
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-12">
            <div className="mb-10 text-center">
                <h1 className="text-4xl font-extrabold mb-4 gradient-title">
                    List Your Vehicle
                </h1>
                <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                    Sell your car faster with our AI-powered listing tool. Upload a photo or enter details manually.
                </p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-xl p-1 md:p-6 border border-gray-100">
                <AddCarForm />
            </div>
        </div>
    );
};

export default AddCarPage;
