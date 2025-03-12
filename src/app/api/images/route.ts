import { db } from "@/drizzle/schema";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { logos } from "@/drizzle/schema";
import cloudinary from "@/lib/cloudinary";

export async function GET() {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cloudinaryResult = await cloudinary.search
      .expression("folder:logos/*")
      .sort_by("created_at", "desc")
      .execute();

    const cloudinaryLogos = cloudinaryResult.resources.map((resource) => ({
      id: resource.public_id,
      url: resource.secure_url,
      filename: resource.public_id.split("/").pop(),
      source: "cloudinary",
    }));
    return NextResponse.json({ logos: cloudinaryLogos });
  } catch (error) {
    console.error("Error fetching logos:", error);
    return NextResponse.json(
      { error: "Failed to fetch logos" },
      { status: 500 }
    );
  }
}
