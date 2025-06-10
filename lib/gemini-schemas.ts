import { SchemaType } from '@google/generative-ai'

// Schema for extracting problems from resources (PDFs, etc.)
export const problemExtractionSchema = {
  type: SchemaType.OBJECT,
  properties: {
    problems: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          number: {
            type: SchemaType.NUMBER,
            description: 'Problem number'
          },
          content: {
            type: SchemaType.STRING,
            description: 'The full problem text'
          },
          solution: {
            type: SchemaType.STRING,
            description: 'The solution if provided',
            nullable: true
          },
          topic: {
            type: SchemaType.STRING,
            description: 'The topic or section this problem belongs to',
            nullable: true
          },
          difficulty: {
            type: SchemaType.STRING,
            description: 'Difficulty level: easy, medium, hard, or competition',
            nullable: true
          },
          skills: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.STRING
            },
            description: 'List of skills or concepts tested',
            nullable: true
          }
        },
        required: ['number', 'content']
      }
    }
  },
  required: ['problems']
}

// Schema for hint generation
export const hintGenerationSchema = {
  type: SchemaType.OBJECT,
  properties: {
    hints: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          hintNumber: {
            type: SchemaType.NUMBER,
            description: 'The order of this hint (1 for most general, increasing for more specific)'
          },
          content: {
            type: SchemaType.STRING,
            description: 'The hint content'
          },
          reasoning: {
            type: SchemaType.STRING,
            description: 'Brief explanation of why this hint is helpful',
            nullable: true
          }
        },
        required: ['hintNumber', 'content']
      }
    }
  },
  required: ['hints']
}

// Schema for similar problem generation
export const similarProblemSchema = {
  type: SchemaType.OBJECT,
  properties: {
    problem: {
      type: SchemaType.OBJECT,
      properties: {
        content: {
          type: SchemaType.STRING,
          description: 'The generated problem text'
        },
        solution: {
          type: SchemaType.STRING,
          description: 'The solution to the generated problem'
        },
        difficulty: {
          type: SchemaType.STRING,
          description: 'Difficulty relative to original: easier, same, or harder'
        },
        skills: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.STRING
          },
          description: 'Skills tested by this problem'
        }
      },
      required: ['content', 'solution', 'difficulty', 'skills']
    }
  },
  required: ['problem']
}