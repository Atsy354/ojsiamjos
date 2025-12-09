
import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email/email.service';

interface RouteContext {
    params: {
        emailKey: string;
    };
}

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ emailKey: string }> }
) {
    const params = await props.params;
    const { emailKey } = params;
    const searchParams = request.nextUrl.searchParams;
    const contextId = parseInt(searchParams.get('contextId') || '0');
    const locale = searchParams.get('locale') || 'en_US';

    const template = await emailService.getTemplate(emailKey, contextId, locale);

    if (!template) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ template });
}

// Implement PUT, DELETE as needed...
