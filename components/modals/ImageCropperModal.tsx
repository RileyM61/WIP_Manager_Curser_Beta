import React, { useState, useRef, useEffect, useCallback } from 'react';
import { XIcon } from '../shared/icons';

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedImage: string) => void;
}

const CROP_ASPECT_RATIO = 2.5 / 1; // e.g., for a 100x40 logo
const OUTPUT_WIDTH = 300; // The width of the final cropped image

const ImageCropperModal: React.FC<ImageCropperModalProps> = ({ isOpen, onClose, imageSrc, onCropComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(new Image());
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const image = imageRef.current;
    if (!image.src) return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cropWidth = canvas.width * 0.8;
    const cropHeight = cropWidth / CROP_ASPECT_RATIO;
    const cropX = (canvas.width - cropWidth) / 2;
    const cropY = (canvas.height - cropHeight) / 2;

    const imgScaledWidth = image.width * zoom;
    const imgScaledHeight = image.height * zoom;
    
    ctx.save();
    ctx.beginPath();
    ctx.rect(cropX, cropY, cropWidth, cropHeight);
    ctx.clip();
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(
      image,
      offset.x,
      offset.y,
      imgScaledWidth,
      imgScaledHeight
    );

    ctx.restore();
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropX, cropY, cropWidth, cropHeight);

  }, [zoom, offset]);


  useEffect(() => {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    image.crossOrigin = "anonymous";
    image.onload = () => {
        const canvasAspectRatio = canvas.width / canvas.height;
        const imageAspectRatio = image.width / image.height;

        let initialZoom;
        if (imageAspectRatio > canvasAspectRatio) {
            initialZoom = canvas.width / image.width;
        } else {
            initialZoom = canvas.height / image.height;
        }

        setZoom(initialZoom);
        setOffset({
            x: (canvas.width - image.width * initialZoom) / 2,
            y: (canvas.height - image.height * initialZoom) / 2
        });
    };
    image.src = imageSrc;
  }, [imageSrc]);

  useEffect(() => {
      draw();
  }, [draw]);


  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleMouseLeave = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const scaleAmount = 0.1;
    const newZoom = e.deltaY > 0 ? zoom * (1 - scaleAmount) : zoom * (1 + scaleAmount);
    setZoom(Math.max(0.1, newZoom)); // Prevent zoom from being too small
  };

  const handleCrop = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image.src) return;

    const cropWidth = canvas.width * 0.8;
    const cropHeight = cropWidth / CROP_ASPECT_RATIO;
    const cropX = (canvas.width - cropWidth) / 2;
    const cropY = (canvas.height - cropHeight) / 2;

    const sourceX = (cropX - offset.x) / zoom;
    const sourceY = (cropY - offset.y) / zoom;
    const sourceWidth = cropWidth / zoom;
    const sourceHeight = cropHeight / zoom;

    const tempCanvas = document.createElement('canvas');
    const outputHeight = OUTPUT_WIDTH / CROP_ASPECT_RATIO;
    tempCanvas.width = OUTPUT_WIDTH;
    tempCanvas.height = outputHeight;
    const tempCtx = tempCanvas.getContext('2d');

    if (tempCtx) {
      tempCtx.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        OUTPUT_WIDTH,
        outputHeight
      );
      // Use JPEG format with 0.9 quality to reduce file size for localStorage
      onCropComplete(tempCanvas.toDataURL('image/jpeg', 0.9));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-full flex flex-col">
        <div className="p-6 border-b dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Edit Logo</h2>
            <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
              <XIcon />
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Use mouse wheel to zoom, click and drag to pan.</p>
        </div>
        <div className="p-6 flex justify-center items-center bg-gray-200 dark:bg-gray-900">
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            className="cursor-move max-w-full"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
          />
        </div>
        <div className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="bg-white dark:bg-gray-600 dark:border-gray-500 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCrop}
            className="bg-brand-blue py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue"
          >
            Save Logo
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperModal;
