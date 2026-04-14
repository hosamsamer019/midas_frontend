"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from "recharts";
import DataFilters from "@/components/DataFilters";
import FileUpload from "@/components/FileUpload";
import AIRecommendation from "@/components/AIRecommendation";
import EnhancedReports from "@/components/EnhancedReports";
import Heatmap from "@/components/Heatmap";
import ChartContainer from "@/components/ChartContainer";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface Stats {
  total_samples: number;
  total_bacteria: number;
  total_antibiotics: number;
}

interface SensitivityData {
  name: string;
  value: number;
  [key: string]: any;
}

interface AntibioticEffectiveness {
  antibiotic: string;
  effectiveness: number;
}

interface ResistanceOverTime {
  month: string;
  resistance: number;
}

export default function Dashboard() {
  const { logout, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<Stats>({ total_samples: 0, total_bacteria: 0, total_antibiotics: 0 });
  const [sensitivityData, setSensitivityData] = useState<SensitivityData[]>([]);
  const [antibioticEffectiveness, setAntibioticEffectiveness] = useState<AntibioticEffectiveness[]>([]);
  const [resistanceOverTime, setResistanceOverTime] = useState<ResistanceOverTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    bacteria: "",
    department: "",
    hospital: "",
    sampleType: "",
    antibiotic: "",
    sensitivity: "",
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [filters, isAuthenticated]);

  const fetchDashboardData = async () => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.bacteria && filters.bacteria !== "all") params.append('bacteria', filters.bacteria);
      if (filters.department && filters.department !== "all") params.append('department', filters.department);
      if (filters.hospital && filters.hospital !== "all") params.append('hospital', filters.hospital);
      if (filters.sampleType && filters.sampleType !== "all") params.append('sample_type', filters.sampleType);
      if (filters.antibiotic && filters.antibiotic !== "all") params.append('antibiotic', filters.antibiotic);
      if (filters.sensitivity && filters.sensitivity !== "all") params.append('sensitivity', filters.sensitivity);

      const queryString = params.toString();
      const urlSuffix = queryString ? `?${queryString}` : '';

      const [statsRes, sensitivityRes, effectivenessRes, resistanceRes] = await Promise.all([
        axios.get(`/api/stats${urlSuffix}`, { headers }),
        axios.get(`/api/sensitivity-distribution${urlSuffix}`, { headers }),
        axios.get(`/api/antibiotic-effectiveness${urlSuffix}`, { headers }),
        axios.get(`/api/resistance-over-time${urlSuffix}`, { headers }),
      ]);

      setStats(statsRes.data);
      setSensitivityData(sensitivityRes.data);
      setAntibioticEffectiveness(effectivenessRes.data);
      setResistanceOverTime(resistanceRes.data);
      setLoading(false);
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 401) {
        logout();
      }
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  return (
    <div className="w-full max-w-7xl mx-auto bg-background">
      <div className="mb-4 sm:mb-6">
        <DataFilters onFiltersChange={handleFiltersChange} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm md:text-base">Total Samples</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold">{stats.total_samples.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm md:text-base">Total Bacteria</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold">{stats.total_bacteria}</p>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm md:text-base">Total Antibiotics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold">{stats.total_antibiotics}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm md:text-base">Sensitivity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              height={280}
              minHeight={200}
              loading={loading}
              hasData={sensitivityData.length > 0}
            >
              <PieChart>
                <Pie
                  data={sensitivityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sensitivityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm md:text-base">Antibiotic Effectiveness</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              height={280}
              minHeight={200}
              loading={loading}
              hasData={antibioticEffectiveness.length > 0}
            >
              <BarChart data={antibioticEffectiveness} margin={{ left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="antibiotic" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="effectiveness" fill="#8884d8" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4 sm:mb-6">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-xs sm:text-sm md:text-base">Resistance Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            height={280}
            minHeight={200}
            loading={loading}
            hasData={resistanceOverTime.length > 0}
          >
            <LineChart data={resistanceOverTime} margin={{ left: -20, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="resistance" stroke="#8884d8" />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
        <FileUpload />
        <AIRecommendation />
      </div>

      <div className="mb-4 sm:mb-6">
        <Heatmap />
      </div>

      <div>
        <EnhancedReports />
      </div>
    </div>
  );
}
