// File: Dashboard.js

import React, { useState, useEffect } from "react";
import { FaUsers, FaUserFriends, FaBriefcase, FaDollarSign } from "react-icons/fa";
import DashboardCharts from "./Analytics/DashboardCharts";
import InternshipTypeChart from "./Analytics/InternshipTypeChart";
import AverageCompensationChart from "./Analytics/AverageCompensationChart";
import PartnerApprovalChart from "./Analytics/PartnerApprovalChart";
import PartnerGrowthChart from "./Analytics/PartnerGrowthChart";
import ApplicationsByTypeChart from "./Analytics/ApplicationsByTypeChart";
import RevenueChart from "./Analytics/RevenueChart";
import Card from "./Analytics/Card";
import axios from "../../../../api/axiosInstance";

const Dashboard = () => {
  const [data, setData] = useState({
    partnersCount: 0,
    activeUsersCount: 0,
    internshipsCount: 0,
    paymentsCount: 0,
    jobApplications: 0,
    internshipApprovals: 0,
    internshipRejections: 0,
    userGrowth: [],
    jobPostings: [],
    internshipTypeDistribution: {},
    averageCompensation: {},
    partnerApproval: {},
    partnerGrowth: [],
    applicationTypeDistribution: {},
    totalRevenue: 0,
    monthlyRevenue: [],
  });

  const fetchDashboardData = async () => {
    try {
      const { data: jsonData } = await axios.get("/api/dashboard/counts");

      setData({
        partnersCount: jsonData.partnersCount || 0,
        activeUsersCount: jsonData.usersCount || 0,
        internshipsCount: jsonData.internshipsCount || 0,
        paymentsCount: jsonData.paymentsCount || 0,
        jobApplications: jsonData.jobApplications || 0,
        internshipApprovals: jsonData.internshipApprovals || 0,
        internshipRejections: jsonData.internshipRejections || 0,
        userGrowth: jsonData.userGrowth || [],
        jobPostings: jsonData.jobPostings || [],
        internshipTypeDistribution: jsonData.internshipTypeDistribution || {},
        averageCompensation: jsonData.averageCompensation || {},
        partnerApproval: jsonData.partnerApproval || {},
        partnerGrowth: jsonData.partnerGrowth || [],
        applicationTypeDistribution: jsonData.applicationTypeDistribution || {},
        totalRevenue: jsonData.totalRevenue || 0,
        monthlyRevenue: jsonData.monthlyRevenue || [],
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error.response || error.message);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-lg shadow-md overflow-hidden">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-center">
        Admin Analytics
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        <Card
          icon={<FaUserFriends className="h-8 w-8 text-blue-600" />}
          title="Partners Enrolled"
          count={data.partnersCount}
          color="bg-blue-100"
        />
        <Card
          icon={<FaUsers className="h-8 w-8 text-green-600" />}
          title="Active Users"
          count={data.activeUsersCount}
          color="bg-green-100"
        />
        <Card
          icon={<FaBriefcase className="h-8 w-8 text-yellow-600" />}
          title="Total Internships"
          count={data.internshipsCount}
          color="bg-yellow-100"
        />
        <Card
          icon={<FaDollarSign className="h-8 w-8 text-red-600" />}
          title="Total Payments"
          count={data.paymentsCount}
          color="bg-red-100"
        />
      </div>

      <DashboardCharts userGrowth={data.userGrowth} jobPostings={data.jobPostings} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mt-6 sm:mt-8">
        <InternshipTypeChart distribution={data.internshipTypeDistribution} />
        <AverageCompensationChart data={data.averageCompensation} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mt-6 sm:mt-8">
        <PartnerApprovalChart data={data.partnerApproval} />
        <PartnerGrowthChart data={data.partnerGrowth} />
      </div>

      <div className="mt-6 sm:mt-8">
        <ApplicationsByTypeChart data={data.applicationTypeDistribution} />
      </div>

      <div className="mt-6 sm:mt-8">
        <RevenueChart data={data.monthlyRevenue} />
      </div>
    </div>
  );
};

export default Dashboard;
//dashboard chganges
