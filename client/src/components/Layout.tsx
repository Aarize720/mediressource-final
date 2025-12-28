import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Package, 
  AlertTriangle, 
  ClipboardList, 
  User,
  LogOut,
  Menu,
  X,
  Stethoscope
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Resources", href: "/resources", icon: Stethoscope },
    { name: "Stocks", href: "/stocks", icon: Package },
    { name: "Alerts", href: "/alerts", icon: AlertTriangle },
    { name: "Requests", href: "/requests", icon: ClipboardList },
  ];

  const isActive = (path: string) => location === path;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg font-display text-primary">Mediressource</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl font-display text-gray-900 leading-none">Mediressource</h1>
              <span className="text-xs text-muted-foreground font-medium">France Medical Network</span>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-1 mt-6">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <div
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer font-medium
                    ${isActive(item.href) 
                      ? "bg-primary/10 text-primary shadow-sm" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }
                  `}
                >
                  <item.icon className={`w-5 h-5 ${isActive(item.href) ? "text-primary" : "text-gray-400"}`} />
                  {item.name}
                </div>
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t bg-gray-50/50">
            {user ? (
              <div className="flex items-center gap-3 px-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate capitalize">{user.role || 'User'}</p>
                </div>
                <Link href="/profile">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <User className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            ) : (
               <div className="px-2 mb-4">
                  <a href="/api/login" className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                    Log In with Replit
                  </a>
               </div>
            )}
            
            {user && (
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100"
                onClick={() => logout()}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen">
        <main className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
