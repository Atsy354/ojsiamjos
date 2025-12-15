"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Upload, X, CheckCircle2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function WizardStep2Upload({ data, onChange, submissionId, errors }: any) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState<File[]>(data?.files || [])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return

    setUploading(true)
    try {
      const selected = Array.from(e.target.files)
      const nextFiles = [...files, ...selected]
      setFiles(nextFiles)
      onChange({ files: nextFiles })

      toast({ title: "Success", description: "Files selected" })
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Alert><FileText className="h-4 w-4" /><AlertDescription>Upload manuscript (DOC, PDF, Max 20MB)</AlertDescription></Alert>

      <Card><CardContent className="pt-6">
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <Button onClick={() => document.getElementById('file-upload')?.click()} disabled={uploading}>
            {uploading ? "Uploading..." : "Select Files"}
          </Button>
          <input id="file-upload" type="file" className="hidden" accept=".doc,.docx,.pdf" multiple onChange={handleFileSelect} />
        </div>
      </CardContent></Card>

      {files.length > 0 && (
        <Card><CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Uploaded: {files.length}</h3>
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-2 border rounded mb-2">
              <FileText className="h-5 w-5" />
              <span className="flex-1">{f.name}</span>
              <Button variant="ghost" size="icon" onClick={() => {
                const newFiles = files.filter((_, idx) => idx !== i)
                setFiles(newFiles)
                onChange({ files: newFiles })
              }}><X className="h-4 w-4" /></Button>
            </div>
          ))}
        </CardContent></Card>
      )}

      {errors && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{errors}</AlertDescription></Alert>}
      {files.length > 0 && <Alert><CheckCircle2 className="h-4 w-4 text-green-600" /><AlertDescription className="text-green-600">Ready! Click Next.</AlertDescription></Alert>}
    </div>
  )
}
