/**
 * SURGICAL REFUND POLICY
 * Optimized for Dropshipping: Protects margins while building buyer trust.
 */
export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-[#0c0c0f] text-slate-300 py-20 px-6 font-sans">
      <div className="max-w-3xl mx-auto bg-[#141420] border border-slate-800 p-8 md:p-12 rounded-3xl shadow-2xl">
        <h1 className="text-4xl font-black text-white mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
          Refund & Happiness Policy
        </h1>
        
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">30-Day Surgical Satisfaction</h2>
          <p className="mb-4">
            At our store, we believe in the surgical precision of our products. If your solution doesn't perform to your expectations within 30 days of <b>delivery</b>, we want to make it right.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">How to Request a Refund</h2>
          <p className="mb-4">
            To initiate a return or refund, please contact our intelligence support team at support@yourdomain.com with your order number. We respond to all inquiries within 24 hours.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><b>Faulty or Damaged Items:</b> We provide a 100% free replacement or full refund if your item arrives damaged. No need to ship the item back to us — just send a photo of the defect.</li>
            <li><b>Change of Mind:</b> Due to the personalized nature of our surgical tools, change-of-mind returns must be in their original packaging and unused.</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">Exchanges</h2>
          <p>
            The fastest way to get a new size or color is to return the item you have and make a separate purchase for the new item.
          </p>
        </section>

        <div className="mt-12 pt-8 border-t border-slate-800 text-xs text-slate-500">
          Last Updated: April 9, 2026
        </div>
      </div>
    </div>
  )
}
