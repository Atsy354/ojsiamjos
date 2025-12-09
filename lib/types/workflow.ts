export interface Submission {
    id: number;
    title: string;
    subtitle?: string;
    abstract?: string;
    status: string; // 'submission', 'review', 'production', 'published'
    date_submitted: string;
    stage_id: number; // Current workflow stage
    authors: Author[];
}

export interface Author {
    first_name: string;
    last_name: string;
    email: string;
    affiliation?: string;
}

export interface ReviewAssignment {
    id: number;
    submission_id: number;
    reviewer_id: string; // UUID
    reviewer_name?: string; // Appended by join
    stage_id: number;
    round: number;
    status: number; // Derived from dates/flags
    date_assigned: string;
    date_due?: string;
    date_completed?: string;
    recommendation?: number;
}

export interface Reviewer {
    id: string; // UUID
    first_name: string;
    last_name: string;
    email: string;
    affiliation?: string;
    interests?: string[];
}
