/**
 * SURGICAL PRIVACY POLICY
 * Standard Shopify-style privacy policy optimized for a custom Next.js store.
 */
export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0c0c0f] text-slate-300 py-20 px-6 font-sans">
      <div className="max-w-3xl mx-auto bg-[#141420] border border-slate-800 p-8 md:p-12 rounded-3xl shadow-2xl">
        <h1 className="text-4xl font-black text-white mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
          Privacy & Data Protection
        </h1>
        
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">Information We Collect</h2>
          <p className="mb-4">
            To provide your surgical solutions, we collect information you provide directly to us (name, address, email, payment info) and information collected automatically through cookies and similar tracking technologies.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">How We Use Your Data</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>To process and fulfill your orders.</li>
            <li>To communicate with you about your "Surgical Roadmap."</li>
            <li>To analyze and improve our store's discovery engine.</li>
            <li>To prevent fraud and enhance site security.</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">Sharing Your Data</h2>
          <p className="mb-4">
            We only share your information with trusted third parties that help us operate our business:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><b>Stripe:</b> For secure payment processing.</li>
            <li><b>AutoDS & Logistics Partners:</b> Only the necessary address data to ship your item.</li>
            <li><b>Clerk:</b> For secure authentication and account management.</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">Your Rights</h2>
          <p>
            You have the right to access, update, or delete your personal information at any time. To exercise these rights, please contact our privacy officer at privacy@yourdomain.com.
          </p>
        </section>

        <div className="mt-12 pt-8 border-t border-slate-800 text-xs text-slate-500">
          Last Updated: April 9, 2026
        </div>
      </div>
    </div>
  )
}
