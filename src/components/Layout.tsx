import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { Button } from "@/components/ui/button";
import { useKeycloak } from "@react-keycloak/web";
import DateRangePicker from "@/components/dashboard/DateRangePicker";
import { isSuperAdmin } from "@/utils/roleUtils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  Phone,
  Menu,
  ChevronRight,
  PhoneCall,
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

  const [chatTelemetryOpen, setChatTelemetryOpen] = useState(true);

  // Chat Telemetry children
  const chatTelemetryChildren = [
    {
      name: "Users",
      path: "/users",
      icon: <Users size={16} />,
    },
    {
      name: "Sessions",
      path: "/sessions",
      icon: <Calendar size={16} />,
    },
    {
      name: "Questions",
      path: "/questions",
      icon: <MessageSquare size={16} />,
    },
    {
      name: "Feedback",
      path: "/feedback",
      icon: <ClipboardCheck size={16} />,
    },
    {
      name: "ASR",
      path: "/asr",
      icon: <Mic size={16} />,
    },
    {
      name: "TTS",
      path: "/tts",
      icon: <Volume2 size={16} />,
    },
  ];

  // Check if any chat telemetry child is active
  const isChatTelemetryActive = chatTelemetryChildren.some(
    (item) => location.pathname === item.path
  );

  const renderNavLink = (
    item: { name: string; path: string; icon: React.ReactNode },
    isMobile: boolean,
    showLabel = true
  ) => (
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
      {showLabel && <span>{item.name}</span>}
    </Link>
  );

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
          {/* Dashboard */}
          <li>
            {renderNavLink(
              { name: "Dashboard", path: "/", icon: <LayoutDashboard size={20} /> },
              isMobile,
              !collapsed || isMobile
            )}
          </li>

          {/* Chat Telemetry - Collapsible Group */}
          <li>
            {(!collapsed || isMobile) ? (
              <Collapsible
                open={chatTelemetryOpen}
                onOpenChange={setChatTelemetryOpen}
              >
                <CollapsibleTrigger asChild>
                  <button
                    className={`flex items-center w-full px-3 py-2 rounded-md transition-colors text-left ${
                      isChatTelemetryActive && !chatTelemetryOpen
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    }`}
                  >
                    <span className="mr-3"><BarChart3 size={20} /></span>
                    <span className="flex-1">Chat Telemetry</span>
                    <ChevronRight
                      size={16}
                      className={`transition-transform duration-200 ${
                        chatTelemetryOpen ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ul className="ml-4 mt-1 space-y-0.5 border-l border-sidebar-border pl-3">
                    {chatTelemetryChildren.map((item) => (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          onClick={() => {
                            if (isMobile) {
                              setIsMobileMenuOpen(false);
                            }
                          }}
                          className={`flex items-center px-2 py-1.5 rounded-md transition-colors text-sm ${
                            location.pathname === item.path
                              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                          }`}
                        >
                          <span className="mr-2.5">{item.icon}</span>
                          <span>{item.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              /* Collapsed: show children icons directly */
              <>
                {chatTelemetryChildren.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-3 py-2 rounded-md transition-colors mt-1 ${
                      location.pathname === item.path
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                  </Link>
                ))}
              </>
            )}
          </li>

          {/* Call Logs */}
          <li>
            {renderNavLink(
              { name: "Call Logs", path: "/calls", icon: <PhoneCall size={20} /> },
              isMobile,
              !collapsed || isMobile
            )}
          </li>

          {/* Service Status */}
          <li>
            {renderNavLink(
              { name: "Service Status", path: "/service-status", icon: <Activity size={20} /> },
              isMobile,
              !collapsed || isMobile
            )}
          </li>
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
