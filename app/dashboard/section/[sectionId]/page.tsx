import SectionClient from './section-client'

export default async function SectionPage({ params }: { params: Promise<{ sectionId: string }> }) {
  const { sectionId } = await params
  return <SectionClient sectionId={sectionId} />
}