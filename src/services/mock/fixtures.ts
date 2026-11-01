import type {
  DetectedIssue,
  ModifiedFile,
  Project,
  RepairPlan,
  RepairSession,
  TestResult,
} from '@/types/repair'

export const sampleProjects: Project[] = [
  {
    id: 'forma',
    name: 'Forma storefront',
    framework: 'React · TypeScript',
    updatedAt: '2026-11-01T06:30:00Z',
    description: 'Thoughtful objects for everyday living.',
    color: '#b8ad91',
    sourceName: 'forma-storefront.zip',
  },
  {
    id: 'northstar',
    name: 'Northstar docs',
    framework: 'Next.js',
    updatedAt: '2026-10-31T14:10:00Z',
    description: 'A better home for technical knowledge.',
    color: '#91a8c4',
    sourceName: 'northstar-docs.zip',
  },
  {
    id: 'atelier',
    name: 'Atelier portfolio',
    framework: 'Vite · React',
    updatedAt: '2026-10-30T09:15:00Z',
    description: 'Selected work, carefully presented.',
    color: '#b39abb',
    sourceName: 'atelier.zip',
  },
]

export const issues: DetectedIssue[] = [
  {
    id: 'runtime',
    title: 'Product collection fails to render',
    severity: 'high',
    description:
      'The product grid calls .map() before asynchronous product data is available, interrupting the homepage render.',
    file: 'src/components/ProductGrid.tsx',
    line: 7,
    evidence: "TypeError: Cannot read properties of undefined (reading 'map')",
    explanation:
      'On the initial render, the request has not resolved. The optional products value is undefined. A non-null assertion only affects TypeScript; it does not provide a value at runtime.',
  },
  {
    id: 'loading',
    title: 'Missing loading and error boundaries',
    severity: 'medium',
    description:
      'The homepage passes pending data directly to the grid without a loading or request-failure state.',
    file: 'src/pages/Home.tsx',
    line: 6,
    evidence: '<ProductGrid products={products.data} />',
    explanation:
      'Explicit loading and error states make the request lifecycle understandable and keep the page usable when data is not ready.',
  },
]
export const repairPlan: RepairPlan = {
  title: 'Handle the entire data lifecycle',
  steps: [
    'Provide an empty-array fallback inside the product grid.',
    'Render an intentional empty state when no products are returned.',
    'Add loading and request-error states to the homepage.',
    'Compare the result and run the demonstration checks.',
  ],
  scope: 'Two source files. No dependencies, routing, or deployment changes.',
}

export const modifiedFiles: ModifiedFile[] = [
  {
    path: 'src/components/ProductGrid.tsx',
    original: `import type { Product } from '../types'

type Props = { products?: Product[] }

export function ProductGrid({ products }: Props) {
  return (
    <section className="product-grid">
      {products!.map((product) => (
        <article key={product.id}>
          <h2>{product.name}</h2>
          <p>{product.price}</p>
        </article>
      ))}
    </section>
  )
}`,
    modified: `import type { Product } from '../types'

type Props = { products?: Product[] }

export function ProductGrid({ products }: Props) {
  const items = products ?? []

  if (items.length === 0) {
    return <p>No products to show yet.</p>
  }

  return (
    <section className="product-grid">
      {items.map((product) => (
        <article key={product.id}>
          <h2>{product.name}</h2>
          <p>{product.price}</p>
        </article>
      ))}
    </section>
  )
}`,
    summary: 'Guard optional data and provide an empty state.',
    reason:
      'An undefined collection can no longer reach .map(). An empty response has a readable state rather than a blank grid.',
  },
  {
    path: 'src/pages/Home.tsx',
    original: `import { ProductGrid } from '../components/ProductGrid'
import { useProducts } from '../hooks/useProducts'

export function Home() {
  const products = useProducts()
  return <ProductGrid products={products.data} />
}`,
    modified: `import { ProductGrid } from '../components/ProductGrid'
import { useProducts } from '../hooks/useProducts'

export function Home() {
  const products = useProducts()

  if (products.loading) {
    return <p role="status">Loading the collection…</p>
  }

  if (products.error) {
    return <p role="alert">The collection could not be loaded.</p>
  }

  return <ProductGrid products={products.data} />
}`,
    summary: 'Make pending and failed requests visible.',
    reason:
      'The homepage now communicates loading and request failures before rendering the collection. The original product data and routing are preserved.',
  },
]

