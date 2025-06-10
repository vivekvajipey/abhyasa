import DevLogViewer from './dev-log-viewer'

export default function DevLogPage({ params }: { params: { sessionId: string } }) {
  return <DevLogViewer sessionId={params.sessionId} />
}