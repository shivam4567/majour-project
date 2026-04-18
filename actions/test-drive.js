'use server';

import { serializeCarData } from "@/lib/helper";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function bookTestDrive({
    carId, bookingDate, startTime, endTime, notes
}) {
    try {
        const { userId } = await auth();
        //SERVER WILL THROW THIS ERROR
        if (!userId) throw new Error('You must be logged in to book a testdrive');

        //CHECK IF USER EXIST IN DB
        const user = await db.user.findUnique({
            where: {
                clerkUserId: userId
            }
        })
        if (!user) throw new Error('User not found in DB');

        //CHECK IF CAR EXIST IN DB
        const car = await db.car.findUnique({
            where: {
                id: carId,
                status: 'AVAILABLE'
            }
        })
        if (!car) throw new Error('Car not available for test drive');

        //CHECK IF SLOT IS ALREADY BOOKED
        const existingBooking = await db.testDriveBooking.findFirst({
            where: {
                carId,
                bookingDate: new Date(bookingDate),
                startTime,
                status: {
                    in: ['PENDING', 'CONFIRMED']
                }
            }
        })
        if (existingBooking) {
            throw new Error("This time slot is already booked. Please select another time")
        }

        //CREATE BOOKING
        const booking = await db.testDriveBooking.create({
            data: {
                carId,
                userId: user.id,
                bookingDate: new Date(bookingDate),
                startTime,
                endTime,
                notes: notes || null,
                status: 'PENDING'
            }
        })
        //route will re-fetch fresh data (like from a database or API), 
        // rather than using the stale cached version.
        revalidatePath(`/test-drive/${carId}`);
        revalidatePath(`/cars/${carId}`);
        return {
            success: true,
            data: booking
        }
    } catch (error) {
        return {
            success: false,
            error: error.message || 'Failed to book test drive'
        }
    }
}

export async function getUserTestDrives() {
    try {
        const { userId } = await auth();
        //SERVER WILL THROW THIS ERROR
        if (!userId) throw new Error('You must be logged in to book a testdrive');

        //CHECK IF USER EXIST IN DB
        const user = await db.user.findUnique({
            where: {
                clerkUserId: userId
            }
        })
        if (!user) throw new Error('User not found in DB');

        //GET ALL THE BOOKINGS
        const bookings = await db.testDriveBooking.findMany({
            where: {
                userId: user.id
            },
            include: {
                car: true
            },
            orderBy: { bookingDate: 'desc' }
        });

        const formatBookings = bookings.map((booking) => ({
            id: booking.id,
            carId: booking.carId,
            car: serializeCarData(booking.car),
            bookingDate: booking.bookingDate.toISOString(),
            startTime: booking.startTime,
            endTime: booking.endTime,
            status: booking.status,
            notes: booking.notes
        }))
        return {
            success: true,
            data: formatBookings
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        }
    }
}

export async function cancelTestDrive(bookingId) {
    try {
        const { userId } = await auth();
        //SERVER WILL THROW THIS ERROR
        if (!userId) throw new Error('You must be logged in to book a testdrive');

        //CHECK IF USER EXIST IN DB
        const user = await db.user.findUnique({
            where: {
                clerkUserId: userId
            }
        })
        if (!user) throw new Error('User not found in DB');

        //GET THE BOOKING
        const booking = await db.testDriveBooking.findUnique({
            where: {
                id: bookingId
            }
        })
        if (!booking) {
            return {
                success: false,
                error: 'Booking not found'
            }
        }
        if (booking.userId !== user.id || user.role !== 'ADMIN') {
            return {
                success: false,
                error: 'UNAUTHORIZED TO CANCEL THIS BOOKING'
            }
        }

        //CHECK IF BOOKING IS ALREADY CANCELLD
        if (booking.status === 'CANCELLED') {
            return {
                success: true,
                error: 'Booking is already cancelled'
            }
        }

        //CHECK IF BOOKING IS ALREADY COMPLEATED
        if (booking.status === 'COMPLETED') {
            return {
                success: false,
                error: 'Cannot cancel a completed booking'
            }
        }

        //UPDATE TH BOOKING
        await db.testDriveBooking.update({
            where: { id: bookingId },
            data: { status: 'CANCELLED' }
        })
        revalidatePath("/reservations");
        revalidatePath("/admin/test-drives");
        return {
            success: true,
            message: 'Test drive cancelled Successfully'
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        }
    }
}