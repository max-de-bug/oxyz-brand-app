import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function GET() {
  try {
    const result = await cloudinary.search
      .expression("folder:photos/*")
      .sort_by("created_at", "desc")
      .execute();

    const logos = result.resources.map((resource: any) => ({
      id: resource.public_id,
      url: resource.secure_url,
      filename: resource.public_id.split("/").pop(),
    }));

    return NextResponse.json({ logos });
  } catch (error) {
    console.error("Error fetching logos from Cloudinary:", error);
    return NextResponse.json(
      { error: "Failed to fetch logos" },
      { status: 500 }
    );
  }
}
