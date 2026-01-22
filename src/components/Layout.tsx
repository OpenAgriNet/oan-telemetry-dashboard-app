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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme, setTheme } = useTheme();
  const { dateRange, setDateRange, resetDateRange } = useDateFilter();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
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
      name: "Devices",
      path: "/devices",
      icon: <Users size={20} />,
    },
    // {
    //   name: "Sessions",
    //   path: "/sessions",
    //   icon: <Calendar size={20} />,
    // },
    // {
    //   name: "Questions",
    //   path: "/questions",
    //   icon: <MessageSquare size={20} />,
    // },
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
    // {
    //   name: "Feedback",
    //   path: "/feedback",
    //   icon: <ClipboardCheck size={20} />,
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

    // {
    //   name: "Service Status",
    //   path: "/service-status",
    //   icon: <Activity size={20} />,
    // },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={`bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ease-in-out ${
          collapsed ? "w-[70px]" : "w-[240px]"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-sidebar-border flex justify-between items-center">
            {!collapsed && (
              <h2 className="text-lg font-semibold">Bharat Vistaar Insights</h2>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="hover:bg-sidebar-accent"
            >
              {collapsed ? <BarChart3 size={20} /> : <BarChart3 size={20} />}
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                      location.pathname === item.path
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {!collapsed && <span>{item.name}</span>}
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
                  className={`w-full justify-${
                    collapsed ? "center" : "start"
                  } hover:bg-sidebar-accent`}
                >
                  {theme === "dark" ? (
                    <Moon size={20} className="mr-2" />
                  ) : theme === "light" ? (
                    <Sun size={20} className="mr-2" />
                  ) : (
                    <Sun size={20} className="mr-2" />
                  )}
                  {!collapsed && <span>Theme</span>}
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
                  className={`w-full justify-${
                    collapsed ? "center" : "start"
                  } hover:bg-sidebar-accent`}
                  onClick={handleLogout}
                >
                  <LogOut size={20} className="mr-2" />
                  {!collapsed && <span>Logout</span>}
                </Button>
              </DropdownMenuTrigger>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="container mx-auto">
          {/* Header with Global Date Filter and User Profile */}
          <div className="flex justify-between items-center p-6 border-b mb-2 mt-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-base font-medium">Filter:</span>
              </div>
              <div className="flex items-center gap-2">
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

          <div className="p-6">{children}</div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
