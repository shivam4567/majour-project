"use server";
import { db } from "@/lib/prisma";
import { createClient } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";
import { serializeCarData } from "@/lib/helper";

async function fileToBase64(file) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    return buffer.toString("base64");
}

export const processCarImageWithAI = async (file) => {
    try {
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            throw new Error("Gemini Api Key is not Configured");
        }
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        //CONVERT FILE TO BASE 65
        const base64Image = await fileToBase64(file);

        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: file.type,
            },
        };

        //ANALYZE THE CAR IMAGE AND GIVE RESPONSE FROM GEMINI
        const prompt = `
        Analyze this car image and extract the following information:
        1. Make (manufacturer)
        2. Model
        3. Year (approximately)
        4. Color
        5. Body type (SUV, Sedan, Hatchback, etc.)
        6. Mileage
        7. Fuel type (your best guess)
        8. Transmission type (your best guess)
        9. Price (your best guess in the actual currency value, not in thousands. For example, if it's a $25000 car, return 25000 not 25)
        10. Short Description as to be added to a car listing
  
        Format your response as a clean JSON object with these fields:
        {
          "make": "",
          "model": "",
          "year": 0000,
          "color": "",
          "price": 0,
          "mileage": 0,
          "bodyType": "",
          "fuelType": "",
          "transmission": "",
          "description": "",
          "confidence": 0.0
        }
  
        For confidence, provide a value between 0 and 1 representing how confident you are in your overall identification.
        IMPORTANT: Make sure price is a NUMBER not a string, and it represents the FULL price value (not in thousands).
        Only respond with the JSON object, nothing else.
      `;

        const result = await model.generateContent([imagePart, prompt]);
        const response = await result.response;
        const text = response.text();
        const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
        try {
            const carDetails = JSON.parse(cleanedText);

            // Validate and fix price - ensure it's a proper number
            if (carDetails.price) {
                let price = typeof carDetails.price === 'string' 
                    ? parseFloat(carDetails.price) 
                    : carDetails.price;
                
                // Fix common AI mistakes with price scaling
                // If price seems too low (under 1000 for a car), multiply by reasonable factor
                if (price > 0 && price < 1000) {
                    // For realistic car prices, if under 1000, it's likely meant to be thousands
                    price = price * 1000;
                }
                
                carDetails.price = price;
            }

            // Ensure mileage is a number
            if (carDetails.mileage && typeof carDetails.mileage === 'string') {
                carDetails.mileage = parseInt(carDetails.mileage);
            }

            // Validate the response format
            const requiredFields = [
                "make",
                "model",
                "year",
                "color",
                "bodyType",
                "price",
                "mileage",
                "fuelType",
                "transmission",
                "description",
                "confidence",
            ];

            const missingFields = requiredFields.filter(
                (field) => !(field in carDetails)
            );

            if (missingFields.length > 0) {
                throw new Error(
                    `AI response missing required fields: ${missingFields.join(", ")}`
                );
            }

            // Return success response with data
            return {
                success: true,
                data: carDetails,
            };
        } catch (parseError) {
            console.error("Failed to parse AI response:", parseError);
            console.log("Raw response:", text);
            return {
                success: false,
                error: "Failed to parse AI response",
            };
        }
    } catch (e) {
        throw new Error("Gemini Api Error " + e.message);
    }
};

