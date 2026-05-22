// OfferLetterCard.jsx

// 1. IMPORT StipendDetailsModal 
import React, { useCallback, useEffect, useState, useRef } from "react";
import axios from "../../../../api/axiosInstance";
import { toast } from "react-toastify";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import CertificateTemplate from "./CertificateTemplate";
// env-backed bases (correct relative path)
import { API_BASE, GOOGLE_AUTH_URL } from "../../../../config";
import CalendarSyncStatus from "./calendarsyncstatus";
import StipendDetailsModal from "./StipendDetailsModal"; // <--- IMPORTED MODAL
import OfferLetterCardpaid from "./OfferLetterCardpaid"; // <--- NEW PAID SCHEDULE MODAL

import {
  faMapMarkerAlt,
  faLink,
  faDollarSign,
  faCalendarAlt,
  faClock,
  faCreditCard,
  faDownload,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  formatDistanceToNow,
  format,
  parseISO,
  isValid,
  isToday,
} from "date-fns";

// Set axios base URL once for this module
if (API_BASE) {
  axios.defaults.baseURL = API_BASE;
  axios.defaults.withCredentials = true;
}

const DEFAULT_CERTIFICATE_SIZE = {
  width: 1120,
  height: 792,
};

function formatDateLabel(value) {
  if (!value) return "—";

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime())
    ? String(value)
    : format(parsedDate, "dd MMM yyyy");
}

function formatEnumLabel(value) {
  if (!value) return "—";

  return String(value)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function loadImageDimensions(src) {
  if (!src) return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      resolve({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      });
    };
    image.onerror = () => reject(new Error("Failed to load certificate template image"));
    image.src = src;
  });
}

function getCertificateRenderSize(dimensions) {
  if (!dimensions?.width || !dimensions?.height) {
    return DEFAULT_CERTIFICATE_SIZE;
  }

  const aspectRatio = dimensions.width / dimensions.height;
  const maxWidth = 1240;
  const maxHeight = 880;

  let width = maxWidth;
  let height = width / aspectRatio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}

function waitForCertificateImages(container) {
  const images = Array.from(container.querySelectorAll("img"));

  if (!images.length) {
    return Promise.resolve();
  }

  return Promise.all(
    images.map(
      (image) =>
        new Promise((resolve, reject) => {
          if (image.complete && image.naturalWidth > 0) {
            resolve();
            return;
          }

          const handleLoad = () => {
            cleanup();
            resolve();
          };
          const handleError = () => {
            cleanup();
            reject(new Error("Failed to load certificate assets"));
          };
          const cleanup = () => {
            image.removeEventListener("load", handleLoad);
            image.removeEventListener("error", handleError);
          };

          image.addEventListener("load", handleLoad);
          image.addEventListener("error", handleError);
        })
    )
  ).then(() => undefined);
}

