"use client";

import * as React from "react";
import {
  IconChartBar,
  IconCloud,
  IconDashboard,
  IconDatabase,
  IconDeviceGamepad2,
  IconFileDescription,
  IconFileDots,
  IconHelp,
  IconInnerShadowTop,
  IconLink,
  IconReport,
  IconSearch,
  IconSettings,
  IconWorld,
} from "@tabler/icons-react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  user: {
    name: "Admin",
    email: "admin@example.com",
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
    // {
    //   title: "Dashboard",
    //   url: "/admin",
    //   icon: IconDashboard,
    // },
    {
      title: "Websites",
      url: "/admin/websites",
      icon: IconWorld,
    },
    {
      title: "Games",
      url: "/admin/games",
      icon: IconDeviceGamepad2,
    },
    {
      title: "Cloudflare",
      url: "/admin/cloudflare",
      icon: IconCloud,
    },
    {
      title: "Textlinks",
      url: "/admin/textlinks",
      icon: IconLink,
    },
    {
      title: "API Docs",
      url: "/admin/api-docs",
      icon: IconFileDescription,
    },
  ],
  navSecondary: [
    // {
    //   title: "Settings",
    //   url: "#",
    //   icon: IconSettings,
    // },
    // {
    //   title: "Get Help",
    //   url: "#",
    //   icon: IconHelp,
    // },
    // {
    //   title: "Search",
    //   url: "#",
    //   icon: IconSearch,
    // },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/admin">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">
                  Website & Game Management System
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
