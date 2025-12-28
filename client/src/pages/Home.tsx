import { Layout } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { useAlerts } from "@/hooks/use-alerts";
import { useRequests } from "@/hooks/use-requests";
import { useStocks } from "@/hooks/use-stocks";
import { 
  AlertTriangle, 
  Activity, 
  Package, 
  Users,
  ArrowRight
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function Home() {
  const { data: alerts } = useAlerts();
  const { data: requests } = useRequests();
  const { data: stocks } = useStocks();

  const activeAlerts = alerts?.filter(a => a.active).length || 0;
  const criticalAlerts = alerts?.filter(a => a.active && a.severity === 'critical').length || 0;
  const pendingRequests = requests?.filter(r => r.status === 'pending').length || 0;
  const totalStock = stocks?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 font-display">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-2">Welcome to the national medical resource coordination center.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Active Alerts"
          value={activeAlerts}
          icon={AlertTriangle}
          iconColor="text-orange-600"
          iconBg="bg-orange-50"
          trend={criticalAlerts > 0 ? `${criticalAlerts} Critical` : undefined}
          trendUp={false}
        />
        <StatCard
          title="Pending Requests"
          value={pendingRequests}
          icon={Activity}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Total Stock Units"
          value={totalStock.toLocaleString()}
          icon={Package}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
        <StatCard
          title="Network Coverage"
          value="85%"
          icon={Users}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Alerts Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Critical Alerts</h2>
            <Link href="/alerts">
              <Button variant="ghost" className="text-primary gap-2">
                View All <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-4">
            {alerts?.filter(a => a.active).slice(0, 3).map((alert) => (
              <div 
                key={alert.id}
                className={`
                  p-5 rounded-xl border-l-4 shadow-sm bg-white transition-all hover:shadow-md
                  ${alert.severity === 'critical' ? 'border-l-red-500' : 
                    alert.severity === 'high' ? 'border-l-orange-500' : 
                    'border-l-blue-500'}
                `}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`
                      px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                      ${alert.severity === 'critical' ? 'bg-red-100 text-red-700' : 
                        alert.severity === 'high' ? 'bg-orange-100 text-orange-700' : 
                        'bg-blue-100 text-blue-700'}
                    `}>
                      {alert.severity}
                    </span>
                    <span className="text-sm font-medium text-gray-500 capitalize">{alert.type}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {alert.createdAt && format(new Date(alert.createdAt), 'MMM d, h:mm a')}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{alert.message}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {alert.city || "National Alert"}
                </p>
              </div>
            ))}
            
            {(!alerts || alerts.filter(a => a.active).length === 0) && (
              <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed">
                <p className="text-gray-500">No active alerts at the moment.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / Recent Requests */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Recent Requests</h2>
            <Link href="/requests">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm divide-y">
            {requests?.slice(0, 5).map((request) => (
              <div key={request.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-gray-900">{request.resource?.name}</span>
                  <span className={`
                    text-xs px-2 py-0.5 rounded-full font-medium capitalize
                    ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                      request.status === 'approved' ? 'bg-green-100 text-green-700' : 
                      'bg-gray-100 text-gray-600'}
                  `}>
                    {request.status}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{request.quantity} units</span>
                  <span className="capitalize">{request.urgency} Priority</span>
                </div>
              </div>
            ))}

            {(!requests || requests.length === 0) && (
              <div className="p-8 text-center">
                <p className="text-sm text-gray-500">No recent requests.</p>
                <Link href="/requests">
                  <Button variant="link" className="text-primary text-sm mt-2">
                    Create Request
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Map Placeholder */}
          <div className="relative overflow-hidden rounded-2xl bg-blue-900 h-48 flex items-center justify-center text-white p-6 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-900 opacity-90" />
            <div className="relative z-10 text-center">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <h3 className="font-bold text-lg">National Coverage Map</h3>
              <p className="text-blue-100 text-sm mt-1">Real-time resource tracking across 12 regions</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
