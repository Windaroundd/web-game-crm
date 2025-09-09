import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconWorld, IconDeviceGamepad2, IconCloud, IconLink } from "@tabler/icons-react";

export default function AdminDashboard() {
  return (
    <div className="px-4 lg:px-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your content management system
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Websites</CardTitle>
            <IconWorld className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              <Badge variant="secondary" className="mr-1">+20</Badge>
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Games</CardTitle>
            <IconDeviceGamepad2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">567</div>
            <p className="text-xs text-muted-foreground">
              <Badge variant="secondary" className="mr-1">+12</Badge>
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CF Accounts</CardTitle>
            <IconCloud className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              Active accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Textlinks</CardTitle>
            <IconLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,890</div>
            <p className="text-xs text-muted-foreground">
              <Badge variant="secondary" className="mr-1">+145</Badge>
              from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions in your system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: "Added website", item: "example.com", time: "2 minutes ago" },
                { action: "Purged cache", item: "Cloudflare Zone", time: "15 minutes ago" },
                { action: "Updated game", item: "Retro Bowl", time: "1 hour ago" },
                { action: "Added textlinks", item: "5 new links", time: "2 hours ago" },
              ].map((activity, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.action}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.item}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common management tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <button className="flex items-center justify-start space-x-2 w-full p-3 text-sm border border-border rounded-md hover:bg-accent transition-colors">
                <IconWorld className="h-4 w-4" />
                <span>Add New Website</span>
              </button>
              <button className="flex items-center justify-start space-x-2 w-full p-3 text-sm border border-border rounded-md hover:bg-accent transition-colors">
                <IconDeviceGamepad2 className="h-4 w-4" />
                <span>Upload New Game</span>
              </button>
              <button className="flex items-center justify-start space-x-2 w-full p-3 text-sm border border-border rounded-md hover:bg-accent transition-colors">
                <IconCloud className="h-4 w-4" />
                <span>Purge Cache</span>
              </button>
              <button className="flex items-center justify-start space-x-2 w-full p-3 text-sm border border-border rounded-md hover:bg-accent transition-colors">
                <IconLink className="h-4 w-4" />
                <span>Manage Textlinks</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}