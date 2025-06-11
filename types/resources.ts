// Resource aggregation types for views and functions

export interface PhaseResourceView {
  phase_id: string;
  goal_id: string;
  resource_id: string;
  type: string;
  title: string;
  author?: string;
  url?: string;
  description?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  association_type: 'activity';
  activity_id: string;
  activity_title: string;
}

export interface GoalResourceView {
  goal_id: string;
  resource_id: string;
  type: string;
  title: string;
  author?: string;
  url?: string;
  description?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  association_type: 'direct' | 'activity';
  phase_id?: string;
  phase_name?: string;
  activity_id?: string;
  activity_title?: string;
}

export interface AggregatedResource {
  resource_id: string;
  type: string;
  title: string;
  author?: string;
  url?: string;
  description?: string;
  metadata?: any;
  association_types?: string[];
  activity_count?: number;
}