"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";

interface Bacteria {
  id: number;
  name: string;
}

interface Antibiotic {
  id: number;
  name: string;
}

export default function Reports() {
  const { logout } = useAuth();
  
  // Report type for sidebar
  const [reportScope, setReportScope] = useState<'specific' | 'all_bacteria' | 'all_antibiotics'>('specific');
  
  // Date range
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Bacteria and Antibiotic selections
  const [bacteria, setBacteria] = useState<Bacteria[]>([]);
  const [antibiotics, setAntibiotics] = useState<Antibiotic[]>([]);
  const [selectedBacteria, setSelectedBacteria] = useState<number | ''>('');
  const [selectedAntibiotic, setSelectedAntibiotic] = useState<number | ''>('');
  
  const [generating, setGenerating] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch bacteria and antibiotics data
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('access_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      try {
        const [bacteriaRes, antibioticsRes] = await Promise.all([
          axios.get('http://localhost:8000/api/bacteria-list/', { headers }),
          axios.get('http://localhost:8000/api/antibiotics-list/', { headers })
        ]);
        
        setBacteria(bacteriaRes.data);
        setAntibiotics(antibioticsRes.data);
      } catch (error: any) {
        console.error("Error fetching data:", error);
        if (error.response?.status === 401) {
          logout();
        }
      } finally {
        setLoadingData(false);
      }
    };
    
    fetchData();
  }, [logout]);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const token = localStorage.getItem('access_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      let url = 'http://localhost:8000/api/reports/monthly/';
      const params: Record<string, string> = {};

      // Add date range
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      // Add scope-specific parameters
      if (reportScope === 'specific' && selectedBacteria && selectedAntibiotic) {
        url = 'http://localhost:8000/api/reports/specific/';
        params.bacteria_id = String(selectedBacteria);
        params.antibiotic_id = String(selectedAntibiotic);
      } else if (reportScope === 'all_bacteria' && selectedBacteria) {
        url = 'http://localhost:8000/api/reports/bacteria/';
        params.bacteria_id = String(selectedBacteria);
      } else if (reportScope === 'all_antibiotics' && selectedAntibiotic) {
        url = 'http://localhost:8000/api/reports/antibiotic/';
        params.antibiotic_id = String(selectedAntibiotic);
      }

      const response = await axios.get(url, {
        params,
        responseType: 'blob',
        headers,
      });

      // Generate filename based on selection
      let filename = 'report.pdf';
      if (reportScope === 'specific' && selectedBacteria && selectedAntibiotic) {
        const bacteriaName = bacteria.find(b => b.id === selectedBacteria)?.name || 'bacteria';
        const antibioticName = antibiotics.find(a => a.id === selectedAntibiotic)?.name || 'antibiotic';
        filename = `${bacteriaName}_${antibioticName}_report.pdf`;
      } else if (reportScope === 'all_bacteria') {
        filename = 'all_bacteria_report.pdf';
      } else if (reportScope === 'all_antibiotics') {
        filename = 'all_antibiotics_report.pdf';
      }

      const fileUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = fileUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: any) {
      console.error("Report generation error:", error);
      if (error.response?.status === 401) {
        logout();
      } else {
        // Fallback to basic report
        try {
          const token = localStorage.getItem('access_token');
          const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
          
          const response = await axios.get('http://localhost:8000/api/reports/monthly/', {
            params: { start_date: startDate, end_date: endDate },
            responseType: 'blob',
            headers,
          });
          
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', 'report.pdf');
          document.body.appendChild(link);
          link.click();
          link.remove();
        } catch (fallbackError) {
          console.error("Fallback report generation error:", fallbackError);
        }
      }
    } finally {
      setGenerating(false);
    }
  };

  // Filter antibiotics based on selected bacteria (show all for now)
  const filteredAntibiotics = antibiotics;

  return (
    <div className="space-y-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Generate Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Report Scope Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Report Scope</label>
            <select
              value={reportScope}
              onChange={(e) => {
                setReportScope(e.target.value as 'specific' | 'all_bacteria' | 'all_antibiotics');
                // Reset selections when scope changes
                setSelectedBacteria('');
                setSelectedAntibiotic('');
              }}
              className="w-full p-2 border border-input rounded bg-background"
            >
              <option value="specific">Specific Bacteria-Antibiotic</option>
              <option value="all_bacteria">All Bacteria (by Antibiotic)</option>
              <option value="all_antibiotics">All Antibiotics (by Bacteria)</option>
            </select>
          </div>

          {/* Bacteria Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {reportScope === 'all_antibiotics' ? 'Select Bacteria (Optional - leave empty for all)' : 'Select Bacteria'}
            </label>
            <select
              value={selectedBacteria}
              onChange={(e) => setSelectedBacteria(e.target.value ? Number(e.target.value) : '')}
              disabled={loadingData}
              className="w-full p-2 border border-input rounded bg-background"
            >
              <option value="">{reportScope === 'all_antibiotics' ? 'All Bacteria' : 'Select Bacteria'}</option>
              {bacteria.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Antibiotic Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {reportScope === 'all_bacteria' ? 'Select Antibiotic (Optional - leave empty for all)' : 'Select Antibiotic'}
            </label>
            <select
              value={selectedAntibiotic}
              onChange={(e) => setSelectedAntibiotic(e.target.value ? Number(e.target.value) : '')}
              disabled={loadingData}
              className="w-full p-2 border border-input rounded bg-background"
            >
              <option value="">{reportScope === 'all_bacteria' ? 'All Antibiotics' : 'Select Antibiotic'}</option>
              {filteredAntibiotics.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Report Summary */}
          <div className="p-3 bg-muted rounded-md text-sm">
            <p className="font-medium">Report will include:</p>
            <ul className="mt-1 text-muted-foreground">
              {reportScope === 'specific' && selectedBacteria && selectedAntibiotic && (
                <li>• Specific report for selected bacteria-antibiotic combination</li>
              )}
              {reportScope === 'specific' && (!selectedBacteria || !selectedAntibiotic) && (
                <li>• Please select both bacteria and antibiotic</li>
              )}
              {reportScope === 'all_bacteria' && (
                <li>• All bacteria with effectiveness by antibiotic</li>
              )}
              {reportScope === 'all_antibiotics' && (
                <li>• All antibiotics with effectiveness by bacteria</li>
              )}
              {startDate && endDate && (
                <li>• Date range: {startDate} to {endDate}</li>
              )}
              {(!startDate || !endDate) && (
                <li>• All available data (no date filter)</li>
              )}
            </ul>
          </div>

          <Button
            onClick={handleGenerateReport}
            disabled={generating || loadingData || (reportScope === 'specific' && (!selectedBacteria || !selectedAntibiotic))}
            className="w-full"
          >
            {generating ? "Generating..." : "Generate PDF Report"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
