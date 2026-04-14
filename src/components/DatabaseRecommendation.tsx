"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "./ui/badge";
import { Loader2, Database, TrendingUp, AlertCircle } from "lucide-react";

interface Recommendation {
  antibiotic: string;
  effectiveness: number;
  total_tests: number;
  sensitive_cases: number;
  category: string;
  mechanism: string;
}

interface ApiResponse {
  bacteria: string;
  recommendations: Recommendation[];
  total_antibiotics: number;
  tested_antibiotics: number;
}

export default function DatabaseRecommendation() {
  const [selectedBacteria, setSelectedBacteria] = useState<string>("");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [bacteriaList, setBacteriaList] = useState<string[]>([]);

  // Fetch bacteria list on component mount
  useEffect(() => {
    fetchBacteriaList();
  }, []);

  const fetchBacteriaList = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/bacteria-list/");
      if (response.ok) {
        const data = await response.json();
        setBacteriaList(data.map((item: any) => item.name).filter((name: string) => name && name.trim() !== ""));
      }
    } catch (err) {
      console.error("Failed to fetch bacteria list:", err);
    }
  };

  const handlePredict = async () => {
    if (!selectedBacteria) {
      setError("Please select a bacteria");
      return;
    }

    setLoading(true);
    setError("");
    setRecommendations([]);

    try {
      const response = await fetch("http://localhost:8000/api/ai/predict/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bacteria_name: selectedBacteria }),
      });

      if (response.ok) {
        const data: ApiResponse = await response.json();
        setRecommendations(data.recommendations);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to get recommendations");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const getEffectivenessColor = (effectiveness: number) => {
    if (effectiveness >= 80) return "bg-green-500";
    if (effectiveness >= 60) return "bg-yellow-500";
    if (effectiveness >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const getEffectivenessLabel = (effectiveness: number) => {
    if (effectiveness >= 80) return "Excellent";
    if (effectiveness >= 60) return "Good";
    if (effectiveness >= 40) return "Moderate";
    return "Poor";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database-Based Antibiotic Recommendations
          </CardTitle>
          <CardDescription>
            Get antibiotic recommendations based on historical sensitivity data from your database.
            This analysis relies solely on actual test results without AI prediction models.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Select Bacteria</label>
              <Select value={selectedBacteria} onValueChange={setSelectedBacteria}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a bacteria..." />
                </SelectTrigger>
                <SelectContent>
                  {bacteriaList.map((bacteria) => (
                    <SelectItem key={bacteria} value={bacteria}>
                      {bacteria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handlePredict}
              disabled={loading || !selectedBacteria}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4" />
              )}
              Get Recommendations
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Antibiotic Recommendations for {selectedBacteria}</CardTitle>
            <CardDescription>
              Based on historical sensitivity data. Effectiveness calculated from actual test results.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recommendations.map((rec, index) => (
                <Card key={index} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{rec.antibiotic}</CardTitle>
                      <Badge
                        className={`${getEffectivenessColor(rec.effectiveness)} text-white`}
                      >
                        {getEffectivenessLabel(rec.effectiveness)}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">
                      {rec.category} • {rec.mechanism}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Effectiveness:</span>
                      <span className="font-semibold">{rec.effectiveness}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Tests:</span>
                      <span>{rec.total_tests}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Sensitive Cases:</span>
                      <span>{rec.sensitive_cases}</span>
                    </div>
                    {rec.total_tests > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className={`h-2 rounded-full ${getEffectivenessColor(rec.effectiveness)}`}
                          style={{ width: `${rec.effectiveness}%` }}
                        ></div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

