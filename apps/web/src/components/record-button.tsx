import { AudioLines } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const RECORDING_MAX_DURATION = 240; // 4 minutes in seconds

export function RecordButton({
  onRecord,
  className,
}: {
  onRecord: (blob: Blob) => void;
  className?: string;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function toggleRecording() {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    let audio: BlobPart[] = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audio = [event.data];
      }
    };
    mediaRecorder.onstop = () => {
      const b = new Blob(audio, { type: "audio/wav" });
      onRecord(b);
    };
    mediaRecorder.start();
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime((prevTime) => {
        if (prevTime >= RECORDING_MAX_DURATION - 1) {
          stopRecording();
          return RECORDING_MAX_DURATION;
        }
        return prevTime + 1;
      });
    }, 1000);
  }

  function stopRecording() {
    if (!mediaRecorderRef.current) {
      return;
    }
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const time = useMemo(() => {
    const minutes = Math.floor(recordingTime / 60);
    const remainingSeconds = recordingTime % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  }, [recordingTime]);

  return (
    <div className={cn(className, "flex items-center gap-2")}>
      {isRecording && <span className="text-xs">{time}</span>}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant={isRecording ? "destructive" : "default"}
            onClick={toggleRecording}
            className="rounded-full"
          >
            <AudioLines />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Use your voice</TooltipContent>
      </Tooltip>
    </div>
  );
}
