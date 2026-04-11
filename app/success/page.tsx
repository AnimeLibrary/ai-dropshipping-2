import Link from 'next/link'

/**
 * SURGICAL SUCCESS PAGE
 * Professional, AI-driven order confirmation and next steps.
 */
export default function SuccessPage({ searchParams }: { searchParams: { session_id: string } }) {
  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white flex flex-col items-center justify-center p-6 text-center">
      
      <div className="bg-gradient-to-b from-purple-500/10 to-transparent p-12 rounded-3xl border border-purple-500/20 max-w-2xl w-full">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/30">
            <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
            </svg>
        </div>

        <h1 className="text-4xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
            Surgical Solution Confirmed.
        </h1>
        <p className="text-slate-400 text-lg mb-12">
            Your transformation has started. We've received your order and are currently preparing your surgical kit for dispatch.
        </p>

        <div className="grid gap-6 text-left mb-12">
            <div className="bg-[#141420] p-6 rounded-2xl border border-slate-800">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Step 1: Intelligence Processing</span>
                <p className="text-sm text-slate-300 mt-2">Our sourcing engine is verifying stock and preparing your tracking number (24-48 hours).</p>
            </div>
            <div className="bg-[#141420] p-6 rounded-2xl border border-slate-800 opacity-60">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Step 2: Surgical Dispatch</span>
                <p className="text-sm text-slate-300 mt-2">Your solution will be shipped via our fastest vetted carrier.</p>
            </div>
            <div className="bg-[#141420] p-6 rounded-2xl border border-slate-800 opacity-60">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Step 3: Post-Arrival Guide</span>
                <p className="text-sm text-slate-300 mt-2">Check your email for your personalized AI usage guide to maximize results.</p>
            </div>
        </div>

        <div className="flex flex-col gap-4">
            <Link 
                href="/"
                className="bg-white text-black font-bold py-4 px-8 rounded-xl hover:bg-slate-200 transition-colors"
            >
                Back to Discovery
            </Link>
            <p className="text-xs text-slate-500">
                Order ID: {searchParams.session_id?.substring(0, 16)}...
            </p>
        </div>
      </div>
      
    </div>
  )
}
