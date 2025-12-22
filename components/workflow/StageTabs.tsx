import { cn } from "@/lib/utils"
import { CheckCircle } from "lucide-react"

interface WorkflowStage {
    id: number
    path: string
    label: string
    translationKey?: string
}

interface StageTabsProps {
    stages: WorkflowStage[]
    currentStage: number
    onStageClick?: (stageId: number) => void
}

export function StageTabs({ stages, currentStage, onStageClick }: StageTabsProps) {
    return (
        <div className="stageTabs mb-6">
            <ul className="stageTabs__list flex border-b-2 border-border">
                {stages.map((stage) => {
                    const isInitiated = stage.id <= currentStage
                    const isCurrent = stage.id === currentStage

                    return (
                        <li
                            key={stage.id}
                            className={cn(
                                "stageTabs__item flex-1 relative",
                                `pkp_workflow_${stage.path}`,
                                `stageId${stage.id}`,
                                isInitiated && "initiated",
                                isCurrent && "current"
                            )}
                        >
                            <button
                                onClick={() => onStageClick?.(stage.id)}
                                className={cn(
                                    "w-full py-3 px-4 text-sm font-medium transition-colors",
                                    "hover:bg-muted/50",
                                    isInitiated && "bg-muted/30",
                                    isCurrent && "bg-primary/10 text-primary"
                                )}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <span>{stage.label}</span>
                                    {isInitiated && stage.id < currentStage && (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                    )}
                                </div>
                            </button>
                            {isInitiated && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                            )}
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
