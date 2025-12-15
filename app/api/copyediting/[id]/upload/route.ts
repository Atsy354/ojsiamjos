import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/middleware/auth"
import { logger } from "@/lib/utils/logger"

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const startTime = Date.now()

    try {
        // Check authorization
        const { authorized, user, error: authError } = await requireAuth(request)
        if (!authorized) {
            logger.apiError('/api/copyediting/[id]/upload', 'POST', authError)
            return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
        }

        logger.apiRequest('/api/copyediting/[id]/upload', 'POST', user?.id)

        const submissionId = params.id
        const body = await request.json()
        const { fileId, versionType } = body

        // Validate required fields
        if (!fileId || !versionType) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Get current max version number
        const { data: versions } = await supabase
            .from("file_versions")
            .select("version_number")
            .eq("submission_id", submissionId)
            .order("version_number", { ascending: false })
            .limit(1)

        const nextVersion = versions && versions.length > 0 ? versions[0].version_number + 1 : 1

        // Create file version
        const { data: version, error: dbError } = await supabase
            .from("file_versions")
            .insert({
                submission_id: submissionId,
                file_id: fileId,
                version_number: nextVersion,
                version_type: versionType,
                uploaded_by: user?.id,
                uploaded_at: new Date().toISOString(),
            })
            .select()
            .single()

        if (dbError) {
            logger.apiError('/api/copyediting/[id]/upload', 'POST', dbError, user?.id)
            return NextResponse.json({ error: dbError.message }, { status: 500 })
        }

        // Update copyediting assignment status if copyedited version
        if (versionType === 'copyedited') {
            await supabase
                .from("copyediting_assignments")
                .update({ status: 1 }) // In Progress
                .eq("submission_id", submissionId)
        }

        const duration = Date.now() - startTime
        logger.apiResponse('/api/copyediting/[id]/upload', 'POST', 201, duration, user?.id)
        logger.info('File version uploaded', {
            versionId: version.id,
            submissionId,
            versionType
        }, { userId: user?.id, route: '/api/copyediting/[id]/upload' })

        return NextResponse.json(version, { status: 201 })
    } catch (error) {
        logger.apiError('/api/copyediting/[id]/upload', 'POST', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
