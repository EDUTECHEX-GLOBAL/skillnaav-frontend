// Dashboard.js
import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line,
  PieChart, Pie, Cell
} from "recharts";
import { FiKey, FiClock, FiCheckCircle, FiBarChart2 } from "react-icons/fi";
import { BsFileEarmarkCheck, BsClipboardData } from "react-icons/bs";
import { motion } from "framer-motion";


// Stats data
const stats = [
  {
    label: "Total Credentials Received",
    // sub: "Across all internship programs",
    value: 500,
    icon: <FiBarChart2 size={32} />,
    color: "from-orange-400 to-orange-200",
    textColor: "text-orange-600"
  },
  {
    label: "Credentials Distributed",
    // sub: "Issued to eligible candidates",
    value: 340,
    icon: <FiKey size={32} />,
    color: "from-green-400 to-green-200",
    textColor: "text-green-600"
  },
  {
    label: "Remaining Credentials",
    // sub: "Available for distribution",
    value: 140,
    icon: <FiClock size={32} />,
    color: "from-pink-400 to-pink-200",
    textColor: "text-pink-600"
  },
  {
    label: "Internships Completed",
    // sub: "Successfully wrapped up programs",
    value: 87,
    icon: <FiCheckCircle size={32} />,
    color: "from-indigo-500 to-indigo-300",
    textColor: "text-indigo-700"
  },
];

// Sample chart data
const chartData = [
  { name: "Jan", value: 30 },
  { name: "Feb", value: 40 },
  { name: "Mar", value: 25 },
  { name: "Apr", value: 35 },
  { name: "May", value: 20 },
];

const pieData = [
  { name: "Completed", value: 65 },
  { name: "Pending", value: 35 },
];

const COLORS = ["#4F46E5", "#E5E7EB"];

export default function Dashboard() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen font-poppins">
      {/* Stat Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.4, type: "spring" }}
            whileHover={{ scale: 1.03 }}
            className={`bg-gradient-to-br ${stat.color} p-6 rounded-xl shadow-md hover:shadow-xl transition duration-300 flex flex-col justify-between`}
          >
            <div className="flex justify-end mb-4">
              <div className="text-white">{stat.icon}</div>
            </div>
            <div className="text-white text-lg font-semibold leading-snug mb-2">
              {stat.label}
            </div>
            <div className={`text-4xl font-bold ${stat.textColor}`}>
              {stat.value}
            </div>
          </motion.div>
        ))}

      </div>


      {/* Chart Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard
          title="Internship Completions"
          icon={<BsClipboardData className="text-orange-500" />}
          type="bar"
          color="#f97316"
        />
        <ChartCard
          title="Selected Internships"
          icon={<BsClipboardData className="text-green-500" />}
          type="line"
          color="#10B981"
        />
        <ChartCard
          title="Completed Internships"
          icon={<BsFileEarmarkCheck className="text-pink-500" />}
          type="pie"
        />
        <ChartCard
          title="Ongoing Internships"
          icon={<BsClipboardData className="text-indigo-500" />}
          type="bar"
          color="#6366F1"
        />
      </div>
    </div>
  );
}


// Chart Card Component
function ChartCard({ title, icon, type, color }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-md font-poppins">
      <div className="flex items-center gap-3 text-gray-800 text-lg font-medium mb-4">
        {icon}
        {title}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        {type === "bar" && (
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill={color} radius={[5, 5, 0, 0]} />
          </BarChart>
        )}
        {type === "line" && (
          <LineChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        )}
        {type === "pie" && (
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              outerRadius={60}
              label
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
