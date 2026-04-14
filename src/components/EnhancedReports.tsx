"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, LineChart, Line
} from "recharts";
import ChartContainer from "@/components/ChartContainer";

interface Bacteria {
  id: number;
  name: string;
  type?: string;
}

interface Antibiotic {
  id: number;
  name: string;
  category?: string;
}

interface ReportData {
  summary?: {
    total_tests: number;
    sensitive_count: number;
    resistant_count: number;
    intermediate_count: number;
    sensitivity_rate?: number;
    effectiveness_rate?: number;
  };
  antibiotic_effectiveness?: Array<{
    antibiotic_id: number;
    antibiotic_name: string;
    total_tests: number;
    effective_count: number;
    effectiveness_rate: number;
  }>;
  bacteria_effectiveness?: Array<{
    bacteria_id: number;
    bacteria_name: string;
    total_tests: number;
    effective_count: number;
    effectiveness_rate: number;
  }>;
  trend?: Array<{
    period: string;
    total: number;
    sensitive: number;
    resistant: number;
  }>;
}

interface VisualizationData {
  sensitivity_distribution?: {
    type: string;
    title: string;
    data: Array<{ name: string; value: number }>;
    colors: string[];
    legend: string[];
  };
  antibiotic_effectiveness?: {
    type: string;
    title: string;
    data: Array<{ antibiotic: string; effectiveness: number }>;
    x_axis: string;
    y_axis: string;
  };
  resistance_trend?: {
    type: string;
    title: string;
    data: Array<{ month: string; resistance: number }>;
    x_axis: string;
    y_axis: string;
  };
}

const COLORS = ['#4CAF50', '#F44336', '#FFC107', '#2196F3', '#9C27B0'];

