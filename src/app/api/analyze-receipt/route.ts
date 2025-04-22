import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

// Define Zod schema for receipt data
const ReceiptItem = z.object({
  name: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  totalPrice: z.number(),
});

const ReceiptAnalysis = z.object({
  items: z.array(ReceiptItem),
  subtotal: z.number(),
  taxPercent: z.number(),
  taxAmount: z.number(),
  total: z.number(),
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  console.log("API route called: /api/analyze-receipt");

  try {
    // Parse the form data
    console.log("Parsing form data...");
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      console.error("No image provided in the request");
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    console.log(
      "Image received:",
      imageFile.name,
      imageFile.type,
      `${Math.round(imageFile.size / 1024)}KB`
    );

    try {
      // Convert the image file to a buffer
      console.log("Converting image to buffer...");
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Convert buffer to base64
      console.log("Converting buffer to base64...");
      const base64Image = buffer.toString("base64");
      console.log("Base64 conversion complete. Length:", base64Image.length);

      // Call OpenAI API with structured output
      console.log("Calling OpenAI API with structured output...");
      try {
        const completion = await openai.beta.chat.completions.parse({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analyze this receipt and extract all items with their quantities, names, and prices. Also extract tax information.",
                },
                {
                  type: "image_url",
                  image_url: {
                    detail: "high",
                    url: `data:${imageFile.type};base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 1500,
          response_format: zodResponseFormat(
            ReceiptAnalysis,
            "receipt_analysis"
          ),
        });

        console.log("OpenAI API response received with structured output");

        // The response is already validated by Zod
        const receiptData = completion.choices[0].message.parsed;

        if (!receiptData) {
          console.error("Parsed data is null");
          throw new Error("Failed to parse receipt data");
        }

        // Add IDs to items for frontend use
        const structuredData = {
          ...receiptData,
          items: receiptData.items.map((item, index) => ({
            id: `item-${index}`,
            ...item,
          })),
        };

        console.log("Returning structured data");
        return NextResponse.json({ data: structuredData });
      } catch (parseError) {
        console.error("Error with structured output:", parseError);

        // Return a fallback structure if parsing fails
        console.log("Returning fallback structure");
        return NextResponse.json({
          data: {
            items: [],
            subtotal: 0,
            taxPercent: 0,
            taxAmount: 0,
            total: 0,
            error:
              parseError instanceof Error
                ? parseError.message
                : "Unknown error with structured output",
          },
        });
      }
    } catch (processingError: unknown) {
      console.error("Error processing image:", processingError);
      const errorMessage =
        processingError instanceof Error
          ? processingError.message
          : "Unknown error processing image";
      return NextResponse.json(
        { error: `Error processing image: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error("Error analyzing receipt:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error analyzing receipt";
    return NextResponse.json(
      { error: `Failed to analyze receipt: ${errorMessage}` },
      { status: 500 }
    );
  }
}
