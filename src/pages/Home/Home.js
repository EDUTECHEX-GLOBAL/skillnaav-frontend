import React, { Suspense, lazy, useEffect } from "react";
import Navbar from "../../components/Navbar";
import { useSelector, useDispatch } from "react-redux";
import { Skeleton } from "antd";
import axios from "axios";
import { SetSkillNaavData, HideLoading } from "../../redux/rootSlice";

// Lazy components
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

  // ✅ API CALL ONLY FOR HOME PAGE
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/api/skillnaav/get-skillnaav-data");
        dispatch(SetSkillNaavData(response.data));
        dispatch(HideLoading());
      } catch (error) {
        console.error("Error fetching SkillNaav data:", error);
        dispatch(HideLoading());
      }
    };

    if (!skillnaavData) {
      fetchData();
    }
  }, [skillnaavData, dispatch]);

  return (
    <div className="font-inter">
      <Navbar />

      <div className="pt-20">
        {skillnaavData ? (
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
        ) : (
          <div className="px-[20px] lg:px-20 mx-auto">
            <Skeleton active />
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;