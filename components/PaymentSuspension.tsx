// components/PaymentSuspension.tsx
'use client'
import Link from 'next/link'

export default function PaymentSuspension() {
  const sendEmail = (subject: string) => {
    const email = 'tefomoduke@gmail.com'
    const body = `Hello Techni-kali IT Team,\n\nI would like to inquire about: ${subject}\n\nProject Reference: Recca Travel Development\n\nBest regards,`
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
  }

  const partners = [
    { 
      name: 'AnalyticaSecurity', 
      url: '#' 
    },
    { 
      name: 'BlastoTech', 
      url: '#' 
    },
    { 
      name: 'CodeX', 
      url: '#' 
    },
    { 
      name: 'Toporapula.dev', 
      url: '#' 
    },
    { 
      name: 'Techni-kali IT', 
      url: 'https://technikali-it.co.bw/' 
    },
    { 
      name: 'CrunchyDevs', 
      url: '#' 
    },
    { 
      name: 'MofenyiApps', 
      url: '#' 
    },
    { 
      name: 'R.I.S', 
      url: '#' 
    }
  ]

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Aurora Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-black to-purple-900/10"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
      
      {/* Main Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Site Under 
          </h1>
          <div className="text-4xl font-light text-gray-300 mb-4">
            Techni-kali IT
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            This website is currently undergoing maintenance and improvements by our Support team.
          </p>
        </div>

        {/* Powered By Section */}
        <div className="mb-16">
          <div className="text-gray-400 text-lg mb-6 tracking-widest">POWERED BY</div>
          
          {/* Partners Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {partners.map((partner, index) => (
              <a
                key={partner.name}
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative p-4 rounded-lg border border-gray-800 hover:border-blue-500/50 transition-all duration-300 hover:bg-gray-900/30 block"
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animation: 'fadeInUp 0.6s ease-out forwards'
                }}
              >
                <div className="text-sm font-mono font-semibold text-gray-300 group-hover:text-white transition-colors">
                  {partner.name}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </a>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-2xl mx-auto">
          <button
            onClick={() => sendEmail('Report Issue - Recca Travel')}
            className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 border-2 border-transparent hover:border-blue-500"
          >
            Report Issue
          </button>
          
          <button
            onClick={() => sendEmail('Security Testing Inquiry - Recca Travel')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 border-2 border-blue-500/50"
          >
            Get Security Testers
          </button>
          
          <button
            onClick={() => sendEmail('Maintenance Support - Recca Travel')}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-200 transform hover:scale-105 border-2 border-purple-500/50"
          >
            Get Maintenance Support
          </button>
          
          <button
            onClick={() => sendEmail('Development Team Inquiry - Recca Travel')}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 transform hover:scale-105 border-2 border-green-500/50"
          >
            Get Devs
          </button>
        </div>

        {/* Quick Links */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a 
            href="https://technikali-it.co.bw/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm font-semibold"
          >
            Visit Techni-kali IT
          </a>
          
        </div>

        {/* Footer */}
        <div className="mt-12 text-gray-500 text-sm">
          <p>Need immediate assistance? All inquiries redirect to our lead Sites Support</p>
          <p className="mt-2">Email: tefomoduke@gmail.com</p>
          <p className="mt-4 text-xs text-gray-600">
            © {new Date().getFullYear()} Techni-kali IT. All rights reserved.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}