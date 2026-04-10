import React, { Suspense, lazy, useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { useSelector, useDispatch } from "react-redux";
import { Skeleton } from "antd";
import axios from "../../api/axiosInstance";
import { SetSkillNaavData, HideLoading } from "../../redux/rootSlice";

const Discover = lazy(() => import("../../components/Discover"));
const Vision = lazy(() => import("../../components/Vision"));
const Features = lazy(() => import("../../components/Features"));
const Team = lazy(() => import("../../components/Team/Team"));
const Pricing = lazy(() => import("../../components/Pricing"));
const Faq = lazy(() => import("../../components/Faq"));
const Contact = lazy(() => import("../../components/Contact"));
const Footer = lazy(() => import("../../components/Footer"));

function Home() {
  const { skillnaavData } = useSelector((state) => state.root);
  const dispatch = useDispatch();
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("🌍 API BASE:", process.env.REACT_APP_API_BASE);

        const response = await axios.get("/api/skillnaav/get-skillnaav-data");
        console.log("✅ SkillNaav API response:", response.data);

        dispatch(SetSkillNaavData(response.data));
      } catch (error) {
        console.error("❌ Error fetching SkillNaav data:", error);
      } finally {
        setPageLoading(false);
        dispatch(HideLoading());
      }
    };

    if (!skillnaavData || Object.keys(skillnaavData).length === 0) {
      fetchData();
    } else {
      setPageLoading(false);
      dispatch(HideLoading());
    }
  }, [skillnaavData, dispatch]);

  return (
    <div className="font-inter">
      <Navbar />

      <div className="pt-20">
        {pageLoading ? (
          <div className="px-[20px] lg:px-20 mx-auto">
            <Skeleton active />
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="px-[20px] lg:px-20 mx-auto">
                <Skeleton active />
              </div>
            }
          >
            <Discover />

            <div className="px-[20px] lg:px-20 mx-auto">
              <Vision className="mt-16" />
              <Features className="mt-16" />
              <Team className="mt-16" />
              <Pricing className="mt-16" />
              <Faq className="mt-16" />
              <Contact className="mt-16" />
              <Footer className="mt-16" />
            </div>
          </Suspense>
        )}
      </div>
    </div>
  );
}

export default Home;