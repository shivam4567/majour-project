"use server";


import { serializeCarData } from "@/lib/helper";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

//FETCH CARS BASED ON FILTERS
export async function getCarFilters() {
    try {
        const makes = await db.car.findMany({
            where: {
                status: "AVAILABLE",
            },
            select: { make: true },
            distinct: ["make"],
            orderBy: { make: "asc" },
        });

        const bodyTypes = await db.car.findMany({
            where: { status: "AVAILABLE" },
            select: { bodyType: true },
            distinct: ["bodyType"],
            orderBy: { bodyType: "asc" },
        });

        const fuelTypes = await db.car.findMany({
            where: { status: "AVAILABLE" },
            select: { fuelType: true },
            distinct: ["fuelType"],
            orderBy: { fuelType: "asc" },
        });

        const transmissions = await db.car.findMany({
            where: { status: "AVAILABLE" },
            select: { transmission: true },
            distinct: ["transmission"],
            orderBy: { transmission: "asc" },
        });

        const priceAggregations = await db.car.aggregate({
            where: { status: "AVAILABLE" },
            _min: { price: true },
            _max: { price: true },
        });
        /*
                        _min.price: the minimum price of available cars.
                        _max.price: the maximum price of available cars.
                        OUTPUT-->
                        {_min: { price: 4500 },_max: { price: 50000 }}
                        */

        return {
            success: true,
            data: {
                makes: makes.map((item) => item.make), //['Toyota', 'Honda'].
                bodyTypes: bodyTypes.map((item) => item.bodyType), //['SUV', 'Hatchback']
                fuelTypes: fuelTypes.map((item) => item.fuelType),
                transmissions: transmissions.map((item) => item.transmission),
                priceRange: {
                    min: priceAggregations._min.price
                        ? parseFloat(priceAggregations._min.price.toString())
                        : 0,
                    max: priceAggregations._max.price
                        ? parseFloat(priceAggregations._max.price.toString())
                        : 100000,
                },
            },
        };
    } catch (error) {
        throw new Error("Error fetching car filters:" + error.message);
    }
}

//GET ALL CARS
export async function getCars({
    search = "",
    make = "",
    bodyType = "",
    fuelType = "",
    transmission = "",
    minPrice = 0,
    maxPrice = Number.MAX_SAFE_INTEGER,
    sortBy = "newest", // Options: newest, priceAsc, priceDesc
    page = 1,
    limit = 6,
}) {
    try {
        // Get current user if authenticated
        const { userId } = await auth();
        let dbUser = null;

        if (userId) {
            dbUser = await db.user.findUnique({
                where: { clerkUserId: userId },
            });
        }

        // Build where conditions
        let where = {
            status: "AVAILABLE",
        };

        if (search) {
            where.OR = [
                { make: { contains: search } },
                { model: { contains: search } },
                { description: { contains: search } },
            ];
        }

        if (make) where.make = { equals: make };
        if (bodyType) where.bodyType = { equals: bodyType };
        if (fuelType) where.fuelType = { equals: fuelType };
        if (transmission)
            where.transmission = { equals: transmission };

        // Add price range
        where.price = {
            gte: parseFloat(minPrice) || 0,
        };

        if (maxPrice && maxPrice < Number.MAX_SAFE_INTEGER) {
            where.price.lte = parseFloat(maxPrice);
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Determine sort order
        let orderBy = {};
        switch (sortBy) {
            case "priceAsc":
                orderBy = { price: "asc" };
                break;
            case "priceDesc":
                orderBy = { price: "desc" };
                break;
            case "newest":
            default:
                orderBy = { createdAt: "desc" };
                break;
        }

        // Get total count for pagination
        const totalCars = await db.car.count({ where });

        // Execute the main query
        const cars = await db.car.findMany({
            where,
            take: limit,
            skip,
            orderBy,
        });

        // If we have a user, check which cars are wishlisted
        let wishlisted = new Set();
        if (dbUser) {
            const savedCars = await db.userSavedCar.findMany({
                where: { userId: dbUser.id },
                select: { carId: true },
            });

            wishlisted = new Set(savedCars.map((saved) => saved.carId));
        }

        // Serialize and check wishlist status
        const serializedCars = cars.map((car) =>
            serializeCarData(car, wishlisted.has(car.id))
        );

        return {
            success: true,
            data: serializedCars,
            pagination: {
                total: totalCars,
                page,
                limit,
                pages: Math.ceil(totalCars / limit),
            },
        };
    } catch (error) {
        throw new Error("Error fetching cars:" + error.message);
    }
}

//TOGGLE WISHLIST CAR
export async function toggleSavedCar(carId) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) throw new Error("User not found");

        // Check if car exists
        const car = await db.car.findUnique({
            where: { id: carId },
        });

        if (!car) {
            return {
                success: false,
                error: "Car not found",
            };
        }

        // Check if car is already saved
        const existingSave = await db.userSavedCar.findUnique({
            where: {
                userId_carId: {
                    userId: user.id,
                    carId,
                },
            },
        });

        // If car is already saved, remove it
        if (existingSave) {
            await db.userSavedCar.delete({
                where: {
                    userId_carId: {
                        userId: user.id,
                        carId,
                    },
                },
            });

            revalidatePath(`/saved-cars`);
            return {
                success: true,
                saved: false,
                message: "Car removed from favorites",
            };
        }

        // If car is not saved, add it
        await db.userSavedCar.create({
            data: {
                userId: user.id,
                carId,
            },
        });

        revalidatePath(`/saved-cars`);
        return {
            success: true,
            saved: true,
            message: "Car added to favorites",
        };
    } catch (error) {
        throw new Error("Error toggling saved car:" + error.message);
    }
}