const OfferLetterCard = ({ offer, onStatusChange }) => {
  const [job, setJob] = useState(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [errorJob, setErrorJob] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [responseType, setResponseType] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const scrollContainerRef = useRef(null);
  const rowRefs = useRef({});
  const qualificationRowRef = useRef(null);
  const qualificationMeasureRef = useRef(null);
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const userPlan = userInfo?.planType;
  const [showCompleteNotice, setShowCompleteNotice] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [savingTimeSlot, setSavingTimeSlot] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncPhase, setSyncPhase] = useState('idle'); // 'starting' | 'working' | 'auth' | 'done' | 'error'
  const [syncSummary, setSyncSummary] = useState({ created: 0, updated: 0, deleted: 0 });
  const [syncErrorMsg, setSyncErrorMsg] = useState('');
  const [syncTotal, setSyncTotal] = useState(0);
  const [showAuthLinkedModal, setShowAuthLinkedModal] = useState(false);
  const [visibleQualificationCount, setVisibleQualificationCount] = useState(1);
  const submitLockRef = useRef(false);
  const qualificationKey = Array.isArray(job?.qualifications)
    ? job.qualifications.join("|")
    : "";
  const qualificationCount = Array.isArray(job?.qualifications)
    ? job.qualifications.length
    : 0;

  // ✅ NEW: local mirror for preferred time slot (so UI updates immediately without refresh)
  const [preferredSlotLocal, setPreferredSlotLocal] = useState(
    offer?.preferredTimeSlot || offer?.selectedTimeSlot || null
  );

  useEffect(() => {
    setPreferredSlotLocal(offer?.preferredTimeSlot || offer?.selectedTimeSlot || null);
  }, [offer?.preferredTimeSlot, offer?.selectedTimeSlot]);

  useEffect(() => {
    const row = qualificationRowRef.current;
    const measure = qualificationMeasureRef.current;

    if (!qualificationCount) {
      setVisibleQualificationCount(0);
      return undefined;
    }

    if (!row || !measure) return undefined;

    let animationFrameId;
    const gapWidth = 8;

    const calculateVisibleTags = () => {
      const rowWidth = Math.floor(row.getBoundingClientRect().width);
      const tagNodes = Array.from(
        measure.querySelectorAll("[data-qualification-tag]")
      );
      const countNodes = Array.from(
        measure.querySelectorAll("[data-qualification-count]")
      );

      if (!rowWidth || tagNodes.length === 0) return;

      const tagWidths = tagNodes.map((node) =>
        Math.ceil(node.getBoundingClientRect().width)
      );
      const countWidthByHidden = countNodes.reduce((map, node) => {
        const hiddenCount = Number(node.getAttribute("data-qualification-count"));
        map[hiddenCount] = Math.ceil(node.getBoundingClientRect().width);
        return map;
      }, {});

      let nextVisibleCount = tagWidths.length;

      for (let count = tagWidths.length; count >= 0; count -= 1) {
        const hiddenCount = tagWidths.length - count;
        const visibleWidth = tagWidths
          .slice(0, count)
          .reduce((total, width) => total + width, 0);
        const tagGaps = Math.max(count - 1, 0) * gapWidth;
        const countBadgeWidth = hiddenCount > 0
          ? (count > 0 ? gapWidth : 0) + (countWidthByHidden[hiddenCount] || 0)
          : 0;
        const totalWidth = visibleWidth + tagGaps + countBadgeWidth;

        if (totalWidth <= rowWidth || count === 0) {
          nextVisibleCount = count;
          break;
        }
      }

      setVisibleQualificationCount((current) =>
        current === nextVisibleCount ? current : nextVisibleCount
      );
    };

    const scheduleCalculation = () => {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = window.requestAnimationFrame(calculateVisibleTags);
    };

    scheduleCalculation();

    const resizeObserver =
      typeof window.ResizeObserver === "function"
        ? new window.ResizeObserver(scheduleCalculation)
        : null;

    if (resizeObserver) {
      resizeObserver.observe(row);
    } else {
      window.addEventListener("resize", scheduleCalculation);
    }

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener("resize", scheduleCalculation);
      }
    };
  }, [qualificationCount, qualificationKey]);

  const resolvePartnerId = useCallback(
    () => job?.partnerId || job?.postedBy || job?.companyId || null,
    [job]
  );

  const fetchInternshipSchedule = useCallback(async () => {
    const internshipId = offer?.internshipId;
    const partnerId = resolvePartnerId();

    if (!internshipId) {
      throw new Error("Internship ID not found");
    }

    if (!partnerId) {
      throw new Error("Partner ID not found");
    }

    const res = await axios.get(`/api/schedule/get-schedule`, {
      params: { internshipId, partnerId },
    });

    setSchedule(res.data);
    return res.data;
  }, [offer?.internshipId, resolvePartnerId]);

  // ✅ NEW: For FREE + STIPEND — accept immediately and open schedule (no confirmation/time-slot modal)
  const acceptAndOpenSchedule = async () => {
    if (loading) return;

    try {
      setLoading(true);

      // 1) Accept offer (FREE/STIPEND => no paymentId, no preferredTimeSlot)
      await axios.patch(
        `/api/offer-letters/${offer._id}/status`,
        { status: "Accepted" },
        { withCredentials: true, timeout: 15000 }
      );

      onStatusChange("Accepted");
      toast.success("✅ Offer accepted");

      // 2) Fetch schedule immediately so modal shows data
      if (resolvePartnerId() && offer?.internshipId) {
        setLoadingSchedule(true);
        try {
          await fetchInternshipSchedule();
        } catch (err) {
          console.error("Failed to fetch schedule after accept:", err);
        } finally {
          setLoadingSchedule(false);
        }
      }

      // 3) Open schedule modal
      setShowScheduleModal(true);
    } catch (err) {
      console.error("Accept failed:", err);
      toast.error(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to accept offer."
      );
    } finally {
      setLoading(false);
    }
  };

  // 2. STIPEND-SPECIFIC STATE
  const [showStipendModal, setShowStipendModal] = useState(false);
  const [stipendDetailsSubmitted, setStipendDetailsSubmitted] = useState(false);
  // We don't need the form state here, as it's in StipendDetailsModal.jsx

  // Live progress polling (no backend changes required; updates if /api/google/sync-status exists)
  React.useEffect(() => {
    if (syncPhase !== 'working') return;

    let isCancelled = false;
    const interval = setInterval(async () => {
      try {
        const resp = await axios.get('/api/google/sync-status', {
          withCredentials: true,
          params: { internshipId: offer?.internshipId, studentEmail: userInfo?.email },
        });
        const p = resp?.data?.progress || null;
        if (!p || isCancelled) return;

        // Accept either {synced,total,created,updated,deleted} or {created,updated,deleted}
        const next = {
          created: Number(p?.created) || 0,
          updated: Number(p?.updated) || 0,
          deleted: Number(p?.deleted) || 0,
        };
        if (typeof p?.synced === 'number') next.synced = Math.max(0, p.synced);
        if (typeof p?.total === 'number') setSyncTotal(p.total);
        setSyncSummary((prev) => ({ ...prev, ...next }));
        // ✅ Flip UI phase from polled progress (so we don't depend on the POST reply)
        if (p.phase === 'done') {
          setSyncPhase('done');
          toast.success('✅ Schedule synced to Google Calendar');
          return;
        }
        if (p.phase === 'error') {
          setSyncPhase('error');
          setSyncErrorMsg(p.error || 'Sync failed');
          return;
        }
      } catch (_e) {
        // ignore polling errors so UI isn't spammy
      }
    }, 1200);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [syncPhase, offer?.internshipId, userInfo?.email]);

  // ✅ PayPal Configuration
  if (!process.env.REACT_APP_PAYPAL_CLIENT_ID) {
    console.error("❌ PayPal Client ID missing");
  }

  const paypalInitialOptions = {
    "client-id": process.env.REACT_APP_PAYPAL_CLIENT_ID,
    currency: "USD",
    intent: "capture",
  };


  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const byQuery = params.get("gauth") === "success";
    const byStorage = localStorage.getItem("googleAuthSuccess") === "true";

    if (byQuery || byStorage) {
      setShowAuthLinkedModal(true);
      // Clean up flags and URL noise
      localStorage.removeItem("googleAuthSuccess");
      params.delete("gauth");
      const next = `${window.location.pathname}${params.toString() ? "?" + params.toString() : ""}`;
      window.history.replaceState({}, "", next);
    }
  }, []);

  // ─── 1) Fetch internship details ───────────────────────────────────
  useEffect(() => {
    if (!offer.internshipId) {
      console.error("Offer missing internshipId:", offer);
      setErrorJob("No internship ID found. Please contact support.");
      setLoadingJob(false);
      return;
    }

    axios
      .get(`/api/interns/${offer.internshipId}`)
      .then((res) => {
        setJob(res.data);
        // Optional: Check if stipend details were submitted previously
        // This requires a new API endpoint, but for now, we'll assume a flag
        // is necessary if the offer was previously accepted/re-sent.
      })
      .catch((err) => {
        console.error("Failed to fetch internship:", err);
        setErrorJob("Could not load internship details");
      })
      .finally(() => setLoadingJob(false));
  }, [offer]);

  // ─── 2) Fetch schedule after job loads & offer is accepted ────────
  useEffect(() => {
    if (!job || offer.status.toLowerCase() !== "accepted") return;

    const fetchSchedule = async () => {
      setLoadingSchedule(true);
      try {
        await fetchInternshipSchedule();
      } catch (err) {
        console.error("Failed to fetch schedule:", err);
      } finally {
        setLoadingSchedule(false);
      }
    };

    fetchSchedule();
  }, [job, offer.status, fetchInternshipSchedule]);

  // ✅ NEW: Fetch schedule for timeSlots when Time Slot modal opens (before acceptance)
  useEffect(() => {
    const internshipId = offer?.internshipId;

    if (!showTimeModal) return;
    if (!job || !internshipId) return;

    // If schedule already loaded, don't refetch
    if (schedule?._id) return;

    const fetchScheduleForSlots = async () => {
      try {
        setLoadingSchedule(true);
        await fetchInternshipSchedule();
      } catch (err) {
        console.error("Failed to fetch schedule for time slots:", err);
      } finally {
        setLoadingSchedule(false);
      }
    };

    fetchScheduleForSlots();
  }, [showTimeModal, job, offer?.internshipId, schedule?._id, fetchInternshipSchedule]);

  // ─── 3) Check for existing payment status on load ────────
  useEffect(() => {
    const userId = userInfo?._id;
    const paypalPaymentId = paymentStatus?.paypalPaymentId;

    const checkPaymentStatus = async () => {
      if (
        !job ||
        job.internshipType !== "PAID" ||
        !userId ||
        paypalPaymentId
      ) return;

      const response = await axios.get(
        `/api/internship/payments/status/${offer._id}`,
        { params: { studentId: userId } }
      );

      if (response.data.paid) {
        setPaymentStatus(prev => ({
          ...prev,
          paid: true,
          mongoPaymentId: response.data.paymentId,
          paypalPaymentId: response.data.paypalPaymentId,
          amount: response.data.amount,
          currency: response.data.currency
        }));
      }
    };

    checkPaymentStatus();
  }, [job, offer._id, userInfo?._id, paymentStatus?.paypalPaymentId]);


  // 4. STIPEND SUBMISSION HANDLER
  const handleStipendSubmission = async (formDetails) => {

    // ✅ NEW: For FREE + STIPEND — accept immediately and open schedule (no confirmation/time-slot modal)
    const acceptAndOpenSchedule = async () => {
      if (loading) return;

      try {
        setLoading(true);

        // 1) Accept offer (NO preferredTimeSlot, NO paymentId)
        await axios.patch(
          `/api/offer-letters/${offer._id}/status`,
          { status: "Accepted" },
          { withCredentials: true, timeout: 15000 }
        );

        onStatusChange("Accepted");
        toast.success("✅ Offer accepted");

        // 2) Fetch schedule immediately so modal shows data
        const partnerId = job?.partnerId || job?.postedBy || job?.companyId;
        if (partnerId && offer?.internshipId) {
          setLoadingSchedule(true);
          try {
            const res = await axios.get(`/api/schedule/get-schedule`, {
              params: { internshipId: offer.internshipId, partnerId },
            });
            setSchedule(res.data);
          } catch (err) {
            console.error("Failed to fetch schedule after accept:", err);
          } finally {
            setLoadingSchedule(false);
          }
        }

        // 3) Open schedule modal
        setShowScheduleModal(true);
      } catch (err) {
        console.error("Accept failed:", err);
        toast.error(
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to accept offer."
        );
      } finally {
        setLoading(false);
      }
    };

    setShowStipendModal(false); // Close the modal immediately
    setLoading(true);

    try {
      const payload = {
        offerId: offer._id,
        internshipId: offer.internshipId,
        studentId: userInfo._id,
        ...formDetails,
      };

      // Call the API endpoint to submit stipend details
      const res = await axios.post('/api/internship/stipend-details', payload);

      if (res.data.success) {
        setStipendDetailsSubmitted(true);
        toast.success("✅ Stipend details submitted! Accepting offer...");

        // ✅ NEW: For STIPEND → directly accept + open schedule (NO time-slot modal)
        await acceptAndOpenSchedule();
      }

      else {
        toast.error(res.data.message || 'Failed to submit stipend details.');
      }
    } catch (error) {
      console.error('Stipend submission failed:', error);
      toast.error('Failed to submit stipend details. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (showScheduleModal && schedule?.timetable?.length > 0) {
      const todaySession = schedule.timetable.find((session) =>
        isToday(parseISO(session.date))
      );

      if (todaySession) {
        const refKey = `${todaySession.date}-${todaySession.startTime}`;
        const todayRef = rowRefs.current[refKey];
        if (todayRef?.current && scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({
            top: todayRef.current.offsetTop - 33,
            behavior: "smooth",
          });
        }
      }
    }
  }, [showScheduleModal, schedule]);

  // 3. UPDATE handleRespond logic
  // OfferLetterCard.jsx (Inside handleRespond function)

  const handleRespond = (type) => {
    // Reject stays same (confirmation modal)
    if (type !== "Accepted") {
      setResponseType(type);
      setShowModal(true);
      return;
    }

    // ✅ PAID internship → keep existing paid flow (payment → confirmation → time-slot)
    if (job?.internshipType === "PAID") {
      if (!paymentStatus?.paid) {
        setShowPaymentModal(true);
        return;
      }

      // Paid & already paid → show confirmation modal → then time slot modal
      setResponseType(type);
      setShowModal(true);
      return;
    }

    // ✅ FREE + STIPEND → Accept should directly open schedule (no confirmation/time-slot)
    acceptAndOpenSchedule();
  };

  const normalizeUrl = (url) => {
    if (!url) return "";
    return url.startsWith("http://") || url.startsWith("https://")
      ? url
      : `https://${url}`;
  };

  // ✅ Updated PayPal order creation
  const createPayPalOrder = async () => {
    try {
      const response = await axios.post('/api/internship/payments/create-paypal-order', {
        internshipId: offer.internshipId,
        offerId: offer._id,
        amount: job.compensationDetails.amount,
        currency: job.compensationDetails.currency || 'USD',
        studentId: userInfo._id,
      });

      return response.data.orderId;
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      toast.error('Failed to create payment order');
      throw error;
    }
  };

  // ✅ Updated PayPal payment capture
  const onPayPalApprove = async (data, actions) => {
    try {
      const response = await axios.post(
        '/api/internship/payments/capture-paypal-payment',
        {
          orderId: data.orderID,
          offerId: offer._id,
          studentId: userInfo._id,
        }
      );

      if (response.data.success) {
        setPaymentStatus(prev => ({
          ...prev,
          paid: true,
          mongoPaymentId: response.data.paymentId,
          paypalPaymentId: response.data.paypalPaymentId, // ✅ KEEP IT
          amount: response.data.amount,
          currency: response.data.currency
        }));


        setShowPaymentModal(false);
        toast.success('✅ Payment successful! You can now accept the offer.');

        setTimeout(() => {
          setResponseType("Accepted");
          setShowModal(true);
        }, 500);
      }
    } catch (error) {
      console.error('Error capturing payment:', error);
      toast.error('Payment failed. Please try again.');
    }
  };


  const confirmRespond = async () => {
    if (!responseType || loading) return;

    // 🔒 PAID internships must be paid before acceptance
    if (
      responseType === "Accepted" &&
      job?.internshipType === "PAID" &&
      !paymentStatus?.paid
    ) {
      toast.error("Payment required before accepting this internship");
      return;
    }

    // ✅ Accepted → ONLY open time slot modal (NO PATCH here)
    if (responseType === "Accepted") {
      setShowModal(false);

      // ✅ Only PAID uses time slot modal
      if (job?.internshipType === "PAID") {
        setShowTimeModal(true);
        return;
      }

      // ✅ FREE/STIPEND fallback (shouldn't normally hit now, but safe)
      acceptAndOpenSchedule();
      return;
    }

    // ❌ Only rejection reaches backend here
    try {
      setLoading(true);

      await axios.patch(`/api/offer-letters/${offer._id}/status`, {
        status: "Rejected",
      });

      onStatusChange("Rejected");
      setShowModal(false);
      setResponseType(null);
    } catch (error) {
      console.error("Failed to update offer status:", error);
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const confirmTimeSelection = async () => {
    if (submitLockRef.current || savingTimeSlot) return;

    if (!selectedTimeSlot) {
      toast.error("Please select a time slot.");
      return;
    }

    // 🔒 PAID internships must be paid before acceptance
    if (job?.internshipType === "PAID" && !paymentStatus?.paid) {
      toast.error("Payment not verified yet. Please complete payment.");
      return;
    }

    submitLockRef.current = true;
    setSavingTimeSlot(true);

    // ✅ Close modal immediately for fast UX
    setShowTimeModal(false);

    // ✅ Optimistic UI update (so schedule shows selected slot instantly)
    const previousSlot = preferredSlotLocal;
    setPreferredSlotLocal(selectedTimeSlot);

    // ✅ Build smallest payload (only include paymentId for PAID)
    const payload = {
      status: "Accepted",
      preferredTimeSlot: selectedTimeSlot,
    };

    if (job?.internshipType === "PAID") {
      payload.paymentId =
        paymentStatus?.mongoPaymentId || paymentStatus?.paypalPaymentId || null;
    }

    try {
      await axios.patch(`/api/offer-letters/${offer._id}/status`, payload, {
        withCredentials: true,
        timeout: 15000,
      });

      onStatusChange("Accepted");
      toast.success("✅ Offer accepted and time slot saved");

      // cleanup only after success
      setSelectedTimeSlot(null);
      setResponseType(null);
    } catch (error) {
      console.error("Failed to accept offer:", error);

      // ❌ rollback optimistic UI update
      setPreferredSlotLocal(previousSlot);

      // Re-open modal so user can retry (keep selected slot)
      setShowTimeModal(true);

      toast.error(
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to save your time slot."
      );
    } finally {
      setSavingTimeSlot(false);
      submitLockRef.current = false;
    }
  };

  // ✅ NEW: Build available time slots from saved schedule.timeSlots
  const scheduleType = (schedule?.defaultType || job?.mode || "online").toLowerCase();
  const availableSlots = Array.isArray(schedule?.timeSlots?.[scheduleType])
    ? schedule.timeSlots[scheduleType]
    : [];

  // ✅ Determine if payment is required
  const requiresPayment = job?.internshipType === "PAID";
  const requiresStipendDetails = job?.internshipType === "STIPEND";
  const paymentAmount = job?.compensationDetails?.amount || 0;
  const currency = job?.compensationDetails?.currency || "USD";

  const isUnpaidAccepted =
    offer?.status?.toLowerCase() === "accepted" &&
    job?.internshipType === "PAID" &&
    !paymentStatus?.paid;
  // Always start Google OAuth, carrying internshipId + email in state.
  // The backend callback will sync the full schedule after auth.
  const handleAddUpdateCalendar = async () => {
    if (!offer?.internshipId || !userInfo?.email) {
      toast.error('Missing internship or user email');
      return;
    }

    // open the status popup immediately
    setSyncErrorMsg('');
    setSyncSummary({ created: 0, updated: 0, deleted: 0 });
    setSyncPhase('starting');
    setSyncModalOpen(true);
    setSyncTotal(Array.isArray(schedule?.timetable) ? schedule.timetable.length : 0);

    setLoading(true); // keep existing loading toggles (won't change button label below)
    try {
      setSyncPhase('working');

      const res = await axios.post('/api/google/update-schedule', {
        internshipId: offer.internshipId,
        studentEmail: userInfo.email,
      }, {
        withCredentials: true,
        timeout: 5000 // keep the "starter" call snappy; real work runs in background
      });

      // Needs OAuth?
      if (res.status === 401 || res?.data?.message?.match(/auth|invalid_grant|unauthorized|token/i)) {
        setSyncPhase('auth');
        const stateObj = { internshipId: offer.internshipId, email: userInfo.email };
        const state = btoa(JSON.stringify(stateObj));
        window.location.href = `${GOOGLE_AUTH_URL}?state=${encodeURIComponent(state)}`;
        return;
      }

      // Non-blocking flow: backend returns 202 + { started: true }
      if (res.status === 202 || res?.data?.started) {
        toast.info('Sync started…');
        // Stay in "working"; polling will flip to done/error
        return;
      }

      // Legacy synchronous success (if server still returns counts)
      if (res?.data?.success) {
        const counts = res.data.counts || res.data.result?.counts || { created: 0, updated: 0, deleted: 0 };
        setSyncSummary(counts);
        setSyncPhase('done');
        toast.success('✅ Schedule synced to Google Calendar');
        return;
      }

      // Any other non-success payload
      if (res?.data && res?.data.success === false) {
        setSyncPhase('error');
        setSyncErrorMsg(res.data.message || 'Sync failed');
        throw new Error(res.data.message || 'Sync failed');
      }
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message || err.message || '';
      if (status === 401 || /auth|invalid_grant|unauthorized|token/i.test(message)) {
        try {
          setSyncPhase('auth');
          const stateObj = { internshipId: offer.internshipId, email: userInfo.email };
          const state = btoa(JSON.stringify(stateObj));
          window.location.href = `${GOOGLE_AUTH_URL}?state=${encodeURIComponent(state)}`;
          return;
        } catch (e) {
          console.error('Failed to start Google OAuth:', e);
        }
      }
      console.error('Sync error:', err);
      setSyncPhase('error');
      setSyncErrorMsg('Could not sync to Google Calendar');
      toast.error('Could not sync to Google Calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = async () => {
    let container = null;
    let reactDom = null;
    try {
      let latestSchedule = schedule;

      if (resolvePartnerId() && offer?.internshipId) {
        setLoading(true);
        try {
          latestSchedule = await fetchInternshipSchedule();
        } finally {
          setLoading(false);
        }
      }

      // 🔒 Gate: partner must close the schedule first
      if (!latestSchedule?.isClosed) {
        setShowCompleteNotice(true);
        return;
      }

      let backgroundImageUrl = latestSchedule?.selectedCertificateTemplate?.imageUrl || "";
      let certificateSize = DEFAULT_CERTIFICATE_SIZE;

      if (backgroundImageUrl) {
        try {
          const dimensions = await loadImageDimensions(backgroundImageUrl);
          certificateSize = getCertificateRenderSize(dimensions);
        } catch (imageError) {
          console.error("Failed to load certificate template image:", imageError);
          backgroundImageUrl = "";
        }
      }

      // Create hidden container for rendering certificate
      container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-10000px";
      container.style.top = "0";
      container.style.zIndex = "-1";
      document.body.appendChild(container);

      // Render the CertificateTemplate inside container
      const element = (
        <CertificateTemplate
          studentName={userInfo?.name || "Student"}
          backgroundImageUrl={backgroundImageUrl}
          width={certificateSize.width}
          height={certificateSize.height}
        />
      );

      // Dynamically import ReactDOM and render → capture → PDF
      const reactDomModule = await import("react-dom");
      reactDom = reactDomModule.default || reactDomModule;

      await new Promise((resolve) => {
        reactDom.render(element, container, resolve);
      });

      await waitForCertificateImages(container);

      const certificateNode = container.querySelector("#certificate-content");
      if (!certificateNode) {
        throw new Error("Certificate content not found");
      }

      const canvas = await html2canvas(certificateNode, {
        useCORS: true,
        scale: 2,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: canvas.width >= canvas.height ? "landscape" : "portrait",
        unit: "pt",
        format: [certificateSize.width, certificateSize.height],
      });

      pdf.addImage(imgData, "PNG", 0, 0, certificateSize.width, certificateSize.height);
      pdf.save("Internship_Certificate.pdf");
    } catch (err) {
      console.error("Certificate generation failed:", err);
      toast.error("Failed to generate certificate.");
    } finally {
      setLoading(false);
      if (reactDom && container) {
        reactDom.unmountComponentAtNode(container);
      }
      if (container?.parentNode) {
        container.parentNode.removeChild(container);
      }
    }
  };

  // ─── 3) Render the schedule with table + per‐row Google Calendar links ─
  const renderSchedule = () => {
    if (loadingSchedule) {
      return (
        <div className="mt-4 p-4 bg-gray-50 rounded-xl animate-pulse">
          <p className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <p key={i} className="h-3 bg-gray-200 rounded w-full" />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="mt-4">
          {/* ── FIXED Summary Cards ──────────────────────────────── */}
          <div className="sticky top-0 z-10 bg-white pt-2 pb-4">
            {schedule?.startDate && schedule?.endDate && schedule?.workHours && (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3 flex flex-col items-center justify-center">
                  <p className="text-xs text-gray-500">Start Date</p>
                  <p className="mt-1 font-medium text-gray-800">
                    {format(parseISO(schedule.startDate), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3 flex flex-col items-center justify-center">
                  <p className="text-xs text-gray-500">End Date</p>
                  <p className="mt-1 font-medium text-gray-800">
                    {format(parseISO(schedule.endDate), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3 flex flex-col items-center justify-center">
                  <p className="text-xs text-gray-500">Working Hours</p>
                  <p className="mt-1 font-medium text-gray-800">{schedule.workHours}</p>
                </div>
              </div>
            )}
          </div>

          {/* ── SCROLLABLE Session Table ─────────────────────────── */}
          <div
            ref={scrollContainerRef}
            className="mt-4 max-h-[65vh] overflow-auto relative hide-scrollbar"
          >
            <table className="min-w-full bg-white rounded-lg">
              <thead className="bg-indigo-50 border-b border-indigo-200 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2 text-xs font-medium text-gray-600 text-center">Date</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-600 text-center">Day</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-600 text-center">Time</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-600 text-center">Summary</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-600 text-center">Section Link</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-600 text-center">Type</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(schedule?.timetable) && schedule.timetable.length > 0 ? (
                  schedule.timetable.map((session, idx) => {
                    const sessionDate = parseISO(session.date);
                    const isTodaySession = isValid(sessionDate) && isToday(sessionDate);
                    const rowRefKey = `${session.date}-${session.startTime}`;

                    // ✅ For PAID internships, show student's preferred time slot immediately (local state)
                    const savedPreferredSlot = preferredSlotLocal;

                    const displayTime =
                      job?.internshipType === "PAID" && savedPreferredSlot
                        ? savedPreferredSlot
                        : `${session.startTime} - ${session.endTime}`;

                    if (isTodaySession) {
                      rowRefs.current[rowRefKey] = React.createRef();
                    }

                    const summaryText = session.sectionSummary || "-";
                    const isOnline = session.type === "online";
                    const isOffline = session.type === "offline";

                    return (
                      <tr
                        key={idx}
                        ref={isTodaySession ? rowRefs.current[rowRefKey] : null}
                        className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}
                      >
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap text-center">
                          {format(parseISO(session.date), "dd MMM yyyy")}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap text-center">
                          {format(parseISO(session.date), "EEE")}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap text-center">
                          {displayTime}
                        </td>
                        <td className="px-4 py-3 text-sm text-indigo-600 hover:text-indigo-800 whitespace-nowrap text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedSummary({
                                sectionSummary: summaryText,
                                instructor: session.instructor || ""
                              })
                            }
                            className="text-indigo-600 hover:underline text-xs font-medium"
                          >
                            View Summary
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap text-center">
                          {isOnline ? (
                            session.eventLink ? (
                              <a
                                href={normalizeUrl(session.eventLink)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                              >
                                <FontAwesomeIcon icon={faLink} className="mr-1" />
                                Join Meeting
                              </a>
                            ) : (
                              <span className="text-gray-400 text-xs">Link Pending</span>
                            )
                          ) : isOffline ? (
                            session.location?.address ? (
                              <button
                                type="button"
                                onClick={() => setSelectedLocation(session.location)}
                                className="inline-flex items-center text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                              >
                                <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1" />
                                Location
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs">Location TBA</span>
                            )
                          ) : (
                            <>
                              {session.eventLink && (
                                <a
                                  href={normalizeUrl(session.eventLink)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-indigo-600 hover:text-indigo-800 text-xs font-medium mr-2"
                                >
                                  <FontAwesomeIcon icon={faLink} className="mr-1" />
                                  Join Meeting
                                </a>
                              )}
                              {session.location?.address && (
                                <p className="inline-flex items-center">
                                  <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1 text-gray-600" />
                                  <span className="text-gray-700 text-sm">
                                    {session.location.name}
                                  </span>
                                </p>
                              )}
                              {!session.eventLink && !session.location?.address && (
                                <span className="text-gray-400 text-xs">TBA</span>
                              )}
                            </>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap text-center">
                          <span
                            className={`
                inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full capitalize
                ${isOnline
                                ? "bg-blue-100 text-blue-700"
                                : isOffline
                                  ? "bg-green-100 text-green-700"
                                  : "bg-purple-100 text-purple-700"
                              }
              `}
                          >
                            {session.type}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center text-sm text-gray-500 py-4">
                      Internship schedule coming soon.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ─── 4) "Loading" / "Error" / Header / Details / Actions ───────
  if (loadingJob)
    return <div className="bg-white rounded-lg shadow-lg p-4 animate-pulse h-[420px] min-w-0 w-full overflow-hidden" />;
  if (errorJob) return <p className="text-red-500">{errorJob}</p>;

  // ─── Fix for "Invalid time value" ─────────────────────────────────
  let timeAgo;
  if (offer.sentDate) {
    const parsedSent = parseISO(offer.sentDate);
    if (isValid(parsedSent)) {
      timeAgo = formatDistanceToNow(parsedSent, { addSuffix: true });
    } else {
      timeAgo = "Date unknown";
    }
  } else {
    timeAgo = "Date unknown";
  }

  const qualifications = Array.isArray(job.qualifications) ? job.qualifications : [];
  const safeVisibleQualificationCount = qualifications.length > 0
    ? Math.min(Math.max(visibleQualificationCount, 0), qualifications.length)
    : 0;
  const visibleQualifications = qualifications.slice(0, safeVisibleQualificationCount);
  const hiddenQualifications = qualifications.slice(safeVisibleQualificationCount);
  const compensationText =
    job.internshipType === "STIPEND"
      ? `${job.compensationDetails?.amount || "—"} ${job.compensationDetails?.currency || ""}${
          job.compensationDetails?.frequency
            ? ` per ${job.compensationDetails.frequency.toLowerCase()}`
            : ""
        }`.trim()
      : job.internshipType === "FREE"
        ? "Unpaid / Free"
        : job.internshipType === "PAID"
          ? `Student Pays: ${job.compensationDetails?.amount || "—"} ${job.compensationDetails?.currency || ""}`.trim()
          : "N/A";
  const benefits = Array.isArray(job.compensationDetails?.benefits)
    ? job.compensationDetails.benefits.filter(Boolean)
    : [];
  const additionalCosts = Array.isArray(job.compensationDetails?.additionalCosts)
    ? job.compensationDetails.additionalCosts.filter(Boolean)
    : [];
  const detailRows = [
    { label: "Company", value: job.companyName || "—" },
    { label: "Location", value: job.location || "Remote" },
    { label: "Start Date", value: formatDateLabel(job.startDate) },
    { label: "End Date / Duration", value: formatDateLabel(job.endDateOrDuration || job.duration) },
    { label: "Mode", value: formatEnumLabel(job.internshipMode || job.mode) },
    { label: "Type", value: formatEnumLabel(job.internshipType) },
    { label: "Level", value: job.classification || "—" },
    { label: "Compensation", value: compensationText },
  ];

  return (
    // NEW
    <div className="bg-white rounded-lg shadow-lg p-4 flex h-[420px] min-w-0 w-full flex-col overflow-hidden">

      {/* 5. RENDER STIPEND MODAL */}
      {/* 5. RENDER STIPEND MODAL (Fixed) */}
      {showStipendModal && (
        <StipendDetailsModal
          visible={showStipendModal}
          onClose={() => setShowStipendModal(false)}
          onSubmit={handleStipendSubmission}
        />
      )}

      {/* ✅ PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full relative">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
            >
              &times;
            </button>

            <div className="text-center mb-6">
              <FontAwesomeIcon icon={faCreditCard} className="text-4xl text-indigo-600 mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Complete Payment
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                This is a paid internship. Please complete the payment to accept the offer.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-lg font-bold text-gray-800">
                  Amount: {paymentAmount} {currency}
                </p>
              </div>
            </div>

            {/* ✅ PayPal Buttons */}
            <PayPalScriptProvider options={paypalInitialOptions}>
              <PayPalButtons
                createOrder={createPayPalOrder}
                onApprove={onPayPalApprove}
                onError={(error) => {
                  console.error('PayPal error:', error);
                  toast.error('Payment failed. Please try again.');
                }}
                style={{
                  layout: 'vertical',
                  color: 'blue',
                  shape: 'rect',
                  label: 'paypal'
                }}
              />
            </PayPalScriptProvider>
          </div>
        </div>
      )}

      {showAuthLinkedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6">
            <h3
              className="text-lg font-semibold text-gray-800 text-center whitespace-nowrap mb-4"
            >
              Your Google-Calendar authentication to Skillnaav is successful ✅
            </h3>
            <p className="text-sm text-gray-700 text-center">
              Now click on "Add/Update to Calendar" button to sync your Schedule events to your Google Calendar.
            </p>
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setShowAuthLinkedModal(false)}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal (Simple, Modern) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowModal(false)}
              aria-label="Close"
              className="absolute right-3 top-3 h-9 w-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
            >
              ×
            </button>

            <div className="px-6 py-6 text-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Confirm {responseType === "Accepted" ? "Accept" : "Reject"}
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to{" "}
                <span className="font-medium text-indigo-600">
                  {responseType?.toLowerCase()}
                </span>{" "}
                this offer?
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={confirmRespond}
                  className={`flex-1 h-10 rounded-xl text-sm font-semibold text-white transition active:scale-[0.98]
              ${responseType === "Accepted"
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "bg-red-600 hover:bg-red-700"
                    }`}
                >
                  {responseType === "Accepted" ? "Yes, Accept" : "Yes, Reject"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-10 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-900 hover:bg-gray-50 transition active:scale-[0.98]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Selection Modal (shown after clicking "Yes, Accept") */}
      {showTimeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4 border-b border-gray-100">
              <button
                onClick={() => {
                  setShowTimeModal(false);
                  setSelectedTimeSlot(null);
                }}
                className="absolute right-4 top-4 h-9 w-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
                aria-label="Close"
              >
                ×
              </button>

              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                  <FontAwesomeIcon icon={faClock} className="text-white" />
                </div>

                <div className="min-w-0">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Select a time slot
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Choose your preferred slot to confirm acceptance.
                  </p>

                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {/* Card container */}
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wide">
                    <span className="text-gray-700">Available slots</span>{" "}
                    <span className="text-gray-500 font-medium">(24 Hours Format)</span>
                  </p>
                  <span className="text-xs text-gray-500">
                    {availableSlots.length > 0 ? `${availableSlots.length} slots Available` : "No slots"}
                  </span>
                </div>

                {loadingSchedule ? (
                  <div className="py-10 text-center text-sm text-gray-500">
                    Loading time slots...
                  </div>
                ) : availableSlots.length > 0 ? (
                  // ✅ EXACTLY 4 slots visible then scroll
                  <div className="max-h-[324px] overflow-y-auto space-y-3 hide-scrollbar pr-1">
                    {availableSlots.map((slot, i) => {
                      const label = `${slot.startTime} - ${slot.endTime}`; // keep for saving
                      const isSelected = selectedTimeSlot === label;

                      return (
                        <label
                          key={i}
                          className={`h-[72px] flex items-center justify-between rounded-2xl border bg-white px-4 cursor-pointer transition
                      ${isSelected
                              ? "border-indigo-500 ring-2 ring-indigo-200"
                              : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40"
                            }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Modern radio */}
                            <span
                              className={`h-5 w-5 rounded-full border flex items-center justify-center flex-shrink-0
                          ${isSelected ? "border-indigo-600" : "border-gray-300"}`}
                            >
                              <span
                                className={`h-2.5 w-2.5 rounded-full bg-indigo-600 transition
                            ${isSelected ? "opacity-100" : "opacity-0"}`}
                              />
                            </span>

                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-gray-900 truncate">
                                {slot.startTime} <span className="text-gray-400">-</span> {slot.endTime}
                              </div>
                              <div className="text-xs text-gray-500">
                                Click to select
                              </div>
                            </div>
                          </div>

                          {/* Right selected badge */}
                          {isSelected ? (
                            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">
                              <FontAwesomeIcon icon={faCheck} />
                              Selected
                            </div>
                          ) : null}

                          {/* Keep behavior standard */}
                          <input
                            type="radio"
                            name="timeSlot"
                            value={label}
                            checked={isSelected}
                            onClick={(e) => {
                              // ✅ Clicking the already selected slot should unselect it
                              if (isSelected) {
                                e.preventDefault();     // stop native radio behavior
                                e.stopPropagation();    // avoid extra bubbling
                                setSelectedTimeSlot(null);
                              }
                            }}
                            onChange={() => setSelectedTimeSlot(label)} // ✅ Normal selection
                            className="sr-only"
                          />

                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-10 text-center text-sm text-gray-500">
                    No time slots provided by instructor.
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowTimeModal(false);
                  setSelectedTimeSlot(null);
                }}
                className="h-10 px-4 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmTimeSelection}
                disabled={savingTimeSlot || !selectedTimeSlot}
                className={`h-10 px-5 rounded-xl text-white font-medium transition
            ${savingTimeSlot || !selectedTimeSlot
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
              >
                {savingTimeSlot ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="flex w-full max-w-3xl max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
            <div className="flex-shrink-0 border-b border-gray-100 px-6 pb-5 pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-4">
                  <img
                    src={job.imgUrl || "/default-image.jpg"}
                    alt="Company Logo"
                    className="h-12 w-12 flex-shrink-0 rounded-full object-contain"
                  />
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {job.jobTitle || "Internship Details"}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {job.companyName || "Company not specified"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(false)}
                  aria-label="Close"
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xl leading-none text-gray-500 hover:bg-gray-100"
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto hide-scrollbar px-6 py-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {detailRows.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm font-medium text-gray-800">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  About the Internship
                </h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600">
                  {job.jobDescription || "No description available."}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Skills Required
                </h3>
                {qualifications.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {qualifications.map((qualification, index) => (
                      <span
                        key={`${qualification}-${index}`}
                        className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                      >
                        {qualification}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-gray-500">
                    No qualifications listed.
                  </p>
                )}
              </div>

              {(benefits.length > 0 || additionalCosts.length > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {benefits.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        Benefits
                      </h3>
                      <ul className="mt-2 space-y-1 text-sm text-gray-600">
                        {benefits.map((benefit, index) => (
                          <li key={`${benefit}-${index}`}>{benefit}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {additionalCosts.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        Additional Costs
                      </h3>
                      <ul className="mt-2 space-y-1 text-sm text-gray-600">
                        {additionalCosts.map((cost, index) => (
                          <li key={`${cost.description || "cost"}-${index}`}>
                            {cost.description || "Additional cost"}
                            {cost.amount
                              ? `: ${cost.amount} ${cost.currency || ""}`.trim()
                              : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Contact Information
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {job.contactInfo?.name || "Not provided"}
                  {job.contactInfo?.email ? `, ${job.contactInfo.email}` : ""}
                  {job.contactInfo?.phone ? `, ${job.contactInfo.phone}` : ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-3 flex justify-end">
        <span
          className={`inline-flex max-w-full rounded-full px-3 py-1 text-xs font-medium leading-tight text-center whitespace-normal break-words ${offer.status === "Accepted"
            ? "bg-green-100 text-green-700"
            : offer.status === "Rejected"
              ? "bg-red-100 text-red-700"
              : "bg-blue-100 text-blue-700"
            }`}
        >
          {offer.status}
        </span>
      </div>

      {/* HEADER */}
      <div className="mb-4">
        {/* left: logo + text */}
        <div className="flex items-start gap-3 min-w-0">
          <img
            src={job.imgUrl || "/default-image.jpg"}
            alt="Company Logo"
            className="w-12 h-12 rounded-full object-contain flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h3
              className="truncate text-lg font-semibold text-gray-800 leading-tight"
              title={job.jobTitle || ""}
            >
              {job.jobTitle}
            </h3>
            <p
              className="truncate text-sm text-gray-500"
              title={`${job.companyName || ""} · ${timeAgo}`}
            >
              {job.companyName} · {timeAgo}
            </p>
          </div>
        </div>
      </div>


      {/* DETAILS */}
      <div className="text-gray-600 text-sm mb-3 space-y-1">
        <p className="flex items-center">
          <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />
          {job.location || "Remote"}
        </p>
        <p className="flex items-center">
          <FontAwesomeIcon icon={faClock} className="mr-2" />
          {format(new Date(job.startDate), "dd MMM yyyy")} –{" "}
          {job.endDateOrDuration
            ? format(new Date(job.endDateOrDuration), "dd MMM yyyy")
            : "—"}
        </p>

        {/* ✅ Selected Time Slot (only after accepted) */}
        {offer?.status?.toLowerCase() === "accepted" && preferredSlotLocal && (
          <p className="flex items-center">
            <FontAwesomeIcon icon={faClock} className="mr-2" />
            Selected Slot: {preferredSlotLocal}
          </p>
        )}

        <p>
          <FontAwesomeIcon icon={faDollarSign} className="mr-2" />
          {job.internshipType === "STIPEND"
            ? `${job.compensationDetails?.amount} ${job.compensationDetails?.currency} per ${job.compensationDetails?.frequency?.toLowerCase()}`
            : job.internshipType === "FREE"
              ? "Unpaid / Free"
              : job.internshipType === "PAID"
                ? `Student Pays: ${job.compensationDetails?.amount} ${job.compensationDetails?.currency}`
                : "N/A"
          }
        </p>
      </div>

      {/* QUALIFICATIONS */}
      <div className="mb-4 flex items-center gap-2">
        <div
          ref={qualificationRowRef}
          className="flex min-w-0 flex-1 flex-nowrap gap-2 overflow-hidden"
        >
          {qualifications.length > 0 ? (
            <>
              {visibleQualifications.map((q, i) => (
                <span
                  key={i}
                  className="inline-flex shrink-0 whitespace-nowrap text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                  title={q}
                >
                  {q}
                </span>
              ))}
              {hiddenQualifications.length > 0 && (
                <span
                  className="shrink-0 text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full font-medium"
                  title={hiddenQualifications.join(", ")}
                >
                  +{hiddenQualifications.length}
                </span>
              )}
            </>
          ) : (
            <span className="text-xs text-gray-500">No qualifications</span>
          )}
        </div>
        {offer.status.toLowerCase() !== "accepted" && (
          <button
            type="button"
            onClick={() => setShowDetailsModal(true)}
            className="shrink-0 whitespace-nowrap text-sm font-medium text-purple-600 transition hover:text-purple-800"
          >
            View details
          </button>
        )}
      </div>
      {qualifications.length > 0 && (
        <div
          ref={qualificationMeasureRef}
          className="fixed left-[-9999px] top-0 pointer-events-none invisible whitespace-nowrap"
        >
          {qualifications.map((q, i) => (
            <span
              key={`measure-${i}`}
              data-qualification-tag
              className="inline-flex whitespace-nowrap text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
            >
              {q}
            </span>
          ))}
          {Array.from({ length: qualifications.length }, (_, i) => i + 1).map((hiddenCount) => (
            <span
              key={`measure-count-${hiddenCount}`}
              data-qualification-count={hiddenCount}
              className="inline-flex whitespace-nowrap text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full font-medium"
            >
              +{hiddenCount}
            </span>
          ))}
        </div>
      )}

      {/* VIEW SCHEDULE & LINK CALENDAR BUTTONS */}
      {offer.status.toLowerCase() === "accepted" && (
        <div className="mt-auto pt-4">
          {(userPlan === "Premium Basic" || userPlan === "Premium Plus") ? (
            <div className="space-y-5 pb-1">
              {/* VIEW SCHEDULE + DETAILS */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="flex items-center text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                >
                  <FontAwesomeIcon icon={faCalendarAlt} className="mr-1 text-emerald-500" />
                  View Schedule
                </button>
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(true)}
                  className="whitespace-nowrap text-sm font-medium text-purple-600 transition hover:text-purple-800"
                >
                  View details
                </button>
              </div>

              {/* LINK + UPDATE merged */}
              <div className="flex justify-center">
                <button
                  onClick={handleAddUpdateCalendar}
                  className="text-sm font-semibold text-orange-600 transition hover:text-orange-700 disabled:cursor-not-allowed disabled:text-gray-400"
                  disabled={syncPhase === 'working' || syncPhase === 'auth'}
                >
                  Add/Update to Calendar
                </button>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleDownloadCertificate}
                  className={`flex items-center text-sm font-medium ${schedule?.isClosed
                    ? "text-cyan-600 hover:text-cyan-700"
                    : "text-gray-500 hover:text-gray-600"
                    }`}
                >
                  <FontAwesomeIcon icon={faDownload} className="mr-2" />
                  Download Certificate
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg text-sm font-medium">
              Upgrade to Premium Basic or Plus to access schedule and calendar features.
            </div>
          )}
        </div>
      )}

      {/* ✅ Schedule Modal (FREE + STIPEND) — keep existing code SAME */}
      {showScheduleModal && job?.internshipType !== "PAID" && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl relative p-6">
            <button
              onClick={() => setShowScheduleModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl"
            >
              &times;
            </button>
            <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
              <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-indigo-500" />
              Internship Schedule
            </h2>

            {/* Schedule Table */}
            {renderSchedule()}

            {/* LOCATION MODAL */}
            {selectedLocation && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md relative">
                  <button
                    onClick={() => setSelectedLocation(null)}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
                  >
                    &times;
                  </button>

                  <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-indigo-600" />
                    Location Details
                  </h3>

                  <div className="text-sm text-gray-700 space-y-6">
                    <p>
                      <strong className="text-gray-700">Location Name:</strong>{" "}
                      {selectedLocation.name || "—"}
                    </p>
                    <p>
                      <strong className="text-gray-700">Address:</strong>{" "}
                      {selectedLocation.address || "—"}
                    </p>
                    <p>
                      <strong className="text-gray-700">Map Link:</strong>{" "}
                      {selectedLocation.mapLink ? (
                        <a
                          href={normalizeUrl(selectedLocation.mapLink)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline"
                        >
                          View on Map
                        </a>
                      ) : (
                        "—"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SUMMARY MODAL */}
            {selectedSummary && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md relative">
                  <button
                    onClick={() => setSelectedSummary(null)}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
                  >
                    &times;
                  </button>
                  <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                    <FontAwesomeIcon icon={faClock} className="mr-2 text-indigo-600" />
                    Summary
                  </h3>
                  <div className="text-sm text-gray-700 space-y-6">
                    <p>
                      <strong className="text-gray-700">Section Summary:</strong>{" "}
                      {selectedSummary.sectionSummary || "—"}
                    </p>
                    <p>
                      <strong className="text-gray-700">Instructor Name:</strong>{" "}
                      {selectedSummary.instructor || "—"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ✅ Schedule Modal (PAID) — isolated in OfferLetterCardpaid.js */}
      <OfferLetterCardpaid
        show={showScheduleModal && job?.internshipType === "PAID"}
        onClose={() => setShowScheduleModal(false)}
        renderSchedule={renderSchedule}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
        selectedSummary={selectedSummary}
        setSelectedSummary={setSelectedSummary}
        normalizeUrl={normalizeUrl}
      />

      {/* Complete Internship Notice */}
      {showCompleteNotice && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 text-center relative">
            {/* ✨ NEW: Close (×) button */}
            <button
              onClick={() => setShowCompleteNotice(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
              aria-label="Close"
            >
              &times;
            </button>

            <p className="text-gray-800 font-semibold mb-2">
              Complete the internship first
            </p>
            <p className="text-gray-600 text-sm mb-6">
              Contact Your Instructor for the Internship Certificate after completing your whole internship schedule
            </p>
            <button
              onClick={() => setShowCompleteNotice(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* ✅ ACTION BUTTONS */}
      {(offer.status.toLowerCase() === "sent" || isUnpaidAccepted) && (
        <div className="mt-auto space-y-4 pt-4">
          {/* Status Indicator for STIPEND details */}
          {requiresStipendDetails && (
            <div
              className={`p-3 rounded-lg text-sm font-medium text-center ${stipendDetailsSubmitted
                ? "bg-green-100 text-green-800"
                : "bg-blue-100 text-blue-800"
                }`}
            >
              <FontAwesomeIcon icon={faDollarSign} className="mr-2" />
              {stipendDetailsSubmitted
                ? `✅ Stipend details submitted.`
                : ` Stipend Details Required for Acceptance.`}
            </div>
          )}

          {/* Payment Status Indicator for PAID internships */}
          {requiresPayment && (
            <div
              className={`p-3 rounded-lg text-sm font-medium text-center ${paymentStatus?.paid
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
                }`}
            >
              <FontAwesomeIcon icon={faCreditCard} className="mr-2" />
              {paymentStatus?.paid
                ? `✅ Payment completed (${paymentAmount} ${currency})`
                : ` Payment Required: ${paymentAmount} ${currency}`}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => handleRespond("Accepted")}
              disabled={loading}
              className={`flex-1 px-4 py-2 rounded-lg text-white transition
                ${loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                }`}
            >
              {loading ? "Processing..." : "Accept"}
            </button>

            <button
              onClick={() => handleRespond("Rejected")}
              disabled={loading}
              className={`flex-1 px-4 py-2 rounded-lg text-white transition
                ${loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                }`}
            >
              {loading ? "Please wait..." : "Reject"}
            </button>

          </div>
        </div>
      )}

      <CalendarSyncStatus
        open={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        phase={syncPhase}
        total={syncTotal}
        summary={syncSummary}
        errorMsg={syncErrorMsg}
      />
    </div>
  );
}

export default OfferLetterCard;
