import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get the token from the request headers
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Get query parameters
    const url = new URL(request.url);
    const reportType = url.searchParams.get("type") || "excel";
    const startDate = url.searchParams.get("start_date");
    const endDate = url.searchParams.get("end_date");

    let backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/reports/${reportType}/`;
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (params.toString()) {
      backendUrl += `?${params.toString()}`;
    }

    // Forward the request to the Django backend
    const backendResponse = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.text();
      return new NextResponse(errorData, {
        status: backendResponse.status,
        headers: {
          "Content-Type":
            backendResponse.headers.get("Content-Type") ||
            "application/octet-stream",
          "Content-Disposition":
            backendResponse.headers.get("Content-Disposition") ||
            "attachment; filename=report",
        },
      });
    }

    const data = await backendResponse.arrayBuffer();
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type":
          backendResponse.headers.get("Content-Type") ||
          "application/octet-stream",
        "Content-Disposition":
          backendResponse.headers.get("Content-Disposition") ||
          "attachment; filename=report",
      },
    });
  } catch (error) {
    console.error("Reports API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
