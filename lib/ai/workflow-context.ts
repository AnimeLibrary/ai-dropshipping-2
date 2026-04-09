/**
 * ULTRA-LAYERED DROPSHIPPING WORKFLOW CONTEXT
 * This file encodes the 10-step business strategy defined in the global rules.
 * It is used as System Context for the AI Strategist.
 */

export const ULTRA_LAYERED_WORKFLOW = {
  version: '1.0.0',
  name: 'Ultra-Layered Dropshipping Pipeline',
  steps: [
    {
      id: 1,
      name: 'Data Sourcing Layer',
      tools: ['Kalodata (CSV)', 'Minea (API)'],
      goal: 'Normalize trending products into a master database.'
    },
    {
      id: 2,
      name: 'Keyword & SEO Layer',
      logic: 'Intent classifier (informational, transactional) + Cluster generator.',
      goal: 'Match products to high-intent keyword clusters.'
    },
    {
      id: 3,
      name: 'AI Content Layer',
      responsibilities: ['Hero copy (pain -> solution)', 'FAQs', 'Product bundles copy'],
      rules: ['Emotional storytelling first', 'Problem-solving before selling']
    },
    {
      id: 4,
      name: 'Programmatic Page Generation',
      templates: ['Guide', 'Product', 'Bundle', 'Problem/Solution'],
      goal: 'Scale to hundreds of programmatic pages across niches.'
    },
    {
      id: 5,
      name: 'Internal Linking Layer',
      rules: ['Each page links to 3-5 related pages', 'No orphan pages', 'Semantic relevance grouping']
    },
    {
      id: 6,
      name: 'Schema & Technical Layer',
      features: ['Auto-generated Product/FAQ Schema', 'SSR for speed', 'Clean URLs']
    },
    {
      id: 7,
      name: 'Product Bundling Layer',
      logic: 'AI identifies complementary products to increase AOV (Average Order Value).'
    },
    {
      id: 8,
      name: 'Modern Headless Frontend',
      stack: ['Next.js', 'Headless Shopify (Checkout)', 'Vercel']
    },
    {
      id: 9,
      name: 'Analytics & Feedback Loop',
      metrics: ['CTR', 'Add-to-cart', 'Scroll Depth', 'Conversion'],
      automation: 'AI updates underperforming pages based on engagement.'
    },
    {
      id: 10,
      name: 'Scale & Repeat',
      goal: 'Consistency + manual validation initialy until AI patterns are proven.'
    }
  ],
  pricingRules: {
    markup: '3x',
    minMargin: 20,
    formula: 'max(SupplierPrice * 3, SupplierPrice + 20)'
  }
}

export const WORKFLOW_SYSTEM_PROMPT = `
You are the TrendDrop AI Master Strategist. 
You have deep knowledge of the following 10-step "Ultra-Layered Workflow":
${JSON.stringify(ULTRA_LAYERED_WORKFLOW.steps, null, 2)}

Your pricing logic is strictly: ${ULTRA_LAYERED_WORKFLOW.pricingRules.formula}.

Guidelines:
- Always prioritize the "Pain -> Solution" narrative.
- Focus on conversion-driven aesthetics and data-backed trends.
- Use your understanding of the entire pipeline to help the admin scale from a single product to a multi-niche empire.
`
