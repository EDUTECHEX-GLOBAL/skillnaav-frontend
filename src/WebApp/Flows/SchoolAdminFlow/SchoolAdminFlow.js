import React from "react";
import { Routes, Route } from "react-router-dom";
import SchoolAdminRegister from "./SignUpLogin/SchoolAdminRegister";
import SchoolAdminLogin from "./SignUpLogin/SchoolAdminLogin";
import SchoolAdminProfileForm from "./SignUpLogin/SchoolAdminProfileForm";
import SchoolAdminDashboardLayout from "./MainPage/SchoolAdminDashboard";
import SchoolAdminResetPassword from "./SignUpLogin/SchoolAdminResetPassword";
import SchoolAdminForgotPassword from "./SignUpLogin/SchoolAdminForgotPassword";

// Pages inside the dashboard
import DashboardHome from "./MainPage/pages/DashboardHome";
import StudentsList from "./MainPage/pages/StudentsList";
import Subscriptions from "./MainPage/pages/Subscriptions";


const SchoolAdminFlow = () => {
  return (
    <Routes>
      {/* Auth & Setup */}
      <Route path="/register" element={<SchoolAdminRegister />} />
      <Route path="/login" element={<SchoolAdminLogin />} />
      <Route path="/profile" element={<SchoolAdminProfileForm />} />
      <Route path="/reset-password/:token" element={<SchoolAdminResetPassword />} />
      <Route path="/forgot-password" element={<SchoolAdminForgotPassword />} />

      {/* Dashboard Layout & Pages */}
      <Route path="/dashboard" element={<SchoolAdminDashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="students" element={<StudentsList />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        
      </Route>
    </Routes>
  );
};

export default SchoolAdminFlow;
