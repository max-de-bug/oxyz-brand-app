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

  const resizedLogo = await logo
    .resize(Math.floor(width! * 0.2), null, { fit: "inside" })
    .toBuffer();

  const processedImage = await image
    .composite([
      {
        input: resizedLogo,
        top: position.y,
        left: position.x,
      },
    ])
    .toBuffer();

  const base64Image = `data:image/png;base64, ${processedImage.toString(
    "base64"
  )}`;
  return base64Image;
}
