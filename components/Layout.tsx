"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Home, Users, Bus, FileText, LogOut, Bell, Menu, X, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import ThemeToggle from "./theme-toggle";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(pathname);
  const [navOpen, setNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: <Home className="h-5 w-5" /> },
    { name: "Bookings", href: "/admin/bookings", icon: <Users className="h-5 w-5" /> },
    { name: "Inquiries", href: "/admin/requests", icon: <Bus className="h-5 w-5" /> },
    { name: "Reports", href: "/admin/reports", icon: <FileText className="h-5 w-5" /> },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("admin/login")
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header - now with higher z-index */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and mobile menu button */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden mr-2"
                onClick={() => setNavOpen((v) => !v)}
                aria-label="Toggle navigation"
              >
                {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <Link href="/admin" className="flex items-center gap-3">
                <div className="relative h-10 w-10">
                  <Image
                    src="/images/reeca-travel-logo.png"
                    alt="Reeca Travel"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-semibold text-gray-900">Reeca Travel</h1>
                  <p className="text-xs text-gray-500">Admin Portal</p>
                </div>
              </Link>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="relative text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                
              </Button>

              <ThemeToggle />

              {/* Profile dropdown */}
              <div className="relative ml-2">
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 hover:bg-gray-100"
                  onClick={() => setProfileOpen(!profileOpen)}
                >
                  <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-medium">
                    AD
                  </div>
                  <span className="hidden md:inline text-sm font-medium text-gray-700">
                    Admin
                  </span>
                  <ChevronDown className={cn("h-4 w-4 text-gray-500 transition-transform", profileOpen ? "rotate-180" : "")} />
                </Button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content with proper spacing */}
      <div className="flex flex-1 pt-16"> {/* Added pt-16 to push content below fixed header */}
        {/* Sidebar for desktop - now properly positioned below header */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:pt-16"> {/* Added pt-16 */}
          <div className="flex flex-col flex-grow pb-4 overflow-y-auto border-r border-gray-200 bg-white">
            <div className="flex-grow px-4 pt-4"> {/* Added pt-4 */}
              <nav className="flex-1 space-y-3">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                      activeTab === item.href
                        ? "bg-teal-50 text-teal-600"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                    onClick={() => setActiveTab(item.href)}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </aside>

        {/* Mobile sidebar */}
        {navOpen && (
          <div className="fixed inset-0 z-50 md:hidden"> {/* Increased z-index */}
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75"
              onClick={() => setNavOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 flex max-w-xs w-full">
              <div className="relative flex-1 flex flex-col w-full bg-white">
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button
                    type="button"
                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={() => setNavOpen(false)}
                  >
                    <X className="h-6 w-6 text-white" />
                  </button>
                </div>
                <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                  <div className="flex-shrink-0 flex items-center px-4 mb-6">
                    <div className="relative h-10 w-10">
                      <Image
                        src="/images/reeca-travel-logo.png"
                        alt="Reeca Travel"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <h1 className="ml-3 text-lg font-semibold text-gray-900">Reeca Travel</h1>
                  </div>
                  <nav className="px-2 space-y-4">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "group flex items-center px-3 py-3 text-base font-medium rounded-lg",
                          activeTab === item.href
                            ? "bg-teal-50 text-teal-600"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        )}
                        onClick={() => {
                          setActiveTab(item.href);
                          setNavOpen(false);
                        }}
                      >
                        <span className="mr-4">{item.icon}</span>
                        {item.name}
                      </Link>
                    ))}
                  </nav>
                </div>
                <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                  <button
                    onClick={handleLogout}
                    className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main content area - now properly offset */}
        <main className="flex-1 md:pl-64">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}