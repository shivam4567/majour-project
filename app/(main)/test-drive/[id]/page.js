import { getCarById } from '@/actions/car-listing';
import { notFound } from 'next/navigation';
import React from 'react'
import TestdriveForm from './_components/TestdriveForm';

export async function generateMetadata() {
    return {
        title: `Book Test Drive | Vehiql`,
        description: `Schedule a test drive in few seconds`
    }
}

const TestDrivePage = async ({ params }) => {
    const { id } = await params;
    const result = await getCarById(id);
    if (!result.success) notFound();
    return (
        <div className='container mx-auto px-4 py-12'>
            <h1 className='text-6xl mb-6 gradient-title'>Book a Test Drive</h1>
            <TestdriveForm car={result.data} testDriveInfo={result.data.testDriveInfo} />
        </div>
    )
}

export default TestDrivePage
