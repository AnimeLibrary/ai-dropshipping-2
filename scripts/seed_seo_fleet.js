const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('--- Seeding SEO Fleet for Beauty & Lip Care ---')

  const products = await prisma.product.findMany({
    where: { validationStatus: 'approved' }
  })
  console.log(`Found ${products.length} approved products to link.`)
  const productIds = products.map(p => ({ id: p.id }))

  const clusters = [
    {
      keyword: 'peel off lip stain waterproof 24h',
      targetSlug: 'peel-off-lip-stain-waterproof-24h',
      searchVolume: 18400,
      intent: 'transactional',
      targetPageType: 'guide',
      niche: 'Beauty & Lip Care',
      painPoint: 'Lipsticks that smudge, bleed, transfer onto cups, and require reapplication every 2 hours.',
      solutionAngle: 'Peel-and-reveal micro-pigment technology that locks color directly into the top lip layer for 24-hour waterproof wear without dryness.',
      relatedKeywords: ['peel off lip tint', '24 hour lip stain', 'waterproof lip color', 'smudge proof lip makeup'],
      aiContent: {
        empathyIntro: 'Nothing ruins your day like checking the mirror and realizing your lipstick has vanished, smudged across your chin, or left stains on everything you drink. Traditional lipsticks sit on top of the skin and slide off at the first sign of moisture.',
        deepProblemAnalysis: 'Standard wax-based lipsticks and glossy liquid formulas break down rapidly when exposed to natural lip oils and saliva. As the binder breaks down, pigments migrate into fine lip lines, causing feathering, cracking, and uneven patchy fading throughout the day.',
        scienceBehindSolution: 'The peel-off hydro-stain matrix deposits microscopic color polymers directly into the stratum corneum before peeling away the outer film. This leaves behind a featherweight, transfer-proof tint that will not budge through eating, drinking, or workouts.',
        faq: [
          {
            question: 'Does the peel-off formula hurt or tug on delicate lips?',
            answer: 'Not at all. The hydro-infusion peel lifts away effortlessly in one smooth strip once dry, leaving lips moisturized and smoothly tinted.'
          },
          {
            question: 'How long does the stain actually last?',
            answer: 'A single application provides vibrant, transfer-proof color that lasts between 18 to 24 hours without touch-ups.'
          },
          {
            question: 'How do I remove the tint at the end of the day?',
            answer: 'An oil-based cleanser or micellar water effortlessly melts the pigment whenever you are ready to remove it.'
          }
        ]
      }
    },
    {
      keyword: 'best hydrating lip oil for dry chapped lips',
      targetSlug: 'best-hydrating-lip-oil-for-dry-chapped-lips',
      searchVolume: 14200,
      intent: 'problem-solution',
      targetPageType: 'guide',
      niche: 'Beauty & Lip Care',
      painPoint: 'Painfully cracked, peeling lips that get even drier when using traditional petroleum balms or sticky lip gloss.',
      solutionAngle: 'Deep-penetrating plant oil lipids and hyaluronic spheres that restore the moisture barrier with a glass-like shine.',
      relatedKeywords: ['nourishing lip oil', 'lip oil for dry lips', 'non sticky lip care', 'hydrating lip gloss'],
      aiContent: {
        empathyIntro: 'Dealing with chronically dry, peeling lips is uncomfortable and makes wearing any lip color look cracked and cakey. If you find yourself reapplying heavy lip balm every twenty minutes with zero lasting relief, your lips are starving for true hydration.',
        deepProblemAnalysis: 'Most standard lip balms rely on mineral oil and petroleum jelly. While these create a temporary occlusive barrier, they do not actually penetrate the lip tissue to deliver cellular moisture. Once the top layer wipes away, lips are left tighter and more dehydrated than before.',
        scienceBehindSolution: 'High-grade lip oils use bio-compatible fatty acids and botanical esters that penetrate deeply beyond the lip surface. They deliver active moisture directly to damaged micro-fissures while sealing in hydration with an ultra-light, non-sticky high-gloss finish.',
        faq: [
          {
            question: 'Is this lip oil sticky or heavy like traditional lip gloss?',
            answer: 'Zero stickiness. The cushion-soft formula glides on like silk, providing deep nourishment with a luminous glass-like mirror sheen.'
          },
          {
            question: 'Can I layer this lip oil over lip stains or tints?',
            answer: 'Yes! It acts as the ultimate hydrating topcoat over waterproof stains, keeping your lips plump and juicy all day.'
          },
          {
            question: 'How often should I apply it?',
            answer: 'Apply morning and night, or anytime throughout the day for an instant moisture surge and high-shine polish.'
          }
        ]
      }
    },
    {
      keyword: 'long lasting lip tint transfer proof',
      targetSlug: 'long-lasting-lip-tint-transfer-proof',
      searchVolume: 12800,
      intent: 'transactional',
      targetPageType: 'guide',
      niche: 'Beauty & Lip Care',
      painPoint: 'Lip makeup transferring onto clothing, glasses, teeth, and masks during daily activities.',
      solutionAngle: 'Water-gel suspension formula that binds rich pigment weightlessly without residue.',
      relatedKeywords: ['transfer proof lip tint', 'korean lip tint waterproof', 'mask proof lip stain', 'all day lip tint'],
      aiContent: {
        empathyIntro: 'There is nothing more frustrating than carefully applying your makeup only to leave a messy stain on your coffee cup, collar, or teeth five minutes later. You deserve vibrant lip color that stays exactly where you put it.',
        deepProblemAnalysis: 'Most colored lip products contain heavy oils and silicones that never fully cure. Because they remain in a liquid or semi-solid state on your lips, friction immediately transfers the pigment to any surface it touches.',
        scienceBehindSolution: 'Transfer-proof water tints utilize rapid evaporation technology combined with concentrated micro-dyes. Within 60 seconds of application, the water vehicle evaporates, binding the pigment flush against your lip texture without leaving any sticky residue on top.',
        faq: [
          {
            question: 'Does this lip tint dry out lips like liquid matte lipsticks?',
            answer: 'No. Unlike drying liquid mattes that suck out moisture, this featherlight water-tint preserves your natural lip flexibility.'
          },
          {
            question: 'Is it smudge-proof while eating and drinking?',
            answer: 'Yes, the stain is completely resistant to water, beverages, and daily wear.'
          },
          {
            question: 'Can I build up the color intensity?',
            answer: 'Absolutely. Apply one layer for a natural gradient flush, or two to three coats for rich, bold saturation.'
          }
        ]
      }
    },
    {
      keyword: 'how to keep lip color on all day without smudging',
      targetSlug: 'how-to-keep-lip-color-on-all-day-without-smudging',
      searchVolume: 9600,
      intent: 'informational',
      targetPageType: 'guide',
      niche: 'Beauty & Lip Care',
      painPoint: 'Constant feathering, bleeding around lip borders, and patchy wear after lunch.',
      solutionAngle: 'Prep-exfoliation routine paired with longwear membrane stains and nourishing lip oil sealant.',
      relatedKeywords: ['make lipstick last all day', 'smudge proof lip routine', 'prevent lip bleeding', 'longwear lip tips'],
      aiContent: {
        empathyIntro: 'If your morning lip color looks completely faded and patchy by lunchtime, you are not alone. Getting your lip shade to stay crisp and vibrant through meals and coffee requires the right technique and product formulation.',
        deepProblemAnalysis: 'Dead surface skin cells prevent pigments from adhering evenly to your lips. When dead flakes slough off naturally during the day, they take chunks of your lipstick with them, creating that dreaded uneven ring of color around the lip edges.',
        scienceBehindSolution: 'A two-phase protocol delivers all-day wear: First, a micro-pigment stain anchors color directly into smooth lip skin. Second, an antioxidant lip oil shields the pigment layer from saliva and friction without breaking down the pigment bonds.',
        faq: [
          {
            question: 'What is the best primer for all-day lip color?',
            answer: 'A gentle sugar exfoliation followed by a dry canvas allows modern stains to anchor with maximum 24H staying power.'
          },
          {
            question: 'Why does my lipstick always feather into lines?',
            answer: 'Waxes melt with body heat and spread into micro-creases. Switching to a transfer-proof hydro-stain completely eliminates feathering.'
          },
          {
            question: 'Can I reapply throughout the day without clumping?',
            answer: 'Yes, because the formula does not build up thick cakey layers, you can refresh your shine anytime.'
          }
        ]
      }
    },
    {
      keyword: 'juicy lip oil vs traditional lip gloss comparison',
      targetSlug: 'juicy-lip-oil-vs-traditional-lip-gloss-comparison',
      searchVolume: 7500,
      intent: 'commercial',
      targetPageType: 'guide',
      niche: 'Beauty & Lip Care',
      painPoint: 'Hair getting stuck to sticky lip gloss on windy days and dry lips once gloss wears off.',
      solutionAngle: 'Non-tacky nutrient-rich lipid oil that delivers superior mirror shine with real skincare treatment.',
      relatedKeywords: ['lip oil vs gloss', 'best non sticky gloss', 'juicy lips without sticky', 'plumping lip oil'],
      aiContent: {
        empathyIntro: 'We all remember the horror of windy days where every strand of hair gets glued to your sticky lip gloss. For years, women had to choose between high shine or comfortable, non-sticky lips.',
        deepProblemAnalysis: 'Traditional lip glosses use thick polybutene resins to achieve high shine. While shiny, these heavy polymers form an adhesive film that catches dust and hair, while offering zero real conditioning for the skin underneath.',
        scienceBehindSolution: 'Juicy lip oils replace sticky polymers with lightweight botanical oils such as jojoba, camellia, and vitamin E. The result is the same dazzling refractive index (mirror shine) with a weightless, cushiony comfort that actually heals your lips.',
        faq: [
          {
            question: 'Does a lip oil give the same shine as a lip gloss?',
            answer: 'Yes! Lip oils provide a modern glass-like high-shine finish without any of the tacky stickiness.'
          },
          {
            question: 'Will lip oil make my lips plump naturally?',
            answer: 'Yes. Deep hydration and light-reflecting lipids visibly smooth out lip lines, giving lips a fuller, juicier appearance.'
          },
          {
            question: 'Is it fragranced or flavored?',
            answer: 'Crafted with delicate, refreshing fruit essences that smell divine without irritating sensitive skin.'
          }
        ]
      }
    },
    {
      keyword: 'non sticky lip stain for sensitive lips',
      targetSlug: 'non-sticky-lip-stain-for-sensitive-lips',
      searchVolume: 6200,
      intent: 'problem-solution',
      targetPageType: 'guide',
      niche: 'Beauty & Lip Care',
      painPoint: 'Burning, itching, or tingling caused by harsh chemical dyes and artificial plumping agents.',
      solutionAngle: 'Hypoallergenic botanical formulation tested for sensitive skin and delicate lip barriers.',
      relatedKeywords: ['hypoallergenic lip tint', 'gentle lip stain', 'clean beauty lip color', 'safe lip stain'],
      aiContent: {
        empathyIntro: 'If you have sensitive skin, finding a lip color that does not cause stinging, burning, or allergic flare-ups can feel impossible. Many products pack harsh drying alcohols and artificial irritants just to make the color last.',
        deepProblemAnalysis: 'The skin on your lips is three times thinner than the rest of your face and lacks sebaceous glands. When low-grade cosmetics use aggressive solvent bases or stinging synthetic plumping agents, the delicate lip barrier becomes inflamed and compromised.',
        scienceBehindSolution: 'Hypoallergenic lip stains utilize clean, biocompatible colorants and soothing botanical extracts like aloe and chamomile. They achieve 24-hour stay without synthetic parabens, harsh sulfates, or irritating chemical tingling agents.',
        faq: [
          {
            question: 'Is this safe for eczema or allergy-prone lips?',
            answer: 'Yes, formulated without parabens, synthetic fragrances, or aggressive plumping irritants.'
          },
          {
            question: 'Does it cause peeling or irritation after removal?',
            answer: 'No, nourishing botanical emollients keep your natural lip moisture barrier calm and fortified.'
          },
          {
            question: 'Are the products cruelty-free?',
            answer: '100% cruelty-free, vegan-formulated, and rigorously dermatologically vetted.'
          }
        ]
      }
    }
  ]

  for (const c of clusters) {
    const upserted = await prisma.keywordCluster.upsert({
      where: { targetSlug: c.targetSlug },
      update: {
        keyword: c.keyword,
        searchVolume: c.searchVolume,
        intent: c.intent,
        targetPageType: c.targetPageType,
        niche: c.niche,
        painPoint: c.painPoint,
        solutionAngle: c.solutionAngle,
        relatedKeywords: c.relatedKeywords,
        aiContent: c.aiContent,
        products: {
          connect: productIds
        }
      },
      create: {
        keyword: c.keyword,
        targetSlug: c.targetSlug,
        searchVolume: c.searchVolume,
        competition: 'low',
        intent: c.intent,
        trend: 'rising',
        niche: c.niche,
        painPoint: c.painPoint,
        solutionAngle: c.solutionAngle,
        relatedKeywords: c.relatedKeywords,
        relatedSlugs: [],
        source: 'seo_fleet_seed',
        targetPageType: c.targetPageType,
        aiContent: c.aiContent,
        products: {
          connect: productIds
        }
      }
    })
    console.log(`✅ Seeded: "${upserted.keyword}" (Vol: ${upserted.searchVolume}) -> /guides/${upserted.targetSlug}`)
  }

  const total = await prisma.keywordCluster.count()
  console.log(`--- Total SEO Fleet Clusters in DB: ${total} ---`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
