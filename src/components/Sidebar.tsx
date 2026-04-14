"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Home, FileText, Upload, Brain, Map, Mail, Shield, FlaskConical } from "lucide-react";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "upload", label: "File Upload", icon: Upload },
  { id: "ai", label: "AI Recommendations", icon: Brain },
  { id: "database", label: "Database Recs", icon: Brain },
  { id: "heatmap", label: "Heatmap", icon: Map },
  { id: "messages", label: "Messages", icon: Mail },
  { id: "admin", label: "Admin", icon: Shield },
  { id: "eucast", label: "EUCAST", icon: FlaskConical },
];

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isOpen, setIsOpen] = useState(false);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('tabChange', { detail: tabId }));
  };

  return (
    <>
      {/* Mobile menu button - visible on small screens */}
      <div className="lg:hidden fixed top-16 right-2 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant="outline"
          size="sm"
          className="h-10 w-10 p-0 shadow-lg"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar - full screen on mobile, fixed sidebar on desktop */}
      <div
        className={`fixed lg:static inset-y-0 right-0 z-40 bg-card dark:bg-card shadow-xl border-l border-border dark:border-border transform transition-transform duration-300 ease-in-out lg:transform-none lg:shadow-none lg:border-l rounded-l-lg 
          w-16 sm:w-48 md:w-56 lg:w-64 xl:w-72
          ${isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
          ${isOpen ? "lg:translate-x-0" : ""}`}
        style={{ top: '4rem' }}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Reset Button - only visible on larger screens */}
          <div className="hidden lg:block px-4 py-4">
            <Button
              onClick={() => handleTabChange("dashboard")}
              variant="default"
              className="w-full justify-start transition-all duration-200 ease-in-out rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-md dark:shadow-black/30"
            >
              <Home className="h-4 w-4 flex-shrink-0" />
              <span className="ml-3 hidden xl:inline">Reset to Main</span>
              <span className="ml-3 hidden lg:xl:hidden">Reset</span>
            </Button>
          </div>

          {/* Mobile reset button */}
          <div className="lg:hidden px-2 py-2">
            <Button
              onClick={() => handleTabChange("dashboard")}
              variant="default"
              className="w-full justify-center sm:justify-start bg-primary hover:bg-primary/90 text-primary-foreground h-10 sm:h-9"
            >
              <Home className="h-4 w-4" />
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
                  className={`w-full justify-center sm:justify-start transition-all duration-200 ease-in-out rounded-lg h-10 sm:h-9 
                    ${isActive
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md dark:shadow-black/30"
                      : "hover:bg-accent dark:hover:bg-accent hover:shadow-sm"
                    }
                    ${isOpen ? "lg:w-full" : "lg:w-full"}
                  `}
                  title={item.label}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="ml-2 hidden sm:hidden md:inline lg:hidden xl:inline">
                    {item.label}
                  </span>
                  <span className="ml-2 hidden lg:hidden xl:hidden md:block">
                    {item.label.length > 12 ? item.label.substring(0, 12) + '...' : item.label}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
