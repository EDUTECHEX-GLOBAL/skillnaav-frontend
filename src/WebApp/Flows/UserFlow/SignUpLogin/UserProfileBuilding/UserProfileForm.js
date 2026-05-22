// // File: UserProfileForm.js

// import React, { useState, useEffect, useRef } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";

// // --- Location constants and GeoDB config (US/CA only) ---
// const US_STATES = [
//   "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
//   "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
//   "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
//   "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
//   "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
//   "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah",
//   "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
// ];

// const CA_PROVINCES = [
//   "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador",
//   "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island",
//   "Quebec", "Saskatchewan", "Yukon"
// ];

// const GEODB_URL = "https://wft-geo-db.p.rapidapi.com/v1/geo/cities";
// // Use Vite or CRA env; set your key accordingly
// const GEODB_KEY =
//   (typeof import.meta !== "undefined" ? import.meta.env?.VITE_GEODB_KEY : undefined) ??
//   process.env.REACT_APP_GEODB_KEY ??
//   "";

// const UserProfileForm = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const userData = location.state?.userData || {}; // Access user data


//   // Initialize form data with empty values (to ensure empty fields on initial load)
//   const [formData, setFormData] = useState({
//     universityName: "",
//     dob: null,
//     educationLevel: "",
//     fieldOfStudy: "",
//     // --- Location defaults (US/CA only) ---
//     country: "",
//     state: "",
//     city: "",
//     zip: "",
//     address: "",
//     // Allow incoming userData to override defaults
//     ...userData,
//   });

//   const [filteredSuggestions, setFilteredSuggestions] = useState([]);
//   const [isFormValid, setIsFormValid] = useState(false);

//   // --- City suggestions + debounce/cancel helpers ---
//   const [citySuggestions, setCitySuggestions] = useState([]);
//   const cityTimerRef = useRef(null);
//   const cityAbortRef = useRef(null);

//   const stateList =
//     formData.country === "Canada"
//       ? CA_PROVINCES
//       : formData.country === "United States"
//         ? US_STATES
//         : [];

//   const stateLabel =
//     formData.country === "Canada"
//       ? "Province / Territory"
//       : formData.country === "United States"
//         ? "State"
//         : "State / Province";

//   const zipLabel =
//     formData.country === "Canada"
//       ? "Postal Code"
//       : formData.country === "United States"
//         ? "ZIP Code"
//         : "ZIP / Postal Code";

//   // Effect to handle loading form data from location state or localStorage
//   useEffect(() => {
//     const savedData = localStorage.getItem("userFormData");

//     if (savedData) {
//       // Load saved data from localStorage
//       try {
//         const parsed = JSON.parse(savedData);
//         setFormData((prev) => ({
//           ...prev,
//           ...parsed,
//           dob: parsed?.dob ? new Date(parsed.dob) : null,
//         }));
//       } catch {
//         // ignore malformed storage
//       }
//     }
//   }, []); // Empty dependency array ensures this runs only once on component mount

//   // Update validation for form
//   useEffect(() => {
//     const { universityName, dob, educationLevel, fieldOfStudy, country, state, city, zip, address } = formData;
//     setIsFormValid(Boolean(universityName && dob && educationLevel && fieldOfStudy && country && state && city && zip && address));
//   }, [formData]);

