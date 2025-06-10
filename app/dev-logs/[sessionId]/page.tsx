import DevLogViewer from './dev-log-viewer'

export default async function DevLogPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  return <DevLogViewer sessionId={sessionId} />
}