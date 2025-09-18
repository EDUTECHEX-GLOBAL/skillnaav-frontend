// OfferLetterCard.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast } from 'react-toastify';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import CertificateTemplate from "./CertificateTemplate";

import {
  faMapMarkerAlt,
  faLink,
  faDollarSign,
  faCalendarAlt,
  faClock,
  faCreditCard,
  faDownload,

} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  formatDistanceToNow,
  format,
  parseISO,
  isValid,
  isToday,
} from "date-fns";

// ─── Google Calendar URL Helper ─────────────────────────────────────────
function buildGoogleCalendarUrl({
  title,
  startDate,
  endDate,
  location,
  description = "",
}) {
  const startUTC = format(startDate, "yyyyMMdd'T'HHmmss'Z'");
  const endUTC = format(endDate, "yyyyMMdd'T'HHmmss'Z'");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${startUTC}/${endUTC}`,
    details: description,
    location: location || "",
    sf: "true",
    output: "xml",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// ─── Parse "YYYY-MM-DD" + "hh:mm AM/PM" or "HH:mm" into a JS Date ─────
function parseDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return new Date(NaN);

  const hasAmPm = /[AaPp][Mm]$/.test(timeStr.trim());
  let dt;

  if (hasAmPm) {
    dt = new Date(`${dateStr} ${timeStr}`);
  } else {
    const [hour24, minute24] = timeStr.split(":").map((n) => parseInt(n, 10));
    const [year, month, day] = dateStr.split("-").map((n) => parseInt(n, 10));
    dt = new Date(year, month - 1, day, hour24, minute24);
  }

  return dt;
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
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const scrollContainerRef = useRef(null);
  const rowRefs = useRef({});
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const userPlan = userInfo?.planType;
  const [showCompleteNotice, setShowCompleteNotice] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const TIME_SLOTS = ["09:00 - 12:00", "14:00 - 05:00", "18:00 - 21:00"];


  // ✅ PayPal Configuration
  const paypalInitialOptions = {
    "client-id": process.env.REACT_APP_PAYPAL_CLIENT_ID || "your-paypal-client-id",
    currency: "USD",
    intent: "capture",
  };

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
      .then((res) => setJob(res.data))
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
        const partnerId = job.partnerId || job.postedBy || job.companyId;
        if (!partnerId) {
          console.error("Missing partnerId on job:", job);
          throw new Error("Partner ID not found");
        }
        const res = await axios.get(`/api/schedule/get-schedule`, {
          params: {
            internshipId: offer.internshipId,
            partnerId,
          },
        });
        setSchedule(res.data);
      } catch (err) {
        console.error("Failed to fetch schedule:", err);
      } finally {
        setLoadingSchedule(false);
      }
    };

    fetchSchedule();
  }, [job, offer.status]);

  // ─── 3) Check for existing payment status on load ────────
  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!job || job.internshipType !== "PAID" || !userInfo?._id) return;
      try {
        const response = await axios.get(`/api/internship/payments/status/${offer._id}`, {
          params: { studentId: userInfo._id }
        });

        if (response.data.paid) {
          setPaymentStatus({
            paid: true,
            paymentId: response.data.paymentId,
            amount: response.data.amount,
            currency: response.data.currency
          });
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
      }
    };
    checkPaymentStatus();
  }, [job, offer._id, userInfo]);


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

  const handleRespond = (type) => {
    // ✅ Check if it's a PAID internship requiring payment
    if (type === "Accepted" && job?.internshipType === "PAID" && !paymentStatus?.paid) {
      setShowPaymentModal(true);
      return;
    }

    setResponseType(type);
    setShowModal(true);
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
      const response = await axios.post('/api/internship/payments/capture-paypal-payment', {
        orderId: data.orderID,
        offerId: offer._id,
        studentId: userInfo._id,
      });

      if (response.data.success) {
        setPaymentStatus({
          paid: true,
          paymentId: response.data.paymentId,
          amount: job.compensationDetails.amount,
          currency: job.compensationDetails.currency || 'USD'
        });
        setShowPaymentModal(false);
        toast.success('✅ Payment successful! You can now accept the offer.');

        // Automatically show acceptance modal after successful payment
        setTimeout(() => {
          setResponseType("Accepted");
          setShowModal(true);
        }, 1500);
      }
    } catch (error) {
      console.error('Error capturing payment:', error);
      toast.error('Payment failed. Please try again.');
    }
  };

  const confirmRespond = async () => {
    if (!responseType) return;

    // ✅ If accepting, show time slot selection first
    if (responseType === "Accepted") {
      setShowModal(false);
      setShowTimeModal(true);
      return;
    }

    // Rejection flow stays the same
    try {
      const payload = { status: responseType };

      if (job?.internshipType === "PAID" && paymentStatus?.paymentId) {
        payload.paymentId = paymentStatus.paymentId;
      }

      await axios.patch(`/api/offer-letters/${offer._id}/status`, payload);
      onStatusChange(responseType);
      setShowModal(false);
      setResponseType(null);
    } catch (error) {
      console.error("Failed to update offer status:", error);
      alert("Failed to update status.");
    }
  };

  const confirmTimeSelection = async () => {
    if (!selectedTimeSlot) {
      toast.error("Please select a time slot");
      return;
    }

    try {
      const payload = {
        status: "Accepted",
        preferredTimeSlot: selectedTimeSlot,
      };

      if (job?.internshipType === "PAID" && paymentStatus?.paymentId) {
        payload.paymentId = paymentStatus.paymentId;
      }

      await axios.patch(`/api/offer-letters/${offer._id}/status`, payload);

      onStatusChange("Accepted");
      toast.success("Offer accepted and time slot saved");
      setShowTimeModal(false);
      setSelectedTimeSlot(null);
      setResponseType(null);
    } catch (error) {
      console.error("Failed to accept offer with time slot:", error);
      toast.error("Failed to save your time slot. Please try again.");
    }
  };

  // ✅ Determine if payment is required
  const requiresPayment = job?.internshipType === "PAID";
  const paymentAmount = job?.compensationDetails?.amount || 0;
  const currency = job?.compensationDetails?.currency || "USD";

  const handleUpdateSchedule = async () => {
    try {
      setLoading(true);
      const res = await axios.post('/api/google/update-schedule', {
        internshipId: offer.internshipId,
        studentEmail: userInfo.email,
      });

      if (res.data.success) {
        toast.success('✅ Schedule updated in Google Calendar');
      } else {
        toast.error(res.data.message || 'Failed to update schedule');
      }
    } catch (err) {
      console.error("Update schedule failed:", err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = async () => {
    // 🔒 Gate: partner must close the schedule first
    if (!schedule?.isClosed) {
      // Show a simple popup/modal
      setShowCompleteNotice(true);
      return;
    }

    try {
      // Create hidden container for rendering certificate
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.top = "-10000px"; // hide offscreen
      document.body.appendChild(container);

      // Render the CertificateTemplate inside container
      const element = (
        <CertificateTemplate studentName={userInfo?.name || "Student"} />
      );

      // Dynamically import ReactDOM and render → capture → PDF
      import("react-dom").then((ReactDOM) => {
        ReactDOM.render(element, container, async () => {
          const canvas = await html2canvas(container.querySelector("#certificate-content"));
          const imgData = canvas.toDataURL("image/png");

          const pdf = new jsPDF("landscape", "pt", "a4");
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

          pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
          pdf.save("Internship_Certificate.pdf");

          ReactDOM.unmountComponentAtNode(container);
          document.body.removeChild(container);
        });
      });
    } catch (err) {
      console.error("Certificate generation failed:", err);
      toast.error("Failed to generate certificate.");
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

                    if (isTodaySession) {
                      rowRefs.current[rowRefKey] = React.createRef();
                    }

                    const summaryText = session.sectionSummary || "-";
                    const isOnline = session.type === "online";
                    const isOffline = session.type === "offline";

                    const startDateTime = parseDateTime(session.date, session.startTime || "");
                    const endDateTime = parseDateTime(session.date, session.endTime || "");
                    const canBuildCalendar = isValid(startDateTime) && isValid(endDateTime);

                    let gcalUrl = "";
                    if (canBuildCalendar) {
                      const title = `Internship Session: ${session.sectionSummary || "Session"}`;
                      const locationForGc =
                        isOnline && session.eventLink
                          ? normalizeUrl(session.eventLink)
                          : session.location?.address
                            ? `${session.location.name}, ${session.location.address}`
                            : "";

                      const description = `
          Summary: ${summaryText}
          Type: ${session.type}
        `.trim();

                      gcalUrl = buildGoogleCalendarUrl({
                        title,
                        startDate: startDateTime,
                        endDate: endDateTime,
                        location: locationForGc,
                        description,
                      });
                    }

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
                          {session.startTime} - {session.endTime}
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
    return <div className="bg-white rounded-lg shadow-lg p-4 animate-pulse h-64" />;
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

  return (
    // NEW
    <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col h-full">
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

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center relative">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Confirm {responseType === "Accepted" ? "Accept" : "Reject"}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to{" "}
              <span className="font-medium text-indigo-600">
                {responseType?.toLowerCase()}
              </span>{" "}
              this offer?
            </p>
            <div className="flex justify-center gap-3 mt-4">
              <button
                onClick={confirmRespond}
                className={`px-4 py-2 rounded-lg text-white transition ${responseType === "Accepted"
                  ? "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                  : "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                  }`}
              >
                {responseType === "Accepted" ? "Yes, Accept" : "Yes, Reject"}
              </button>

              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg text-white transition bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Time Selection Modal (shown after clicking "Yes, Accept") */}
      {showTimeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full relative">
            <button
              onClick={() => { setShowTimeModal(false); setSelectedTimeSlot(null); }}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
              aria-label="Close"
            >
              &times;
            </button>

            <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">
              Select a Time Slot
            </h2>
            <p className="text-sm text-gray-600 mb-4 text-center">
              Please choose your preferred time.
            </p>

            <div className="flex items-stretch justify-center gap-2 mb-6">
              {TIME_SLOTS.map((slot) => {
                const selected = selectedTimeSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTimeSlot(slot)}
                    className={[
                      "px-3 py-2 rounded-lg text-sm font-medium border transition whitespace-nowrap",
                      selected
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    ].join(" ")}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => { setShowTimeModal(false); setSelectedTimeSlot(null); }}
                className="px-4 py-2 rounded-lg text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmTimeSelection}
                disabled={!selectedTimeSlot}
                className={`px-4 py-2 rounded-lg text-white transition ${selectedTimeSlot
                  ? "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                  : "bg-gray-300 cursor-not-allowed"
                  }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BODY */}
      <div className="flex-1"></div>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <img
            src={job.imgUrl || "/default-image.jpg"}
            alt="Company Logo"
            className="w-12 h-12 rounded-full mr-4 object-contain"
          />
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {job.jobTitle}
            </h3>
            <p className="text-sm text-gray-500">
              {job.companyName} · {timeAgo}
            </p>
          </div>
        </div>
        <span
          className={`text-xs font-medium px-3 py-1 rounded-full ${offer.status === "Accepted"
            ? "bg-green-100 text-green-700"
            : offer.status === "Rejected"
              ? "bg-red-100 text-red-700"
              : "bg-blue-100 text-blue-700"
            }`}
        >
          {offer.status}
        </span>
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
      <div className="flex flex-wrap gap-2 mb-4">
        {job.qualifications?.length > 0 ? (
          job.qualifications.map((q, i) => (
            <span
              key={i}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
            >
              {q}
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-500">No qualifications</span>
        )}
      </div>

      {/* VIEW SCHEDULE & LINK CALENDAR BUTTONS */}
      {offer.status.toLowerCase() === "accepted" && (
        <div className="mt-4 space-y-2">
          {(userPlan === "Premium Basic" || userPlan === "Premium Plus") ? (
            <>
              {/* VIEW SCHEDULE */}
              <button
                onClick={() => setShowScheduleModal(true)}
                className="flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-1 text-indigo-500" />
                View Schedule
              </button>

              {/* LINK GOOGLE CALENDAR + UPDATE SCHEDULE (wrapped together) */}
              <div className="flex flex-wrap items-center gap-2">
                {/* LINK GOOGLE CALENDAR */}
                <a
                  href="http://localhost:5000/api/google/auth"
                  className="inline-block bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                >
                  Link Google Calendar
                </a>

                {/* UPDATE SCHEDULE */}
                <button
                  onClick={handleUpdateSchedule}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Schedule'}
                </button>
              </div>

              {/* DOWNLOAD CERTIFICATE */}
              <div className="mt-auto pt-4">
                {offer.status.toLowerCase() === "accepted" &&
                  (userPlan === "Premium Basic" || userPlan === "Premium Plus") && (
                    <div className="flex justify-center">
                      <button
                        onClick={handleDownloadCertificate}
                        className={`flex items-center text-sm font-medium ${schedule?.isClosed ? "text-blue-600 hover:text-blue-800" : "text-gray-500 hover:text-gray-600"
                          }`}
                      >
                        <FontAwesomeIcon icon={faDownload} className="mr-2" />
                        Download Certificate
                      </button>
                    </div>
                  )}
              </div>
            </>
          ) : (
            <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg text-sm font-medium">
              Upgrade to Premium Basic or Plus to access schedule and calendar features.
            </div>
          )}
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl relative p-6">
            <button
              onClick={() => setShowScheduleModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl"
            >
              &times;
            </button>
            <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
              <FontAwesomeIcon
                icon={faCalendarAlt}
                className="mr-2 text-indigo-500"
              />
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
      {offer.status.toLowerCase() === "sent" && (
        <div className="space-y-3 mt-4">
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
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition"
            >
              {requiresPayment && !paymentStatus?.paid ? 'Pay to Accept' : 'Accept'}
            </button>
            <button
              onClick={() => handleRespond("Rejected")}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition"
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default OfferLetterCard;