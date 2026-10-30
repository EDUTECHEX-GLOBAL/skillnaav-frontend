// File: UserFlow.js

import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate, Link } from "react-router-dom";
import createAccountImage from "../../../assets-webapp/login-image.png";
import { isValidEmail } from "../../../utils/validation";
import axios from "../../../api/axiosInstance";
const validationSchema = Yup.object({
  email: Yup.string()
    .required("Email is required")
    .test(
      "valid-email-domain",
      "Please enter a valid email address with a valid domain (e.g. .com, .in)",
      (val) => isValidEmail(val)
    ),
});

const UserFlow = () => {
  const navigate = useNavigate();

  // Function to handle form submission
  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    const trimmedEmail = values.email?.trim();
    if (!trimmedEmail) {
      setFieldError("email", "Email is required");
      setSubmitting(false);
      return;
    }

    try {
      const resp = await axios.get(`/api/user/check-email?email=${encodeURIComponent(trimmedEmail)}`);
      if (resp.data?.exists) {
        setFieldError("email", "An account with this email already exists. Please login.");
        setSubmitting(false);
        return;
      }
    } catch (err) {
      console.warn("Email check failed:", err?.message);
    }

    navigate("/user-create-account", {
      state: { email: trimmedEmail },
    });
    setSubmitting(false);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen font-poppins">
      <div className="hidden md:flex md:w-full lg:w-1/2 items-center justify-center">
        <img
          src={createAccountImage}
          alt="Create Account"
          className="w-full h-full object-contain max-w-[830px] max-h-[900px] p-6 ml-6 shadow-lg"
        />
      </div>

      <div className="flex flex-col items-center justify-center p-8 w-full lg:w-1/2 bg-white">
        <div className="w-full max-w-md flex flex-col justify-center min-h-screen lg:min-h-full">
          <h1 className="text-3xl font-extrabold mb-4 text-center text-gray-800">
            Dear Student, Welcome!
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
            {({ values, errors, touched, isSubmitting, submitCount }) => {
              const hasEmailError = Boolean(errors.email && (touched.email || values.email || submitCount > 0));
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
                          : "border-gray-300 focus:ring-2 focus:ring-purple-500"
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
                    className="w-full bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-700 mb-4 transition-colors font-medium shadow"
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

          <p className="text-center text-gray-500 font-poppins font-medium text-base leading-6">
            Already have an account?{" "}
            <Link to="/user/login" className="text-purple-600 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserFlow;
