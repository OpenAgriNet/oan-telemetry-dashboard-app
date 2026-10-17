import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { Button } from "@/components/ui/button";
import { useAppAuth } from "@/lib/useAppAuth";
import DateRangePicker from "@/components/dashboard/DateRangePicker";
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
  FlaskConical,
  ServerCog,
  Menu,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme, setTheme } = useTheme();
  const { dateRange, immediateDateRange, setDateRange, resetDateRange } = useDateFilter();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, isMobile]);
  const { keycloak } = useAppAuth();

  const handleLogout = () => {
    keycloak.logout();
  };

  const navItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: <LayoutDashboard size={20} />,
    },
    {
      name: "Users",
      path: "/users",
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
    //   name: "Evaluation",
    //   path: "/evaluation",
    //   icon: <FlaskConical size={20} />,
    // },
    {
      name: "Service Performance",
      path: "/service-snapshot",
      icon: <ServerCog size={20} />,
    },
    {
      name: "Errors",
      path: "/errors",
      icon: <AlertTriangle size={20} />,
    },
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

  ];

  const renderSidebar = (isCollapsed: boolean, mobile = false) => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-sidebar-border flex justify-between items-center">
        {!isCollapsed && (
          mobile ? (
            <SheetTitle className="pr-6 text-sidebar-foreground">MAHA Vistaar Insights</SheetTitle>
          ) : (
            <h2 className="text-lg font-semibold">MAHA Vistaar Insights</h2>
          )
        )}
        {!mobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!isCollapsed)}
            className="shrink-0 hover:bg-sidebar-accent"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!isCollapsed}
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
                onClick={() => setMobileMenuOpen(false)}
                aria-label={isCollapsed ? item.name : undefined}
                aria-current={location.pathname === item.path ? "page" : undefined}
                className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                  location.pathname === item.path
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {!isCollapsed && <span>{item.name}</span>}
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
              className={`w-full ${isCollapsed ? "justify-center" : "justify-start"} hover:bg-sidebar-accent`}
            >
              {theme === "dark" ? (
                <Moon size={20} className="mr-2" />
              ) : theme === "light" ? (
                <Sun size={20} className="mr-2" />
              ) : (
                <Sun size={20} className="mr-2" />
              )}
              {!isCollapsed && <span>Theme</span>}
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
              className={`w-full ${isCollapsed ? "justify-center" : "justify-start"} hover:bg-sidebar-accent`}
              onClick={handleLogout}
            >
              <LogOut size={20} className="mr-2" />
              {!isCollapsed && <span>Logout</span>}
            </Button>
          </DropdownMenuTrigger>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen h-[100dvh] overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={`hidden shrink-0 md:block bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ease-in-out ${
          collapsed ? "w-[70px]" : "w-[240px]"
        }`}
      >
        {renderSidebar(collapsed)}
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
        <div className="container mx-auto px-0 sm:px-8">
          <div className="flex items-center gap-3 border-b p-3 md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Open navigation">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] max-w-[85vw] bg-sidebar p-0 text-sidebar-foreground" aria-describedby={undefined}>
                {renderSidebar(false, true)}
              </SheetContent>
            </Sheet>
            <span className="text-sm font-semibold">MAHA Vistaar Insights</span>
          </div>
          {/* Header with Global Date Filter and User Profile */}
          <div className={`flex flex-wrap justify-between items-center gap-3 p-3 sm:p-6 border-b mb-2 sm:mt-2 ${location.pathname.startsWith("/evaluation") ? "hidden" : ""}`}>
            <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-base font-medium">Filter:</span>
              </div>
              <div className="flex items-center gap-2">
                <DateRangePicker dateRange={immediateDateRange} setDateRange={setDateRange} />
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

          <div className="p-3 sm:p-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
