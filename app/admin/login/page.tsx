"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";


export default function AdminLoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        router.push("/admin");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: { data: { name: regName } },
      });
      if (error) {
        setError(error.message);
      } else {
        router.push("/admin");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#009393] via-[#febf00]/10 to-[#007a7a]/10">
      <div className="bg-white rounded-xl shadow-xl overflow-hidden w-full max-w-md mx-4 border border-[#009393]/20">
        <div className="bg-gradient-to-r from-[#009393] to-[#febf00] p-6 text-white relative">
          <div className="flex justify-center mb-4">
            <img
              src="/images/reeca-travel-logo.png"
              alt="Reeca Travel"
              className="h-12 w-auto drop-shadow-lg"
              style={{ background: "transparent" }}
            />
          </div>
          <h1 className="text-2xl font-bold text-center tracking-wide drop-shadow">Admin Portal</h1>
        </div>

        <div className="p-8">
          <div className="flex mb-6 rounded-lg bg-[#f3f4f6] p-1">
            <button
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${tab === "login"
                ? "bg-white shadow-sm text-[#009393]"
                : "text-gray-500 hover:text-[#009393]"}`}
              onClick={() => setTab("login")}
            >
              Sign In
            </button>
            <button
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${tab === "register"
                ? "bg-white shadow-sm text-[#009393]"
                : "text-gray-500 hover:text-[#009393]"}`}
              onClick={() => setTab("register")}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    className="block w-full pl-10 pr-3 py-2 border border-[#009393]/30 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#febf00] focus:border-[#febf00]"
                    placeholder="admin@reeca.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="block w-full pl-10 pr-10 py-2 border border-[#009393]/30 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#febf00] focus:border-[#febf00]"
                    placeholder="Your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-[#009393]"
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
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-[#009393] focus:ring-[#febf00] border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <button
                    type="button"
                    className="font-medium text-[#009393] hover:text-[#febf00] focus:outline-none"
                    onClick={() => setShowForgot(true)}
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#009393] hover:bg-[#007a7a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#febf00]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : 'Sign in'}
              </Button>
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
                    <h2 className="text-lg font-bold mb-4 text-[#009393]">Forgot Password</h2>
                    {forgotMsg ? (
                      <div className="text-green-600 text-sm mb-2">{forgotMsg}</div>
                    ) : (
                      <form
                        onSubmit={async e => {
                          e.preventDefault();
                          setForgotLoading(true);
                          setForgotMsg("");

                          try {
                            const res = await fetch('/api/auth/forgot-password', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ email: forgotEmail })
                            });

                            const data = await res.json();
                            setForgotLoading(false);

                            if (res.ok) {
                              setForgotMsg(data.message || "If an account exists, a reset link has been sent.");
                            } else {
                              setForgotMsg(data.error || "Failed to send reset link.");
                            }
                          } catch (err) {
                            setForgotLoading(false);
                            setForgotMsg("Network error. Please try again.");
                          }
                        }}
                        className="space-y-4"
                      >
                        <input
                          type="email"
                          className="block w-full border border-[#009393]/30 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#febf00] focus:border-[#febf00]"
                          placeholder="Enter your email"
                          value={forgotEmail}
                          onChange={e => setForgotEmail(e.target.value)}
                          required
                        />
                        <Button type="submit" className="w-full bg-[#009393] hover:bg-[#007a7a] text-white" disabled={forgotLoading}>
                          {forgotLoading ? "Sending..." : "Send Reset Link"}
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-[#009393]/30 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#febf00] focus:border-[#febf00]"
                    placeholder="Your name"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    className="block w-full pl-10 pr-3 py-2 border border-[#009393]/30 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#febf00] focus:border-[#febf00]"
                    placeholder="you@reeca.com"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    className="block w-full pl-10 pr-3 py-2 border border-[#009393]/30 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#febf00] focus:border-[#febf00]"
                    placeholder="Create a password"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Use 8 or more characters with a mix of letters, numbers & symbols
                </p>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    className="focus:ring-[#febf00] h-4 w-4 text-[#009393] border-gray-300 rounded"
                    required
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="terms" className="font-medium text-gray-700">
                    I agree to the{' '}
                    <a href="#" className="text-[#009393] hover:text-[#febf00]">
                      Terms and Conditions
                    </a>
                  </label>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#009393] hover:bg-[#007a7a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#febf00]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </>
                ) : 'Create Account'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
