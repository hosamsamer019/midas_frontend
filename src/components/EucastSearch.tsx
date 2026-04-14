"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  FlaskConical,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Activity,
  Clock,
  Info,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/constants";
import { useTheme } from "@/context/ThemeContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EucastStatus {
  standard: string;
  version: string | null;
  release_date: string | null;
  status: string;
  last_updated: string | null;
  mic_count: number;
  disk_count: number;
  total_count: number;
}

interface Breakpoint {
  id: number;
  bacteria: string;
  antibiotic: string;
  method: string;
  susceptible: number | null;
  resistant: number | null;
  unit: string;
  version_number: string | null;
  source_sheet: string;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Breakpoint[];
  version_info?: {
    standard: string;
    version: string | null;
    last_updated: string | null;
    status: string;
  };
}

interface InterpretResult {
  result: string;
  s_breakpoint: number | null;
  r_breakpoint: number | null;
  method: string;
  unit: string;
  bacteria: string;
  antibiotic: string;
  version: string;
  standard: string;
}

interface UpdateLog {
  id: number;
  checked_at: string;
  status: string;
  new_version_found: boolean;
  version_found: string;
  message: string;
}

// ── MIC Distribution types ────────────────────────────────────────────────────

interface MicDistributionRow {
  id: number;
  organism: string;
  antibiotic: string;
  method: string;
  mic_value: string;
  num_observations: number;
  ecoff: number | null;
  ecoff_label: string;
  total_isolates: number;
  fetched_at: string;
}

interface MicDistributionResult {
  organism: string;
  antibiotic: string;
  method: string;
  ecoff: number | null;
  ecoff_label: string;
  total_isolates: number;
  fetched_at: string | null;
  distribution: MicDistributionRow[];
  message?: string;
  // fetch response extras
  status?: string;
  rows_saved?: number;
}

// ─── MIC Distribution Table sub-component ────────────────────────────────────
// Extracted to avoid IIFE-inside-JSX which causes React DOM reconciliation errors

interface MicDistributionTableProps {
  distribution: MicDistributionRow[];
  ecoff: number | null;
  method: string;
  isDarkMode: boolean;
}

