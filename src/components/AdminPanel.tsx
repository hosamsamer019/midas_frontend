"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { API_BASE_URL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Shield, Mail, Activity, Plus, Search, 
  Trash2, Edit, Key, RefreshCw, Check, X, AlertTriangle,
  FileText, BarChart3, Settings, Server, Database, Cpu, HardDrive,
  Lock, Unlock, ShieldCheck, ShieldOff
} from "lucide-react";

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  role_id: number;
  status: string;
  is_active: boolean;
  is_verified: boolean;
  two_factor_enabled?: boolean;
  api_key_count?: number;
  failed_attempts?: number;
  is_locked?: boolean;
  create_at: string;
  last_login: string | null;
}

interface Role {
  id: number;
  role_name: string;
  description: string;
  permissions: string[];
  permission_count: number;
}

interface AdminEmail {
  id: number;
  admin_email: string;
  is_primary: boolean;
}

interface LoginAttempt {
  id: number;
  email_attempted: string;
  user: string | null;
  ip_address: string | null;
  success: boolean;
  attempt_time: string;
}

interface AuditLog {
  id: number;
  user: string;
  action: string;
  details: string;
  ip_address: string;
  timestamp: string;
}

interface Analytics {
  users: {
    total: number;
    active: number;
    inactive: number;
    new_this_week: number;
  };
  messages: {
    total: number;
    unread: number;
    this_week: number;
  };
  logins: {
    today: number;
    failed_today: number;
  };
  role_distribution: Array<{ role: string; count: number }>;
}

interface SystemHealth {
  cpu: { usage_percent: number; count: number };
  memory: { total_gb: number; used_gb: number; available_gb: number; percent: number };
  disk: { total_gb: number; used_gb: number; free_gb: number; percent: number };
  database: { status: string; size: string };
  application: { process_memory_mb: number };
}

interface Settings {
  site_name: string;
  debug_mode: boolean;
  allowed_hosts: string[];
  max_upload_size_mb: number;
  session_timeout_minutes: number;
  two_factor_required: boolean;
}

interface UserSecurity {
  id: number;
  email: string;
  full_name: string;
  role: string;
  two_factor_enabled: boolean;
  api_key_count: number;
  failed_attempts: number;
  is_locked: boolean;
  is_active: boolean;
  status: string;
}

const API_BASE = API_BASE_URL;

