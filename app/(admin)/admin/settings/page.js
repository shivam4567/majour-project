import SettingForm from "./_components/SettingForm";

export const metaData = {
    title: 'Settings | Vehiql Admin',
    description: "Manage Dealership working hours and admin users"
}

const SettingsPage = () => {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Settings</h1>
            <SettingForm />
        </div>
    )
}

export default SettingsPage;
