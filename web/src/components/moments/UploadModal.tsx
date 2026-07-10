"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ImagePlus, Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { ACCEPTED_UPLOAD_TYPES, uploadFiles } from "@/lib/upload-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

const MAX_FILES = 50;

type Phase = "select" | "uploading" | "done";

export function UploadModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [description, setDescription] = useState("");
  const [phase, setPhase] = useState<Phase>("select");
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setFiles([]);
    setDescription("");
    setPhase("select");
    setProgress(0);
    setDragOver(false);
  }

  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    const next = [...files];
    for (const f of Array.from(incoming)) {
      if (next.length >= MAX_FILES) break;
      // Dedupe by name + size.
      if (!next.some((e) => e.name === f.name && e.size === f.size)) next.push(f);
    }
    setFiles(next);
  }

  async function handleUpload() {
    if (files.length === 0) return;
    setPhase("uploading");
    setProgress(0);
    try {
      const result = await uploadFiles(files, description, setProgress);
      setPhase("done");
      if (result.failedCount > 0) {
        toast.warning(
          `${result.createdCount} uploaded, ${result.failedCount} failed.`,
        );
      } else {
        toast.success(
          result.createdCount === 1 ? "Your memory was added." : `${result.createdCount} memories added.`,
        );
      }
      router.refresh();
    } catch (err) {
      setPhase("select");
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger
        render={
          <Button className="bg-gradient-gold text-foreground shadow-gold">
            <ImagePlus /> Share a memory
          </Button>
        }
      />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif-display text-2xl">Share a memory</DialogTitle>
          <DialogDescription>
            Add your photos and videos to the couple&apos;s gallery. Images are optimized before
            uploading.
          </DialogDescription>
        </DialogHeader>

        {phase === "done" ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <p className="font-serif-display text-xl">Thank you 💛</p>
            <p className="text-sm text-muted-foreground">Your memory has been added to the gallery.</p>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        ) : phase === "uploading" ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {progress < 100 ? `Uploading… ${progress}%` : "Finishing up…"}
            </p>
            <Progress value={progress} className="w-full" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                addFiles(e.dataTransfer.files);
              }}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                dragOver ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <UploadCloud className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium">Drag & drop, or click to choose</span>
              <span className="text-xs text-muted-foreground">
                Photos & videos · up to {MAX_FILES} files
              </span>
            </button>

            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPTED_UPLOAD_TYPES}
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />

            {files.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {files.length} file{files.length === 1 ? "" : "s"} selected
                  </span>
                  <button
                    type="button"
                    className="hover:text-foreground"
                    onClick={() => setFiles([])}
                  >
                    Clear all
                  </button>
                </div>
                <ul className="max-h-32 overflow-y-auto rounded-lg border">
                  {files.map((f, i) => (
                    <li
                      key={`${f.name}-${f.size}`}
                      className="flex items-center justify-between gap-2 border-b px-3 py-1.5 text-sm last:border-b-0"
                    >
                      <span className="truncate">{f.name}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${f.name}`}
                        onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={2}
              placeholder="Add a caption (optional)…"
              className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />

            <Button
              onClick={handleUpload}
              disabled={files.length === 0}
              className="bg-gradient-gold text-foreground shadow-gold"
            >
              <UploadCloud />
              Share {files.length > 0 ? `${files.length} ` : ""}
              {files.length === 1 ? "memory" : "memories"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
