# Abhyasa Database Requirements Document

## Overview
Based on comprehensive analysis of the codebase and CLAUDE.md vision, this document outlines all database requirements for the Abhyasa learning platform.

## Core Functionality Requirements

### 1. User Management
- **Authentication**: Integrate with Supabase Auth
- **Profile Storage**: Basic user info (email, display name)
- **User Isolation**: All data must be user-specific with RLS

### 2. Goal-Oriented Learning Structure
- **Goals**: Primary organizing entity for learning objectives
  - Support for multiple active goals per user
  - Time-bound with start/target dates
  - Status tracking (active, completed, paused, archived)
  - Daily commitment tracking for planning
  
- **Phases**: Time-bound stages within goals
  - Ordered sequence within each goal
  - Date ranges for each phase
  - Progress tracking per phase
  
- **Resources**: Reusable learning materials
  - Multiple types: textbooks, videos, practice exams, websites, etc.
  - Metadata storage for type-specific attributes
  - Can be shared across multiple goals
  - URL and author tracking
  
- **Activities**: Specific learning tasks
  - Belong to phases
  - Link to resources
  - Time estimates
  - Prerequisites support
  - Multiple activity types (read, practice, review, etc.)

### 3. Progress Tracking

#### Problem-Based Progress
- **Problem Storage**: Individual problems from resources
  - Support for generated variations
  - Skill tagging
  - Solutions storage
  
- **Problem Progress**: User interaction with problems
  - Completion status
  - Time tracking
  - Review flagging
  - Hint usage counting

#### Reading Progress
- **Page-Level Tracking**: For textbooks and reading materials
  - Current page and total pages
  - Reading time accumulation
  - Bookmark functionality with notes
  - Completion status

#### Exam Progress
- **Practice Exam Metadata**: Exam specifications
  - Question count, time limits, passing scores
  - Topic coverage
  - Difficulty levels
  
- **Exam Attempts**: Individual test sessions
  - Score tracking
  - Time taken
  - Answer storage
  - Topic-wise performance breakdown

#### Activity Progress
- **General Activity Tracking**: For all activity types
  - Status (not started, in progress, completed, skipped)
  - Percentage completion
  - Time spent
  - Notes capability

### 4. AI Integration Support
- **Hint Generation**: Store generated hints per problem per user
- **Similar Problem Generation**: Link generated problems to originals
- **Study Plan Import**: Bulk creation of goals, phases, resources, activities

### 5. Analytics and Insights
- **Study Sessions**: Time tracking across resources and activities
- **Performance Metrics**: Aggregatable data for progress visualization
- **Resource Effectiveness**: Track which resources help most

### 6. Legacy Support
- **Curriculum Structure**: Support existing curriculum → chapter → section hierarchy
- **Migration Path**: Allow gradual transition to goal-based structure

## Data Relationships

### Primary Relationships
1. User → Goals → Phases → Activities
2. User → Resources (owned/created)
3. Goals ↔ Resources (many-to-many)
4. Activities → Resources (many-to-one)
5. Resources → Problems → Problem Progress
6. Resources → Practice Exams → Exam Attempts

### Cross-Cutting Concerns
- All user data must be isolated via RLS
- Timestamps needed for all main entities
- Soft delete capability for goals (archive)
- Ordering support for phases and activities

## Performance Requirements
- Efficient querying of user's active goals
- Fast problem lookup and progress updates
- Aggregatable progress data
- Minimal joins for common operations

## Extensibility Requirements
- JSONB metadata fields for type-specific data
- Flexible activity types
- Expandable resource types
- Room for future features (collaboration, sharing)

## Migration Considerations
- Preserve existing curriculum-based data
- Allow resources to be linked to both curricula and goals
- Maintain problem associations with sections or resources
- No data loss during transition