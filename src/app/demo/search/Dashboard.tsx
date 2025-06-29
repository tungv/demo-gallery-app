import { TrendingUp, Users, ShoppingCart } from "lucide-react";

const DASHBOARD_STATS = [
  { label: "Total Users", value: "12,543", icon: Users, change: "+12.5%" },
  { label: "Revenue", value: "$45,231", icon: TrendingUp, change: "+8.2%" },
  { label: "Orders", value: "1,247", icon: ShoppingCart, change: "+5.4%" },
];

export default function Dashboard() {
  return (
    <section className="bg-white rounded-lg p-6 border shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Sample Dashboard
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {DASHBOARD_STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-sm text-green-600">{stat.change}</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Recent Activity</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">New user registration</span>
            <span className="text-gray-500">2 minutes ago</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Order #12345 completed</span>
            <span className="text-gray-500">5 minutes ago</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Payment processed</span>
            <span className="text-gray-500">8 minutes ago</span>
          </div>
        </div>
      </div>
    </section>
  );
}
