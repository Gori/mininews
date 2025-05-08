'use client';

import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-foreground mr-6">
                MiniNews
              </Link>
              <NavigationMenu className="border-none p-0 bg-transparent shadow-none">
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <Link href="/dashboard" legacyBehavior passHref>
                      <NavigationMenuLink 
                        className={cn(
                          "group inline-flex h-10 w-max items-center justify-center rounded-base px-4 py-2 text-sm font-heading",
                          "bg-transparent text-foreground hover:bg-secondary-background focus:bg-secondary-background focus:outline-none",
                          "disabled:pointer-events-none disabled:opacity-50"
                        )}
                      >
                        Dashboard
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link href="/newsletters" legacyBehavior passHref>
                      <NavigationMenuLink 
                        className={cn(
                          "group inline-flex h-10 w-max items-center justify-center rounded-base px-4 py-2 text-sm font-heading",
                          "bg-transparent text-foreground hover:bg-secondary-background focus:bg-secondary-background focus:outline-none",
                          "disabled:pointer-events-none disabled:opacity-50"
                        )}
                      >
                        Newsletters
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link href="/contacts" legacyBehavior passHref>
                      <NavigationMenuLink 
                        className={cn(
                          "group inline-flex h-10 w-max items-center justify-center rounded-base px-4 py-2 text-sm font-heading",
                          "bg-transparent text-foreground hover:bg-secondary-background focus:bg-secondary-background focus:outline-none",
                          "disabled:pointer-events-none disabled:opacity-50"
                        )}
                      >
                        Contacts
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link href="/logs" legacyBehavior passHref>
                      <NavigationMenuLink 
                        className={cn(
                          "group inline-flex h-10 w-max items-center justify-center rounded-base px-4 py-2 text-sm font-heading",
                          "bg-transparent text-foreground hover:bg-secondary-background focus:bg-secondary-background focus:outline-none",
                          "disabled:pointer-events-none disabled:opacity-50"
                        )}
                      >
                        Logs
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>
            <div className="flex items-center">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="py-8">
        {children}
      </main>
    </div>
  );
} 