function MicDistributionTable({
  distribution,
  ecoff,
  method,
  isDarkMode,
}: MicDistributionTableProps) {
  const total = distribution.reduce((s, r) => s + r.num_observations, 0) || 1;
  const maxObs = Math.max(...distribution.map((r) => r.num_observations), 1);

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className={isDarkMode ? "bg-gray-800 text-gray-300" : "bg-muted/50"}>
          <th className="text-center px-4 py-3 font-semibold">
            {method === "MIC" ? "MIC (mg/L)" : "Zone Diameter (mm)"}
          </th>
          <th className="text-center px-4 py-3 font-semibold">Isolates (n)</th>
          <th className="text-center px-4 py-3 font-semibold">% of Total</th>
          <th className="text-center px-4 py-3 font-semibold">ECOFF</th>
        </tr>
      </thead>
      <tbody>
        {distribution.map((row, idx) => {
          const isEcoff = ecoff !== null && row.mic_value === String(ecoff);
          const pct = ((row.num_observations / total) * 100).toFixed(1);
          const barWidth =
            maxObs > 0 ? Math.round((row.num_observations / maxObs) * 100) : 0;

          return (
            <tr
              key={row.id ?? idx}
              className={
                isEcoff
                  ? isDarkMode
                    ? "bg-amber-900/30 border-l-4 border-amber-500"
                    : "bg-amber-50 border-l-4 border-amber-400"
                  : idx % 2 === 0
                  ? isDarkMode
                    ? "bg-gray-900"
                    : "bg-white"
                  : isDarkMode
                  ? "bg-gray-800/50"
                  : "bg-muted/20"
              }
            >
              <td className="px-4 py-2 text-center font-mono font-medium">
                {row.mic_value}
              </td>
              <td className="px-4 py-2 text-center font-mono">
                {row.num_observations.toLocaleString()}
              </td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 min-w-[60px]">
                    <div
                      className={`h-2 rounded-full ${
                        isEcoff ? "bg-amber-500" : "bg-blue-500 dark:bg-blue-400"
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-10 text-right">
                    {pct}%
                  </span>
                </div>
              </td>
              <td className="px-4 py-2 text-center">
                {isEcoff ? (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 text-xs">
                    ECOFF
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const resultColor = (result: string) => {
  switch (result) {
    case "Susceptible":
      return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300";
    case "Intermediate":
      return "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300";
    case "Resistant":
      return "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300";
  }
};

const resultIcon = (result: string) => {
  switch (result) {
    case "Susceptible":
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case "Resistant":
      return <XCircle className="h-5 w-5 text-red-600" />;
    case "Intermediate":
      return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    default:
      return <Info className="h-5 w-5 text-gray-500" />;
  }
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EucastSearch() {
  const { isDarkMode } = useTheme();

  // Status
  const [eucastStatus, setEucastStatus] = useState<EucastStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [searchResults, setSearchResults] = useState<Breakpoint[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [prevPage, setPrevPage] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Interpretation
  const [interpBacteria, setInterpBacteria] = useState("");
  const [interpAntibiotic, setInterpAntibiotic] = useState("");
  const [interpValue, setInterpValue] = useState("");
  const [interpMethod, setInterpMethod] = useState("MIC");
  const [interpResult, setInterpResult] = useState<InterpretResult | null>(null);
  const [interpLoading, setInterpLoading] = useState(false);
  const [interpError, setInterpError] = useState("");

  // Update
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");
  const [updateStatus, setUpdateStatus] = useState<"" | "success" | "error">("");
  const [updateLogs, setUpdateLogs] = useState<UpdateLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  // MIC Distribution
  const [micOrganism, setMicOrganism] = useState("");
  const [micAntibiotic, setMicAntibiotic] = useState("");
  const [micMethod, setMicMethod] = useState("MIC");
  const [micResult, setMicResult] = useState<MicDistributionResult | null>(null);
  const [micLoading, setMicLoading] = useState(false);
  const [micError, setMicError] = useState("");
  const [micFetching, setMicFetching] = useState(false);
  const [micFetchMessage, setMicFetchMessage] = useState("");
  const [micFetchStatus, setMicFetchStatus] = useState<"" | "success" | "no_data" | "error">("");
  const [hasMicSearched, setHasMicSearched] = useState(false);

  // ── Fetch EUCAST status on mount ──────────────────────────────────────────
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/eucast/status/`);
      if (res.ok) {
        const data: EucastStatus = await res.json();
        setEucastStatus(data);
      }
    } catch {
      // silently fail – status bar will show "No data"
    } finally {
      setStatusLoading(false);
    }
  };

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearch = useCallback(
    async (url?: string) => {
      if (!searchQuery.trim()) {
        setSearchError("Please enter a search term (bacteria or antibiotic name).");
        return;
      }
      setSearchLoading(true);
      setSearchError("");
      setHasSearched(true);

      try {
        const endpoint =
          url ||
          (() => {
            const params = new URLSearchParams({ q: searchQuery.trim() });
            if (methodFilter && methodFilter !== "all") params.set("method", methodFilter);
            return `${API_BASE_URL}/api/eucast/search/?${params.toString()}`;
          })();

        const res = await fetch(endpoint);
        if (!res.ok) {
          const err = await res.json();
          setSearchError(err.error || "Search failed. Please try again.");
          setSearchResults([]);
          return;
        }
        const data: PaginatedResponse = await res.json();
        setSearchResults(data.results);
        setTotalCount(data.count);
        setNextPage(data.next);
        setPrevPage(data.previous);
      } catch {
        setSearchError("Network error. Please check your connection.");
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    },
    [searchQuery, methodFilter]
  );

  const handlePageChange = (url: string | null, direction: "next" | "prev") => {
    if (!url) return;
    setCurrentPage((p) => (direction === "next" ? p + 1 : p - 1));
    handleSearch(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  // ── Interpretation ────────────────────────────────────────────────────────
  const handleInterpret = async () => {
    if (!interpBacteria.trim() || !interpAntibiotic.trim() || !interpValue.trim()) {
      setInterpError("Please fill in all fields: bacteria, antibiotic, and measured value.");
      return;
    }
    const numVal = parseFloat(interpValue);
    if (isNaN(numVal)) {
      setInterpError("Measured value must be a valid number.");
      return;
    }

    setInterpLoading(true);
    setInterpError("");
    setInterpResult(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/eucast/interpret/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bacteria: interpBacteria.trim(),
          antibiotic: interpAntibiotic.trim(),
          value: numVal,
          method: interpMethod,
        }),
      });
      if (res.ok) {
        const data: InterpretResult = await res.json();
        setInterpResult(data);
      } else {
        const err = await res.json();
        setInterpError(err.error || "Interpretation failed.");
      }
    } catch {
      setInterpError("Network error. Please check your connection.");
    } finally {
      setInterpLoading(false);
    }
  };

  // ── Auto-Update ───────────────────────────────────────────────────────────
  const handleUpdate = async () => {
    setUpdateLoading(true);
    setUpdateMessage("");
    setUpdateStatus("");

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_BASE_URL}/api/eucast/update/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ force: false }),
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setUpdateStatus("success");
        setUpdateMessage(data.message || "Update check completed successfully.");
        fetchStatus(); // refresh status bar
      } else {
        setUpdateStatus("error");
        setUpdateMessage(data.message || data.error || "Update check failed.");
      }
    } catch {
      setUpdateStatus("error");
      setUpdateMessage("Network error during update check.");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleShowLogs = async () => {
    if (showLogs) {
      setShowLogs(false);
      return;
    }
    setLogsLoading(true);
    setShowLogs(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_BASE_URL}/api/eucast/update-logs/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data: UpdateLog[] = await res.json();
        setUpdateLogs(data);
      }
    } catch {
      // silently fail
    } finally {
      setLogsLoading(false);
    }
  };

  // ── MIC Distribution ─────────────────────────────────────────────────────

  const handleMicSearch = async () => {
    if (!micOrganism.trim() || !micAntibiotic.trim()) {
      setMicError("Please enter both organism and antibiotic names.");
      return;
    }
    setMicLoading(true);
    setMicError("");
    setMicResult(null);
    setMicFetchMessage("");
    setMicFetchStatus("");
    setHasMicSearched(true);

    try {
      const params = new URLSearchParams({
        organism:   micOrganism.trim(),
        antibiotic: micAntibiotic.trim(),
        method:     micMethod,
      });
      const res = await fetch(
        `${API_BASE_URL}/api/eucast/mic-distributions/?${params.toString()}`
      );
      if (!res.ok) {
        const err = await res.json();
        setMicError(err.error || "Search failed. Please try again.");
        return;
      }
      const data: MicDistributionResult = await res.json();
      setMicResult(data);
    } catch {
      setMicError("Network error. Please check your connection.");
    } finally {
      setMicLoading(false);
    }
  };

  const handleMicFetch = async () => {
    if (!micOrganism.trim() || !micAntibiotic.trim()) {
      setMicError("Please enter both organism and antibiotic names before fetching.");
      return;
    }
    setMicFetching(true);
    setMicFetchMessage("");
    setMicFetchStatus("");

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_BASE_URL}/api/eucast/mic-distributions/fetch/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          organism:   micOrganism.trim(),
          antibiotic: micAntibiotic.trim(),
          method:     micMethod,
        }),
      });
      const data: MicDistributionResult = await res.json();

      if (res.ok && data.status === "success") {
        setMicFetchStatus("success");
        setMicFetchMessage(
          `Successfully fetched ${data.rows_saved ?? 0} MIC distribution rows from mic.eucast.org.`
        );
        // Populate results directly from fetch response
        setMicResult(data);
        setHasMicSearched(true);
      } else if (data.status === "no_data") {
        setMicFetchStatus("no_data");
        setMicFetchMessage(
          "No MIC distribution data found on mic.eucast.org for this combination."
        );
      } else {
        setMicFetchStatus("error");
        setMicFetchMessage(
          (data as { message?: string }).message ||
          (data as { error?: string }).error ||
          "Fetch failed."
        );
      }
    } catch {
      setMicFetchStatus("error");
      setMicFetchMessage("Network error during fetch. Please check your connection.");
    } finally {
      setMicFetching(false);
    }
  };

  const handleMicKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleMicSearch();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-8">
      {/* ── Page Title ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <FlaskConical className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">EUCAST Breakpoint Search</h1>
          <p className="text-sm text-muted-foreground">
            Search clinical breakpoints, interpret MIC/Disk values, and manage automatic updates.
          </p>
        </div>
      </div>

      {/* ── Status Bar ─────────────────────────────────────────────────── */}
      <Card className={isDarkMode ? "bg-gray-900 border-gray-700" : ""}>
        <CardContent className="pt-4 pb-4">
          {statusLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading EUCAST status…</span>
            </div>
          ) : eucastStatus ? (
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Standard:</span>
                <Badge variant="outline" className="font-semibold">
                  {eucastStatus.standard}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Version:</span>
                <Badge variant="outline">
                  {eucastStatus.version ?? "—"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Last updated: {formatDateTime(eucastStatus.last_updated)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Status:</span>
                <Badge
                  className={
                    eucastStatus.status === "Current"
                      ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300"
                      : "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300"
                  }
                >
                  {eucastStatus.status}
                </Badge>
              </div>
              {eucastStatus.total_count > 0 && (
                <div className="flex items-center gap-2 ml-auto">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {eucastStatus.mic_count.toLocaleString()} MIC &nbsp;·&nbsp;{" "}
                    {eucastStatus.disk_count.toLocaleString()} Disk &nbsp;·&nbsp;{" "}
                    <strong>{eucastStatus.total_count.toLocaleString()}</strong> total breakpoints
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                No EUCAST data loaded. Run{" "}
                <code className="bg-muted px-1 rounded text-xs">
                  python manage.py load_eucast
                </code>{" "}
                to import the local Excel file.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Search Panel ───────────────────────────────────────────────── */}
      <Card className={isDarkMode ? "bg-gray-900 border-gray-700" : ""}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5" />
            Search Breakpoints
          </CardTitle>
          <CardDescription>
            Search by bacteria name, antibiotic name, or both. Results are filtered to the current
            EUCAST version.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="e.g. Escherichia coli, Amoxicillin, Staphylococcus…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className={isDarkMode ? "bg-gray-800 border-gray-600 text-white placeholder:text-gray-400" : ""}
              />
            </div>
            <div className="w-full sm:w-40">
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className={isDarkMode ? "bg-gray-800 border-gray-600 text-white" : ""}>
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="MIC">MIC</SelectItem>
                  <SelectItem value="Disk">Disk</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => { setCurrentPage(1); handleSearch(); }}
              disabled={searchLoading}
              className="flex items-center gap-2"
            >
              {searchLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search
            </Button>
          </div>

          {searchError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{searchError}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Search Results ─────────────────────────────────────────────── */}
      {hasSearched && (
        <Card className={isDarkMode ? "bg-gray-900 border-gray-700" : ""}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Results
                {totalCount > 0 && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({totalCount.toLocaleString()} breakpoints found)
                  </span>
                )}
              </CardTitle>
              {totalCount > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Page {currentPage}</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {searchLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No breakpoints found for your search.</p>
                <p className="text-sm mt-1">Try a different bacteria or antibiotic name.</p>
              </div>
            ) : (
              <>
                {/* Table */}
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={isDarkMode ? "bg-gray-800 text-gray-300" : "bg-muted/50"}>
                        <th className="text-left px-4 py-3 font-semibold">Bacteria / Organism</th>
                        <th className="text-left px-4 py-3 font-semibold">Antibiotic</th>
                        <th className="text-center px-4 py-3 font-semibold">Method</th>
                        <th className="text-center px-4 py-3 font-semibold">S ≤</th>
                        <th className="text-center px-4 py-3 font-semibold">R ≥</th>
                        <th className="text-center px-4 py-3 font-semibold">Unit</th>
                        <th className="text-center px-4 py-3 font-semibold">Version</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.map((bp, idx) => (
                        <tr
                          key={bp.id}
                          className={
                            idx % 2 === 0
                              ? isDarkMode
                                ? "bg-gray-900"
                                : "bg-white"
                              : isDarkMode
                              ? "bg-gray-800/50"
                              : "bg-muted/20"
                          }
                        >
                          <td className="px-4 py-3 font-medium">{bp.bacteria}</td>
                          <td className="px-4 py-3">{bp.antibiotic}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge
                              variant="outline"
                              className={
                                bp.method === "MIC"
                                  ? "border-blue-400 text-blue-700 dark:text-blue-300"
                                  : "border-purple-400 text-purple-700 dark:text-purple-300"
                              }
                            >
                              {bp.method}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center font-mono">
                            {bp.susceptible !== null ? bp.susceptible : "—"}
                          </td>
                          <td className="px-4 py-3 text-center font-mono">
                            {bp.resistant !== null ? bp.resistant : "—"}
                          </td>
                          <td className="px-4 py-3 text-center text-muted-foreground">
                            {bp.unit || "—"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="outline" className="text-xs">
                              v{bp.version_number ?? "—"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {(prevPage || nextPage) && (
                  <div className="flex items-center justify-between mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(prevPage, "prev")}
                      disabled={!prevPage || searchLoading}
                      className="flex items-center gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} · {totalCount.toLocaleString()} total
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(nextPage, "next")}
                      disabled={!nextPage || searchLoading}
                      className="flex items-center gap-1"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Interpretation Tool ────────────────────────────────────────── */}
      <Card className={isDarkMode ? "bg-gray-900 border-gray-700" : ""}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5" />
            MIC / Disk Interpretation
          </CardTitle>
          <CardDescription>
            Enter a measured MIC (mg/L) or Disk zone diameter (mm) to classify as Susceptible,
            Intermediate, or Resistant using EUCAST breakpoints.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1 text-muted-foreground uppercase tracking-wide">
                Bacteria / Organism
              </label>
              <Input
                placeholder="e.g. Escherichia coli"
                value={interpBacteria}
                onChange={(e) => setInterpBacteria(e.target.value)}
                className={isDarkMode ? "bg-gray-800 border-gray-600 text-white placeholder:text-gray-400" : ""}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-muted-foreground uppercase tracking-wide">
                Antibiotic
              </label>
              <Input
                placeholder="e.g. Amoxicillin"
                value={interpAntibiotic}
                onChange={(e) => setInterpAntibiotic(e.target.value)}
                className={isDarkMode ? "bg-gray-800 border-gray-600 text-white placeholder:text-gray-400" : ""}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-muted-foreground uppercase tracking-wide">
                Measured Value
              </label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. 4.0"
                value={interpValue}
                onChange={(e) => setInterpValue(e.target.value)}
                className={isDarkMode ? "bg-gray-800 border-gray-600 text-white placeholder:text-gray-400" : ""}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-muted-foreground uppercase tracking-wide">
                Method
              </label>
              <Select value={interpMethod} onValueChange={setInterpMethod}>
                <SelectTrigger className={isDarkMode ? "bg-gray-800 border-gray-600 text-white" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MIC">MIC (mg/L)</SelectItem>
                  <SelectItem value="Disk">Disk (mm)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleInterpret}
            disabled={interpLoading}
            className="flex items-center gap-2"
          >
            {interpLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FlaskConical className="h-4 w-4" />
            )}
            Interpret
          </Button>

          {interpError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{interpError}</span>
            </div>
          )}

          {interpResult && (
            <div
              className={`p-4 rounded-lg border-2 ${resultColor(interpResult.result)}`}
            >
              <div className="flex items-center gap-3 mb-3">
                {resultIcon(interpResult.result)}
                <span className="text-xl font-bold">{interpResult.result}</span>
                <Badge variant="outline" className="ml-auto text-xs">
                  {interpResult.standard} v{interpResult.version}
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-xs font-medium uppercase tracking-wide opacity-70">
                    Organism
                  </span>
                  <p className="font-medium mt-0.5">{interpResult.bacteria}</p>
                </div>
                <div>
                  <span className="text-xs font-medium uppercase tracking-wide opacity-70">
                    Antibiotic
                  </span>
                  <p className="font-medium mt-0.5">{interpResult.antibiotic}</p>
                </div>
                <div>
                  <span className="text-xs font-medium uppercase tracking-wide opacity-70">
                    S Breakpoint (≤)
                  </span>
                  <p className="font-mono font-medium mt-0.5">
                    {interpResult.s_breakpoint !== null
                      ? `${interpResult.s_breakpoint} ${interpResult.unit}`
                      : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium uppercase tracking-wide opacity-70">
                    R Breakpoint (≥)
                  </span>
                  <p className="font-mono font-medium mt-0.5">
                    {interpResult.r_breakpoint !== null
                      ? `${interpResult.r_breakpoint} ${interpResult.unit}`
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Auto-Update Section ────────────────────────────────────────── */}
      <Card className={isDarkMode ? "bg-gray-900 border-gray-700" : ""}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <RefreshCw className="h-5 w-5" />
            Automatic Updates
          </CardTitle>
          <CardDescription>
            Check the official EUCAST website for a newer breakpoint version and automatically
            download and import it. Requires admin privileges.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Button
              onClick={handleUpdate}
              disabled={updateLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {updateLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {updateLoading ? "Checking…" : "Check for Updates"}
            </Button>

            <Button
              onClick={handleShowLogs}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-muted-foreground"
            >
              <Clock className="h-4 w-4" />
              {showLogs ? "Hide Logs" : "View Update Logs"}
            </Button>
          </div>

          {/* Update result message */}
          {updateMessage && (
            <div
              className={`flex items-start gap-2 p-3 rounded-md border text-sm ${
                updateStatus === "success"
                  ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
                  : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
              }`}
            >
              {updateStatus === "success" ? (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              )}
              <span>{updateMessage}</span>
            </div>
          )}

          {/* Update Logs */}
          {showLogs && (
            <div className="mt-2">
              {logsLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading logs…</span>
                </div>
              ) : updateLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No update logs found.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={isDarkMode ? "bg-gray-800 text-gray-300" : "bg-muted/50"}>
                        <th className="text-left px-4 py-2 font-semibold">Date / Time</th>
                        <th className="text-center px-4 py-2 font-semibold">Status</th>
                        <th className="text-center px-4 py-2 font-semibold">New Version</th>
                        <th className="text-center px-4 py-2 font-semibold">Version Found</th>
                        <th className="text-left px-4 py-2 font-semibold">Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {updateLogs.map((log, idx) => (
                        <tr
                          key={log.id}
                          className={
                            idx % 2 === 0
                              ? isDarkMode ? "bg-gray-900" : "bg-white"
                              : isDarkMode ? "bg-gray-800/50" : "bg-muted/20"
                          }
                        >
                          <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">
                            {formatDateTime(log.checked_at)}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <Badge
                              className={
                                log.status === "success"
                                  ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300"
                                  : "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300"
                              }
                            >
                              {log.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-center">
                            {log.new_version_found ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-center font-mono text-xs">
                            {log.version_found || "—"}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground max-w-xs truncate">
                            {log.message}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      {/* ── MIC Distribution Section ───────────────────────────────────── */}
      <Card className={isDarkMode ? "bg-gray-900 border-gray-700" : ""}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FlaskConical className="h-5 w-5 text-blue-500" />
            MIC Distribution Database
            <Badge
              variant="outline"
              className="ml-2 text-xs border-blue-400 text-blue-600 dark:text-blue-300"
            >
              mic.eucast.org
            </Badge>
          </CardTitle>
          <CardDescription>
            Retrieve MIC distribution data (isolate counts per MIC value, ECOFF) from the EUCAST
            MIC database. Search the local cache or fetch live data from mic.eucast.org.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Search form */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1 text-muted-foreground uppercase tracking-wide">
                Organism / Bacteria
              </label>
              <Input
                placeholder="e.g. Escherichia coli"
                value={micOrganism}
                onChange={(e) => setMicOrganism(e.target.value)}
                onKeyDown={handleMicKeyDown}
                className={isDarkMode ? "bg-gray-800 border-gray-600 text-white placeholder:text-gray-400" : ""}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-muted-foreground uppercase tracking-wide">
                Antibiotic
              </label>
              <Input
                placeholder="e.g. Amoxicillin"
                value={micAntibiotic}
                onChange={(e) => setMicAntibiotic(e.target.value)}
                onKeyDown={handleMicKeyDown}
                className={isDarkMode ? "bg-gray-800 border-gray-600 text-white placeholder:text-gray-400" : ""}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-muted-foreground uppercase tracking-wide">
                Method
              </label>
              <Select value={micMethod} onValueChange={setMicMethod}>
                <SelectTrigger className={isDarkMode ? "bg-gray-800 border-gray-600 text-white" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MIC">MIC (mg/L)</SelectItem>
                  <SelectItem value="Disk">Disk (mm)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 items-center">
            <Button
              onClick={handleMicSearch}
              disabled={micLoading || micFetching}
              className="flex items-center gap-2"
            >
              {micLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {micLoading ? "Searching…" : "Search Local DB"}
            </Button>

            <Button
              onClick={handleMicFetch}
              disabled={micFetching || micLoading}
              variant="outline"
              className="flex items-center gap-2 border-blue-400 text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-900/20"
            >
              {micFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {micFetching ? "Fetching from EUCAST…" : "Fetch from mic.eucast.org"}
            </Button>

            <span className="text-xs text-muted-foreground">
              Admin token required for live fetch
            </span>
          </div>

          {/* Error */}
          {micError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{micError}</span>
            </div>
          )}

          {/* Fetch status message */}
          {micFetchMessage && (
            <div
              className={`flex items-start gap-2 p-3 rounded-md border text-sm ${
                micFetchStatus === "success"
                  ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
                  : micFetchStatus === "no_data"
                  ? "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300"
                  : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
              }`}
            >
              {micFetchStatus === "success" ? (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
              ) : micFetchStatus === "no_data" ? (
                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              )}
              <span>{micFetchMessage}</span>
            </div>
          )}

          {/* Results */}
          {hasMicSearched && !micLoading && (
            <>
              {micResult && micResult.distribution.length > 0 ? (
                <div className="space-y-4">
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className={`rounded-lg p-3 border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-muted/30 border-border"}`}>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Organism</p>
                      <p className="font-semibold text-sm mt-1 truncate" title={micResult.organism}>
                        {micResult.organism}
                      </p>
                    </div>
                    <div className={`rounded-lg p-3 border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-muted/30 border-border"}`}>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Antibiotic</p>
                      <p className="font-semibold text-sm mt-1 truncate" title={micResult.antibiotic}>
                        {micResult.antibiotic}
                      </p>
                    </div>
                    <div className={`rounded-lg p-3 border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-muted/30 border-border"}`}>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Total Isolates</p>
                      <p className="font-semibold text-sm mt-1">
                        {micResult.total_isolates > 0
                          ? micResult.total_isolates.toLocaleString()
                          : micResult.distribution.reduce((s, r) => s + r.num_observations, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className={`rounded-lg p-3 border ${
                      micResult.ecoff !== null
                        ? isDarkMode
                          ? "bg-amber-900/30 border-amber-700"
                          : "bg-amber-50 border-amber-300"
                        : isDarkMode
                        ? "bg-gray-800 border-gray-700"
                        : "bg-muted/30 border-border"
                    }`}>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                        ECOFF
                      </p>
                      <p className={`font-semibold text-sm mt-1 ${micResult.ecoff !== null ? "text-amber-700 dark:text-amber-300" : ""}`}>
                        {micResult.ecoff !== null
                          ? `${micResult.ecoff} ${micResult.method === "MIC" ? "mg/L" : "mm"}`
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Distribution table — rendered via named sub-component to avoid
                      IIFE-inside-JSX React DOM reconciliation errors */}
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <MicDistributionTable
                      distribution={micResult.distribution}
                      ecoff={micResult.ecoff}
                      method={micResult.method}
                      isDarkMode={isDarkMode}
                    />
                  </div>

                  {/* Footer: data source + fetch date */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <span>
                      Source:{" "}
                      <a
                        href="https://mic.eucast.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-primary"
                      >
                        mic.eucast.org
                      </a>
                    </span>
                    {micResult.fetched_at && (
                      <span>Last fetched: {formatDateTime(micResult.fetched_at)}</span>
                    )}
                  </div>
                </div>
              ) : micResult && micResult.distribution.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <FlaskConical className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No MIC distribution data in local database.</p>
                  <p className="text-sm mt-1">
                    {micResult.message ||
                      'Click "Fetch from mic.eucast.org" to retrieve live data.'}
                  </p>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