//   // Handle input changes
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prevData) => ({
//       ...prevData,
//       [name]: value,
//     }));

//     // Filtering university suggestions as user types
//     if (name === "universityName") {
//       const suggestions = universitySuggestions.filter((university) =>
//         university.toLowerCase().includes(value.toLowerCase())
//       );
//       setFilteredSuggestions(suggestions);
//     }
//   };

//   // Handle date picker change
//   const handleDateChange = (date) => {
//     const updatedDate = new Date(date);
//     updatedDate.setHours(0, 0, 0, 0);
//     setFormData((prevData) => ({
//       ...prevData,
//       dob: updatedDate,
//     }));
//   };

//   // --- Location handlers ---
//   const handleCountryChange = (value) => {
//     // Reset state & city when country changes
//     setFormData((prev) => ({ ...prev, country: value, state: "", city: "" }));
//     setCitySuggestions([]);
//   };

//   const handleStateChange = (e) => {
//     const { value } = e.target;
//     setFormData((prev) => ({ ...prev, state: value }));
//   };

//   const handleCityInputChange = (e) => {
//     const { value } = e.target;
//     setFormData((prev) => ({ ...prev, city: value }));

//     if (cityTimerRef.current) clearTimeout(cityTimerRef.current);
//     if (!value) {
//       setCitySuggestions([]);
//       if (cityAbortRef.current) cityAbortRef.current.abort();
//       return;
//     }

//     // Don't fetch suggestions until a country is chosen
//     if (!formData.country) {
//       setCitySuggestions([]);
//       return;
//     }

//     cityTimerRef.current = setTimeout(async () => {
//       try {
//         if (cityAbortRef.current) cityAbortRef.current.abort();
//         cityAbortRef.current = new AbortController();

//         const countryIds =
//           formData.country === "Canada" ? "CA" :
//             formData.country === "United States" ? "US" : "US,CA";

//         const url = new URL(GEODB_URL);
//         url.searchParams.set("namePrefix", value);
//         url.searchParams.set("limit", "10");
//         url.searchParams.set("minPopulation", "100000");
//         url.searchParams.set("countryIds", countryIds);

//         const resp = await fetch(url.toString(), {
//           method: "GET",
//           headers: {
//             "X-RapidAPI-Key": GEODB_KEY,
//             "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com",
//           },
//           signal: cityAbortRef.current.signal,
//         });

//         if (!resp.ok) throw new Error(`GeoDB error: ${resp.status}`);
//         const json = await resp.json();
//         setCitySuggestions(json?.data ?? []);
//       } catch (err) {
//         // Ignore fetch cancels
//         if (err?.name === "AbortError") return;
//         console.error(err);
//       }
//     }, 300); // 300ms debounce
//   };

//   const handleCitySelect = (c) => {
//     const regionName = c?.region || c?.regionCode || "";
//     const normalizedRegion = stateList.includes(regionName) ? regionName : formData.state;

//     setFormData((prev) => ({
//       ...prev,
//       city: c?.name || "",
//       state: normalizedRegion,
//     }));
//     setCitySuggestions([]);
//   };

//   // Cleanup timers/requests when component unmounts
//   useEffect(() => {
//     return () => {
//       if (cityTimerRef.current) clearTimeout(cityTimerRef.current);
//       if (cityAbortRef.current) cityAbortRef.current.abort();
//     };
//   }, []);

//   const handleSubmit = (e) => {
//     // This handler is called only if the form is valid.
//     // React doesn't fire onSubmit when native validation fails.
//     e.preventDefault();

//     console.log("Form Data Submitted:", formData);
//     localStorage.setItem("userFormData", JSON.stringify(formData));
//     navigate("/user-profile-picture", { state: { formData } });
//   };

//   // Example university suggestions (this could come from an API or a more extensive list)
//   const universitySuggestions = [
//     "Harvard University",
//     "Stanford University",
//     "University of California",
//     "Massachusetts Institute of Technology",
//     "Oxford University",
//     // Add more universities as needed
//   ];

//   // Handle suggestion selection
//   const handleSuggestionClick = (suggestion) => {
//     setFormData((prevData) => ({
//       ...prevData,
//       universityName: suggestion,
//     }));
//     setFilteredSuggestions([]); // Clear suggestions after selection
//   };

//   return (
//     <div className="flex justify-center items-center min-h-screen bg-gray-100 font-poppins">
//       <form onSubmit={handleSubmit} className="w-full max-w-xl p-8 space-y-6 bg-white shadow-md rounded-lg">
//         <div className="space-y-4">
//           <div className="w-full h-12 p-3 bg-[#F9F0FF] border-b border-[#E6C4FB]">
//             <h2 className="text-16px font-bold text-gray-700">BASIC INFORMATION</h2>
//           </div>
//           <div className="relative">
//             <label htmlFor="universityName" className="block text-sm font-medium text-gray-700">
//               University Name
//             </label>
//             <input
//               id="universityName"
//               type="text"
//               name="universityName"
//               value={formData.universityName}
//               onChange={handleChange}
//               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
//               placeholder="Enter your University Name"
//               autoComplete="off"
//             />
//             {filteredSuggestions.length > 0 && (
//               <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
//                 {filteredSuggestions.map((suggestion, index) => (
//                   <li key={index} onClick={() => handleSuggestionClick(suggestion)} className="cursor-pointer px-4 py-2 hover:bg-purple-100">
//                     {suggestion}
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </div>
//           <div>
//             <label htmlFor="dob" className="block text-sm font-medium text-gray-700">Date of Birth</label>
//             <DatePicker
//               selected={formData.dob}
//               onChange={handleDateChange}
//               dateFormat="dd/MM/yyyy"
//               maxDate={new Date()}
//               showYearDropdown
//               showMonthDropdown
//               dropdownMode="select"
//               placeholderText="DD/MM/YYYY"
//               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
//             />
//           </div>

//           {/* LOCATION */}
//           <div className="space-y-4">
//             <div className="w-full h-12 p-3 bg-[#F9F0FF] border-b border-[#E6C4FB]">
//               <h2 className="text-16px font-bold text-gray-700">LOCATION</h2>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               {/* Country (US/CA only) */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Country *</label>
//                 <select
//                   name="country"
//                   value={formData.country}
//                   onChange={(e) => handleCountryChange(e.target.value)}
//                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
//                   required
//                 >
//                   <option value="">Select</option>
//                   <option value="United States">United States</option>
//                   <option value="Canada">Canada</option>
//                 </select>

//               </div>

//               {/* State / Province */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">{stateLabel} *</label>
//                 <select
//                   name="state"
//                   value={formData.state}
//                   onChange={handleStateChange}
//                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100"
//                   disabled={!formData.country}
//                   required
//                 >
//                   <option value="">Select</option>
//                   {stateList.map((s) => (
//                     <option key={s} value={s}>{s}</option>
//                   ))}
//                 </select>
//               </div>

//               {/* City with suggestions */}
//               <div className="relative">
//                 <label className="block text-sm font-medium text-gray-700">City *</label>
//                 <input
//                   type="text"
//                   name="city"
//                   value={formData.city}
//                   onChange={handleCityInputChange}
//                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100"
//                   disabled={!formData.country}
//                   placeholder="Start typing city"
//                   autoComplete="off"
//                   required
//                 />
//                 {citySuggestions.length > 0 && (
//                   <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
//                     {citySuggestions.map((c) => (
//                       <li
//                         key={c.id || c.wikiDataId || `${c.name}-${c.region}`}
//                         onClick={() => handleCitySelect(c)}
//                         className="cursor-pointer px-4 py-2 hover:bg-purple-100"
//                       >
//                         {c.name}{c.region ? `, ${c.region}` : ""}
//                       </li>
//                     ))}
//                   </ul>
//                 )}
//               </div>

//               {/* ZIP / Postal Code (NEW) */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">{zipLabel} *</label>
//                 <input
//                   type="text"
//                   name="zip"
//                   value={formData.zip}
//                   onChange={handleChange}
//                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
//                   placeholder={formData.country === "Canada" ? "e.g., K1A 0B1" : "e.g., 94105"}
//                   autoComplete="postal-code"
//                   required
//                 />
//               </div>

//               {/* Full Address (NEW) */}
//               <div className="md:col-span-2 md:col-start-1">
//                 <label className="block text-sm font-medium text-gray-700">Address *</label>
//                 <textarea
//                   name="address"
//                   value={formData.address}
//                   onChange={handleChange}
//                   rows={3}
//                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
//                   placeholder="Street address, Apt/Suite (City is above), State/Province"
//                   autoComplete="street-address"
//                   required
//                 />
//               </div>
//             </div>
//           </div>

//         </div>
//         <div className="space-y-4">
//           <div className="w-full h-12 p-3 bg-[#F9F0FF] border-b border-[#E6C4FB]">
//             <h2 className="text-16px font-bold text-gray-700">EDUCATIONAL INFORMATION</h2>
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700">Current level of education</label>
//             <div className="mt-2 space-y-2">
//               <div className="flex items-center">
//                 <input
//                   type="radio"
//                   id="highschool"
//                   name="educationLevel"
//                   value="highschool"
//                   checked={formData.educationLevel === "highschool"}
//                   onChange={handleChange}
//                   className="h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500"
//                 />
//                 <label htmlFor="highschool" className="ml-3 mt-4 block text-sm text-gray-700">Highschool</label>
//               </div>
//               <div className="flex items-center">
//                 <input
//                   type="radio"
//                   id="undergraduate"
//                   name="educationLevel"
//                   value="undergraduate"
//                   checked={formData.educationLevel === "undergraduate"}
//                   onChange={handleChange}
//                   className="h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500"
//                 />
//                 <label htmlFor="undergraduate" className="ml-3 mt-4 block text-sm text-gray-700">Undergraduate</label>
//               </div>
//               <div className="flex items-center">
//                 <input
//                   type="radio"
//                   id="graduate"
//                   name="educationLevel"
//                   value="graduate"
//                   checked={formData.educationLevel === "graduate"}
//                   onChange={handleChange}
//                   className="h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500"
//                 />
//                 <label htmlFor="graduate" className="ml-3 mt-4 block text-sm text-gray-700">Graduate</label>
//               </div>
//             </div>
//           </div>

//           <div>
//             <label htmlFor="fieldOfStudy" className="block text-sm font-medium text-gray-700">Field of Study</label>
//             <select
//               name="fieldOfStudy"
//               value={formData.fieldOfStudy}
//               onChange={handleChange}
//               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
//             >
//               <option value="">Select Your Field</option>
//               <option value="space">Space Internships</option>
//               <option value="aero">Aeronautical Internships</option>
//               <option value="tech">Tech Internships</option>
//               <option value="research">Research Internships</option>
//               <option value="education">Education Internships</option>
//             </select>
//           </div>
//         </div>

//         <div className="flex justify-end mt-6">
//           <button
//             type="submit"
//             disabled={!isFormValid}
//             className="bg-purple-500 text-white w-full px-6 py-3 rounded-md hover:bg-purple-600 disabled:bg-gray-400"
//           >
//             Continue
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default UserProfileForm;