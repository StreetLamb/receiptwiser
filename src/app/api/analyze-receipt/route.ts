import { OpenAI } from "openai";
import { NextResponse } from "next/server";

// Interface for the raw item data from OpenAI
interface OpenAIReceiptItem {
  name?: string;
  quantity?: number | string;
  unitPrice?: number | string;
  totalPrice?: number | string;
}

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

      // Create a mock response for testing
      if (
        !process.env.OPENAI_API_KEY ||
        process.env.OPENAI_API_KEY === "your_openai_api_key_here"
      ) {
        console.log("Using mock data (no valid API key)");
        return NextResponse.json({
          data: {
            items: [
              {
                id: "item-0",
                name: "Coffee",
                quantity: 1,
                unitPrice: 3.5,
                totalPrice: 3.5,
              },
              {
                id: "item-1",
                name: "Sandwich",
                quantity: 1,
                unitPrice: 7.95,
                totalPrice: 7.95,
              },
            ],
            subtotal: 11.45,
            taxPercent: 8.25,
            taxAmount: 0.94,
            total: 12.39,
          },
        });
      }

      // Call OpenAI API
      console.log("Calling OpenAI API...");
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this receipt and extract all items with their quantities, names, and prices. Also extract tax information. Format the response as a JSON object with the following structure: { items: [{ name: string, quantity: number, unitPrice: number, totalPrice: number }], subtotal: number, taxPercent: number, taxAmount: number, total: number }",
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
        response_format: { type: "json_object" },
      });

      console.log("OpenAI API response received");

      // Process the response
      const content = response.choices[0].message.content;
      if (!content) {
        console.error("Empty content in OpenAI response");
        throw new Error("Invalid response content");
      }

      console.log(
        "OpenAI response content:",
        content.substring(0, 200) + "..."
      );

      try {
        // Parse the JSON response from OpenAI
        console.log("Parsing JSON response...");
        const parsedData = JSON.parse(content);
        console.log("JSON parsed successfully");

        // Ensure the data has the expected structure
        console.log("Creating structured data...");
        const structuredData = {
          items: Array.isArray(parsedData.items)
            ? parsedData.items.map(
                (item: OpenAIReceiptItem, index: number) => ({
                  id: `item-${index}`,
                  name: item.name || "Unknown item",
                  quantity: Number(item.quantity) || 1,
                  unitPrice: Number(item.unitPrice) || 0,
                  totalPrice: Number(item.totalPrice) || 0,
                })
              )
            : [],
          subtotal: Number(parsedData.subtotal) || 0,
          taxPercent: Number(parsedData.taxPercent) || 0,
          taxAmount: Number(parsedData.taxAmount) || 0,
          total: Number(parsedData.total) || 0,
        };

        console.log("Returning structured data");
        return NextResponse.json({ data: structuredData });
      } catch (parseError) {
        console.error("Error parsing OpenAI response:", parseError);
        console.log("Raw content:", content);

        // Return a fallback structure if parsing fails
        console.log("Returning fallback structure");
        return NextResponse.json({
          data: {
            items: [],
            subtotal: 0,
            taxPercent: 0,
            taxAmount: 0,
            total: 0,
            rawContent: content,
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
