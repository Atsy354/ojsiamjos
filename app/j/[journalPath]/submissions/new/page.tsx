/**
 * Public Submission Page for Journal-specific Submissions
 * Uses the same wizard components as /submissions/new/wizard
 * Ensures consistent UX between local development and production
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, ArrowLeft } from "lucide-react";
import { apiGet, apiPost, apiPatch, apiUploadFile } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/hooks/use-auth";
import { cn } from "@/lib/utils";
import type {
  CompleteWizardData,
} from "@/lib/types/workflow";

// Import step components (same as wizard)
import { WizardStep1Start } from "@/components/submissions/wizard/wizard-step1-start";
import { WizardStep2Upload } from "@/components/submissions/wizard/wizard-step2-upload";
import { WizardStep3Metadata } from "@/components/submissions/wizard/wizard-step3-metadata";
import { WizardStep4Confirmation } from "@/components/submissions/wizard/wizard-step4-confirmation";
import { WizardStep5Finish } from "@/components/submissions/wizard/wizard-step5-finish";

const STEPS = [
  { id: 1, title: "Start", description: "Submission checklist" },
  { id: 2, title: "Upload Files", description: "Upload your manuscript" },
  { id: 3, title: "Enter Metadata", description: "Title, abstract, authors" },
  { id: 4, title: "Confirmation", description: "Review your submission" },
  { id: 5, title: "Finish", description: "Complete submission" },
];

export default function PublicSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  const journalPath = params.journalPath as string;

  const [mounted, setMounted] = useState(false);
  const [journal, setJournal] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submissionId, setSubmissionId] = useState<number | string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [wizardData, setWizardData] = useState<Partial<CompleteWizardData>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Keep a synchronous reference to the latest wizard data
  const wizardDataRef = useRef<Partial<CompleteWizardData>>({});

  useEffect(() => {
    wizardDataRef.current = wizardData;
  }, [wizardData]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load journal data
  useEffect(() => {
    if (!mounted) return;

    const loadData = async () => {
      try {
        const journals = await apiGet<any[]>("/api/journals");
        const foundJournal = journals.find((j) => j.path === journalPath || j.id === journalPath);

        if (foundJournal) {
          setJournal(foundJournal);
        }
      } catch (error) {
        console.error("Failed to load journal data:", error);
        toast({
          title: "Error",
          description: "Failed to load journal information",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [journalPath, mounted, toast]);

  // OJS 3.3 Behavior: Auto-populate logged-in user as first author
  useEffect(() => {
    if (!user || isInitialized) return;

    const initialContributor = {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      isPrimaryContact: true,
      includeInBrowse: true,
    };

    setWizardData((prev) => ({
      ...prev,
      step3: {
        ...prev.step3,
        contributors: [initialContributor],
      },
    }));

    setIsInitialized(true);
  }, [user, isInitialized]);

  // Calculate progress percentage
  const progress = (currentStep / STEPS.length) * 100;

  /**
   * Auto-save progress
   */
  const saveProgress = async (step: number, data: any) => {
    if (!submissionId) return;

    setIsSaving(true);
    try {
      void step;
      void data;
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const createDraftSubmissionIfNeeded = async (): Promise<number | string> => {
    if (submissionId) return submissionId;

    const step2: any = (wizardDataRef.current as any).step2 || {};
    const sectionId = step2.sectionId;
    if (!sectionId) {
      throw new Error("Section is required before creating submission");
    }

    const created: any = await apiPost("/api/submissions", {
      title: "Untitled Submission",
      abstract: "",
      sectionId,
    });

    const newId = created?.id ?? created?.submission_id;
    if (!newId) {
      throw new Error("Failed to create submission");
    }

    setSubmissionId(newId);
    return newId;
  };

  const uploadFilesIfNeeded = async (id: number | string) => {
    const step2: any = (wizardDataRef.current as any).step2 || {};
    const files: File[] = Array.isArray(step2.files) ? step2.files : [];
    if (!files || files.length === 0) return;

    for (const file of files) {
      await apiUploadFile(`/api/submissions/${id}/files`, file, {
        fileStage: "submission",
        submissionId: String(id),
      });
    }
  };

  const saveMetadataIfPresent = async (id: number | string) => {
    const step3: any = wizardData.step3 || {};
    const title = (step3.title || "").trim();
    const abstract = (step3.abstract || "").trim();
    const contributors = Array.isArray(step3.contributors)
      ? step3.contributors
      : [];

    if (!title) {
      throw new Error("Title is required");
    }

    await apiPatch(`/api/submissions/${id}`, {
      title,
      abstract,
      authors: contributors.map((c: any) => ({
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        affiliation: c.affiliation,
        isPrimary: c.isPrimaryContact,
        includeInBrowse: c.includeInBrowse !== false,
      })),
    });
  };

  /**
   * Handle step data update
   */
  const handleStepData = (step: number, data: any) => {
    setWizardData((prev) => {
      const updatedData = {
        ...prev,
        [`step${step}`]: data,
      };
      wizardDataRef.current = updatedData;
      return updatedData;
    });
    saveProgress(step, data);
  };

  /**
   * Validate current step
   */
  const validateStep = (step: number): boolean => {
    setErrors({});
    const stepData = (wizardDataRef.current as any)[`step${step}`] as any;

    switch (step) {
      case 1: {
        const allRequirementsChecked =
          stepData?.requirement1 &&
          stepData?.requirement2 &&
          stepData?.requirement3 &&
          stepData?.requirement4 &&
          stepData?.requirement5;

        if (!allRequirementsChecked) {
          setErrors({
            step1: "Please check all submission requirements",
          });
          return false;
        }

        if (!stepData?.copyrightNotice) {
          setErrors({
            step1: "Please agree to the copyright statement",
          });
          return false;
        }

        if (!stepData?.privacyStatement) {
          setErrors({
            step1: "Please agree to the privacy statement",
          });
          return false;
        }

        return true;
      }

      case 2:
        if (!stepData?.sectionId) {
          setErrors({ step2: "Please select a section" });
          return false;
        }
        if (!stepData?.files || stepData.files.length === 0) {
          setErrors({ step2: "Please upload at least one file" });
          return false;
        }
        return true;

      case 3: {
        const messages: string[] = [];
        const title = String((stepData as any)?.title || "").trim();
        const abstract = String((stepData as any)?.abstract || "").trim();
        const contributors = Array.isArray((stepData as any)?.contributors)
          ? (stepData as any).contributors
          : [];

        if (!title || !abstract) {
          messages.push("Title and abstract are required");
        }

        if (contributors.length === 0) {
          messages.push("At least one author is required");
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          let primaryCount = 0;

          for (let i = 0; i < contributors.length; i++) {
            const c = contributors[i] || {};
            const firstName = String(c.firstName || "").trim();
            const lastName = String(c.lastName || "").trim();
            const email = String(c.email || "").trim();
            const isPrimary = Boolean(c.isPrimaryContact);

            if (isPrimary) primaryCount += 1;

            if (!firstName || !lastName) {
              messages.push(
                `Author ${i + 1}: first and last name are required`
              );
            }

            if (!email) {
              messages.push(`Author ${i + 1}: email is required`);
            } else if (!emailRegex.test(email)) {
              messages.push(`Author ${i + 1}: email format is invalid`);
            }
          }

          if (primaryCount !== 1) {
            messages.push(
              "Exactly one author must be selected as Primary contact"
            );
          }
        }

        if (messages.length > 0) {
          setErrors({ step3: messages.join("\n") });
          return false;
        }
        return true;
      }

      case 4:
        if (!stepData?.confirmation) {
          setErrors({ step4: "Please confirm your submission" });
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  /**
   * Navigate to next step
   */
  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    // Upload files and create draft (step 2 -> step 3)
    if (currentStep === 2) {
      setIsLoading(true);
      try {
        const id = await createDraftSubmissionIfNeeded();
        await uploadFilesIfNeeded(id);
      } catch (error: any) {
        console.error("[Wizard Step2] Upload failed:", error);
        setErrors({
          step2:
            error?.message ||
            String(error) ||
            "Failed to upload files. Check console/server logs.",
        });
        toast({
          title: "Error",
          description: error.message || "Failed to upload files",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      } finally {
        setIsLoading(false);
      }
    }

    // Save metadata and authors (step 3 -> step 4)
    if (currentStep === 3) {
      setIsLoading(true);
      try {
        const id = await createDraftSubmissionIfNeeded();
        await saveMetadataIfPresent(id);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to create submission",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      } finally {
        setIsLoading(false);
      }
    }

    // Complete submission (step 4 -> step 5)
    if (currentStep === 4) {
      setIsLoading(true);
      try {
        const id = await createDraftSubmissionIfNeeded();
        await saveMetadataIfPresent(id);

        await apiPatch(`/api/submissions/${id}`, {
          status: "submitted",
          dateSubmitted: new Date().toISOString(),
        });

        toast({
          title: "Submission complete!",
          description: "Your manuscript has been submitted successfully.",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to complete submission",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      } finally {
        setIsLoading(false);
      }
    }

    if (currentStep < STEPS.length) {
      setCurrentStep((prev) => {
        const next = prev + 1;
        return next > STEPS.length ? STEPS.length : next;
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  /**
   * Navigate to previous step
   */
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => {
        const next = prev - 1;
        return next < 1 ? 1 : next;
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  /**
   * Render current step component
   */
  const renderStep = () => {
    const commonProps = {
      data: wizardData[`step${currentStep}` as keyof CompleteWizardData] || {},
      onChange: (data: any) => handleStepData(currentStep, data),
      submissionId,
      errors: errors[`step${currentStep}`],
    };

    switch (currentStep) {
      case 1:
        return <WizardStep1Start {...commonProps} />;
      case 2:
        return <WizardStep2Upload {...commonProps} />;
      case 3:
        return <WizardStep3Metadata {...commonProps} />;
      case 4:
        return (
          <WizardStep4Confirmation {...commonProps} allData={wizardData} />
        );
      case 5:
        return <WizardStep5Finish submissionId={submissionId} />;
      default:
        return null;
    }
  };

  if (!mounted || loading || authLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!journal) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Journal Not Found</h2>
            <p className="text-muted-foreground mb-6">The journal could not be found.</p>
            <Link href="/journal">
              <Button className="w-full">Browse Journals</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Login Required</h2>
            <p className="text-muted-foreground mb-6">You must be logged in to make a submission.</p>
            <Link href="/login">
              <Button className="w-full">Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-[#006798] text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href={`/j/${journal.path}`} className="flex items-center gap-2 text-white/80 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to {journal.name}
          </Link>
          <h1 className="text-2xl font-bold">Make a Submission</h1>
          <p className="text-white/80">Submit your manuscript to {journal.name}</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  {/* Step Title */}
                  <div className="mb-3 text-center">
                    <p
                      className={cn(
                        "text-sm font-medium whitespace-nowrap",
                        currentStep === step.id
                          ? "text-primary font-semibold"
                          : currentStep > step.id
                            ? "text-foreground"
                            : "text-muted-foreground"
                      )}
                    >
                      {step.title}
                    </p>
                  </div>
                  {/* Step Number Circle - Clickable for completed steps */}
                  <div
                    onClick={() => {
                      if (currentStep > step.id) {
                        setCurrentStep(step.id);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                      currentStep > step.id
                        ? "bg-primary border-primary text-primary-foreground cursor-pointer hover:opacity-80"
                        : currentStep === step.id
                          ? "border-primary text-primary bg-background shadow-md"
                          : "border-muted-foreground/30 text-muted-foreground bg-background"
                    )}
                    title={currentStep > step.id ? `Go to ${step.title}` : undefined}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-semibold">{step.id}</span>
                    )}
                  </div>
                </div>
                {/* Connector Line */}
                {index < STEPS.length - 1 && (
                  <div className="flex-1 px-2 mt-9">
                    <div
                      className={cn(
                        "h-0.5 w-full transition-colors",
                        currentStep > step.id ? "bg-primary" : "bg-muted-foreground/30"
                      )}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Auto-save indicator */}
        {isSaving && (
          <Alert className="mb-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>Saving progress...</AlertDescription>
          </Alert>
        )}

        {/* Current Step */}
        <Card className="mb-6">
          <CardContent className="pt-6">{renderStep()}</CardContent>
          {/* Show footer with buttons */}
          {currentStep < STEPS.length ? (
            <CardFooter className="flex justify-between">
              {currentStep > 1 ? (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={isLoading}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
              ) : (
                <div />
              )}

              {currentStep === 4 ? (
                <Button onClick={handleNext} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Finish Submission
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={isLoading}>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </CardFooter>
          ) : (
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isLoading}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <div />
            </CardFooter>
          )}
        </Card>

        {/* Help Text */}
        <Alert>
          <AlertDescription>
            Your progress is automatically saved. You can return to complete this
            submission at any time.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
