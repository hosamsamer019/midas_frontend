"use client";

import React from "react";
import { ResponsiveContainer } from "recharts";

interface ChartContainerProps {
  children: React.ReactNode;
  height?: number | string;
  minHeight?: number | string;
  width?: number | string;
  aspect?: number;
  className?: string;
  loading?: boolean;
  hasData?: boolean;
  loadingMessage?: string;
  noDataMessage?: string;
}

/**
 * A unified chart container component that ensures proper dimensions for ResponsiveContainer.
 * This prevents the "width(-1) and height(-1)" warning by guaranteeing a valid parent container.
 * 
 * @param children - The chart component (e.g., PieChart, BarChart, LineChart)
 * @param height - Fixed height for the container (default: 300)
 * @param minHeight - Minimum height for the container
 * @param width - Width of the container (default: 100%)
 * @param aspect - Aspect ratio (alternative to height)
 * @param className - Additional CSS classes
 * @param loading - Whether data is loading
 * @param hasData - Whether chart has data to display
 * @param loadingMessage - Custom loading message
 * @param noDataMessage - Custom no data message
 */
export default function ChartContainer({
  children,
  height = 300,
  minHeight,
  width = "100%",
  aspect,
  className = "",
  loading = false,
  hasData = true,
  loadingMessage = "Loading data...",
  noDataMessage = "No data available",
}: ChartContainerProps) {
  // Convert height to pixel value if it's a string (like "100%" or Tailwind class)
  const getPixelHeight = (h: number | string | undefined): number => {
    if (typeof h === 'number') return h;
    if (typeof h === 'string') {
      // If it's already a pixel value
      if (h.endsWith('px')) {
        return parseInt(h, 10);
      }
      // If it's a percentage, we can't use it - use default
      if (h.endsWith('%')) {
        return 300;
      }
      // If it's a Tailwind class like h-48, use default
      return 300;
    }
    return 300;
  };

  // Get pixel height value
  const pixelHeight = getPixelHeight(height);
  
  // Determine container styles - always use explicit pixel height
  const containerStyle: React.CSSProperties = {
    width: width === "100%" ? "100%" : width,
    height: pixelHeight,
    minHeight: minHeight ? getPixelHeight(minHeight) : pixelHeight,
  };

  // Show loading state
  if (loading) {
    return (
      <div
        className={`w-full flex items-center justify-center ${className}`}
        style={containerStyle}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        {loadingMessage && (
          <span className="ml-2 text-muted-foreground">{loadingMessage}</span>
        )}
      </div>
    );
  }

  // Show no data state
  if (!hasData) {
    return (
      <div
        className={`w-full flex items-center justify-center text-muted-foreground ${className}`}
        style={containerStyle}
      >
        {noDataMessage}
      </div>
    );
  }

  // Render chart with ResponsiveContainer - use explicit pixel height
  return (
    <div className={`w-full ${className}`} style={containerStyle}>
      <ResponsiveContainer
        width="100%"
        height={pixelHeight}
        minWidth={300}
        minHeight={minHeight ? getPixelHeight(minHeight) : 200}
      >
        {children}
      </ResponsiveContainer>
    </div>
  );
}
