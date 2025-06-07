export default function TestPage() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-4xl font-bold">Test Page</h1>
      
      <div className="space-y-2">
        <p className="text-red-500">This should be red</p>
        <p className="text-blue-500">This should be blue</p>
        <p className="text-green-500">This should be green</p>
      </div>
      
      <div className="space-y-2">
        <button className="btn-primary">Primary Button</button>
        <button className="btn-secondary">Secondary Button</button>
      </div>
      
      <div className="gradient-text text-2xl font-bold">
        Gradient Text Test
      </div>
      
      <div className="space-y-2">
        <div className="w-32 h-32 rounded" style={{ backgroundColor: 'var(--color-sage)' }}>Sage</div>
        <div className="w-32 h-32 rounded" style={{ backgroundColor: 'var(--color-sky)' }}>Sky</div>
        <div className="w-32 h-32 rounded" style={{ backgroundColor: 'var(--color-coral)' }}>Coral</div>
      </div>
    </div>
  )
}