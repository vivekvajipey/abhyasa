import { SchemaType } from '@google/generative-ai'

export const curriculumExtractionSchema = {
  type: SchemaType.OBJECT,
  properties: {
    curriculum: {
      type: SchemaType.OBJECT,
      properties: {
        name: {
          type: SchemaType.STRING,
          description: 'The name of the curriculum or textbook'
        },
        subject: {
          type: SchemaType.STRING,
          description: 'The subject area (e.g., Mathematics, Physics)'
        },
        chapters: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: {
                type: SchemaType.STRING,
                description: 'Chapter name or title'
              },
              order: {
                type: SchemaType.NUMBER,
                description: 'Chapter order/number'
              },
              sections: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    name: {
                      type: SchemaType.STRING,
                      description: 'Section name or title'
                    },
                    order: {
                      type: SchemaType.NUMBER,
                      description: 'Section order within chapter'
                    },
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
                  required: ['name', 'order', 'problems']
                }
              }
            },
            required: ['name', 'order', 'sections']
          }
        }
      },
      required: ['name', 'subject', 'chapters']
    }
  },
  required: ['curriculum']
}