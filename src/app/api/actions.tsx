import sharp from "sharp";

export async function processImage(
  imageUrl: string,
  logoUrl: string,
  position: { x: number; y: number }
) {
  const imageResponse = await fetch(imageUrl);
  const logoResponse = await fetch(logoUrl);
  const imageBuffer = await imageResponse.arrayBuffer();
  const logoBuffer = await logoResponse.arrayBuffer();

  const image = sharp(Buffer.from(imageBuffer));
  const logo = sharp(Buffer.from(logoBuffer));

  const { width, height } = await image.metadata();

  // Resize the logo based on a fixed size
  const logoWidth = 160; // Set your desired logo width
  const logoHeight = 80; // Set your desired logo height

  const resizedLogo = await logo
    .resize(logoWidth, logoHeight, { fit: "inside" })
    .toBuffer();

  // Ensure the position is within the bounds of the image
  const topPosition = Math.min(Math.round(position.y), height - logoHeight);
  const leftPosition = Math.min(Math.round(position.x), width - logoWidth);

  const processedImage = await image
    .composite([
      {
        input: resizedLogo,
        top: topPosition,
        left: leftPosition,
      },
    ])
    .toBuffer();

  const base64Image = `data:image/png;base64, ${processedImage.toString(
    "base64"
  )}`;
  return base64Image;
}
