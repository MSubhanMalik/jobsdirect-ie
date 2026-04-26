import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Briefcase, Search } from "lucide-react";
import { digify } from "@/api/digifyClient";
import { useAuth } from "@/lib/AuthContext";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Jobs", path: "/jobs" },
  { label: "Employers", path: "/employers" },
  { label: "Employees", path: "/employees" },
  { label: "Contact", path: "/contact" },
];

export default function Navbar() {
  const location = useLocation();
  const { isAuthenticated, user, appPublicSettings } = useAuth();
  const [open, setOpen] = useState(false);
  const settings = appPublicSettings?.public_settings || {};
  const brandName = settings.brand_name || "JobsDirect.ie";

  const isActive = (path) => location.pathname === path;
  const dashboardPath = user?.role === "admin" || user?.role === "super_admin" ? "/admin" : "/dashboard";

  return (
    <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">
              {brandName}
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive(link.path)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <Link to="/jobs">
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Search className="w-4 h-4" />
              </Button>
            </Link>
            {isAuthenticated ? (
              <Link to={dashboardPath}>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="text-muted-foreground font-medium"
                  onClick={() => digify.auth.redirectToLogin()}
                >
                  Login
                </Button>
                <Button
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-medium"
                  onClick={() => digify.auth.redirectToLogin()}
                >
                  Register
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <div className="flex flex-col h-full">
                <div className="p-6 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="text-xl font-bold">
                      {brandName}
                    </span>
                  </div>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setOpen(false)}
                      className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive(link.path)
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <div className="p-4 border-t border-border space-y-2">
                  {isAuthenticated ? (
                    <Link to={dashboardPath} onClick={() => setOpen(false)}>
                      <Button className="w-full bg-primary">Dashboard</Button>
                    </Link>
                  ) : (
                    <>
                      <Button
                        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                        onClick={() => { setOpen(false); digify.auth.redirectToLogin(); }}
                      >
                        Register
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => { setOpen(false); digify.auth.redirectToLogin(); }}
                      >
                        Login
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
