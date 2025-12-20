# Manual Integration Steps for EditorialDecisionPanel

## Step 1: Import Added ✅
Already added to `app/submissions/[id]/page.tsx`:
```tsx
import { EditorialDecisionPanel } from "@/components/editorial/EditorialDecisionPanel";
```

## Step 2: Add EditorialDecisionPanel to Review Tab

**Location:** `app/submissions/[id]/page.tsx`, inside the Review TabsContent (around line 1312)

**Find this code:**
```tsx
                    })}\r
                  </div>\r
                )}\r
              </TabsContent>
```

**Replace with:**
```tsx
                    })}\r
                    
                    {/* Editorial Decision Panel - Show when reviews are complete */}\r
                    {isEditor && rounds.some((round: any) => {\r
                      const roundReviews = (reviews || []).filter(\r
                        (r: any) => r?.reviewRoundId === round?.id\r
                      );\r
                      const allComplete = roundReviews.length > 0 && roundReviews.every((r: any) => r?.dateCompleted);\r
                      const roundStatus = round?.status;\r
                      // Show if status is RECOMMENDATIONS_READY (11) or all reviews complete\r
                      return allComplete && (roundStatus === 11 || roundStatus === '11');\r
                    }) && (() => {\r
                      // Find the round with completed reviews\r
                      const activeRound = rounds.find((round: any) => {\r
                        const roundReviews = (reviews || []).filter(\r
                          (r: any) => r?.reviewRoundId === round?.id\r
                        );\r
                        const allComplete = roundReviews.length > 0 && roundReviews.every((r: any) => r?.dateCompleted);\r
                        const roundStatus = round?.status;\r
                        return allComplete && (roundStatus === 11 || roundStatus === '11');\r
                      });\r
                      \r
                      if (!activeRound) return null;\r
                      \r
                      const completedReviews = (reviews || []).filter(\r
                        (r: any) => r?.reviewRoundId === activeRound?.id && r?.dateCompleted\r
                      ).map((review: any) => {\r
                        const reviewer = (reviewers || []).find(\r
                          (r: User) => String(r.id) === String(review?.reviewerId)\r
                        );\r
                        return {\r
                          id: review.id,\r
                          reviewer: {\r
                            firstName: reviewer?.firstName || reviewer?.first_name || '',\r
                            lastName: reviewer?.lastName || reviewer?.last_name || '',\r
                            email: reviewer?.email || ''\r
                          },\r
                          recommendation: review.recommendation,\r
                          comments: review.comments || '',\r
                          confidentialComments: review.confidential_comments || review.confidentialComments,\r
                          quality: review.quality,\r
                          dateCompleted: review.dateCompleted || review.date_completed\r
                        };\r
                      });\r
                      \r
                      return (\r
                        <div className="mt-6">\r
                          <EditorialDecisionPanel\r
                            submissionId={Number(params.id)}\r
                            reviewRoundId={activeRound.id}\r
                            reviews={completedReviews}\r
                            onDecisionMade={async () => {\r
                              await refetchSubmission();\r
                              await refetchRounds();\r
                              toast.success("Editorial decision recorded");\r
                            }}\r
                          />\r
                        </div>\r
                      );\r
                    })()}\r
                  </div>\r
                )}\r
              </TabsContent>
```

## Alternative: Simpler Integration

If the above is too complex, use this simpler version:

**Add after line 1312 (after the rounds.map closing):**

```tsx
{/* Editorial Decision Panel */}
{isEditor && (() => {
  // Find round with all reviews complete
  const activeRound = rounds.find((round: any) => {
    const roundReviews = (reviews || []).filter(r => r?.reviewRoundId === round?.id);
    return roundReviews.length > 0 && roundReviews.every(r => r?.dateCompleted);
  });
  
  if (!activeRound) return null;
  
  const completedReviews = (reviews || [])
    .filter(r => r?.reviewRoundId === activeRound?.id && r?.dateCompleted)
    .map(review => {
      const reviewer = (reviewers || []).find(r => String(r.id) === String(review?.reviewerId));
      return {
        id: review.id,
        reviewer: {
          firstName: reviewer?.firstName || '',
          lastName: reviewer?.lastName || '',
          email: reviewer?.email || ''
        },
        recommendation: review.recommendation,
        comments: review.comments || '',
        confidentialComments: review.confidential_comments,
        quality: review.quality,
        dateCompleted: review.dateCompleted
      };
    });
  
  if (completedReviews.length === 0) return null;
  
  return (
    <div className="mt-6">
      <EditorialDecisionPanel
        submissionId={Number(params.id)}
        reviewRoundId={activeRound.id}
        reviews={completedReviews}
        onDecisionMade={async () => {
          await refetchSubmission();
          await refetchRounds();
          toast.success("Editorial decision recorded");
        }}
      />
    </div>
  );
})()}
```

## Testing

1. Login as editor
2. Open submission with completed reviews
3. Go to Review tab
4. You should see:
   - List of reviewers with their recommendations
   - Editorial Decision Panel below
   - Summary of recommendations
   - Decision form

5. Make a decision and verify:
   - Submission status updates
   - Workflow progresses
   - Author receives notification

## Troubleshooting

If panel doesn't appear:
- Check browser console for errors
- Verify all reviews have `dateCompleted`
- Verify user has editor role
- Check review round status in database

If decision fails:
- Check API logs in terminal
- Verify RLS policies are enabled
- Check editorial_decisions table exists
