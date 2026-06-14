'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api';
import Cookies from 'js-cookie';
import { FiLogOut, FiPlus, FiTrash2 } from 'react-icons/fi';
import { Video } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await apiClient.get('/videos');
      setVideos(response.data.data || []);
    } catch (error: any) {
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);

      const response = await apiClient.post('/videos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Video uploaded successfully!');
      setVideos([response.data, ...videos]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
      Cookies.remove('token');
      router.push('/');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      await apiClient.delete(`/videos/${videoId}`);
      setVideos(videos.filter(v => v.id !== videoId));
      toast.success('Video deleted');
    } catch (error: any) {
      toast.error('Failed to delete video');
    }
  };

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <header className="border-b border-dark-700 bg-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Videos</h1>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition"
          >
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Upload Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <label className="block border-2 border-dashed border-dark-600 rounded-lg p-8 cursor-pointer hover:border-primary-500 transition text-center">
          <FiPlus className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-300">Click to upload or drag and drop</p>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Videos Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center text-gray-400">Loading videos...</div>
        ) : videos.length === 0 ? (
          <div className="text-center text-gray-400">No videos yet. Upload one to get started!</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map(video => (
              <div key={video.id} className="bg-dark-800 border border-dark-700 rounded-lg overflow-hidden hover:border-primary-500 transition">
                <div className="bg-dark-700 h-40 flex items-center justify-center">
                  <span className="text-gray-400">Video Preview</span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold truncate">{video.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{video.duration}s • {video.resolution}</p>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => router.push(`/editor/${video.id}`)}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(video.id)}
                      className="px-4 py-2 text-red-500 hover:bg-red-500/10 rounded transition"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
