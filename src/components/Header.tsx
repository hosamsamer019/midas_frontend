"use client";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Menu } from "lucide-react";
import MessagingIcon from "./MessagingIcon";

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <header className={`shadow-sm border-b border-border fixed top-0 left-0 right-0 z-50 ${
      isDarkMode 
        ? "bg-black border-gray-800" 
        : "bg-card"
    }`}>
      <div className="w-full px-2 sm:px-3 md:px-4 lg:px-6">
        <div className="flex justify-between items-center h-12 sm:h-14 md:h-16">
          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <Button
              onClick={onMenuClick}
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 mr-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Title */}
          <div className="flex items-center flex-1 min-w-0">
            <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-foreground truncate">
              <span className="hidden md:inline">MIDAS</span>
              <span className="md:hidden">MIDAS</span>
            </h1>
          </div>
          
          {/* Right side controls */}
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
            <MessagingIcon />
            
            <Button
              onClick={toggleDarkMode}
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0"
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              <div className="relative w-4 h-4">
                {isDarkMode ? (
                  <Sun className="absolute inset-0 h-4 w-4" />
                ) : (
                  <Moon className="absolute inset-0 h-4 w-4" />
                )}
              </div>
            </Button>
            
            {user && (
              <>
                <span className="hidden sm:block text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                  {user.username} ({user.role})
                </span>
                <span className="sm:hidden text-xs text-muted-foreground">
                  {user.username}
                </span>
                
                <Button 
                  onClick={logout} 
                  variant="outline" 
                  size="sm"
                  className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
                >
                  <span className="hidden sm:inline">Logout</span>
                  <span className="sm:hidden">Out</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
