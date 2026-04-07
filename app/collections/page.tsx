import { redirect } from 'next/navigation'

// We changed our architectural metaphor. We don't have "collections" based on products anymore.
// We have "problems" based on pain. Auto-redirect anyone expecting traditional collections to the problems index.
export default function CollectionsPage() {
  redirect('/problems')
}
