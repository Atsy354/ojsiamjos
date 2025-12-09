import { supabase } from './supabaseClient';

export const revalidate = 0; // Disable cache for now to see realtime updates

// --- Types ---
export interface Journal {
    id: number;
    name: string;
    description: string;
    path: string;
}

export interface Issue {
    id: number;
    volume: number;
    number: string;
    year: number;
    title: string | null;
    description: string | null;
    cover_image: string | null;
    date_published: string;
    status: string;
}

export interface Article {
    id: number;
    title: string;
    subtitle: string | null;
    abstract: string | null;
    status: string;
    date_published: string;
    section?: { title: string };
    authors: Author[];
    citations?: string[]; // Mocked for now as we don't have citations table
    keywords?: string[]; // Mocked
    galleys?: any[]; // Mocked
}

export interface Author {
    first_name: string;
    last_name: string | null;
    affiliation: string | null;
    orcid: string | null;
}

// --- Services ---

// 1. Get Journal Info (Assuming single journal for now, id=1)
export async function getJournal(): Promise<Journal | null> {
    const { data, error } = await supabase
        .from('journals')
        .select('*, id:journal_id') // Alias for compatibility
        .eq('journal_id', 1)
        .single();

    if (error) {
        console.error('Error fetching journal:', error);
        return null;
    }
    return data;
}

// 2. Get Latest Published Issue
export async function getCurrentIssue(): Promise<Issue | null> {
    const { data, error } = await supabase
        .from('issues')
        .select('*')
        .eq('status', 'published')
        .order('date_published', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        // It's okay if no issue found
        return null;
    }
    return data;
}

// 3. Get Announcements (Mocked for now as table not created yet, but ready structure)
export async function getAnnouncements() {
    return [
        { id: 1, title: 'Call for Papers 2025', date_posted: '2024-12-01', content: 'We are accepting submissions...' }
    ];
}

// 4. Get Issue by ID with Articles
export async function getIssueById(id: number) {
    const { data: issue, error: issueError } = await supabase
        .from('issues')
        .select('*')
        .eq('id', id)
        .single();

    if (issueError) return null;

    // Get Articles for this issue
    const { data: articles, error: articlesError } = await supabase
        .from('articles')
        .select(`
      *,
      section:sections(title),
      authors(*)
    `)
        .eq('issue_id', id)
        .eq('status', 'published')
        .order('seq', { foreignTable: 'sections', ascending: true }); // Order by section seq if possible

    if (articlesError) console.error(articlesError);

    return { ...issue, articles: articles || [] };
}

// 5. Get Article by ID
export async function getArticleById(id: number) {
    const { data: article, error } = await supabase
        .from('articles')
        .select(`
      *,
      section:sections(title),
      journal:journals(id:journal_id, name),
      issue:issues(id, volume, number, year),
      authors(*)
    `)
        .eq('id', id)
        .single();

    if (error) return null;

    // Transform to match component props if needed
    return {
        ...article,
        // Add mock properties for UI compatibility until DB has them
        keywords: ['OJS', 'Migration', 'Next.js'],
        citations: [],
        galleys: [{ id: 1, label: 'PDF', url: '#' }]
    };
}

// 6. Get Archived Issues
export async function getArchivedIssues() {
    const { data, error } = await supabase
        .from('issues')
        .select('*')
        .eq('status', 'published')
        .order('date_published', { ascending: false });

    if (error) return [];
    return data;
}