export const testFixtures: TestResult[] = [
  {
    id: 'build',
    name: 'Production build',
    status: 'passed',
    duration: 1240,
    description: 'Sample TypeScript and bundle check.',
    log: 'DEMO OUTPUT\n$ npm run build\nSample fixture compiled without errors.\nThis output is simulated; no uploaded source was built.',
  },
  {
    id: 'render',
    name: 'Homepage rendering',
    status: 'passed',
    duration: 328,
    description: 'The sample collection renders with product data.',
    log: 'DEMO OUTPUT\nExpected: 3 product cards\nReceived: 3 product cards\nSample rendering scenario: passed.',
  },
  {
    id: 'runtime',
    name: 'Undefined product data',
    status: 'passed',
    duration: 86,
    description: 'An undefined collection resolves to the empty state.',
    log: 'DEMO OUTPUT\nInput: products = undefined\nExpected: No products to show yet.\nNo .map() exception in the simulated scenario.',
  },
  {
    id: 'navigation',
    name: 'Store navigation',
    status: 'passed',
    duration: 215,
    description: 'Sample collection anchors are available.',
    log: 'DEMO OUTPUT\nCollection, About, and Contact anchors present.\nNo real browser test was run against uploaded files.',
  },
  {
    id: 'responsive',
    name: 'Responsive layout',
    status: 'passed',
    duration: 452,
    description: 'Desktop, tablet, and phone fixture layouts.',
    log: 'DEMO OUTPUT\n1440 / 768 / 390 px sample viewports\nNo horizontal overflow in the simulated report.',
  },
  {
    id: 'external',
    required: false,
    name: 'Live checkout integration',
    status: 'skipped',
    duration: 0,
    description: 'An external payment backend is outside this demonstration.',
    log: 'SKIPPED\nNo payment backend is connected. No transaction was attempted.',
  },
]

export const sampleSessions: RepairSession[] = [
  {
    id: 'demo',
    projectId: 'forma',
    title: 'Restore the homepage collection',
    createdAt: '2026-11-01T06:30:00Z',
    sourceName: 'forma-storefront.zip',
    scenario: 'storefront',
    executionMode: 'demo',
    status: 'IMPORTED',
    verification: 'unverified',
    decision: 'undecided',
    application: 'not_applied',
    activityStep: 0,
    tests: [],
    sandbox: 'simulated',
  },
  {
    id: 'px-1041',
    projectId: 'northstar',
    title: 'Sample collection lifecycle repair',
    createdAt: '2026-10-31T14:10:00Z',
    sourceName: 'northstar-docs.zip',
    scenario: 'storefront',
    executionMode: 'demo',
    status: 'READY_FOR_REVIEW',
    verification: 'simulated',
    decision: 'undecided',
    application: 'not_applied',
    activityStep: 6,
    tests: testFixtures,
    sandbox: 'simulated',
  },
  {
    id: 'px-1038',
    projectId: 'atelier',
    title: 'Sample collection lifecycle repair',
    createdAt: '2026-10-30T09:15:00Z',
    sourceName: 'atelier.zip',
    scenario: 'storefront',
    executionMode: 'demo',
    status: 'APPROVED',
    verification: 'simulated',
    decision: 'approved',
    application: 'not_applied',
    activityStep: 6,
    tests: testFixtures,
    sandbox: 'simulated',
  },
]
export const activityLabels = [
  'Source registered',
  'Prepare working copy',
  'Inspect sample source',
  'Diagnose the failure',
  'Plan the repair',
  'Prepare proposed changes',
]