export default function AdminPanel() {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  };

  const [activeTab, setActiveTab] = useState<"users" | "roles" | "emails" | "activity" | "audit" | "analytics" | "health" | "settings" | "security">("users");
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [adminEmails, setAdminEmails] = useState<AdminEmail[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [userSecurity, setUserSecurity] = useState<UserSecurity[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Create user form state
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<number | undefined>(undefined);
  const [createdUserPassword, setCreatedUserPassword] = useState<string | null>(null);

  // Default roles in case API doesn't return any
  const defaultRoles = [
    { id: 1, role_name: 'Administrator', description: 'Full system access', permissions: [], permission_count: 0 },
    { id: 2, role_name: 'Doctor', description: 'Can view and manage patients', permissions: [], permission_count: 0 },
    { id: 3, role_name: 'Lab', description: 'Can manage lab results', permissions: [], permission_count: 0 },
    { id: 4, role_name: 'Viewer', description: 'Read-only access', permissions: [], permission_count: 0 },
  ];

  // New admin email state
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [isPrimaryEmail, setIsPrimaryEmail] = useState(false);

  // Function to open create modal and fetch roles if needed
  const handleOpenCreateModal = () => {
    if (roles.length === 0) {
      fetchRoles();
    }
    setShowCreateModal(true);
  };

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    if (activeTab === "roles") fetchRoles();
    if (activeTab === "emails") fetchAdminEmails();
    if (activeTab === "activity") fetchLoginAttempts();
    if (activeTab === "audit") fetchAuditLogs();
    if (activeTab === "analytics") fetchAnalytics();
    if (activeTab === "health") fetchSystemHealth();
    if (activeTab === "settings") fetchSettings();
    if (activeTab === "security") fetchUserSecurity();
  }, [activeTab]);

  const fetchWithAuth = async (endpoint: string) => {
    const token = getToken();
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth("/api/admin/users/");
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth("/api/admin/roles/");
      setRoles(data);
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminEmails = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth("/api/admin/emails/");
      setAdminEmails(data);
    } catch (error) {
      console.error("Error fetching admin emails:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoginAttempts = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth("/api/admin/login-attempts/");
      setLoginAttempts(data);
    } catch (error) {
      console.error("Error fetching login attempts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth("/api/admin/audit-logs/");
      setAuditLogs(data);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth("/api/admin/analytics/");
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemHealth = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth("/api/admin/system-health/");
      setSystemHealth(data);
    } catch (error) {
      console.error("Error fetching system health:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth("/api/admin/settings/");
      setSettings(data);
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSecurity = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth("/api/admin/user-security/");
      setUserSecurity(data);
    } catch (error) {
      console.error("Error fetching user security:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserName) return;
    const token = getToken();
    if (!token) return;

    try {
      const userData: { email: string; full_name: string; role_id?: number } = {
        email: newUserEmail,
        full_name: newUserName,
      };
      
      if (newUserRole !== undefined && newUserRole !== null) {
        userData.role_id = newUserRole;
      }

      const response = await fetch(`${API_BASE}/api/admin/users/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const data = await response.json();
        setCreatedUserPassword(data.generated_password);
        fetchUsers();
        setShowCreateModal(false);
        setNewUserEmail("");
        setNewUserName("");
        setNewUserRole(undefined);
      } else {
        const errorData = await response.json();
        alert("Error creating user: " + JSON.stringify(errorData));
      }
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Error creating user. Please check console for details.");
    }
  };

  const handleResetPassword = async (userId: number) => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/admin/users/${userId}/reset_password/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        alert(`New password: ${data.generated_password}`);
      }
    } catch (error) {
      console.error("Error resetting password:", error);
    }
  };

  const handleDeactivateUser = async (userId: number) => {
    if (!confirm("Are you sure you want to deactivate this user?")) return;
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/admin/users/${userId}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Error deactivating user:", error);
    }
  };

  const handleVerifyUser = async (userId: number, isVerified: boolean) => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/admin/users/${userId}/verify_user/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_verified: isVerified }),
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Error verifying user:", error);
    }
  };

  const handleToggle2FA = async (userId: number, enable: boolean) => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/admin/user-security/${userId}/toggle_2fa/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enable }),
      });

      if (response.ok) {
        fetchUserSecurity();
        alert(`2FA ${enable ? 'enabled' : 'disabled'} successfully`);
      }
    } catch (error) {
      console.error("Error toggling 2FA:", error);
    }
  };

  const handleUnlockUser = async (userId: number) => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/admin/user-security/${userId}/unlock_user/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        fetchUserSecurity();
        alert("User unlocked successfully");
      }
    } catch (error) {
      console.error("Error unlocking user:", error);
    }
  };

  const handleAddAdminEmail = async () => {
    if (!newAdminEmail) return;
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/admin/emails/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          admin_email: newAdminEmail,
          is_primary: isPrimaryEmail,
        }),
      });

      if (response.ok) {
        fetchAdminEmails();
        setNewAdminEmail("");
        setIsPrimaryEmail(false);
      }
    } catch (error) {
      console.error("Error adding admin email:", error);
    }
  };

  const handleRemoveAdminEmail = async (emailId: number) => {
    if (!confirm("Are you sure you want to remove this admin email?")) return;
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/admin/emails/${emailId}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchAdminEmails();
      }
    } catch (error) {
      console.error("Error removing admin email:", error);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSecurityUsers = userSecurity.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`p-4 ${isDarkMode ? "bg-black" : ""}`}>
      <h1 className={`text-2xl font-bold mb-6 ${isDarkMode ? "text-white" : ""}`}>
        Admin Panel
      </h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={activeTab === "users" ? "default" : "outline"}
          onClick={() => setActiveTab("users")}
          className="flex items-center gap-2"
        >
          <Users className="h-4 w-4" />
          Users
        </Button>
        <Button
          variant={activeTab === "security" ? "default" : "outline"}
          onClick={() => setActiveTab("security")}
          className="flex items-center gap-2"
        >
          <ShieldCheck className="h-4 w-4" />
          Security
        </Button>
        <Button
          variant={activeTab === "roles" ? "default" : "outline"}
          onClick={() => setActiveTab("roles")}
          className="flex items-center gap-2"
        >
          <Shield className="h-4 w-4" />
          Roles
        </Button>
        <Button
          variant={activeTab === "emails" ? "default" : "outline"}
          onClick={() => setActiveTab("emails")}
          className="flex items-center gap-2"
        >
          <Mail className="h-4 w-4" />
          Emails
        </Button>
        <Button
          variant={activeTab === "activity" ? "default" : "outline"}
          onClick={() => setActiveTab("activity")}
          className="flex items-center gap-2"
        >
          <Activity className="h-4 w-4" />
          Activity
        </Button>
        <Button
          variant={activeTab === "audit" ? "default" : "outline"}
          onClick={() => setActiveTab("audit")}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Audit Logs
        </Button>
        <Button
          variant={activeTab === "analytics" ? "default" : "outline"}
          onClick={() => setActiveTab("analytics")}
          className="flex items-center gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          Analytics
        </Button>
        <Button
          variant={activeTab === "health" ? "default" : "outline"}
          onClick={() => setActiveTab("health")}
          className="flex items-center gap-2"
        >
          <Server className="h-4 w-4" />
          System Health
        </Button>
        <Button
          variant={activeTab === "settings" ? "default" : "outline"}
          onClick={() => setActiveTab("settings")}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>

      {/* Users Tab */}
      {activeTab === "users" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleOpenCreateModal} className="ml-4">
              <Plus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className={`w-full ${isDarkMode ? "text-white" : ""}`}>
                <thead>
                  <tr className={isDarkMode ? "border-gray-700" : "border-gray-200"}>
                    <th className="text-left p-3 border-b">Name</th>
                    <th className="text-left p-3 border-b">Email</th>
                    <th className="text-left p-3 border-b">Role</th>
                    <th className="text-left p-3 border-b">Status</th>
                    <th className="text-left p-3 border-b">Verified</th>
                    <th className="text-left p-3 border-b">Created</th>
                    <th className="text-left p-3 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className={isDarkMode ? "border-gray-700 hover:bg-gray-800" : "hover:bg-gray-50"}>
                      <td className="p-3 border-b">{user.full_name}</td>
                      <td className="p-3 border-b">{user.email}</td>
                      <td className="p-3 border-b">
                        <Badge variant="outline">{user.role || "No Role"}</Badge>
                      </td>
                      <td className="p-3 border-b">
                        <Badge variant={user.status === "Active" ? "default" : "destructive"}>
                          {user.status}
                        </Badge>
                      </td>
                      <td className="p-3 border-b">
                        {user.is_verified ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                      </td>
                      <td className="p-3 border-b">
                        {user.create_at ? new Date(user.create_at).toLocaleDateString() : "-"}
                      </td>
                      <td className="p-3 border-b">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerifyUser(user.id, !user.is_verified)}
                            title={user.is_verified ? "Unverify User" : "Verify User"}
                            className={user.is_verified ? "text-orange-500" : "text-green-500"}
                          >
                            {user.is_verified ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetPassword(user.id)}
                            title="Reset Password"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeactivateUser(user.id)}
                            title="Deactivate User"
                            className="text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className={`w-full ${isDarkMode ? "text-white" : ""}`}>
                <thead>
                  <tr className={isDarkMode ? "border-gray-700" : "border-gray-200"}>
                    <th className="text-left p-3 border-b">Name</th>
                    <th className="text-left p-3 border-b">Email</th>
                    <th className="text-left p-3 border-b">2FA</th>
                    <th className="text-left p-3 border-b">API Keys</th>
                    <th className="text-left p-3 border-b">Failed Attempts</th>
                    <th className="text-left p-3 border-b">Locked</th>
                    <th className="text-left p-3 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSecurityUsers.map((user) => (
                    <tr key={user.id} className={isDarkMode ? "border-gray-700 hover:bg-gray-800" : "hover:bg-gray-50"}>
                      <td className="p-3 border-b">{user.full_name}</td>
                      <td className="p-3 border-b">{user.email}</td>
                      <td className="p-3 border-b">
                        {user.two_factor_enabled ? (
                          <Badge variant="default" className="bg-green-500">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Enabled
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <ShieldOff className="h-3 w-3 mr-1" />
                            Disabled
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 border-b">
                        <Badge variant="outline">
                          {user.api_key_count} key(s)
                        </Badge>
                      </td>
                      <td className="p-3 border-b">
                        <span className={user.failed_attempts > 0 ? "text-red-500 font-bold" : ""}>
                          {user.failed_attempts}
                        </span>
                      </td>
                      <td className="p-3 border-b">
                        {user.is_locked ? (
                          <Badge variant="destructive">
                            <Lock className="h-3 w-3 mr-1" />
                            Locked
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-500">
                            <Unlock className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 border-b">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggle2FA(user.id, !user.two_factor_enabled)}
                            title={user.two_factor_enabled ? "Disable 2FA" : "Enable 2FA"}
                            className={user.two_factor_enabled ? "text-orange-500" : "text-green-500"}
                          >
                            {user.two_factor_enabled ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                          </Button>
                          {user.is_locked && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnlockUser(user.id)}
                              title="Unlock User"
                              className="text-green-500"
                            >
                              <Unlock className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetPassword(user.id)}
                            title="Reset Password"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === "roles" && (
        <div>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(roles.length > 0 ? roles : defaultRoles).map((role) => (
                <Card key={role.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {role.role_name}
                      <Badge>{role.permission_count} permissions</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-sm mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                      {role.description || "No description"}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions && role.permissions.slice(0, 5).map((perm, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {perm}
                        </Badge>
                      ))}
                      {role.permissions && role.permissions.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{role.permissions.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Admin Emails Tab */}
      {activeTab === "emails" && (
        <div>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Add Admin Email</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter admin email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                />
                <Button
                  variant={isPrimaryEmail ? "default" : "outline"}
                  onClick={() => setIsPrimaryEmail(!isPrimaryEmail)}
                >
                  Primary
                </Button>
                <Button onClick={handleAddAdminEmail}>Add</Button>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="space-y-2">
              {adminEmails.map((email) => (
                <Card key={email.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4" />
                      <span>{email.admin_email}</span>
                      {email.is_primary && (
                        <Badge variant="default">Primary</Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveAdminEmail(email.id)}
                      className="text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === "activity" && (
        <div>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className={`w-full ${isDarkMode ? "text-white" : ""}`}>
                <thead>
                  <tr className={isDarkMode ? "border-gray-700" : "border-gray-200"}>
                    <th className="text-left p-3 border-b">Time</th>
                    <th className="text-left p-3 border-b">Email</th>
                    <th className="text-left p-3 border-b">IP Address</th>
                    <th className="text-left p-3 border-b">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loginAttempts.map((attempt) => (
                    <tr key={attempt.id} className={isDarkMode ? "border-gray-700 hover:bg-gray-800" : "hover:bg-gray-50"}>
                      <td className="p-3 border-b">
                        {new Date(attempt.attempt_time).toLocaleString()}
                      </td>
                      <td className="p-3 border-b">{attempt.email_attempted}</td>
                      <td className="p-3 border-b">{attempt.ip_address || "-"}</td>
                      <td className="p-3 border-b">
                        {attempt.success ? (
                          <Badge variant="default" className="bg-green-500">
                            Success
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === "audit" && (
        <div>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className={`w-full ${isDarkMode ? "text-white" : ""}`}>
                <thead>
                  <tr className={isDarkMode ? "border-gray-700" : "border-gray-200"}>
                    <th className="text-left p-3 border-b">Time</th>
                    <th className="text-left p-3 border-b">User</th>
                    <th className="text-left p-3 border-b">Action</th>
                    <th className="text-left p-3 border-b">Details</th>
                    <th className="text-left p-3 border-b">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} className={isDarkMode ? "border-gray-700 hover:bg-gray-800" : "hover:bg-gray-50"}>
                      <td className="p-3 border-b">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : "-"}
                      </td>
                      <td className="p-3 border-b">{log.user}</td>
                      <td className="p-3 border-b">
                        <Badge variant="outline">{log.action}</Badge>
                      </td>
                      <td className="p-3 border-b">{log.details || "-"}</td>
                      <td className="p-3 border-b">{log.ip_address || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : analytics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analytics.users.total}</div>
                  <p className="text-sm text-gray-500">
                    {analytics.users.active} active, {analytics.users.inactive} inactive
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">New This Week</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500">{analytics.users.new_this_week}</div>
                  <p className="text-sm text-gray-500">New users registered</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analytics.messages.total}</div>
                  <p className="text-sm text-gray-500">
                    {analytics.messages.unread} unread
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Logins Today</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-500">{analytics.logins.today}</div>
                  <p className="text-sm text-red-500">
                    {analytics.logins.failed_today} failed
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8">No analytics data</div>
          )}
        </div>
      )}

      {/* System Health Tab */}
      {activeTab === "health" && (
        <div>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : systemHealth ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="h-5 w-5" />
                    CPU Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{systemHealth.cpu.usage_percent}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${systemHealth.cpu.usage_percent}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{systemHealth.cpu.count} cores</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5" />
                    Memory
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{systemHealth.memory.percent}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${systemHealth.memory.percent}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {systemHealth.memory.used_gb}GB / {systemHealth.memory.total_gb}GB
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{systemHealth.database.status}</div>
                  <p className="text-sm text-gray-500 mt-2">Size: {systemHealth.database.size}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Disk Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{systemHealth.disk.percent}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full" 
                      style={{ width: `${systemHealth.disk.percent}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {systemHealth.disk.used_gb}GB / {systemHealth.disk.total_gb}GB
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8">No system health data</div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : settings ? (
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Site Name</p>
                    <p className="font-medium">{settings.site_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Debug Mode</p>
                    <Badge variant={settings.debug_mode ? "destructive" : "default"}>
                      {settings.debug_mode ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Max Upload Size</p>
                    <p className="font-medium">{settings.max_upload_size_mb} MB</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Session Timeout</p>
                    <p className="font-medium">{settings.session_timeout_minutes} minutes</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Two-Factor Auth</p>
                    <Badge variant={settings.two_factor_required ? "default" : "outline"}>
                      {settings.two_factor_required ? "Required" : "Optional"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Allowed Hosts</p>
                    <p className="font-medium">{settings.allowed_hosts.join(", ")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8">No settings data</div>
          )}
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {createdUserPassword ? (
                <div className="text-center space-y-4">
                  <div className="p-4 bg-green-100 dark:bg-green-900 rounded-lg">
                    <p className="font-bold text-green-800 dark:text-green-200">
                      User Created Successfully!
                    </p>
                    <p className="text-sm mt-2">
                      Temporary Password:
                    </p>
                    <p className="text-xl font-mono font-bold text-green-700 dark:text-green-300">
                      {createdUserPassword}
                    </p>
                    <p className="text-xs mt-2 text-yellow-600">
                      Please copy this password and share with the user
                    </p>
                  </div>
                  <Button onClick={() => {
                    setCreatedUserPassword(null);
                    setShowCreateModal(false);
                  }}>
                    Close
                  </Button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name</label>
                    <Input
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <Input
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Role</label>
                    <select
                      className="w-full p-2 border rounded"
                      value={newUserRole ?? ""}
                      onChange={(e) => setNewUserRole(e.target.value ? parseInt(e.target.value) : undefined)}
                    >
                      <option value="">Select Role (Optional)</option>
                      {(roles.length > 0 ? roles : defaultRoles).map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.role_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateUser} disabled={!newUserEmail || !newUserName}>
                      Create User
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
