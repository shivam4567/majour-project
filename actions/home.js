'use server'

import { serializeCarData } from "@/lib/helper"
import { db } from "@/lib/prisma"
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function fileToBase64(file) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    return buffer.toString("base64");
}

//GET FEATURED CARS
export async function getFeaturedCars(limit = 3) {
    try {
        const cars = await db.car.findMany({
            where: {
                featured: true,
                status: 'AVAILABLE'
            },
            take: limit,
            orderBy: {
                createdAt: "desc"
            }
        })
        return cars.map(serializeCarData)
    } catch (error) {
        throw new Error("Error fetching cars" + error.message)
    }
}

export async function getHeroImage() {
    try {
        const dealership = await db.dealershipInfo.findFirst({
            select: { heroImageUrl: true },
        });
        return dealership?.heroImageUrl || "/3.jpg";
    } catch (error) {
        return "/3.jpg";
    }
}

export async function processImageSearch(file) {
    try {
        // Get request data for ArcJet
        const req = await request();

        // Check rate limit
        const decision = await aj.protect(req, {
            requested: 1, // Specify how many tokens to consume
        });

        if (decision.isDenied()) {
            if (decision.reason.isRateLimit()) {
                const { remaining, reset } = decision.reason;
                console.error({
                    code: "RATE_LIMIT_EXCEEDED",
                    details: {
                        remaining,
                        resetInSeconds: reset,
                    },
                });

                throw new Error("Too many requests. Please try again later.");
            }

            throw new Error("Request blocked");
        }

        // Check if API key is available
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            throw new Error("Gemini API key is not configured");
        }

        // Initialize Gemini API
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        // Convert image file to base64
        const base64Image = await fileToBase64(file);

        // Create image part for the model
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: file.type,
            },
        };

        // Define the prompt for car search extraction
        const prompt = `
        Analyze this car image and extract the following information for a search query:
        1. Make (manufacturer)
        2. Model
        3. Body type (SUV, Sedan, Hatchback, etc.)
        4. Color
  
        Format your response as a clean JSON object with these fields:
        {
          "make": "",
          "model": "",
          "bodyType": "",
          "color": "",
          "confidence": 0.0
        }
  
        For confidence, provide a value between 0 and 1 representing how confident you are in your overall identification.
        Only respond with the JSON object, nothing else.
      `;

        // Get response from Gemini
        const result = await model.generateContent([imagePart, prompt]);
        const response = await result.response;
        const text = response.text();
        const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

        // Parse the JSON response
        try {
            const carDetails = JSON.parse(cleanedText);

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
    } catch (error) {
        throw new Error("AI Search error:" + error.message);
    }
}
