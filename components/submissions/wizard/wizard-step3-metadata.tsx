"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, AlertCircle } from "lucide-react";

export function WizardStep3Metadata({ data, onChange, errors }: any) {
  const normalize = (input: any) => ({
    title: input?.title ?? "",
    subtitle: input?.subtitle ?? "",
    abstract: input?.abstract ?? "",
    keywords: Array.isArray(input?.keywords) ? input.keywords : [],
    contributors: Array.isArray(input?.contributors) ? input.contributors : [],
  });

  const [localData, setLocalData] = useState(() => normalize(data));

  useEffect(() => {
    setLocalData(normalize(data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const update = (field: string, value: any) => {
    const updated = { ...localData, [field]: value };
    setLocalData(updated);
    onChange(updated);
  };

  const addContributor = () => {
    const contributors = [
      ...(localData.contributors || []),
      {
        firstName: "",
        lastName: "",
        email: "",
        country: "",
        affiliation: "",
        isPrimaryContact: false, // Never primary for added contributors
        includeInBrowse: true, // Auto-checked by default
      },
    ];
    update("contributors", contributors);
  };

  const removeContributor = (idx: number) => {
    const next = localData.contributors.filter(
      (_: any, i: number) => i !== idx
    );
    // First author always remains primary
    if (next.length > 0) {
      next[0] = { ...next[0], isPrimaryContact: true };
    }
    update("contributors", next);
  };

  const updateContributor = (idx: number, field: string, value: any) => {
    const contributors = [...localData.contributors];
    contributors[idx] = { ...contributors[idx], [field]: value };
    update("contributors", contributors);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={localData.title ?? ""}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Article title"
            />
          </div>

          <div>
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              value={localData.subtitle ?? ""}
              onChange={(e) => update("subtitle", e.target.value)}
            />
          </div>

          {/* Abstract with Rich Text Editor Toolbar */}
          <div>
            <Label htmlFor="abstract">Abstract *</Label>
            <div className="border rounded-md">
              {/* Toolbar */}
              <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
                <button
                  type="button"
                  className="p-1.5 hover:bg-muted rounded"
                  title="Paste from Word"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="p-1.5 hover:bg-muted rounded"
                  title="Paste from Plain Text"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                <div className="w-px h-6 bg-border mx-1" />
                <button
                  type="button"
                  className="p-1.5 hover:bg-muted rounded font-bold"
                  title="Bold"
                >
                  B
                </button>
                <button
                  type="button"
                  className="p-1.5 hover:bg-muted rounded italic"
                  title="Italic"
                >
                  I
                </button>
                <button
                  type="button"
                  className="p-1.5 hover:bg-muted rounded underline"
                  title="Underline"
                >
                  U
                </button>
                <div className="w-px h-6 bg-border mx-1" />
                <button
                  type="button"
                  className="p-1.5 hover:bg-muted rounded"
                  title="Bulleted List"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="p-1.5 hover:bg-muted rounded"
                  title="Numbered List"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="p-1.5 hover:bg-muted rounded"
                  title="Superscript"
                >
                  <span className="text-xs">x²</span>
                </button>
                <button
                  type="button"
                  className="p-1.5 hover:bg-muted rounded"
                  title="Subscript"
                >
                  <span className="text-xs">x₂</span>
                </button>
                <div className="w-px h-6 bg-border mx-1" />
                <button
                  type="button"
                  className="p-1.5 hover:bg-muted rounded"
                  title="Insert Link"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="p-1.5 hover:bg-muted rounded"
                  title="Remove Link"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <div className="w-px h-6 bg-border mx-1" />
                <button
                  type="button"
                  className="p-1.5 hover:bg-muted rounded"
                  title="Insert Special Character"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="p-1.5 hover:bg-muted rounded"
                  title="Code Block"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="p-1.5 hover:bg-muted rounded"
                  title="Fullscreen"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="p-1.5 hover:bg-muted rounded"
                  title="Insert Image"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="p-1.5 hover:bg-muted rounded"
                  title="Download"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
              {/* Textarea */}
              <Textarea
                id="abstract"
                value={localData.abstract ?? ""}
                onChange={(e) => update("abstract", e.target.value)}
                rows={6}
                className="resize-none border-0 rounded-t-none focus-visible:ring-0"
                placeholder=""
              />
            </div>
          </div>

          <div>
            <Label htmlFor="keywords">Keywords</Label>
            <div className="space-y-2">
              <Input
                id="keywords"
                placeholder="Type keyword and press Enter"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const input = e.currentTarget;
                    const value = input.value.trim();
                    if (value && !(localData.keywords || []).includes(value)) {
                      update("keywords", [...(localData.keywords || []), value]);
                      input.value = "";
                    }
                  }
                }}
              />
              {(localData.keywords || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {(localData.keywords || []).map((keyword: string, idx: number) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
                    >
                      <span>{keyword}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newKeywords = (localData.keywords || []).filter(
                            (_: string, i: number) => i !== idx
                          );
                          update("keywords", newKeywords);
                        }}
                        className="hover:bg-primary/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Press Enter to add each keyword
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">List of Contributors</h3>
            <Button onClick={addContributor} size="sm" variant="outline">
              Add Contributor
            </Button>
          </div>

          {(localData.contributors || []).map((c: any, i: number) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">
                  {i === 0 ? "Submitting Author" : `Contributor ${i + 1}`}
                </span>
                {i > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeContributor(i)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>First Name *</Label>
                  <Input
                    value={c.firstName}
                    onChange={(e) =>
                      updateContributor(i, "firstName", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input
                    value={c.lastName}
                    onChange={(e) =>
                      updateContributor(i, "lastName", e.target.value)
                    }
                  />
                </div>
                <div className="col-span-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={c.email}
                    onChange={(e) =>
                      updateContributor(i, "email", e.target.value)
                    }
                  />
                </div>
                <div className="col-span-2">
                  <Label>Country *</Label>
                  <Input
                    value={c.country || ""}
                    onChange={(e) =>
                      updateContributor(i, "country", e.target.value)
                    }
                    placeholder="e.g., Indonesia, United States, etc."
                  />
                </div>
                {/* Only show affiliation for co-authors (not first author) */}
                {i > 0 && (
                  <div className="col-span-2">
                    <Label>Affiliation *</Label>
                    <Input
                      value={c.affiliation || ""}
                      onChange={(e) =>
                        updateContributor(i, "affiliation", e.target.value)
                      }
                      placeholder="University or Institution"
                    />
                  </div>
                )}
              </div>
              {/* Checkboxes */}
              <div className="flex flex-col gap-2 pt-2 border-t">
                {/* Primary Contact - Only show for first author (submitting author) */}
                {i === 0 && (
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={true}
                      disabled={true}
                      id={`primary-contact-${i}`}
                    />
                    <Label htmlFor={`primary-contact-${i}`} className="text-sm text-muted-foreground">
                      Primary contact (submitting author)
                    </Label>
                  </div>
                )}
                {/* Include in Browse List - Show for all contributors */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={c.includeInBrowse !== false} // Default true
                    onCheckedChange={(v) =>
                      updateContributor(i, "includeInBrowse", Boolean(v))
                    }
                    id={`browse-list-${i}`}
                  />
                  <Label htmlFor={`browse-list-${i}`} className="text-sm">
                    Include in browse list
                  </Label>
                </div>
              </div>
            </div>
          ))}

          {localData.contributors?.length === 0 && (
            <Alert>
              <AlertDescription>
                Click "Add Contributor" to add at least one contributor
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {errors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errors}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
