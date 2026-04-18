'use server';
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase";
import { cookies } from "next/headers";


// Get dealership info with working hours
export async function getDealershipInfo() {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        // Get the dealership record
        let dealership = await db.dealershipInfo.findFirst({
            select: {
                id: true,
                name: true,
                address: true,
                phone: true,
                email: true,
                createdAt: true,
                updatedAt: true,
                workingHours: {
                    orderBy: {
                        dayOfWeek: "asc",
                    },
                },
            },
        });

        // If no dealership exists, create a default one
        if (!dealership) {
            dealership = await db.dealershipInfo.create({
                data: {
                    // Default values will be used from schema
                    workingHours: {
                        create: [
                            {
                                dayOfWeek: "MONDAY",
                                openTime: "09:00",
                                closeTime: "18:00",
                                isOpen: true,
                            },
                            {
                                dayOfWeek: "TUESDAY",
                                openTime: "09:00",
                                closeTime: "18:00",
                                isOpen: true,
                            },
                            {
                                dayOfWeek: "WEDNESDAY",
                                openTime: "09:00",
                                closeTime: "18:00",
                                isOpen: true,
                            },
                            {
                                dayOfWeek: "THURSDAY",
                                openTime: "09:00",
                                closeTime: "18:00",
                                isOpen: true,
                            },
                            {
                                dayOfWeek: "FRIDAY",
                                openTime: "09:00",
                                closeTime: "18:00",
                                isOpen: true,
                            },
                            {
                                dayOfWeek: "SATURDAY",
                                openTime: "10:00",
                                closeTime: "16:00",
                                isOpen: true,
                            },
                            {
                                dayOfWeek: "SUNDAY",
                                openTime: "10:00",
                                closeTime: "16:00",
                                isOpen: false,
                            },
                        ],
                    },
                },
                select: {
                    id: true,
                    name: true,
                    address: true,
                    phone: true,
                    email: true,
                    createdAt: true,
                    updatedAt: true,
                    workingHours: {
                        orderBy: {
                            dayOfWeek: "asc",
                        },
                    },
                },
            });
        }

        // Format the data
        return {
            success: true,
            data: {
                ...dealership,
                createdAt: dealership.createdAt.toISOString(),
                updatedAt: dealership.updatedAt.toISOString(),
            },
        };
    } catch (error) {
        throw new Error("Error fetching dealership info:" + error.message);
    }
}

export async function saveWorkingHours(workingHours) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        // Check if user is admin
        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user || user.role !== 'ADMIN') {
            throw new Error('Unauthorized: Admin access required')
        }

        const dealership = await db.dealershipInfo.findFirst();
        if (!dealership) {
            throw new Error("Dealership info not found");
        }

        await db.workingHour.deleteMany({
            where: {
                dealershipId: dealership.id
            }
        })

        for (const hour of workingHours) {
            await db.workingHour.create({
                data: {
                    dayOfWeek: hour.dayOfWeek,
                    openTime: hour.openTime,
                    closeTime: hour.closeTime,
                    isOpen: hour.isOpen,
                    dealershipId: dealership.id,
                }
            })
        }
        revalidatePath("/admin/settings")
        return {
            success: true
        }

    } catch (error) {
        return {
            success: false,
            error: error.message
        }
    }
}

export async function getUsers() {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        // Check if user is admin
        const adminUser = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!adminUser || adminUser.role !== "ADMIN") {
            throw new Error("Unauthorized: Admin access required");
        }

        //GET ALL USERS
        const users = await db.user.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        })

        return {
            success: true,
            data: users.map((user) => ({
                ...user,
                createdAt: user.createdAt.toISOString(),
                updatedAt: user.updatedAt.toISOString(),
            }))
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        }
    }
}

export async function updateHeroImage(base64Data) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user || user.role !== "ADMIN") {
            throw new Error("Unauthorized: Admin access required");
        }

        if (!base64Data || !base64Data.startsWith("data:image/")) {
            throw new Error("Invalid image data");
        }

        const dealership = await db.dealershipInfo.findFirst();
        if (!dealership) {
            throw new Error("Dealership info not found");
        }

        const base64 = base64Data.split(",")[1];
        const imageBuffer = Buffer.from(base64, "base64");
        const mimeMatch = base64Data.match(/data:image\/([a-zA-Z0-9]+);/);
        const fileExtension = mimeMatch ? mimeMatch[1] : "jpeg";
        const fileName = `hero-${Date.now()}.${fileExtension}`;
        const filePath = `site/hero/${fileName}`;

        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { error } = await supabase.storage
            .from("car-images")
            .upload(filePath, imageBuffer, {
                contentType: `image/${fileExtension}`,
                upsert: true,
            });

        if (error) {
            throw new Error(`Failed to upload image: ${error.message}`);
        }

        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/car-images/${filePath}`;

        await db.dealershipInfo.update({
            where: { id: dealership.id },
            data: { heroImageUrl: publicUrl },
        });

        revalidatePath("/");
        revalidatePath("/admin/settings");

        return {
            success: true,
            data: {
                heroImageUrl: publicUrl,
            },
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}

export async function updateUserRole(userId, role) {
    try {
        const { userId: adminId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        // Check if user is admin
        const user = await db.user.findUnique({
            where: { clerkUserId: adminId },
        });

        if (!user || user.role !== 'ADMIN') {
            throw new Error('Unauthorized: Admin access required')
        }

        await db.user.update({
            where: { id: userId },
            data: { role }
        })

        revalidatePath('/admin/settings');
        return {
            success: true
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        }
    }
}
