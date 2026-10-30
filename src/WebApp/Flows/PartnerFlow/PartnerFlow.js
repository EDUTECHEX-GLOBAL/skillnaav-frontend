import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate, Link } from "react-router-dom";
import partner2Image from "../../../assets-webapp/partner2_img.jpg";

// Validation schema for Formik with domain check
const isValidEmailDomain = (email) => {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  const basicRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!basicRegex.test(trimmed)) return false;

  const parts = trimmed.split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1].toLowerCase();

  // Block common mistyped domains
  const invalidDomainTypos = [
    "gmail.co", "yahoo.co", "hotmail.co", "outlook.co", "icloud.co",
    "gmail.c", "yahoo.c", "hotmail.c", "outlook.c", "icloud.c",
    "gmail.cm", "yahoo.cm", "hotmail.cm", "outlook.cm",
    "gmail.om", "yahoo.om", "hotmail.om", "outlook.om",
    "gmail.con", "yahoo.con", "hotmail.con", "outlook.con",
  ];
  if (invalidDomainTypos.includes(domain)) return false;

  const domainParts = domain.split(".");
  if (domainParts.some((p) => p.length === 0)) return false;
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) return false;

  return true;
};

const validationSchema = Yup.object({
  email: Yup.string()
    .required("Email is required")
    .test(
      "valid-email-domain",
      "Please enter a valid email address with a valid domain (e.g. .com, .in)",
      (val) => isValidEmailDomain(val)
    ),
});

const PartnerFlow = () => {
  const navigate = useNavigate();

  // Function to handle form submission
  const handleSubmit = (values, { setSubmitting }) => {
    // Navigate to create account with prefilled email only when valid
    navigate("/partner-create-account", {
      state: { email: values.email?.trim() },
    });
    setSubmitting(false);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen font-poppins">
      <div className="hidden md:flex md:w-full lg:w-1/2 items-center justify-center">
        <img
          src={partner2Image}
          alt="Create Account"
          className="w-full h-full object-contain max-w-[830px] max-h-[900px] p-6 ml-6 shadow-lg"
        />
      </div>

      <div className="flex flex-col items-center justify-center p-8 w-full lg:w-1/2 bg-white">
        <div className="w-full max-w-md flex flex-col justify-center min-h-screen lg:min-h-full">
          <h1 className="text-3xl font-extrabold mb-4 text-center text-gray-800">
            Dear Partner, Welcome!
          </h1>
          <h2 className="text-lg font-medium mb-6 text-center text-gray-600">
            Get started with your account
          </h2>

          <Formik
            initialValues={{ email: "" }}
            validationSchema={validationSchema}
            validateOnChange={true}
            validateOnBlur={true}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, isSubmitting }) => {
              const hasEmailError = Boolean(errors.email && (touched.email || values.email));
              return (
                <Form>
                  <div className="mb-4">
                    <Field
                      type="email"
                      name="email"
                      placeholder="Email"
                      className={`!mt-0 w-full p-3 border rounded-lg focus:outline-none transition-all ${
                        hasEmailError
                          ? "!border-red-500 focus:ring-2 focus:ring-red-200"
                          : "border-gray-300 focus:ring-2 focus:ring-teal-500"
                      }`}
                    />
                    {hasEmailError && (
                      <div className="text-red-500 text-sm mt-1.5 font-medium">
                        {errors.email}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-teal-500 text-white p-3 rounded-lg hover:bg-teal-600 mb-4 transition-colors font-medium shadow"
                  >
                    Get Started
                  </button>
                </Form>
              );
            }}
          </Formik>

          <div className="flex items-center my-4">
            <hr className="w-full border-t border-gray-300" />
            <span className="px-3 text-gray-500">OR</span>
            <hr className="w-full border-t border-gray-300" />
          </div>
          {/* <button className="w-full bg-white text-gray-800 p-3 rounded-lg border border-gray-300 hover:bg-gray-100 mb-4 flex items-center justify-center">
            <span className="mr-2">
              <img src={googleIcon} alt="Google" className="h-5 w-5" />
            </span>
            <span className="font-poppins font-semibold text-base leading-6">
              Sign Up with Google
            </span>
          </button>
          <button className="w-full bg-white text-gray-800 p-3 rounded-lg border border-gray-300 hover:bg-gray-100 mb-4 flex items-center justify-center">
            <span className="mr-2">
              <img src={facebookIcon} alt="Facebook" className="h-5 w-5" />
            </span>
            <span className="font-poppins font-semibold text-base leading-6">
              Sign Up with Facebook
            </span>
          </button>
          <button className="w-full bg-white text-gray-800 p-3 rounded-lg border border-gray-300 hover:bg-gray-100 mb-4 flex items-center justify-center">
            <span className="mr-2">
              <img src={appleIcon} alt="Apple" className="h-5 w-5" />
            </span>
            <span className="font-poppins font-semibold text-base leading-6">
              Sign Up with Apple
            </span>
          </button> */}
          <p className="text-center text-gray-500 font-poppins font-medium text-base leading-6">
            Already have an account?{" "}
            <Link to="/partner/login" className="text-teal-500 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PartnerFlow;
