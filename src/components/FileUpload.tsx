"use client";

import { useState, useRef } from "react";
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
import {
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  Upload,
  Clock,
  Database,
  Trash2,
} from "lucide-react";

interface UploadHistory {
  id: number;
  file_name: string;
  upload_date: string;
  status: "success" | "failed" | "pending";
  rows_processed: number;
}

interface ColumnMapping {
  source_column: string;
  target_field: string;
}

interface DataPreview {
  columns: string[];
  rows: string[][];
  total_rows: number;
}

const TARGET_FIELDS = [
  "sample_id",
  "bacteria_name",
  "antibiotic_name",
  "sensitivity",
  "date",
  "department",
  "patient_id",
  "ward",
];

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);
  const [dataPreview, setDataPreview] = useState<DataPreview | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "preview" | "history">(
    "upload",
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".csv"];

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return "File size exceeds 10MB limit";
    }
    const extension = file.name
      .substring(file.name.lastIndexOf("."))
      .toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return "Only Excel (.xlsx, .xls) and CSV files are allowed";
    }
    return null;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const error = validateFile(selectedFile);

      if (error) {
        setMessage(error);
        setMessageType("error");
        return;
      }

      setFile(selectedFile);
      setMessage("");
      setMessageType("");

      await previewData(selectedFile);
    }
  };

  const previewData = async (fileToPreview: File) => {
    const formData = new FormData();
    formData.append("file", fileToPreview);
    formData.append("preview", "true");

    try {
      const token = localStorage.getItem("access_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/upload/preview/`,
        formData,
        {
          headers: {
            ...headers,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setDataPreview(response.data);

      const autoMapping: ColumnMapping[] = response.data.columns.map(
        (col: string) => {
          const normalizedCol = col.toLowerCase().replace(/[_\s-]/g, "");
          let target = "";

          if (normalizedCol.includes("sample") || normalizedCol.includes("id"))
            target = "sample_id";
          else if (
            normalizedCol.includes("bacteria") ||
            normalizedCol.includes("bug")
          )
            target = "bacteria_name";
          else if (
            normalizedCol.includes("antibiotic") ||
            normalizedCol.includes("drug")
          )
            target = "antibiotic_name";
          else if (
            normalizedCol.includes("sensitiv") ||
            normalizedCol.includes("result")
          )
            target = "sensitivity";
          else if (
            normalizedCol.includes("date") ||
            normalizedCol.includes("time")
          )
            target = "date";
          else if (
            normalizedCol.includes("dept") ||
            normalizedCol.includes("unit")
          )
            target = "department";
          else if (normalizedCol.includes("patient")) target = "patient_id";
          else if (normalizedCol.includes("ward")) target = "ward";

          return { source_column: col, target_field: target };
        },
      );

      setColumnMapping(autoMapping);
      setShowPreview(true);
      setActiveTab("preview");
    } catch (error) {
      console.error("Preview error:", error);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setMessage("");
    setMessageType("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("column_mapping", JSON.stringify(columnMapping));

    try {
      const token = localStorage.getItem("access_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/upload/`,
        formData,
        {
          headers: {
            ...headers,
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1),
            );
            setProgress(percentCompleted);
          },
        },
      );

      setMessage("File uploaded successfully! Data has been processed.");
      setMessageType("success");

      const newUpload: UploadHistory = {
        id: Date.now(),
        file_name: file.name,
        upload_date: new Date().toISOString(),
        status: "success",
        rows_processed: response.data.rows_processed || 0,
      };
      setUploadHistory([newUpload, ...uploadHistory]);

      setFile(null);
      setShowPreview(false);
      setDataPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      setMessage(
        error.response?.data?.message || "Upload failed. Please try again.",
      );
      setMessageType("error");

      const newUpload: UploadHistory = {
        id: Date.now(),
        file_name: file.name,
        upload_date: new Date().toISOString(),
        status: "failed",
        rows_processed: 0,
      };
      setUploadHistory([newUpload, ...uploadHistory]);
    } finally {
      setUploading(false);
    }
  };

  const handleMappingChange = (sourceColumn: string, targetField: string) => {
    setColumnMapping((prev) =>
      prev.map((m) =>
        m.source_column === sourceColumn
          ? { ...m, target_field: targetField }
          : m,
      ),
    );
  };

  const handleDeleteHistory = (id: number) => {
    setUploadHistory(uploadHistory.filter((h) => h.id !== id));
  };

  const handleTabChange = (tab: "upload" | "preview" | "history") => {
    if (tab === "preview" && !dataPreview) return;
    setActiveTab(tab);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Upload Lab Data
        </CardTitle>
        <CardDescription>
          Upload Excel or CSV files containing laboratory test results
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tab Navigation */}
        <div className="flex border-b">
          <button
            onClick={() => handleTabChange("upload")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "upload"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Upload
          </button>
          <button
            onClick={() => handleTabChange("preview")}
            disabled={!dataPreview}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "preview"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            } ${!dataPreview ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Data Preview ({dataPreview?.total_rows || 0} rows)
          </button>
          <button
            onClick={() => handleTabChange("history")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "history"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            History ({uploadHistory.length})
          </button>
        </div>

        {/* Upload Tab Content */}
        {activeTab === "upload" && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                id="file"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-10 w-10 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Click to select file (max 10MB)
                  </span>
                  <span className="text-xs text-gray-400">
                    Supported: .xlsx, .xls, .csv
                  </span>
                </div>
              </label>
            </div>

            {file && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <Button onClick={handleUpload} disabled={!file || uploading}>
                  {uploading ? "Uploading..." : "Upload and Process"}
                </Button>
              </div>
            )}

            {uploading && (
              <div className="space-y-2">
                <div className="h-2 bg-gray-200 rounded overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-center text-gray-600">
                  {progress}% complete
                </p>
              </div>
            )}

            {message && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  messageType === "success"
                    ? "bg-green-50 text-green-700"
                    : messageType === "error"
                      ? "bg-red-50 text-red-700"
                      : "bg-gray-50"
                }`}
              >
                {messageType === "success" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : messageType === "error" ? (
                  <AlertCircle className="h-4 w-4" />
                ) : null}
                <span className="text-sm">{message}</span>
              </div>
            )}
          </div>
        )}

        {/* Preview Tab Content */}
        {activeTab === "preview" && dataPreview && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Column Mapping</h3>
              <span className="text-xs text-gray-500">
                {dataPreview.total_rows} rows
              </span>
            </div>

            <div className="space-y-2">
              {columnMapping.map((mapping, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-2 bg-gray-50 rounded"
                >
                  <span className="text-sm font-medium w-1/3">
                    {mapping.source_column}
                  </span>
                  <span className="text-gray-400">{">"}</span>
                  <select
                    value={mapping.target_field}
                    onChange={(e) =>
                      handleMappingChange(mapping.source_column, e.target.value)
                    }
                    className="flex-1 p-2 text-sm border rounded bg-white"
                  >
                    <option value="">-- Select Target Field --</option>
                    {TARGET_FIELDS.map((field) => (
                      <option key={field} value={field}>
                        {field}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <h3 className="text-sm font-medium">
                Data Preview (First 5 rows)
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("upload")}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleUpload} disabled={uploading}>
                  {uploading ? "Processing..." : "Confirm & Upload"}
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    {dataPreview.columns.map((col, i) => (
                      <th
                        key={i}
                        className="px-3 py-2 text-left text-xs font-medium text-gray-600"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataPreview.rows.slice(0, 5).map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-3 py-2 text-xs">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* History Tab Content */}
        {activeTab === "history" && (
          <div className="space-y-4">
            {uploadHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No upload history yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {uploadHistory.map((upload) => (
                  <div
                    key={upload.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {upload.status === "success" ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {upload.file_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(upload.upload_date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          upload.status === "success"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {upload.status}
                      </span>
                      {upload.status === "success" && (
                        <span className="text-xs text-gray-500">
                          {upload.rows_processed} rows
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteHistory(upload.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
