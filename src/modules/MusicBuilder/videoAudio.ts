import coreURL from '@ffmpeg/core?url';
import wasmURL from '@ffmpeg/core/wasm?url';
import classWorkerURL from '@ffmpeg/ffmpeg/worker?worker&url';

export async function extractVideoAudio(
  file: File,
  context: AudioContext,
  signal: AbortSignal,
  onProgress: (message: string) => void,
): Promise<Blob> {
  signal.throwIfAborted();
  try {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    signal.throwIfAborted();
    const ffmpeg = new FFmpeg();
    const cancel = () => ffmpeg.terminate();
    signal.addEventListener('abort', cancel, { once: true });
    const loadTimer = setTimeout(cancel, 60000);
    try {
      onProgress('Loading the bundled FFmpeg engine. Media stays on this device.');
      ffmpeg.on('progress', ({ progress }) => {
        onProgress(`Converting video with FFmpeg: ${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%`);
      });
      await ffmpeg.load({ coreURL, wasmURL, classWorkerURL });
      clearTimeout(loadTimer);
      signal.throwIfAborted();
      const extension = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'mp4';
      const inputName = `input.${extension}`;
      await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));
      const resultCode = await ffmpeg.exec(['-i', inputName, '-vn', '-acodec', 'pcm_s16le', '-ar', '44100', '-ac', '2', 'audio.wav'], 120000);
      if (resultCode !== 0) throw new Error('Video decoding failed, timed out, or no audio stream was found.');
      const result = await ffmpeg.readFile('audio.wav');
      if (typeof result === 'string') throw new Error('The converter returned invalid audio.');
      return new Blob([new Uint8Array(result)], { type: 'audio/wav' });
    } finally {
      clearTimeout(loadTimer);
      signal.removeEventListener('abort', cancel);
      ffmpeg.terminate();
    }
  } catch (error) {
    signal.throwIfAborted();
    console.warn('Fast video extraction failed; trying local real-time capture.', error);
    onProgress(`Fast conversion unavailable (${error instanceof Error ? error.message : String(error)}). Trying real-time capture; keep this page open.`);
    return captureVideoAudio(file, context, signal);
  }
}

async function captureVideoAudio(file: File, context: AudioContext, signal: AbortSignal): Promise<Blob> {
  if (typeof MediaRecorder === 'undefined') throw new Error('Real-time audio capture is not supported by this browser.');
  const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
  if (!mimeType) throw new Error('No supported audio recording format. Try Chrome or Edge.');
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'auto';
  video.playsInline = true;
  const destination = context.createMediaStreamDestination();
  const source = context.createMediaElementSource(video);
  source.connect(destination);
  let recorder: MediaRecorder | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await new Promise<void>((resolve, reject) => {
      const cancel = () => finish(new DOMException('Conversion cancelled.', 'AbortError'));
      const finish = (error?: Error) => {
        clearTimeout(timer);
        signal.removeEventListener('abort', cancel);
        video.onloadedmetadata = null;
        video.onerror = null;
        if (error) reject(error); else resolve();
      };
      signal.addEventListener('abort', cancel, { once: true });
      video.onloadedmetadata = () => finish();
      video.onerror = () => finish(new Error('The browser cannot open this video format.'));
      timer = setTimeout(() => finish(new Error('Timed out opening the video.')), 15000);
      video.src = url;
      video.load();
      if (signal.aborted) cancel();
    });
    if (!Number.isFinite(video.duration) || video.duration <= 0) throw new Error('The video has no finite playable duration.');
    await context.resume();
    recorder = new MediaRecorder(destination.stream, { mimeType });
    const chunks: Blob[] = [];
    return await new Promise<Blob>((resolve, reject) => {
      const cancel = () => finish(new DOMException('Conversion cancelled.', 'AbortError'));
      const finish = (error?: Error) => {
        clearTimeout(timer);
        signal.removeEventListener('abort', cancel);
        video.onended = null;
        video.onerror = null;
        if (error) {
          if (recorder?.state !== 'inactive') recorder?.stop();
          reject(error);
        } else {
          resolve(new Blob(chunks, { type: mimeType }));
        }
      };
      recorder!.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder!.onerror = () => finish(new Error('Real-time audio capture failed.'));
      recorder!.onstop = () => finish();
      video.onended = () => { if (recorder?.state !== 'inactive') recorder?.stop(); };
      video.onerror = () => finish(new Error('Video playback failed during extraction.'));
      signal.addEventListener('abort', cancel, { once: true });
      timer = setTimeout(() => finish(new Error('Video playback timed out.')), (video.duration + 15) * 1000);
      if (signal.aborted) { cancel(); return; }
      recorder!.start(250);
      void video.play().catch(error => finish(error instanceof Error ? error : new Error(String(error))));
    });
  } finally {
    clearTimeout(timer);
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    source.disconnect();
    destination.stream.getTracks().forEach(track => track.stop());
    video.pause();
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  }
}
