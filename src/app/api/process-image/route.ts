import { NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(request: Request) {
  const { imageUrl, logoUrl, position } = await request.json();

  try {
    // Fetch the image and logo from their URLs
    const imageResponse = await fetch(imageUrl);
    const logoResponse = await fetch(logoUrl);

    if (!imageResponse.ok || !logoResponse.ok) {
      throw new Error("Failed to fetch image or logo");
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const logoBuffer = await logoResponse.arrayBuffer();

    const image = sharp(Buffer.from(imageBuffer));
    const logo = sharp(Buffer.from(logoBuffer));

    // Get the original dimensions of the image
    const { width: imageWidth, height: imageHeight } = await image.metadata();
    if (!imageWidth || !imageHeight) throw new Error("Invalid image metadata");

    // Set a fixed logo size similar to the frontend
    const logoWidth = Math.floor(imageWidth * 0.2); // 20% of main image width
    const logoHeight = Math.floor(logoWidth * (80 / 160)); // Maintain aspect ratio

    // Resize the logo
    const resizedLogo = await logo
      .resize(logoWidth, logoHeight, { fit: "inside" })
      .toBuffer();

    // Ensure the logo position is within bounds
    const topPosition = Math.min(
      Math.max(0, Math.round(position.y)),
      imageHeight - logoHeight
    );
    const leftPosition = Math.min(
      Math.max(0, Math.round(position.x)),
      imageWidth - logoWidth
    );

    // Composite the images
    const compositeImage = await image.composite([
      {
        input: resizedLogo,
        top: topPosition,
        left: leftPosition,
      },
    ]);

    const processedImageBuffer = await compositeImage.toBuffer();
    return new NextResponse(processedImageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="processed-image.png"`,
      },
    });
  } catch (error) {
    console.error("Error processing image:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process image" },
      { status: 500 }
    );
  }
}
