import { getUserTestDrives } from '@/actions/test-drive';
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation';

import React from 'react'
import ReservationsList from './_components/ReservationsList';

export const metadata = {
    title: 'My Reservations | Vehiql',
    description: 'Manage your test drives reservations'
}

const ReservationsPage = async () => {
    const { userId } = await auth();
    if (!userId) {
        //REDIRECT CAN ONLY BE USED IN SERVER COMPONENTS
        redirect('/sign-in?redirect=/reservations')
    }
    const reservationsResult = await getUserTestDrives();
    return (
        <div className='container mx-auto px-4 py-12'>
            <h1 className='text-6xl mb-6 gradient-title'>Your Reservations</h1>
            <ReservationsList initialData={reservationsResult} />
        </div>
    )
}

export default ReservationsPage
