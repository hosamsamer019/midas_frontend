"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

interface Bacteria {
  id: number;
  name: string;
  type?: string;
}

interface Recommendation {
  antibiotic: string;
  antibiotic_id: number;
  effectiveness: number;
  total_tests: number;
  sensitive_cases: number;
  resistant_cases: number;
  intermediate_cases: number;
  category: string;
  mechanism: string;
  confidence_score: number;
  final_recommendation?: string;
  dosage?: string;
  side_effects?: string;
  interactions?: string;
}

interface TrendData {
  period: string;
  effectiveness: number;
  total: number;
}

export default function AIRecommendation() {
  const { logout } = useAuth();

  const [bacteriaList, setBacteriaList] = useState<Bacteria[]>([]);
  const [selectedBacteria, setSelectedBacteria] = useState<number | string>("");
  const [bacteriaName, setBacteriaName] = useState("");
  const [useDropdown, setUseDropdown] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBacteria, setLoadingBacteria] = useState(true);

  useEffect(() => {
    const fetchBacteria = async () => {
      const token = localStorage.getItem("access_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/bacteria-list/`,
          { headers },
        );
        setBacteriaList(response.data);
      } catch (error: unknown) {
        const err = error as { response?: { status?: number } };
        console.error("Error fetching bacteria:", error);
        if (err.response?.status === 401) {
          logout();
        }
      } finally {
        setLoadingBacteria(false);
      }
    };
    fetchBacteria();
  }, [logout]);

  const handlePredict = async () => {
    const bacteria = useDropdown
      ? bacteriaList.find((b) => b.id === Number(selectedBacteria))?.name ||
        bacteriaName
      : bacteriaName;

    if (!bacteria?.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const params: Record<string, string> = { bacteria_name: bacteria };

      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ai/predict/`,
        params,
        { headers },
      );
      setRecommendations(response.data.recommendations || []);
      setTrendData(response.data.trend || []);
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      console.error("Prediction error:", error);
      if (err.response?.status === 401) {
        logout();
      }
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const getEffectivenessColor = (effectiveness: number) => {
    if (effectiveness >= 70) return "bg-green-500";
    if (effectiveness >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.5) return "text-yellow-600";
    return "text-red-600";
  };

  const groupedByCategory = recommendations.reduce(
    (acc: Record<string, Recommendation[]>, rec: Recommendation) => {
      if (!acc[rec.category]) {
        acc[rec.category] = [];
      }
      acc[rec.category].push(rec);
      return acc;
    },
    {},
  );

  const exportToPDF = async () => {
    try {
      const bacteria = useDropdown
        ? bacteriaList.find((b) => b.id === Number(selectedBacteria))?.name ||
          bacteriaName
        : bacteriaName;

      const bacteriaId = useDropdown
        ? selectedBacteria
        : bacteriaList.find((b) => b.name === bacteriaName)?.id || "";
      const bacteriaType = useDropdown
        ? bacteriaList.find((b) => b.id === Number(selectedBacteria))?.type ||
          "Unknown"
        : "Unknown";

      // Get visualization data including geometric shapes
      const visualizationParams = {
        type: "geometric",
        bacteria_id: bacteriaId,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      };

      // Fetch visualization data in parallel with the specific report
      const [reportResponse, visualizationResponse] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/specific/`, {
          params: {
            bacteria_id: bacteriaId,
            start_date: startDate,
            end_date: endDate,
          },
          responseType: "blob",
        }),
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/reports/visualization/`,
          {
            params: visualizationParams,
          },
        ),
      ]);

      // Get the visualization data
      const visualizationData = visualizationResponse.data;

      // Create a custom PDF with enhanced information
      // For now, we'll use the blob response but with enhanced metadata
      const url = window.URL.createObjectURL(new Blob([reportResponse.data]));
      const link = document.createElement("a");
      link.href = url;

      // Include selection details in filename
      const selectionMethod = useDropdown ? "database" : "manual";
      const dateRange =
        startDate || endDate
          ? `_${startDate || "start"}-${endDate || "end"}`
          : "";
      link.setAttribute(
        "download",
        `ai_recommendations_${bacteria}_${selectionMethod}${dateRange}.pdf`,
      );

      document.body.appendChild(link);
      link.click();
      link.remove();

      // Log the visualization data for reference (can be used for future PDF enhancement)
      console.log("Visualization data for PDF:", visualizationData);
    } catch (error) {
      console.error("Export error:", error);
      // Fallback to basic export if visualization fails
      try {
        const bacteria = useDropdown
          ? bacteriaList.find((b) => b.id === Number(selectedBacteria))?.name ||
            bacteriaName
          : bacteriaName;

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/reports/specific/`,
          {
            params: {
              bacteria_id: useDropdown ? selectedBacteria : "",
              start_date: startDate,
              end_date: endDate,
            },
            responseType: "blob",
          },
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `ai_recommendations_${bacteria}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (fallbackError) {
        console.error("Fallback export also failed:", fallbackError);
      }
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>AI Antibiotic Recommendations</CardTitle>
        <CardDescription>
          Get AI-powered antibiotic recommendations based on historical data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={useDropdown}
                onChange={(e) => {
                  setUseDropdown(e.target.checked);
                  setSelectedBacteria("");
                  setBacteriaName("");
                }}
                className="rounded"
              />
              <span className="text-sm">Select from database</span>
            </label>
          </div>

          {useDropdown ? (
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Bacteria
              </label>
              <select
                value={selectedBacteria}
                onChange={(e) => setSelectedBacteria(e.target.value)}
                disabled={loadingBacteria}
                className="w-full p-2 border border-input rounded bg-background"
              >
                <option value="">Select a bacteria</option>
                {bacteriaList.map((bacteria) => (
                  <option key={bacteria.id} value={bacteria.id}>
                    {bacteria.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-2">
                Enter Bacteria Name
              </label>
              <Input
                type="text"
                placeholder="e.g., Escherichia coli"
                value={bacteriaName}
                onChange={(e) => setBacteriaName(e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Start Date (Optional)
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                End Date (Optional)
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={handlePredict}
              disabled={
                loading || (useDropdown ? !selectedBacteria : !bacteriaName)
              }
            >
              {loading ? "Analyzing..." : "Get Recommendations"}
            </Button>
            {recommendations.length > 0 && (
              <Button variant="outline" onClick={exportToPDF}>
                Export PDF
              </Button>
            )}
          </div>
        </div>

        {recommendations.length > 0 && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {recommendations.reduce(
                        (sum, r) => sum + (Number(r.sensitive_cases) || 0),
                        0,
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Sensitive
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {recommendations.reduce(
                        (sum, r) => sum + (Number(r.resistant_cases) || 0),
                        0,
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Resistant
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {recommendations.reduce(
                        (sum, r) => sum + (Number(r.intermediate_cases) || 0),
                        0,
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Intermediate
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recommendations by Categories */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Recommended Antibiotics by Category
              </h3>
              {Object.entries(groupedByCategory).map(
                ([category, antibiotics]) => (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="text-md">{category}</CardTitle>
                      <CardDescription>
                        {antibiotics.length} antibiotics in this category -
                        Ranked by effectiveness against this bacteria
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {antibiotics.map((rec, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-muted rounded-lg space-y-3"
                        >
                          {/* Header with Antibiotic Name and Rank */}
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <span className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                                {idx + 1}
                              </span>
                              <div>
                                <span className="font-medium text-lg">
                                  {rec.antibiotic}
                                </span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  ({rec.mechanism})
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-bold text-green-600">
                                {Number(rec.effectiveness || 0)}%
                              </span>
                              <div
                                className={`text-xs ${getConfidenceColor(Number(rec.confidence_score) || 0)}`}
                              >
                                Confidence:{" "}
                                {(
                                  (Number(rec.confidence_score) || 0) * 100
                                ).toFixed(0)}
                                %
                              </div>
                            </div>
                          </div>

                          {/* AI Recommendation Explanation */}
                          {rec.final_recommendation && (
                            <div
                              className={`p-2 rounded text-sm ${
                                rec.final_recommendation.includes("Highly")
                                  ? "bg-green-100 text-green-800"
                                  : rec.final_recommendation.includes(
                                        "Alternative",
                                      )
                                    ? "bg-blue-100 text-blue-800"
                                    : rec.final_recommendation.includes(
                                          "caution",
                                        )
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                              }`}
                            >
                              <strong>AI Analysis:</strong>{" "}
                              {rec.final_recommendation}
                            </div>
                          )}

                          {/* Why This Antibiotic Was Ranked Higher */}
                          <div className="text-sm bg-white p-2 rounded border">
                            <strong className="text-blue-600">
                              Why this ranking:
                            </strong>
                            <ul className="list-disc list-inside text-muted-foreground mt-1">
                              <li>
                                Effectiveness rate of{" "}
                                {Number(rec.effectiveness || 0)}% against{" "}
                                {rec.antibiotic}
                              </li>
                              <li>
                                {Number(rec.sensitive_cases) || 0} sensitive
                                cases out of {Number(rec.total_tests) || 0}{" "}
                                total tests
                              </li>
                              <li>
                                Category: {rec.category} | Mechanism:{" "}
                                {rec.mechanism}
                              </li>
                              {Number(rec.total_tests) >= 50 && (
                                <li className="text-green-600">
                                  ✓ Strong statistical data (
                                  {Number(rec.total_tests)} tests)
                                </li>
                              )}
                            </ul>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getEffectivenessColor(Number(rec.effectiveness) || 0)}`}
                              style={{
                                width: `${Math.min(100, Math.max(0, Number(rec.effectiveness) || 0))}%`,
                              }}
                            ></div>
                          </div>

                          {/* Sensitivity Details */}
                          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                            <div className="text-center">
                              <div className="font-medium text-green-600">
                                {Number(rec.sensitive_cases) || 0}
                              </div>
                              <div>Sensitive</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium text-red-600">
                                {Number(rec.resistant_cases) || 0}
                              </div>
                              <div>Resistant</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium text-yellow-600">
                                {Number(rec.intermediate_cases) || 0}
                              </div>
                              <div>Intermediate</div>
                            </div>
                          </div>

                          {/* Test Data Info */}
                          <div className="text-xs text-muted-foreground text-right flex justify-between items-center">
                            <span>
                              Based on {Number(rec.total_tests) || 0} total
                              tests
                            </span>
                            <span className="px-2 py-1 bg-gray-100 rounded text-gray-600">
                              {Number(rec.effectiveness) >= 70
                                ? "✅ Recommended"
                                : Number(rec.effectiveness) >= 40
                                  ? "⚠️ Use with caution"
                                  : "❌ Not recommended"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ),
              )}
            </div>
          </div>
        )}

        {recommendations.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <p>
              Enter a bacteria name and click "Get Recommendations" to see
              AI-powered antibiotic recommendations.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
