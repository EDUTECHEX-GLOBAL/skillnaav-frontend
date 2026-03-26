import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import PageLoader from "./components/PageLoader";

// ---------- CONTEXT ----------
import FeedbackProvider from "./context/FeedbackContext";
import FeedbackModal from "./components/FeedbackModal/FeedbackModal";


// ---------- LAZY IMPORTS ----------
const Home = lazy(() => import("./pages/Home/Home"));
const Admin = lazy(() => import("./pages/Admin"));
const Login = lazy(() => import("./pages/Admin/Login"));

const PricingPage = lazy(() => import("./pages/PricingPage"));
const FeaturesPage = lazy(() => import("./pages/FeaturesPage"));
const TeamPage = lazy(() => import("./pages/TeamPage"));
const FaqPage = lazy(() => import("./pages/FaqPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const VisionPage = lazy(() => import("./pages/VisionPage"));

const UserCreateAccount = lazy(() => import("./WebApp/Flows/UserFlow/SignUpLogin/UserCreateAccount"));
const UserLogin = lazy(() => import("./WebApp/Flows/UserFlow/SignUpLogin/UserLogin"));
const UserFlow = lazy(() => import("./WebApp/Flows/UserFlow/UserFlow"));
const UserMainPage = lazy(() => import("./WebApp/Flows/UserFlow/MainPage/UserMainPage"));
const UserProfileForm = lazy(() => import("./WebApp/Flows/UserFlow/SignUpLogin/UserProfileBuilding/UserProfileForm"));
const UserProfilePicture = lazy(() => import("./WebApp/Flows/UserFlow/SignUpLogin/UserProfileBuilding/UserProfilePicture"));
const UserforgotPassword = lazy(() => import("./WebApp/Flows/UserFlow/SignUpLogin/UserforgotPassword"));
const GoogleUserProfileForm = lazy(() => import("./WebApp/Flows/UserFlow/SignUpLogin/UserProfileBuilding/GoogleUserProfileForm"));

const SkillnaavAnalysis = lazy(() => import("./WebApp/Flows/UserFlow/MainPage/SkillnaavAnalysis"));

const PartnerFlow = lazy(() => import("./WebApp/Flows/PartnerFlow/PartnerFlow"));
const PartnerCreateAccount = lazy(() => import("./WebApp/Flows/PartnerFlow/SignUpLogin/PartnerCreateAccount"));
const PartnerLogin = lazy(() => import("./WebApp/Flows/PartnerFlow/SignUpLogin/PartnerLogin"));
const PartnerProfilePicture = lazy(() => import("./WebApp/Flows/PartnerFlow/SignUpLogin/UserProfileBuilding/PartnerProfilePicture"));
const PartnerMainPage = lazy(() => import("./WebApp/Flows/PartnerFlow/MainPage/PartnerMainPage"));
const PartnerforgotPassword = lazy(() => import("./WebApp/Flows/PartnerFlow/SignUpLogin/PartnerforgotPassword"));

const AdminCreateAccount = lazy(() => import("./WebApp/Flows/AdminFlow/SignUpLogin/AdminCreateAccount"));
const AdminLogin = lazy(() => import("./WebApp/Flows/AdminFlow/SignUpLogin/AdminLogin"));
const AdminLoginOtp = lazy(() => import("./WebApp/Flows/AdminFlow/SignUpLogin/AdminLoginOtp"));
const AdminForgotPassword = lazy(() => import("./WebApp/Flows/AdminFlow/SignUpLogin/AdminForgotPassword"));
const AdminResetPassword = lazy(() => import("./WebApp/Flows/AdminFlow/SignUpLogin/AdminResetPassword"));
const AdminProfileForm = lazy(() => import("./WebApp/Flows/AdminFlow/SignUpLogin/AdminProfileBuilding/AdminProfileForm"));
const AdminProfilePicture = lazy(() => import("./WebApp/Flows/AdminFlow/SignUpLogin/AdminProfileBuilding/AdminProfilePicture"));
const AdminMainPage = lazy(() => import("./WebApp/Flows/AdminFlow/MainPage/AdminMainPage"));

const TryforFree = lazy(() => import("./WebApp/TryforFree"));

const SchoolAdminFlow = lazy(() => import("./WebApp/Flows/SchoolAdminFlow/SchoolAdminFlow"));
const SchoolAdminResetPassword = lazy(() => import("./WebApp/Flows/SchoolAdminFlow/SignUpLogin/SchoolAdminResetPassword"));
const SchoolAdminForgotPassword = lazy(() => import("./WebApp/Flows/SchoolAdminFlow/SignUpLogin/SchoolAdminForgotPassword"));



function App() {
  return (
    <FeedbackProvider>
     <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Website */}
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin-login" element={<Login />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/faqs" element={<FaqPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/vision" element={<VisionPage />} />

            {/* User */}
            <Route path="/user" element={<UserFlow />} />
            <Route path="/user-create-account" element={<UserCreateAccount />} />
            <Route path="/user/login" element={<UserLogin />} />
            <Route path="/user-profile-form" element={<UserProfileForm />} />
            <Route path="/user-profile-picture" element={<UserProfilePicture />} />
            <Route path="/user-main-page" element={<UserMainPage />} />
            <Route path="/user-forgot-password" element={<UserforgotPassword />} />
            <Route path="/google-user-profileform" element={<GoogleUserProfileForm />} />

            <Route path="/skillnaav-analysis" element={<SkillnaavAnalysis />} />

            {/* Partner */}
            <Route path="/partner" element={<PartnerFlow />} />
            <Route path="/partner-create-account" element={<PartnerCreateAccount />} />
            <Route path="/partner/login" element={<PartnerLogin />} />
            <Route path="/partner-profile-picture" element={<PartnerProfilePicture />} />
            <Route path="/partner-main-page" element={<PartnerMainPage />} />
            <Route path="/partner-forgot-password" element={<PartnerforgotPassword />} />

            {/* Admin */}
            <Route path="/admin-create-account" element={<AdminCreateAccount />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/login-otp" element={<AdminLoginOtp />} />
            <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
            <Route path="/admin/reset-password" element={<AdminResetPassword />} />
            <Route path="/admin-profile-form" element={<AdminProfileForm />} />
            <Route path="/admin-profile-picture" element={<AdminProfilePicture />} />
            <Route path="/admin-main-page" element={<AdminMainPage />} />

            {/* School */}
            <Route path="/schooladmin/*" element={<SchoolAdminFlow />} />
            <Route path="/schooladmin/reset-password/:token" element={<SchoolAdminResetPassword />} />
            <Route path="/schooladmin/forgot-password" element={<SchoolAdminForgotPassword />} />

            <Route path="/choose-role" element={<TryforFree />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>

        <FeedbackModal />
      </BrowserRouter>
    </FeedbackProvider>
  );
}

export default App;