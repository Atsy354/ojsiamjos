import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // Mock Search - Returns the created reviewer
    // In production, this would query auth.users or public.user_profiles
    const mockReviewers = [
        {
            id: "a315e109-c16e-4f11-8f5b-113e618e47f5", // Check this ID from create_reviewer.js output
            first_name: "Budi",
            last_name: "Reviewer",
            email: "reviewer@jurnal.com",
            affiliation: "Universitas Indonesia",
            interests: ["Machine Learning", "AI"]
        }
    ];

    return NextResponse.json(mockReviewers);
}