export default function EnhancedReports() {
  const { logout } = useAuth();
  
  // Local state for EnhancedReports specific controls
  const [reportScope, setReportScope] = useState<'specific' | 'all_bacteria' | 'all_antibiotics'>('specific');
  const [selectedBacteria, setSelectedBacteria] = useState<string>("");
  const [selectedAntibiotic, setSelectedAntibiotic] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const [bacteriaList, setBacteriaList] = useState<Bacteria[]>([]);
  const [antibioticsList, setAntibioticsList] = useState<Antibiotic[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [visualizationData, setVisualizationData] = useState<VisualizationData | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'data' | 'visualization'>('data');

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('access_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      try {
        const [bacteriaRes, antibioticsRes] = await Promise.all([
          axios.get("http://localhost:8000/api/bacteria-list/", { headers }),
          axios.get("http://localhost:8000/api/antibiotics-list/", { headers })
        ]);
        setBacteriaList(bacteriaRes.data);
        setAntibioticsList(antibioticsRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    
    fetchData();
  }, []);

  // Fetch reports when filters or scope changes
  useEffect(() => {
    if (reportScope === 'specific' && selectedBacteria && selectedAntibiotic) {
      fetchSpecificReport();
    } else if (reportScope === 'all_bacteria') {
      fetchBacteriaReport();
    } else if (reportScope === 'all_antibiotics') {
      fetchAntibioticReport();
    }
  }, [reportScope, selectedBacteria, selectedAntibiotic, startDate, endDate]);

  // Fetch visualization data when filters change
  useEffect(() => {
    fetchVisualizationData();
  }, [selectedBacteria, selectedAntibiotic, startDate, endDate]);

  const fetchBacteriaReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const response = await axios.get(
        `http://localhost:8000/api/reports/bacteria/?${params}`,
        { headers }
      );
      setReportData(response.data);
    } catch (error: any) {
      console.error("Error fetching bacteria report:", error);
      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAntibioticReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const response = await axios.get(
        `http://localhost:8000/api/reports/antibiotic/?${params}`,
        { headers }
      );
      setReportData(response.data);
    } catch (error: any) {
      console.error("Error fetching antibiotic report:", error);
      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecificReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const params = new URLSearchParams();
      params.append('bacteria_id', selectedBacteria);
      params.append('antibiotic_id', selectedAntibiotic);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const response = await axios.get(
        `http://localhost:8000/api/reports/specific/?${params}`,
        { headers }
      );
      setReportData(response.data);
    } catch (error: any) {
      console.error("Error fetching specific report:", error);
      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchVisualizationData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const params = new URLSearchParams();
      params.append('type', 'all');
      if (selectedBacteria) params.append('bacteria_id', selectedBacteria);
      if (selectedAntibiotic) params.append('antibiotic_id', selectedAntibiotic);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const response = await axios.get(
        `http://localhost:8000/api/reports/visualization/?${params}`,
        { headers }
      );
      setVisualizationData(response.data);
    } catch (error: any) {
      console.error("Error fetching visualization data:", error);
    }
  };

  const handleGeneratePDF = async () => {
    setGenerating(true);
    try {
      const token = localStorage.getItem('access_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const params = new URLSearchParams();
      params.append('type', 'monthly');
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (selectedBacteria) params.append('bacteria_id', selectedBacteria);
      if (selectedAntibiotic) params.append('antibiotic_id', selectedAntibiotic);
      
      const response = await axios.get(
        `http://localhost:8000/api/reports/monthly/?${params}`,
        {
          responseType: 'blob',
          headers,
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bacteria_antibiotic_report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      setGenerating(false);
    }
  };

  const sensitivityChartData = visualizationData?.sensitivity_distribution?.data || [];
  const antibioticChartData = visualizationData?.antibiotic_effectiveness?.data || [];
  const trendChartData = visualizationData?.resistance_trend?.data || [];

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Generate Reports</CardTitle>
          <CardDescription>
            Select bacteria and antibiotic to generate detailed reports with visualizations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 border border-input rounded bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 border border-input rounded bg-background"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Report Scope</label>
            <select
              value={reportScope}
              onChange={(e) => setReportScope(e.target.value as typeof reportScope)}
              className="w-full p-2 border border-input rounded bg-background"
            >
              <option value="specific">Specific Bacteria-Antibiotic</option>
              <option value="all_bacteria">All Bacteria Report</option>
              <option value="all_antibiotics">All Antibiotics Report</option>
            </select>
          </div>

          {reportScope === 'specific' && (
            <div>
              <label className="block text-sm font-medium mb-2">Select Bacteria</label>
              <select
                value={selectedBacteria}
                onChange={(e) => setSelectedBacteria(e.target.value)}
                className="w-full p-2 border border-input rounded bg-background"
              >
                <option value="">Choose bacteria</option>
                {bacteriaList.map((bacteria) => (
                  <option key={bacteria.id} value={bacteria.id}>
                    {bacteria.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {reportScope === 'specific' && (
            <div>
              <label className="block text-sm font-medium mb-2">Select Antibiotic</label>
              <select
                value={selectedAntibiotic}
                onChange={(e) => setSelectedAntibiotic(e.target.value)}
                className="w-full p-2 border border-input rounded bg-background"
              >
                <option value="">Choose antibiotic</option>
                {antibioticsList.map((antibiotic) => (
                  <option key={antibiotic.id} value={antibiotic.id}>
                    {antibiotic.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            onClick={handleGeneratePDF}
            disabled={generating || (reportScope === 'specific' && (!selectedBacteria || !selectedAntibiotic))}
            className="w-full"
          >
            {generating ? "Generating..." : "Generate PDF Report"}
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button
          variant={activeTab === 'data' ? 'default' : 'outline'}
          onClick={() => setActiveTab('data')}
        >
          Report Data
        </Button>
        <Button
          variant={activeTab === 'visualization' ? 'default' : 'outline'}
          onClick={() => setActiveTab('visualization')}
        >
          Visualizations and Graphs
        </Button>
      </div>

      {activeTab === 'data' && (
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-10 text-center">
                Loading report data...
              </CardContent>
            </Card>
          ) : reportData ? (
            <>
              {reportData.summary && (
                <Card>
                  <CardHeader>
                    <CardTitle>Summary Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">{reportData.summary.total_tests}</p>
                        <p className="text-sm text-muted-foreground">Total Tests</p>
                      </div>
                      <div className="text-center p-4 bg-green-100 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{reportData.summary.sensitive_count}</p>
                        <p className="text-sm text-muted-foreground">Sensitive</p>
                      </div>
                      <div className="text-center p-4 bg-red-100 rounded-lg">
                        <p className="text-2xl font-bold text-red-600">{reportData.summary.resistant_count}</p>
                        <p className="text-sm text-muted-foreground">Resistant</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-100 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-600">{reportData.summary.intermediate_count}</p>
                        <p className="text-sm text-muted-foreground">Intermediate</p>
                      </div>
                    </div>
                    {reportData.summary.sensitivity_rate !== undefined && (
                      <div className="mt-4 text-center">
                        <p className="text-lg">
                          Sensitivity Rate: <span className="font-bold text-green-600">{reportData.summary.sensitivity_rate}%</span>
                        </p>
                      </div>
                    )}
                    {reportData.summary.effectiveness_rate !== undefined && (
                      <div className="mt-4 text-center">
                        <p className="text-lg">
                          Effectiveness Rate: <span className="font-bold text-blue-600">{reportData.summary.effectiveness_rate}%</span>
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {reportData.antibiotic_effectiveness && reportData.antibiotic_effectiveness.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Antibiotic Effectiveness</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Antibiotic</th>
                            <th className="text-right p-2">Total Tests</th>
                            <th className="text-right p-2">Effective</th>
                            <th className="text-right p-2">Effectiveness</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.antibiotic_effectiveness.map((item, index) => (
                            <tr key={index} className="border-b">
                              <td className="p-2">{item.antibiotic_name}</td>
                              <td className="text-right p-2">{item.total_tests}</td>
                              <td className="text-right p-2">{item.effective_count}</td>
                              <td className="text-right p-2">
                                <span className={`font-bold ${
                                  item.effectiveness_rate >= 70 ? 'text-green-600' :
                                  item.effectiveness_rate >= 40 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {item.effectiveness_rate}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {reportData.bacteria_effectiveness && reportData.bacteria_effectiveness.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Bacteria Effectiveness</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Bacteria</th>
                            <th className="text-right p-2">Total Tests</th>
                            <th className="text-right p-2">Effective</th>
                            <th className="text-right p-2">Effectiveness</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.bacteria_effectiveness.map((item, index) => (
                            <tr key={index} className="border-b">
                              <td className="p-2">{item.bacteria_name}</td>
                              <td className="text-right p-2">{item.total_tests}</td>
                              <td className="text-right p-2">{item.effective_count}</td>
                              <td className="text-right p-2">
                                <span className={`font-bold ${
                                  item.effectiveness_rate >= 70 ? 'text-green-600' :
                                  item.effectiveness_rate >= 40 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {item.effectiveness_rate}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {reportData.trend && reportData.trend.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Trend Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Period</th>
                            <th className="text-right p-2">Total</th>
                            <th className="text-right p-2">Sensitive</th>
                            <th className="text-right p-2">Resistant</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.trend.map((item, index) => (
                            <tr key={index} className="border-b">
                              <td className="p-2">{item.period}</td>
                              <td className="text-right p-2">{item.total}</td>
                              <td className="text-right p-2 text-green-600">{item.sensitive}</td>
                              <td className="text-right p-2 text-red-600">{item.resistant}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Select bacteria and antibiotic to view report data
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'visualization' && (
        <div className="space-y-6">
          {sensitivityChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Sensitivity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer height={300} minHeight={200} hasData={sensitivityChartData.length > 0}>
                  <PieChart>
                    <Pie
                      data={sensitivityChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sensitivityChartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {antibioticChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Antibiotic Effectiveness</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer height={300} minHeight={200} hasData={antibioticChartData.length > 0}>
                  <BarChart data={antibioticChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="antibiotic" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="effectiveness" fill="#4CAF50" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {trendChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Resistance Trend Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer height={300} minHeight={200} hasData={trendChartData.length > 0}>
                  <LineChart data={trendChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="resistance" stroke="#F44336" />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Geometric Shapes - Effectiveness Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col items-center p-4 bg-green-50 rounded-lg">
                  <div className="w-16 h-16 rounded-full bg-green-500 mb-2"></div>
                  <p className="font-bold text-green-700">Most Effective</p>
                  <p className="text-sm text-center text-muted-foreground">
                    Antibiotics with high effectiveness rate
                  </p>
                </div>
                <div className="flex flex-col items-center p-4 bg-yellow-50 rounded-lg">
                  <div className="w-0 h-0 border-l-8 border-r-8 border-b-16 border-yellow-500 mb-4"></div>
                  <p className="font-bold text-yellow-700">Moderately Effective</p>
                  <p className="text-sm text-center text-muted-foreground">
                    Antibiotics with moderate effectiveness rate
                  </p>
                </div>
                <div className="flex flex-col items-center p-4 bg-red-50 rounded-lg">
                  <div className="w-12 h-12 bg-red-500 mb-2"></div>
                  <p className="font-bold text-red-700">Least Effective</p>
                  <p className="text-sm text-center text-muted-foreground">
                    Antibiotics with low effectiveness rate
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