// Add a car to the database with images
export async function addCar({ carData, images }) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) throw new Error("User not found");

        // Create a unique folder name for this car's images
        const carId = uuidv4();
        const folderPath = `cars/${carId}`;

        // Initialize Supabase client for server-side operations
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        // Upload all images to Supabase storage
        const imageUrls = [];

        for (let i = 0; i < images.length; i++) {
            const base64Data = images[i];

            // Skip if image data is not valid
            if (!base64Data || !base64Data.startsWith("data:image/")) {
                console.warn("Skipping invalid image data");
                continue;
            }

            // Extract the base64 part (remove the data:image/xyz;base64, prefix)
            const base64 = base64Data.split(",")[1];
            const imageBuffer = Buffer.from(base64, "base64");

            // Determine file extension from the data URL
            const mimeMatch = base64Data.match(/data:image\/([a-zA-Z0-9]+);/);
            const fileExtension = mimeMatch ? mimeMatch[1] : "jpeg";

            // Create filename
            const fileName = `image-${Date.now()}-${i}.${fileExtension}`;
            const filePath = `${folderPath}/${fileName}`;

            // Upload the file buffer directly
            const { data, error } = await supabase.storage
                .from("car-images")
                .upload(filePath, imageBuffer, {
                    contentType: `image/${fileExtension}`,
                });

            if (error) {
                console.error("Error uploading image:", error);
                throw new Error(`Failed to upload image: ${error.message}`);
            }

            // Get the public URL for the uploaded file
            const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/car-images/${filePath}`; // disable cache in config

            imageUrls.push(publicUrl);
        }

        if (imageUrls.length === 0) {
            throw new Error("No valid images were uploaded");
        }

        // Add the car to the database
        const car = await db.car.create({
            data: {
                id: carId, // Use the same ID we used for the folder
                make: carData.make,
                model: carData.model,
                year: carData.year,
                price: carData.price,
                mileage: carData.mileage,
                color: carData.color,
                fuelType: carData.fuelType,
                transmission: carData.transmission,
                bodyType: carData.bodyType,
                seats: carData.seats,
                description: carData.description,
                status: carData.status,
                featured: carData.featured,
                images: imageUrls, // Store the array of image URLs
            },
        });
        console.log('car', car);

        // Revalidate the cars list page
        revalidatePath("/admin/cars");

        return {
            success: true,
        };
    } catch (error) {
        throw new Error("Error adding car:" + error.message);
    }
}

export async function getCars(search = "") {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error('Unauthorized');

        const user = await db.user.findUnique({
            where: {
                clerkUserId: userId
            }
        })
        if (!user) throw new Error("User not found");
        let where = {};
        if (search) {
            where.OR = [
                { make: { contains: search, mode: 'insensitive' } },
                { model: { contains: search, mode: 'insensitive' } },
                { color: { contains: search, mode: 'insensitive' } },

            ]
        }
        const cars = await db.car.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        })

        const serializedCars = cars.map(serializeCarData);
        return {
            success: true,
            data: serializedCars
        }

    } catch (error) {
        console.error('Error fetching cars', error);
        return {
            success: false,
            error: error.message
        }
    }
}

// Delete a car by ID
export async function deleteCar(id) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        // First, fetch the car to get its images
        const car = await db.car.findUnique({
            where: { id },
            select: { images: true },
        });

        if (!car) {
            return {
                success: false,
                error: "Car not found",
            };
        }

        // Delete the car from the database
        await db.car.delete({
            where: { id },
        });

        // Delete the images from Supabase storage
        try {
            const cookieStore = cookies();
            const supabase = createClient(cookieStore);

            // Extract file paths from image URLs
            const filePaths = car.images
                .map((imageUrl) => {
                    const url = new URL(imageUrl);
                    const pathMatch = url.pathname.match(/\/car-images\/(.*)/);
                    return pathMatch ? pathMatch[1] : null;
                })
                .filter(Boolean);

            // Delete files from storage if paths were extracted
            if (filePaths.length > 0) {
                const { error } = await supabase.storage
                    .from("car-images")
                    .remove(filePaths);

                if (error) {
                    console.error("Error deleting images:", error);
                    // We continue even if image deletion fails
                }
            }
        } catch (storageError) {
            console.error("Error with storage operations:", storageError);
            // Continue with the function even if storage operations fail
        }

        // Revalidate the cars list page
        revalidatePath("/admin/cars");

        return {
            success: true,
        };
    } catch (error) {
        console.error("Error deleting car:", error);
        return {
            success: false,
            error: error.message,
        };
    }
}


// Update car status or featured status
export async function updateCarStatus(id, { status, featured }) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const updateData = {};

        if (status !== undefined) {
            updateData.status = status;
        }

        if (featured !== undefined) {
            updateData.featured = featured;
        }

        // Update the car
        await db.car.update({
            where: { id },
            data: updateData,
        });

        // Revalidate the cars list page
        revalidatePath("/admin/cars");

        return {
            success: true,
        };
    } catch (error) {
        console.error("Error updating car status:", error);
        return {
            success: false,
            error: error.message,
        };
    }
}