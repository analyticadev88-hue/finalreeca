"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

export default function AgentAuth() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [organization, setOrganization] = useState("");
  const [mobile, setMobile] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      const payload = mode === "login"
        ? { email, password }
        : { name, email, password, organization, mobile, idNumber };
      const endpoint = mode === "login" ? "/api/agent/login" : "/api/agent/register";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        if (mode === "login") {
          window.location.href = "/agent/dashboard";
        } else {
          setSuccess(true);
          setName("");
          setEmail("");
          setPassword("");
          setOrganization("");
          setMobile("");
          setIdNumber("");
          setMode("login");
        }
      } else {
        setError(data.error || `${mode === "login" ? "Login" : "Registration"} failed`);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
        {/* Left: Image */}
        <div className="hidden lg:block relative h-[700px]">
          <Image
            src="/images/agentlog.webp"
            alt="Bus travel image"
            fill
            className="object-cover"
            priority
            quality={100}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20 flex items-end p-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white">Reeca Travel Agents</h2>
              <p className="text-teal-200/90 font-medium">
                {mode === "login" 
                  ? "Professional booking management platform"
                  : "Join our network of trusted travel partners"}
              </p>
              <div className="flex items-center space-x-2 pt-2">
                <div className="w-8 h-px bg-teal-300/70"></div>
                <span className="text-xs text-teal-200/70 tracking-wider">REECA TRAVEL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="flex flex-col justify-center p-6 sm:p-10 md:p-12">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                <Image
                  src="/images/reeca-travel-logo.png"
                  alt="Company Logo"
                  width={150}
                  height={150}
                  className="rounded-md"
                />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              {mode === "login" ? "Agent Portal" : "Agent Registration"}
            </h2>
            <p className="text-gray-500 mt-2 text-sm">
              {mode === "login"
                ? "Sign in to access your dashboard"
                : "Create your professional account"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wider">
                    Full Name
                  </label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="py-3 px-4 text-sm border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label htmlFor="organization" className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wider">
                    Organization
                  </label>
                  <Input
                    id="organization"
                    placeholder="Travel Agency Ltd"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    required
                    className="py-3 px-4 text-sm border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label htmlFor="mobile" className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wider">
                    Mobile Number
                  </label>
                  <Input
                    id="mobile"
                    placeholder="+267 123 4567"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    required
                    className="py-3 px-4 text-sm border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label htmlFor="idNumber" className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wider">
                    ID Number
                  </label>
                  <Input
                    id="idNumber"
                    placeholder="ID/Passport Number"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    required
                    className="py-3 px-4 text-sm border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                  />
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wider">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="agent@yourcompany.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="py-3 px-4 text-sm border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="py-3 px-4 pr-10 text-sm border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-teal-600"
                    tabIndex={-1}
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.402-3.22 1.125-4.575M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c1.657 0 3.22.402 4.575 1.125M19.07 4.93l-14.14 14.14" /></svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-.274.857-.67 1.67-1.17 2.414" /></svg>
                    )}
                  </button>
                </div>
                {mode === "login" && (
                  <div className="mt-2 text-right">
                    <button
                      type="button"
                      className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                      onClick={() => setShowForgot(true)}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>
            </div>

            {mode === "login" && (
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs text-gray-600">
                  Remember me
                </label>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 text-green-600 text-sm rounded-md flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  Registration successful! Your account will be reviewed by Reeca management. 
                  You'll receive an email once your agent account is approved.
                </span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-medium py-3 px-4 rounded-lg shadow-sm transition-all duration-200 ease-in-out transform hover:shadow-md"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : mode === "login" ? (
                "Sign In"
              ) : (
                "Register Account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            {mode === "login" ? (
              <>
                New to Reeca Travel?{" "}
                <button
                  onClick={() => {
                    setMode("register");
                    setError("");
                    setSuccess(false);
                  }}
                  className="text-teal-600 font-medium hover:text-teal-700 hover:underline"
                >
                  Create agent account
                </button>
              </>
            ) : (
              <>
                Already registered?{" "}
                <button
                  onClick={() => {
                    setMode("login");
                    setError("");
                    setSuccess(false);
                  }}
                  className="text-teal-600 font-medium hover:text-teal-700 hover:underline"
                >
                  Sign in to your account
                </button>
              </>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              By continuing, you agree to our{" "}
              <a href="#" className="text-teal-600 hover:underline">Terms of Service</a> and{" "}
              <a href="#" className="text-teal-600 hover:underline">Privacy Policy</a>
            </p>
          </div>
        </div>
        {/* Forgot password modal */}
        {showForgot && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6 relative">
              <button
                className="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                onClick={() => { setShowForgot(false); setForgotMsg(""); setForgotEmail(""); setForgotLoading(false); }}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-lg font-bold mb-4 text-teal-600">Forgot Password</h2>
              {forgotMsg ? (
                <div className="text-green-600 text-sm mb-2">{forgotMsg}</div>
              ) : (
                <form
                  onSubmit={async e => {
                    e.preventDefault();
                    setForgotLoading(true);
                    setForgotMsg("");
                    const res = await fetch("/api/auth/forgot-password", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: forgotEmail }),
                    });
                    setForgotLoading(false);
                    if (res.ok) {
                      setForgotMsg("If an account exists, a reset link has been sent.");
                    } else {
                      const data = await res.json();
                      setForgotMsg(data.error || "Failed to send reset link.");
                    }
                  }}
                  className="space-y-4"
                >
                  <input
                    type="email"
                    className="block w-full border border-teal-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                    placeholder="Enter your email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    required
                  />
                  <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white" disabled={forgotLoading}>
                    {forgotLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}