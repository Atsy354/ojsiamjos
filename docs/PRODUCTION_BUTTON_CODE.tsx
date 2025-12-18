// Add this code after line 1642 in app/submissions/[id]/page.tsx
// After the Metadata Card closing tags

{/* Production Workflow Button - Only show for editors in production stage */ }
{
    isEditor && isProduction && (
        <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-4">
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-purple-600 animate-pulse" />
                        <h3 className="font-semibold text-purple-900">Production Stage</h3>
                    </div>
                    <p className="text-sm text-purple-700">
                        This submission is ready for final production and publication.
                    </p>
                    <Button
                        className="w-full bg-purple-600 hover:bg-purple-700 h-11"
                        onClick={() => router.push(`/production/${submissionId}`)}
                    >
                        <FileText className="mr-2 h-4 w-4" />
                        Go to Production Workflow
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
