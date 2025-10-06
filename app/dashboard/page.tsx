"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const analyticsData = [
  { name: "Jan", users: 400 },
  { name: "Feb", users: 300 },
  { name: "Mar", users: 500 },
  { name: "Apr", users: 200 },
  { name: "May", users: 350 },
];

const newsData = [
  { name: "Published", value: 45 },
  { name: "Draft", value: 10 },
  { name: "Archived", value: 5 },
];

const videoData = [
  { name: "YouTube", value: 30 },
  { name: "Vimeo", value: 10 },
];

const COLORS = ["#4ade80", "#facc15", "#f87171"];

export default function DashboardPage() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 p-6">
      {/* Analytics Card */}
      <Card className="animate-slide-up bg-card/80 shadow-xl rounded-2xl p-4 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>📊 Analytics</CardTitle>
        </CardHeader>
        <CardContent className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* News Overview Card */}
      <Card className="animate-slide-up bg-card/80 shadow-xl rounded-2xl p-4 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>📰 News Overview</CardTitle>
        </CardHeader>
        <CardContent className="h-48 flex items-center justify-center">
          <ResponsiveContainer width="80%" height="80%">
            <PieChart>
              <Pie
                data={newsData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={60}
                fill="#8884d8"
                label
              >
                {newsData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Video News Card */}
      <Card className="animate-slide-up bg-card/80 shadow-xl rounded-2xl p-4 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>🎥 Video News</CardTitle>
        </CardHeader>
        <CardContent className="h-48 flex flex-col justify-center items-center gap-4">
          <div className="text-center font-medium text-lg">Total Videos: 40</div>
          <ResponsiveContainer width="80%" height="60%">
            <PieChart>
              <Pie
                data={videoData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={50}
                fill="#8884d8"
                label
              >
                {videoData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
