# Abhyasa Learning Progress Tracker - Project Requirements Document

## Project Overview

This web application helps students systematically work through structured educational materials. We can start with the Art of Problem Solving Pre-Algebra textbook. The core purpose is to provide a clean, distraction-free environment for tracking progress while adding intelligent features that support self-directed learning. Unlike simple checkbox apps, this system understands the learning process and provides timely support through hint generation and practice problem creation.

The app addresses a key challenge in self-study: students often get stuck on problems without knowing whether they should persist, seek hints, or review earlier material. By combining progress tracking with intelligent problem generation and time-aware hint systems, learners can maintain momentum while building genuine understanding.

The application embraces minimalism in its visual design while being sophisticated in its learning support. Every feature should earn its place by directly supporting the learning process. The interface draws inspiration from Notion's clean aesthetic.

## Technical Architecture

The application will be built using Next.js and deployed on Vercel, making sure that the UI can be used on either desktop or mobile cleanly. Authentication happens through Google OAuth. All user data is stored in Supabase, ensuring reliable data persistence and real-time updates across devices. The AI components for hint and problem generation will integrate with LLM APIs (specifically Google's new Gemini 2.5 Pro model).

## Core Features

### Progress Tracking System

The main screen presents a clear visualization of the student's journey through the curriculum. Each chapter and section is displayed with its completion status, allowing students to see both their overall progress and identify areas needing attention. The design prioritizes clarity – a student should understand their status at a glance without interpreting complex metrics or statistics.

Within each section, problems are listed with simple checkboxes for completion tracking. However, these aren't just binary complete/incomplete markers. The system tracks additional context like time spent, whether hints were used, and if the problem was flagged to revisit/review. This metadata remains hidden during normal use but becomes valuable for generating insights and recommendations.

### Intelligent Timer System

Students can optionally start a timer when beginning a problem. This serves multiple purposes beyond simple time tracking. First, it enables the hint system – hints only become available after a reasonable attempt time, preventing students from immediately seeking help without genuine effort. Second, it provides data about which problems or concepts consistently take longer, indicating areas where additional practice or prerequisite review might help.

The timer runs in the background, allowing students to reference other sections or take breaks without losing their time data. If a problem takes exceptionally long, the system can suggest flagging it for review or generating similar but simpler problems to build up to the challenging one.

### Contextual Hint Generation

After a student has spent sufficient time on a problem (configurable, but defaulting to 5 minutes), the option to receive hints becomes available. These hints are generated based on the problem content and the typical solution approach. Rather than showing the full solution, hints guide students toward discovering the answer themselves. This maintains the learning value while preventing complete frustration.

### Similar Problem Generation

One of the most powerful features is the ability to generate similar problems on demand. When a student completes a problem and wants more practice, or when they struggled with a problem and want to try similar ones, they can request generated alternatives. These maintain the same conceptual requirements while varying the specific numbers and context.

The generation system is particularly sophisticated when it has access to the original problem's solution. It can ensure that generated problems test the same skills and concepts, avoiding the common issue where "similar" problems are actually testing something entirely different. Generated problems are added to the section's problem list, becoming part of the student's permanent practice set.

This similar problem is generated through an API call to the Gemini 2.5 Pro language model.

## User Experience Flow

When students first sign in, they're presented with a welcoming, uncluttered interface. After authentication, they see their curriculum overview – for testing, this will be the pre-loaded Art of Problem Solving Pre-Algebra structure. Clicking into any section reveals the list of problems for that unit.

The problem-solving experience is designed to mirror natural study habits. Students can work through problems in order or jump around as needed. Starting a timer is optional but encouraged. As they work, they can mark problems complete, flag them for review, or generate similar problems for additional practice. The interface stays out of the way during problem-solving, with features appearing contextually when needed.

## Content Management Approach

For initial testing and development, problems and their solutions will be stored in JSON format. This allows rapid iteration and easy modification without database changes. The structure includes not just problem text but also metadata about skills tested and typical solution approaches, enabling intelligent hint and problem generation.

In the future production version, users will be able to work with their own materials through PDF upload or image capture. However, the initial focus is on proving the concept with pre-structured content before adding the complexity of content extraction and recognition.