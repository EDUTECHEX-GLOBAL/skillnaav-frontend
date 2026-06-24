import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import useIsMobileChart from "./useIsMobileChart";

const PartnerGrowthChart = ({ data }) => {
  const isMobile = useIsMobileChart();

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
      <h3 className="text-base sm:text-lg font-semibold mb-4">Partner Growth Over Time</h3>
      <ResponsiveContainer width="100%" height={isMobile ? 220 : 250}>
        <LineChart data={data} margin={{ top: 8, right: 10, left: isMobile ? -20 : 0, bottom: 0 }}>
          <XAxis dataKey="month" tick={{ fontSize: isMobile ? 10 : 12 }} minTickGap={isMobile ? 18 : 10} />
          <YAxis width={isMobile ? 28 : 40} tick={{ fontSize: isMobile ? 10 : 12 }} />
          <Tooltip />
          <CartesianGrid strokeDasharray="3 3" />
          <Line type="monotone" dataKey="count" stroke="#82ca9d" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PartnerGrowthChart;
