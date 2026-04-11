/**
 * SURGICAL SHIPPING POLICY
 * Transparency on timelines is the #1 way to prevent chargebacks.
 */
export default function ShippingPolicy() {
  return (
    <div className="min-h-screen bg-[#0c0c0f] text-slate-300 py-20 px-6 font-sans">
      <div className="max-w-3xl mx-auto bg-[#141420] border border-slate-800 p-8 md:p-12 rounded-3xl shadow-2xl">
        <h1 className="text-4xl font-black text-white mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
          Surgical Logistics & Shipping
        </h1>
        
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">The "Surgical" Shipping Model</h2>
          <p className="mb-4">
            We source our solutions from vetted global creators to bring you premium tech without the middleman markup. This means our logistics are optimized for safety and efficiency rather than just local speed.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">Timelines</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-[#0c0c0f] rounded-xl border border-slate-800">
              <h3 className="text-purple-400 font-bold mb-1">Processing Time</h3>
              <p className="text-sm">24–48 hours for quality control & intelligence logging.</p>
            </div>
            <div className="p-4 bg-[#0c0c0f] rounded-xl border border-slate-800">
              <h3 className="text-indigo-400 font-bold mb-1">Transit Time</h3>
              <p className="text-sm">7–14 business days depending on your global location.</p>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">Tracking Your Solution</h2>
          <p className="mb-4">
            Once your order is dispatched, you will receive a <b>Surgical Tracking ID</b> via email. You can use this ID to track your package's movement through our logistics partner's hubs.
          </p>
          <p className="text-sm italic">
            Note: Tracking numbers may take 3-5 days to show movement while the package is processed at the international hub.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">Customs & Duties</h2>
          <p>
            For international orders, customs fees or duties may be applied by your local authorities. These fees are the responsibility of the customer and are not included in our shipping costs.
          </p>
        </section>

        <div className="mt-12 pt-8 border-t border-slate-800 text-xs text-slate-500">
          Last Updated: April 9, 2026
        </div>
      </div>
    </div>
  )
}
