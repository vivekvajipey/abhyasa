import Link from 'next/link'

// Mock data for sections
const mockSections: Record<string, Array<{ id: string; name: string; problemCount: number }>> = {
  '1': [
    { id: '1', name: 'Section 1.1: Order of Operations', problemCount: 15 },
    { id: '2', name: 'Section 1.2: Distributive Property', problemCount: 12 },
    { id: '3', name: 'Section 1.3: Fractions', problemCount: 18 },
    { id: '4', name: 'Section 1.4: Equations', problemCount: 20 },
    { id: '5', name: 'Section 1.5: Word Problems', problemCount: 10 },
  ],
  '2': [
    { id: '6', name: 'Section 2.1: Introduction to Exponents', problemCount: 12 },
    { id: '7', name: 'Section 2.2: Exponent Rules', problemCount: 15 },
    { id: '8', name: 'Section 2.3: Negative Exponents', problemCount: 14 },
    { id: '9', name: 'Section 2.4: Scientific Notation', problemCount: 16 },
  ],
  '3': [
    { id: '10', name: 'Section 3.1: Divisibility', problemCount: 13 },
    { id: '11', name: 'Section 3.2: Prime Numbers', problemCount: 11 },
    { id: '12', name: 'Section 3.3: Prime Factorization', problemCount: 15 },
    { id: '13', name: 'Section 3.4: Greatest Common Factor', problemCount: 14 },
    { id: '14', name: 'Section 3.5: Least Common Multiple', problemCount: 12 },
    { id: '15', name: 'Section 3.6: Number Theory Problems', problemCount: 20 },
  ],
}

const chapterNames: Record<string, string> = {
  '1': 'Chapter 1: Properties of Arithmetic',
  '2': 'Chapter 2: Exponents',
  '3': 'Chapter 3: Number Theory',
}

export default async function ChapterPage({ params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await params
  const sections = mockSections[chapterId] || []
  const chapterName = chapterNames[chapterId] || 'Unknown Chapter'

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard"
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Back
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">{chapterName}</h2>
      </div>

      <div className="grid gap-4">
        {sections.map((section) => (
          <Link
            key={section.id}
            href={`/dashboard/section/${section.id}`}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium text-gray-900">{section.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{section.problemCount} problems</p>
              </div>
              <div className="text-2xl text-gray-300">→</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}