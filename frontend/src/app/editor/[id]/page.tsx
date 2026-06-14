'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import apiClient from '@/lib/api';
import toast from 'react-hot-toast';
import { FiPlay, FiPause, FiDownload, FiZap } from 'react-icons/fi';
import { Detection, Region, Job } from '@/types';

export default function EditorPage() {
  const params = useParams();
  const videoId = params.id as string;
  const videoRef = useRef<HTMLVideoElement>(null);

  const [video, setVideo] = useState<any>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<Region[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectionMethod, setDetectionMethod] = useState('all');
  const [removalMethod, setRemovalMethod] = useState('blur');
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetchVideo();
  }, [videoId]);

  useEffect(() => {
    if (!currentJob) return;

    const interval = setInterval(async () => {
      try {
        const response = await apiClient.get(`/jobs/${currentJob.id}`);
        setCurrentJob(response.data);

        if (response.data.status === 'completed') {
          toast.success('Processing complete!');
          clearInterval(interval);
        } else if (response.data.status === 'failed') {
          toast.error('Processing failed');
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Failed to fetch job status');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentJob]);

  const fetchVideo = async () => {
    try {
      const response = await apiClient.get(`/videos/${videoId}`);
      setVideo(response.data);
    } catch (error: any) {
      toast.error('Failed to load video');
    }
  };

  const handleDetect = async () => {
    setIsDetecting(true);
    try {
      const response = await apiClient.post(`/videos/${videoId}/detect`, {
        detectionTypes: detectionMethod === 'all' 
          ? ['logo', 'watermark', 'timestamp', 'channel_overlay']
          : [detectionMethod],
        sensitivity: 0.7,
      });

      setCurrentJob(response.data);
      toast.success('Detection started...');
    } catch (error: any) {
      toast.error('Detection failed');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleProcess = async () => {
    if (selectedRegions.length === 0) {
      toast.error('Please select regions to remove');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await apiClient.post(`/videos/${videoId}/process`, {
        regions: selectedRegions,
        method: removalMethod,
        quality: 'high',
        format: 'mp4',
      });

      setCurrentJob(response.data);
      toast.success('Processing started...');
    } catch (error: any) {
      toast.error('Processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!currentJob) {
      toast.error('No processed video available');
      return;
    }

    try {
      const response = await apiClient.get(`/videos/${videoId}/download`, {
        params: { jobId: currentJob.id },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `processed_${video.title}`;
      link.click();
      toast.success('Download started!');
    } catch (error: any) {
      toast.error('Download failed');
    }
  };

  if (!video) return <div className="min-h-screen bg-dark-900 flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-dark-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">{video.title}</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video Preview */}
          <div className="lg:col-span-2">
            <div className="bg-dark-800 rounded-lg overflow-hidden border border-dark-700">
              <video
                ref={videoRef}
                src={`/api/videos/${videoId}/stream`}
                controls
                className="w-full aspect-video bg-black"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Detection Section */}
            <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FiZap />
                Detection
              </h2>
              <div className="space-y-4">
                <select
                  value={detectionMethod}
                  onChange={(e) => setDetectionMethod(e.target.value)}
                  className="w-full bg-dark-700 border border-dark-600 rounded px-3 py-2 text-white"
                >
                  <option value="all">All Types</option>
                  <option value="logo">Logos</option>
                  <option value="watermark">Watermarks</option>
                  <option value="timestamp">Timestamps</option>
                  <option value="channel_overlay">Channel Overlays</option>
                </select>
                <button
                  onClick={handleDetect}
                  disabled={isDetecting || currentJob?.status === 'processing'}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded font-semibold disabled:opacity-50 transition"
                >
                  {isDetecting ? 'Detecting...' : 'Detect Overlays'}
                </button>
              </div>
            </div>

            {/* Processing Section */}
            <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Removal Method</h2>
              <div className="space-y-4">
                <select
                  value={removalMethod}
                  onChange={(e) => setRemovalMethod(e.target.value)}
                  className="w-full bg-dark-700 border border-dark-600 rounded px-3 py-2 text-white"
                >
                  <option value="blur">Blur</option>
                  <option value="inpaint">AI Inpainting</option>
                  <option value="interpolation">Frame Interpolation</option>
                  <option value="pixel">Pixel Replacement</option>
                </select>
                <button
                  onClick={handleProcess}
                  disabled={isProcessing || currentJob?.status === 'processing'}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-semibold disabled:opacity-50 transition"
                >
                  {isProcessing ? 'Processing...' : 'Process Video'}
                </button>
              </div>
            </div>

            {/* Progress */}
            {currentJob && (
              <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Progress</h2>
                <div className="space-y-4">
                  <div className="bg-dark-700 rounded h-2">
                    <div
                      className="bg-primary-600 h-2 rounded transition-all"
                      style={{ width: `${currentJob.progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-400">{currentJob.progress}% complete</p>
                  {currentJob.status === 'completed' && (
                    <button
                      onClick={handleDownload}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold transition flex items-center justify-center gap-2"
                    >
                      <FiDownload />
                      Download
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
