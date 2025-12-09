import { createRouteHandlerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { NotificationManager } from '@/lib/notifications/notification-manager';
import { getContextId } from '@/lib/utils/context';

export const dynamic = 'force-dynamic';

// GET: Fetch unread notifications
export async function GET(request: Request) {
    const supabase = await createRouteHandlerClient();
    const { data: session } = await supabase.auth.getSession();

    if (!session.session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contextId = await getContextId();
    const manager = new NotificationManager(supabase);

    const notifications = await manager.getUnreadNotifications(session.session.user.id, contextId);

    return NextResponse.json(notifications);
}

// PUT: Mark as read
export async function PUT(request: Request) {
    const supabase = await createRouteHandlerClient();
    const { notification_id } = await request.json();

    if (!notification_id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const manager = new NotificationManager(supabase);
    await manager.markAsRead(notification_id);

    return NextResponse.json({ success: true });
}
