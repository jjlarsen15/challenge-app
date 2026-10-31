"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Mic, Square, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspace } from "@/lib/demo/workspace-store";
import { SOURCE_LABELS, type SourceCapture } from "@/lib/types/domain";
import { assertFileAllowed } from "@/lib/validations";
import { formatRelativeTime } from "@/lib/utils";

export function CaptureStudio() {
  const router = useRouter();
  const { createNoteCapture, createFileCapture, createVoiceCapture, snapshot, profileName } =
    useWorkspace();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  async function submitNote() {
    setBusy(true);
    try {
      await createNoteCapture(note);
      toast.success("Note captured. A draft was sent to review.");
      setNote("");
      router.push("/review");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the note");
    } finally {
      setBusy(false);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setElapsed(0);
      timerRef.current = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    } catch {
      toast.error("Microphone access is required to record a voice note");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) window.clearInterval(timerRef.current);
  }

  async function saveRecording() {
    if (!audioBlob) return;
    setBusy(true);
    try {
      await createVoiceCapture(audioBlob, elapsed);
      toast.success("Voice note captured. Review the suggested knowledge next.");
      setAudioBlob(null);
      setAudioUrl(null);
      router.push("/review");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the recording");
    } finally {
      setBusy(false);
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      assertFileAllowed(file);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "File not allowed");
      return;
    }
    setBusy(true);
    try {
      await createFileCapture(file);
      toast.success("File captured and queued for knowledge review.");
      router.push("/review");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Capture</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Record a 30-second voice note after a job, drop a file, or type what you just learned.
          OwnerOS keeps the original and suggests knowledge for review.
        </p>
      </header>

      <Tabs defaultValue="voice">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="voice">Voice</TabsTrigger>
          <TabsTrigger value="note">Note</TabsTrigger>
          <TabsTrigger value="file">File</TabsTrigger>
        </TabsList>

        <TabsContent value="voice" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Voice note</CardTitle>
              <CardDescription>
                Uses the browser MediaRecorder API. Without an OpenAI key, a labeled demo transcript
                is used.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 py-8">
              <button
                type="button"
                onClick={recording ? stopRecording : startRecording}
                className="flex size-28 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:bg-primary/90 focus-visible:ring-4 focus-visible:ring-ring/40"
                aria-pressed={recording}
                aria-label={recording ? "Stop recording" : "Start recording"}
                data-testid="record-button"
              >
                {recording ? <Square className="size-8" /> : <Mic className="size-10" />}
              </button>
              <p className="text-sm text-muted-foreground">
                {recording ? `Recording ${elapsed}s` : "Tap to record"}
              </p>
              {audioUrl ? (
                <div className="flex w-full max-w-md flex-col gap-3">
                  <audio controls src={audioUrl} className="w-full" />
                  <Button onClick={saveRecording} disabled={busy} data-testid="save-voice">
                    Save voice note
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="note" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick note</CardTitle>
              <CardDescription>Write the thing you do not want to explain twice.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quick-note">What did we learn?</Label>
                <Textarea
                  id="quick-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Weekend lockouts on commercial rooftops are a $125 trip fee plus time-and-a-half."
                  className="min-h-36 rounded-xl"
                  data-testid="quick-note"
                />
              </div>
              <Button onClick={submitNote} disabled={busy} data-testid="save-note">
                <FileText data-icon="inline-start" />
                Save note
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="file" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload source</CardTitle>
              <CardDescription>
                Audio up to 25 MB. PDF, TXT, and DOCX up to 10 MB. Files stay private.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-12 text-center hover:bg-muted/40">
                <Upload className="size-6 text-primary" />
                <span className="text-sm font-medium">Choose an audio or document file</span>
                <span className="text-xs text-muted-foreground">
                  MP3, WAV, M4A, WEBM, PDF, TXT, DOCX
                </span>
                <input
                  type="file"
                  className="sr-only"
                  accept=".mp3,.wav,.m4a,.webm,.ogg,.pdf,.txt,.docx,audio/*,application/pdf,text/plain"
                  onChange={(event) => onFile(event.target.files?.[0])}
                  data-testid="file-input"
                />
              </label>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <section>
        <h2 className="text-lg font-semibold">Recent captures</h2>
        <ul className="mt-4 space-y-3">
          {snapshot.captures.slice(0, 8).map((capture) => (
            <CaptureRow
              key={capture.id}
              capture={capture}
              author={profileName(capture.createdBy)}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

function CaptureRow({
  capture,
  author,
}: {
  capture: SourceCapture;
  author: string;
}) {
  return (
    <li className="rounded-2xl border bg-card px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{SOURCE_LABELS[capture.sourceType]}</p>
        <p className="text-xs text-muted-foreground">{formatRelativeTime(capture.createdAt)}</p>
      </div>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
        {capture.originalContent || capture.transcript || capture.originalFilename}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        {author} · {capture.processingStatus}
      </p>
    </li>
  );
}
