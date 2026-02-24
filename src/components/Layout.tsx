import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { Button } from "@/components/ui/button";
import { useKeycloak } from "@react-keycloak/web";
import DateRangePicker from "@/components/dashboard/DateRangePicker";
import { isSuperAdmin } from "@/utils/roleUtils";
import {
  BarChart3,
  Users,
  MessageSquare,
  Calendar,
  Moon,
  Sun,
  LayoutDashboard,
  LogOut,
  UserRound,
  FileText,
  Activity,
  CalendarIcon,
  RotateCcw,
  ClipboardCheck,
  AlertTriangle,
  Mic,
  Volume2,
  Menu,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme, setTheme } = useTheme();
  const { dateRange, setDateRange, resetDateRange } = useDateFilter();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { keycloak } = useKeycloak();

  const handleLogout = () => {
    keycloak.logout();
  };

  // Check if current user is super admin
  const isSuper = isSuperAdmin(keycloak);

  const navItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: <LayoutDashboard size={20} />,
    },
    {
      name: "Users",
      path: "/devices",
      icon: <Users size={20} />,
    },
    {
      name: "Sessions",
      path: "/sessions",
      icon: <Calendar size={20} />,
    },
    {
      name: "Questions",
      path: "/questions",
      icon: <MessageSquare size={20} />,
    },
    // {
    //   name: "Content",
    //   path: "/content",
    //   icon: <FileText size={20} />,
    // },
    // {
    //   name: "Analytics",
    //   path: "/analytics",
    //   icon: <BarChart3 size={20} />,
    // },
    {
      name: "Feedback",
      path: "/feedback",
      icon: <ClipboardCheck size={20} />,
    },
    // {
    //   name: "ASR",
    //   path: "/asr",
    //   icon: <Mic size={20} />,
    // },
    // {
    //   name: "TTS",
    //   path: "/tts",
    //   icon: <Volume2 size={20} />,
    // },
    // Conditionally add Errors menu item for super-admin users only
    ...(isSuper
      ? [
          // {
          //   name: "Errors",
          //   path: "/errors",
          //   icon: <AlertTriangle size={20} />,
          // },
          // {
          //   name: "Health Monitor",
          //   path: "/health-monitor",
          //   icon: <Activity size={20} />,
          // },
          // {
          //   name: "Service Status",
          //   path: "/service-status",
          //   icon: <Activity size={20} />,
          // },
        ]
      : []),

    {
      name: "Service Status",
      path: "/service-status",
      icon: <Activity size={20} />,
    },
  ];

  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className="p-4 border-b border-sidebar-border flex justify-between items-center h-[60px]">
        {(!collapsed || isMobile) && (
          <h2 className="text-lg font-semibold truncate pr-2 mr-2">Bharat Vistaar Insights</h2>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="hover:bg-sidebar-accent flex-shrink-0"
          >
            <BarChart3 size={20} />
          </Button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                onClick={() => {
                  if (isMobile) {
                    setIsMobileMenuOpen(false);
                  }
                }}
                className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                  location.pathname === item.path
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {(!collapsed || isMobile) && <span>{item.name}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`w-full hover:bg-sidebar-accent mb-2 ${
                (collapsed && !isMobile) ? "justify-center" : "justify-start"
              }`}
            >
              {theme === "dark" ? (
                <Moon size={20} className="mr-2 flex-shrink-0" />
              ) : theme === "light" ? (
                <Sun size={20} className="mr-2 flex-shrink-0" />
              ) : (
                <Sun size={20} className="mr-2 flex-shrink-0" />
              )}
              {(!collapsed || isMobile) && <span>Theme</span>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun size={16} className="mr-2" />
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon size={16} className="mr-2" />
              Dark
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`w-full hover:bg-sidebar-accent ${
                (collapsed && !isMobile) ? "justify-center" : "justify-start"
              }`}
              onClick={handleLogout}
            >
              <LogOut size={20} className="mr-2 flex-shrink-0" />
              {(!collapsed || isMobile) && <span>Logout</span>}
            </Button>
          </DropdownMenuTrigger>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={`bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ease-in-out hidden md:block ${
          collapsed ? "w-[70px]" : "w-[280px]"
        }`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="container mx-auto">
          {/* Header with Global Date Filter and User Profile */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 px-0 sm:p-6 border-b mb-2 mt-2 gap-4">
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="md:hidden">
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[240px] p-0 border-r-0">
                    {renderSidebarContent(true)}
                  </SheetContent>
                </Sheet>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground hidden sm:block" />
                <span className="text-base font-medium hidden sm:block">Filter:</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                <DateRangePicker
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                />
              </div>
            </div>

            <DropdownMenu>
              {/* <DropdownMenuTrigger asChild> */}
              {/* <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarFallback>
                      <UserRound className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                </Button> */}
              {/* </DropdownMenuTrigger> */}
              {/* <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuItem className="flex items-center">
                  <UserRound className="mr-2 h-4 w-4" />
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center text-red-600 focus:text-red-600"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent> */}
            </DropdownMenu>
          </div>

          <div className="py-4 px-0 sm:p-6">{children}</div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
