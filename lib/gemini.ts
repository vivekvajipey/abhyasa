import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function generateHint(problemContent: string, hintNumber: number): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' })
    
    const prompt = `You are a helpful math tutor. A student is working on this problem:

"${problemContent}"

They have been working on it for at least 5 minutes and need hint #${hintNumber}. 

Provide a helpful hint that guides them toward the solution without giving away the answer. The hint should:
1. Be appropriate for hint number ${hintNumber} (earlier hints are more general, later hints more specific)
2. Help them understand the concept or approach needed
3. Not directly reveal the answer
4. Be encouraging and supportive

Keep the hint concise (2-3 sentences max).`

    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Error generating hint:', error)
    return 'Unable to generate hint at this time. Try breaking down the problem step by step.'
  }
}

export async function generateSimilarProblem(
  originalProblem: string,
  solution?: string
): Promise<{ content: string; solution: string }> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' })
    
    const prompt = `You are a math problem generator. Create a similar problem to this one:

Original problem: "${originalProblem}"
${solution ? `Original solution: "${solution}"` : ''}

Generate a new problem that:
1. Tests the same mathematical concepts and skills
2. Has similar difficulty level
3. Uses different numbers or context
4. Is clearly written and unambiguous

Provide your response in this exact format:
PROBLEM: [new problem text]
SOLUTION: [step-by-step solution]`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Parse the response
    const problemMatch = text.match(/PROBLEM:\s*([\s\S]+?)(?=SOLUTION:|$)/)
    const solutionMatch = text.match(/SOLUTION:\s*([\s\S]+)/)
    
    return {
      content: problemMatch ? problemMatch[1].trim() : 'Unable to generate problem',
      solution: solutionMatch ? solutionMatch[1].trim() : 'Solution not available'
    }
  } catch (error) {
    console.error('Error generating similar problem:', error)
    return {
      content: 'Unable to generate similar problem at this time.',
      solution: 'Solution not available'
    }
  }
}