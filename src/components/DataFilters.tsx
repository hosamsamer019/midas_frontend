"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface DataFiltersProps {
  onFiltersChange?: (filters: Partial<Filters>) => void;
}

interface BacteriaOption {
  id: number;
  name: string;
  type: string;
}

interface DepartmentOption {
  name: string;
}

interface HospitalOption {
  name: string;
}

interface SampleTypeOption {
  name: string;
  original?: string;
}

interface AntibioticOption {
  id: number;
  name: string;
  category: string;
}

export default function DataFilters({
  onFiltersChange,
}: DataFiltersProps): React.ReactElement {
  const [filters, setFilters] = useState<Filters>({
    dateFrom: "",
    dateTo: "",
    bacteria: "",
    department: "",
    hospital: "",
    sampleType: "",
    antibiotic: "",
    sensitivity: "",
  });

  const [bacteriaOptions, setBacteriaOptions] = useState<BacteriaOption[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<
    DepartmentOption[]
  >([]);
  const [hospitalOptions, setHospitalOptions] = useState<HospitalOption[]>([]);
  const [sampleTypeOptions, setSampleTypeOptions] = useState<
    SampleTypeOption[]
  >([]);
  const [antibioticOptions, setAntibioticOptions] = useState<
    AntibioticOption[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOptions = async () => {
      const token = localStorage.getItem("access_token");
      const requestOptions: RequestInit = {};

      if (token) {
        requestOptions.headers = {
          Authorization: `Bearer ${token}`,
        };
      }

      const API_BASE =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      try {
        const bacteriaRes = await fetch(
          `${API_BASE}/api/bacteria-list/`,
          requestOptions,
        );
        if (bacteriaRes.ok) {
          const bacteriaData = await bacteriaRes.json();
          setBacteriaOptions(bacteriaData);
        }

        const deptRes = await fetch(
          `${API_BASE}/api/departments-list/`,
          requestOptions,
        );
        if (deptRes.ok) {
          const deptData = await deptRes.json();
          setDepartmentOptions(deptData);
        }

        const hospitalRes = await fetch(
          `${API_BASE}/api/hospitals-list/`,
          requestOptions,
        );
        if (hospitalRes.ok) {
          const hospitalData = await hospitalRes.json();
          setHospitalOptions(hospitalData);
        }

        const sampleTypeRes = await fetch(
          `${API_BASE}/api/sample-types-list/`,
          requestOptions,
        );
        if (sampleTypeRes.ok) {
          const sampleTypeData = await sampleTypeRes.json();
          setSampleTypeOptions(sampleTypeData);
        }

        const antibioticRes = await fetch(
          `${API_BASE}/api/antibiotics-list/`,
          requestOptions,
        );
        if (antibioticRes.ok) {
          const antibioticData = await antibioticRes.json();
          setAntibioticOptions(antibioticData);
        }
      } catch (err) {
        console.error("Error fetching filter options:", err);
        setError(
          "Unable to connect to server. Please ensure the Django backend is running on port 8000.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  };

  const clearFilters = () => {
    const emptyFilters: Filters = {
      dateFrom: "",
      dateTo: "",
      bacteria: "",
      department: "",
      hospital: "",
      sampleType: "",
      antibiotic: "",
      sensitivity: "",
    };
    setFilters(emptyFilters);
    if (onFiltersChange) {
      onFiltersChange(emptyFilters);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Data Filters</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">From Date</label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">To Date</label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange("dateTo", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Bacteria</label>
            {loading ? (
              <Input type="text" placeholder="Loading..." disabled />
            ) : (
              <Select
                value={filters.bacteria}
                onValueChange={(value) => handleFilterChange("bacteria", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bacteria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Bacteria</SelectItem>
                  {bacteriaOptions
                    .filter(
                      (bacteria) =>
                        bacteria.name && bacteria.name.trim() !== "",
                    )
                    .map((bacteria) => (
                      <SelectItem key={bacteria.id} value={bacteria.name}>
                        {bacteria.name}{" "}
                        {bacteria.type ? `(${bacteria.type})` : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Department</label>
            {loading ? (
              <Input type="text" placeholder="Loading..." disabled />
            ) : (
              <Select
                value={filters.department}
                onValueChange={(value) =>
                  handleFilterChange("department", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departmentOptions
                    .filter((dept) => dept.name && dept.name.trim() !== "")
                    .map((dept, index) => (
                      <SelectItem key={index} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Hospital</label>
            {loading ? (
              <Input type="text" placeholder="Loading..." disabled />
            ) : (
              <Select
                value={filters.hospital}
                onValueChange={(value) => handleFilterChange("hospital", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select hospital" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Hospitals</SelectItem>
                  {hospitalOptions
                    .filter((h) => h.name && h.name.trim() !== "")
                    .map((hospital, index) => (
                      <SelectItem key={index} value={hospital.name}>
                        {hospital.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Sample Type
            </label>
            {loading ? (
              <Input type="text" placeholder="Loading..." disabled />
            ) : (
              <Select
                value={filters.sampleType}
                onValueChange={(value) =>
                  handleFilterChange("sampleType", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sample type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sample Types</SelectItem>
                  {sampleTypeOptions
                    .filter((st) => st.name && st.name.trim() !== "")
                    .map((st, index) => (
                      <SelectItem key={index} value={st.original || st.name}>
                        {st.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Antibiotic</label>
            {loading ? (
              <Input type="text" placeholder="Loading..." disabled />
            ) : (
              <Select
                value={filters.antibiotic}
                onValueChange={(value) =>
                  handleFilterChange("antibiotic", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select antibiotic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Antibiotics</SelectItem>
                  {antibioticOptions
                    .filter((ab) => ab.name && ab.name.trim() !== "")
                    .map((ab) => (
                      <SelectItem key={ab.id} value={ab.name}>
                        {ab.name} {ab.category ? `(${ab.category})` : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Sensitivity Status
            </label>
            <Select
              value={filters.sensitivity}
              onValueChange={(value) =>
                handleFilterChange("sensitivity", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select sensitivity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="sensitive">Sensitive</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="resistant">Resistant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4">
          <Button onClick={clearFilters} variant="outline">
            Clear All Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
