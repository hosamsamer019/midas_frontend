"use client";

import { Suspense, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Home as HomeIcon, FileText, Upload, Brain, Map, Mail, Menu, X, Shield, FlaskConical } from "lucide-react";
import Dashboard from "@/components/Dashboard";
import Login from "@/components/Login";
import FileUpload from "@/components/FileUpload";
import AIRecommendation from "@/components/AIRecommendation";
import DatabaseRecommendation from "@/components/DatabaseRecommendation";
import Reports from "@/components/Reports";
import Heatmap from "@/components/Heatmap";
import Messages from "@/components/Messages";
import Header from "@/components/Header";
import AdminPanel from "@/components/AdminPanel";
import EucastSearch from "@/components/EucastSearch";

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  useEffect(() => {
    const handleTabChange = (event: CustomEvent<string>) => {
      setActiveTab(event.detail);
      setSidebarOpen(false);
    };

    window.addEventListener('tabChange', handleTabChange as EventListener);

    return () => {
      window.removeEventListener('tabChange', handleTabChange as EventListener);
    };
  }, []);

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "upload":
        return <FileUpload />;
      case "ai":
        return <AIRecommendation />;
      case "database":
        return <DatabaseRecommendation />;
      case "reports":
        return <Reports />;
      case "heatmap":
        return <Heatmap />;
      case "messages":
        return <Messages />;
      case "admin":
        return <AdminPanel />;
      case "eucast":
        return <EucastSearch />;
      default:
        return <Dashboard />;
    }
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: HomeIcon },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "upload", label: "File Upload", icon: Upload },
    { id: "ai", label: "AI Recs", icon: Brain },
    { id: "database", label: "DB Recs", icon: Brain },
    { id: "heatmap", label: "Heatmap", icon: Map },
    { id: "messages", label: "Messages", icon: Mail },
    { id: "admin", label: "Admin", icon: Shield },
    { id: "eucast", label: "EUCAST", icon: FlaskConical },
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-black" : "bg-background"}`}>
      <Header onMenuClick={handleMenuClick} />
      
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-14 right-2 z-50">
        <Button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          variant="outline"
          size="sm"
          className={`h-10 w-10 p-0 shadow-lg ${
            isDarkMode 
              ? "bg-gray-900 border-gray-700" 
              : "bg-background"
          }`}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        <div 
          className={
            "fixed lg:static inset-y-0 right-0 z-40 " +
            (isDarkMode 
              ? "bg-black border-gray-800" 
              : "bg-card border-border") +
            " shadow-xl border-l " +
            "transform transition-transform duration-300 ease-in-out " +
            "w-16 sm:w-48 md:w-56 lg:w-64 xl:w-72 " +
            "mt-14 lg:mt-0 " +
            (sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0")
          }
        >
          <div className="flex flex-col h-full overflow-hidden">
            {/* Reset Button */}
            <div className="px-2 py-2 lg:px-4 lg:py-4">
              <Button
                onClick={() => handleTabChange("dashboard")}
                variant="default"
                className={`w-full justify-center sm:justify-start h-9 sm:h-10 ${
                  isDarkMode 
                    ? "bg-gray-800 hover:bg-gray-700 text-white" 
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                }`}
              >
                <HomeIcon className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Reset</span>
              </Button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 px-2 lg:px-4 py-2 space-y-1 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <Button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    variant={isActive ? "default" : "ghost"}
                    className={
                      "w-full justify-center sm:justify-start transition-all duration-200 ease-in-out rounded-lg h-9 sm:h-10 " +
                      (isActive 
                        ? (isDarkMode 
                            ? "bg-gray-800 hover:bg-gray-700 text-white" 
                            : "bg-primary hover:bg-primary/90 text-primary-foreground") 
                        : (isDarkMode 
                            ? "hover:bg-gray-900 text-gray-300" 
                            : "hover:bg-accent"))
                    }
                    title={item.label}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="ml-2 hidden sm:inline">
                      {item.label}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Main Content */}
        <main className={`flex-1 w-full p-2 sm:p-3 md:p-4 lg:p-4 xl:p-6 mt-14 lg:mt-0 ${
          isDarkMode ? "bg-black" : ""
        }`}>
          <Suspense fallback={
            <div className="flex items-center justify-center p-4">
              <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
                isDarkMode ? "border-white" : "border-primary"
              }`}></div>
            </div>
          }>
            {renderContent()}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
