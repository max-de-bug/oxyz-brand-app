import { NextResponse } from "next/server"
import path from "path"
import sharp from "sharp"

export async function POST(request: Request) {
    const {imageUrl, logoUrl, position} = await request.json()


try {
    const imagePath = path.join(process.cwd(), "public", imageUrl)
const logoPath = path.join(process.cwd(), "public", logoUrl)

const image = sharp(imagePath)
const logo = sharp(logoPath)

const {width: logoWidth, height: logoHeight} = await logo.metadata()

const compositeImage = await image.composite([
    {
        input: await logo.toBuffer(),
        top: Math.round(position.y),
        left: Math.round(position.x)
    }
])

const processedImageBuffer = await compositeImage.toBuffer()
return new NextResponse(processedImageBuffer, {
    headers: {
        "Content-Type": "image/png",
        "Content-Disposition": "attachment",
        "filename-processed-image.png",
    }
})
} catch (error) {
    console.error("Error processing image:", error)
    return NextResponse.json({success: false, error: "Failed to process image" }, {status: 500})
}

}