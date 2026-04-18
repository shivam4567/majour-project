/* eslint-disable react-hooks/exhaustive-deps */
import TestDriveList from './_components/TestDriveList'


const TestDrivePage = () => {
    return (
        <div className='p-6'>
            <h1 className='text-2xl font-bold mb-6'>Test Drive Management</h1>
            <TestDriveList />
        </div>
    )
}

export default TestDrivePage