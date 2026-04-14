"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

interface HeatmapData {
  bacteria: string;
  antibiotic: string;
  resistance: number;
}

interface Filters {
  dateFrom: string;
  dateTo: string;
  bacteria: string;
  department: string;
  hospital: string;
  sampleType: string;
  antibiotic: string;
  sensitivity: string;
}

interface HeatmapProps {
  filters?: Partial<Filters>;
}

export default function Heatmap({ filters: propFilters }: HeatmapProps) {
  const { logout, isAuthenticated } = useAuth();
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);

  // Use propFilters if provided, otherwise use empty object
  const filters = propFilters || {
    dateFrom: "",
    dateTo: "",
    bacteria: "",
    department: "",
    hospital: "",
    sampleType: "",
    antibiotic: "",
    sensitivity: "",
  };

  useEffect(() => {
    if (localStorage.getItem("access_token") && isAuthenticated) {
      fetchHeatmapData();
    }
  }, [isAuthenticated, filters]);

  const fetchHeatmapData = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const params = new URLSearchParams();
      if (filters.dateFrom) params.append("date_from", filters.dateFrom);
      if (filters.dateTo) params.append("date_to", filters.dateTo);
      if (filters.bacteria && filters.bacteria !== "all")
        params.append("bacteria", filters.bacteria);
      if (filters.department && filters.department !== "all")
        params.append("department", filters.department);
      if (filters.hospital && filters.hospital !== "all")
        params.append("hospital", filters.hospital);
      if (filters.sampleType && filters.sampleType !== "all")
        params.append("sample_type", filters.sampleType);
      if (filters.antibiotic && filters.antibiotic !== "all")
        params.append("antibiotic", filters.antibiotic);
      if (filters.sensitivity && filters.sensitivity !== "all")
        params.append("sensitivity", filters.sensitivity);

      const queryString = params.toString();
      const urlSuffix = queryString ? `?${queryString}` : "";

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/resistance-heatmap/${urlSuffix}`,
        { headers },
      );
      setHeatmapData(response.data);
    } catch (error: any) {
      console.error("Error fetching heatmap data:", error);
      if (error.response?.status === 401) {
        console.error("Authentication failed. Please log in again.");
        logout();
      }
    }
  };

  const getColor = (resistance: number) => {
    if (resistance < 0.3) return "bg-green-500 text-white";
    if (resistance < 0.7) return "bg-yellow-500 text-white";
    return "bg-red-500 text-white";
  };

  const getSIR = (resistance: number) => {
    if (resistance < 0.3) return "S";
    if (resistance < 0.7) return "I";
    return "R";
  };

  const uniqueBacteria = [...new Set(heatmapData.map((d) => d.bacteria))];
  const uniqueAntibiotics = [...new Set(heatmapData.map((d) => d.antibiotic))];

  return (
    <div className="space-y-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Resistance Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 bg-muted">Bacteria / Antibiotic</th>
                  {uniqueAntibiotics.map((antibiotic) => (
                    <th
                      key={antibiotic}
                      className="border p-2 bg-muted text-xs"
                    >
                      {antibiotic}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uniqueBacteria.map((bacteria) => (
                  <tr key={bacteria}>
                    <td className="border p-2 font-medium bg-muted/50">
                      {bacteria}
                    </td>
                    {uniqueAntibiotics.map((antibiotic) => {
                      const data = heatmapData.find(
                        (d) =>
                          d.bacteria === bacteria &&
                          d.antibiotic === antibiotic,
                      );
                      const resistance = data ? data.resistance : 0;
                      return (
                        <td
                          key={`${bacteria}-${antibiotic}`}
                          className={`border p-2 text-center ${getColor(resistance)}`}
                        >
                          {getSIR(resistance)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 mr-2"></div>S (Sensitive)
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 mr-2"></div>I (Intermediate)
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 mr-2"></div>R (Resistant)
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