//GET SAVED CARS
export async function getSavedCars() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return {
                success: false,
                error: "Unauthorized",
            };
        }
        //GET USER FROM DB
        const user = await db.user.findUnique({
            where: {
                clerkUserId: userId,
            },
        });
        if (!user) {
            return {
                success: false,
                error: "User Not Found",
            };
        }

        const savedCars = await db.userSavedCar.findMany({
            where: {
                userId: user.id,
            },
            include: {
                car: true,
            },
            orderBy: {
                savedAt: "desc",
            },
        });

        const cars = savedCars.map((saved) => serializeCarData(saved.car));
        return {
            success: true,
            data: cars,
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}

//GET CAR DETAILS BY ID
export async function getCarById(carId) {
    console.log('carId', carId);
    try {
        // Get current user if authenticated
        const { userId } = await auth();
        let dbUser = null;

        if (userId !== null) {
            dbUser = await db.user.findUnique({
                where: { clerkUserId: userId },
            });
        }

        // Get car details
        const car = await db.car.findUnique({
            where: { id: carId },
        });
        console.log('car', car);

        if (!car) {
            return {
                success: false,
                error: "Car not found",
            };
        }

        // Check if car is wishlisted by user
        let isWishlisted = false;
        if (dbUser) {
            const savedCar = await db.userSavedCar.findUnique({
                where: {
                    userId_carId: {
                        userId: dbUser.id,
                        carId,
                    },
                },
            });

            isWishlisted = !!savedCar;
        }

        // Check if user has already booked a test drive for this car
        let userTestDrive = null;

        if (dbUser) {
            const existingTestDrive = await db.testDriveBooking.findFirst({
                where: {
                    carId,
                    userId: dbUser.id,
                    status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
                },
                orderBy: {
                    createdAt: "desc",
                },
            });

            if (existingTestDrive) {
                userTestDrive = {
                    id: existingTestDrive.id,
                    status: existingTestDrive.status,
                    bookingDate: existingTestDrive.bookingDate.toISOString(),
                };
            }
        }


        // Get dealership info for test drive availability
        const dealership = await db.dealershipInfo.findFirst({
            select: {
                id: true,
                name: true,
                address: true,
                phone: true,
                email: true,
                createdAt: true,
                updatedAt: true,
                workingHours: {
                    select: {
                        id: true,
                        dayOfWeek: true,
                        openTime: true,
                        closeTime: true,
                        isOpen: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
            },
        });

        return {
            success: true,
            data: {
                ...serializeCarData(car, isWishlisted),
                testDriveInfo: {
                    userTestDrive,
                    dealership: dealership
                        ? {
                            ...dealership,
                            createdAt: dealership.createdAt.toISOString(),
                            updatedAt: dealership.updatedAt.toISOString(),
                            workingHours: dealership.workingHours.map((hour) => ({
                                ...hour,
                                createdAt: hour.createdAt.toISOString(),
                                updatedAt: hour.updatedAt.toISOString(),
                            })),
                        }
                        : null,
                },
            },
        };
    } catch (error) {
        throw new Error("Error fetching car details:" + error.message);
    }
}
