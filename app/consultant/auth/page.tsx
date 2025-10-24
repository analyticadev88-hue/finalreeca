"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

export default function ConsultantAuth() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [mobile, setMobile] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      const payload =
        mode === "login"
          ? { email, password }
          : { name, email, password, organization, mobile, idNumber };
      const endpoint =
        mode === "login"
          ? "/api/consultant/login"
          : "/api/consultant/register";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        if (mode === "login") {
          window.location.href = "/consultant/dashboard";
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-teal-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        {/* Left: Image */}
        <div className="hidden lg:block relative h-[600px]">
          <Image
            src="/images/cons.webp"
            alt="Consultant image"
            fill
            className="object-cover"
            priority
            quality={100}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/30 flex items-end p-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Bus Booking System</h2>
              <p className="text-teal-200">
                {mode === "login"
                  ? "Consult your clients and manage bookings"
                  : "Join our network of professional travel consultants"}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="flex flex-col justify-center p-8 sm:p-12">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Image
                src="/images/reeca-travel-logo.png"
                alt="Company Logo"
                width={150}
                height={150}
                className="rounded-lg"
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              {mode === "login" ? "Consultant Sign In" : "Create Consultant Account"}
            </h2>
            <p className="text-gray-500 mt-2">
              {mode === "login"
                ? "Access your consultant dashboard"
                : "Register to start consulting and managing bookings"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "register" && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <Input
                    id="name"
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="py-3 px-4"
                  />
                </div>
                <div>
                  <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">
                    Organization
                  </label>
                  <Input
                    id="organization"
                    placeholder="Travel Co."
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    required
                    className="py-3 px-4"
                  />
                </div>
                <div>
                  <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number
                  </label>
                  <Input
                    id="mobile"
                    placeholder="0712345678"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    required
                    className="py-3 px-4"
                  />
                </div>
                <div>
                  <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    ID Number
                  </label>
                  <Input
                    id="idNumber"
                    placeholder="ID/Passport Number"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    required
                    className="py-3 px-4"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="consultant@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="py-3 px-4"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="py-3 px-4 pr-10"
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

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md flex items-center">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 text-green-600 text-sm rounded-md flex items-center">
                Registration successful! Your account will be reviewed by Reeca management. You will be able to log in once your consultant account is approved.
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-lg shadow-sm transition-colors"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : mode === "login" ? "Sign In" : "Register"}
            </Button>
          </form>
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

          <div className="mt-6 text-center text-sm text-gray-600">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => {
                    setMode("register");
                    setError("");
                    setSuccess(false);
                  }}
                  className="text-teal-600 font-semibold hover:text-teal-700 hover:underline"
                >
                  Register here
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setMode("login");
                    setError("");
                    setSuccess(false);
                  }}
                  className="text-teal-600 font-semibold hover:text-teal-700 hover:underline"
                >
                  Sign in here
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}