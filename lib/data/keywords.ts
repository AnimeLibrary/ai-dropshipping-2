// ============================================================
// KEYWORD CLUSTER DATA LAYER
// Source: ZIK Analytics, Minea API, Google Autosuggest scraper
// This is the seed data. Add clusters from your tool exports here.
// ============================================================

export type PageIntent = 'informational' | 'transactional' | 'problem-solution' | 'comparison'
export type TrendDirection = 'rising' | 'stable' | 'declining'
export type Competition = 'low' | 'medium' | 'high'

export interface KeywordCluster {
  id: string
  keyword: string               // Primary keyword (from ZIK/Minea/Kalodata)
  searchVolume: number          // Monthly search volume
  competition: Competition
  intent: PageIntent
  trend: TrendDirection
  niche: string                 // e.g. "back-pain", "sleep", "home-office"
  relatedKeywords: string[]     // Secondary/LSI keywords for content
  relatedPages: string[]        // Internal link targets (slugs)
  targetPageType: 'guide' | 'problem' | 'solution' | 'product' | 'collection'
  targetSlug: string            // URL slug for the generated page
  painPoint: string             // The core human problem this addresses
  solutionAngle: string         // How the solution should be framed
  source: 'minea' | 'zik' | 'kalodata' | 'pipiads' | 'manual'
}

// ============================================================
// SEED CLUSTERS — Replace/expand with real data from your tools
// ============================================================
export const keywordClusters: KeywordCluster[] = [
  {
    id: 'back-pain-gaming',
    keyword: 'why does my back hurt after gaming',
    searchVolume: 1200,
    competition: 'low',
    intent: 'problem-solution',
    trend: 'rising',
    niche: 'back-pain',
    relatedKeywords: ['gaming chair back pain', 'back support for gaming', 'posture corrector gaming'],
    relatedPages: ['back-pain-posture-fix', 'best-lumbar-support-chair', 'back-pain-solutions'],
    targetPageType: 'guide',
    targetSlug: 'why-does-my-back-hurt-after-gaming',
    painPoint: 'Back and neck pain from long gaming sessions destroying posture and causing chronic pain.',
    solutionAngle: 'Ergonomic support products that allow longer, pain-free gaming sessions.',
    source: 'manual',
  },
  {
    id: 'sleep-quality',
    keyword: 'how to sleep better with anxiety',
    searchVolume: 8900,
    competition: 'low',
    intent: 'problem-solution',
    trend: 'rising',
    niche: 'sleep',
    relatedKeywords: ['anxiety sleep aid', 'weighted blanket anxiety', 'sleep mask anxiety'],
    relatedPages: ['sleep-guide', 'weighted-blanket-review', 'sleep-solutions'],
    targetPageType: 'guide',
    targetSlug: 'how-to-sleep-better-with-anxiety',
    painPoint: 'Racing thoughts and anxiety making it impossible to fall or stay asleep.',
    solutionAngle: 'Calming sleep products that signal safety to an overactive nervous system.',
    source: 'manual',
  },
  {
    id: 'wfh-neck-pain',
    keyword: 'neck pain from working from home',
    searchVolume: 3400,
    competition: 'low',
    intent: 'problem-solution',
    trend: 'stable',
    niche: 'home-office',
    relatedKeywords: ['monitor stand neck pain', 'ergonomic desk setup wfh', 'neck pain remote work'],
    relatedPages: ['home-office-ergonomics-guide', 'monitor-stand-comparison', 'wfh-solutions'],
    targetPageType: 'guide',
    targetSlug: 'neck-pain-from-working-from-home',
    painPoint: 'Chronic neck and shoulder pain from looking down at laptop screens all day.',
    solutionAngle: 'Proper monitor height + posture tools that eliminate the root cause.',
    source: 'manual',
  },
  {
    id: 'pet-hair-everywhere',
    keyword: 'how to get dog hair off couch',
    searchVolume: 5600,
    competition: 'low',
    intent: 'problem-solution',
    trend: 'stable',
    niche: 'pet-care',
    relatedKeywords: ['dog hair remover', 'pet hair lint roller', 'couch protector dogs'],
    relatedPages: ['pet-hair-solutions', 'best-pet-hair-removers', 'pet-care-guide'],
    targetPageType: 'guide',
    targetSlug: 'how-to-get-dog-hair-off-couch',
    painPoint: 'Dog hair covering every surface, embarrassing for guests and impossible to clean.',
    solutionAngle: 'One-pass hair removal tools that make cleaning effortless and permanent.',
    source: 'manual',
  },
  {
    id: 'lumbar-support-comparison',
    keyword: 'best lumbar support for office chair',
    searchVolume: 6800,
    competition: 'medium',
    intent: 'comparison',
    trend: 'rising',
    niche: 'back-pain',
    relatedKeywords: ['lumbar pillow review', 'back support cushion office', 'ergonomic lumbar support'],
    relatedPages: ['back-pain-gaming', 'office-chair-guide', 'back-pain-solutions'],
    targetPageType: 'solution',
    targetSlug: 'best-lumbar-support-for-office-chair',
    painPoint: 'Generic office chairs destroying lower back after hours of sitting.',
    solutionAngle: 'Targeted lumbar support that corrects sitting posture instantly.',
    source: 'manual',
  },
]

// ============================================================
// HELPER: Get clusters by niche
// ============================================================
export function getClustersByNiche(niche: string): KeywordCluster[] {
  return keywordClusters.filter((c) => c.niche === niche)
}

// ============================================================
// HELPER: Get clusters by intent
// ============================================================
export function getClustersByIntent(intent: PageIntent): KeywordCluster[] {
  return keywordClusters.filter((c) => c.intent === intent)
}

// ============================================================
// HELPER: Get rising clusters for priority publishing
// ============================================================
export function getRisingClusters(): KeywordCluster[] {
  return keywordClusters
    .filter((c) => c.trend === 'rising')
    .sort((a, b) => b.searchVolume - a.searchVolume)
}

// ============================================================
// HELPER: Get all unique niches
// ============================================================
export function getAllNiches(): string[] {
  return Array.from(new Set(keywordClusters.map((c) => c.niche)))
}
