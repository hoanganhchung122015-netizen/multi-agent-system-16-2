import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RotateCcw, Check, X, Crop as CropIcon } from 'lucide-react';
import Cropper from 'react-easy-crop';

interface CameraScannerProps {
  onCapture: (base64Data: string) => void;
  onClose: () => void;
}

const CameraScanner: React.FC<CameraScannerProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [countdown, setCountdown] = useState<number | null>(3);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 } }
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch { alert("Không thể mở camera"); }
  };

  useEffect(() => { startCamera(); return () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(t => t.stop());
  }}, []);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    } else if (countdown === 0) { captureRaw(); }
  }, [countdown]);

  const captureRaw = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      setTempImage(canvas.toDataURL('image/jpeg'));
      setCountdown(null);
    }
  };

  const onCropComplete = useCallback((_: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleFinalConfirm = async () => {
    if (tempImage && croppedAreaPixels) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const image = new Image();
      image.src = tempImage;
      await new Promise(r => image.onload = r);

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      ctx?.drawImage(
        image,
        croppedAreaPixels.x, croppedAreaPixels.y,
        croppedAreaPixels.width, croppedAreaPixels.height,
        0, 0, canvas.width, canvas.height
      );
      onCapture(canvas.toDataURL('image/jpeg'));
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {!tempImage ? (
        <div className="relative flex-1">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-72 h-48 border-2 border-emerald-400 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
          </div>
          {countdown! > 0 && <div className="absolute inset-0 flex items-center justify-center text-white text-9xl font-black">{countdown}</div>}
        </div>
      ) : (
        <div className="relative flex-1 bg-slate-900">
          <Cropper
            image={tempImage}
            crop={crop}
            zoom={zoom}
            aspect={4 / 3}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
          <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-4 px-6">
            <button onClick={() => {setTempImage(null); setCountdown(3); startCamera();}} className="p-4 bg-white/10 backdrop-blur-md rounded-2xl text-white"><RotateCcw /></button>
            <button onClick={handleFinalConfirm} className="flex-1 bg-blue-600 py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 shadow-xl"><Check /> XÁC NHẬN VÙNG CHỌN</button>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraScanner;