import React, { useState, useRef } from 'react';
import { useAdept } from '../../context/AdeptContext';
import {
  X,
  Camera,
  Upload,
  Mic,
  Square,
  Volume2,
  Trash2,
  Sparkles,
  Heart,
  CheckCircle2,
} from 'lucide-react';

interface MemoryLaneUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MemoryLaneUploadModal: React.FC<MemoryLaneUploadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addMemoryLanePhoto, memoryLanePhotos, deleteMemoryLanePhoto, activeElder } = useAdept();

  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [caption, setCaption] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Audio voice note recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Feedback state
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'gallery'>('upload');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.warn('Microphone permission not granted or unavailable:', err);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !relationship.trim()) return;

    // Default sample image if user didn't pick custom photo
    const finalPhotoUrl =
      photoPreview ||
      'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80';

    addMemoryLanePhoto({
      elderId: activeElder.id,
      name: name.trim(),
      relationship: relationship.trim(),
      caption: caption.trim() || `${name} (${relationship}) sharing a warm moment with you.`,
      photoUrl: finalPhotoUrl,
      voiceAudioUrl: recordedAudioUrl || undefined,
    });

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setName('');
      setRelationship('');
      setCaption('');
      setPhotoPreview(null);
      setRecordedAudioUrl(null);
      setActiveTab('gallery');
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl relative border border-slate-100 animate-in zoom-in-95 my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <Camera className="w-5 h-5 text-emerald-800" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Memory Lane Photos
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                For {activeElder.name.split(' ')[0]}’s Mind tab recall game
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch: Upload vs View Gallery */}
        <div className="grid grid-cols-2 gap-2 my-3">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-[#064e3b] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Add New Photo
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              activeTab === 'gallery'
                ? 'bg-[#064e3b] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Gallery ({memoryLanePhotos.length})
          </button>
        </div>

        {/* Form Body */}
        {activeTab === 'upload' ? (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-3.5 pr-1">
            {saveSuccess && (
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3 text-emerald-900 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Photo added to {activeElder.name.split(' ')[0]}’s Memory Lane!</span>
              </div>
            )}

            {/* Photo Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Family Photo
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-36 bg-slate-50 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden relative transition-colors"
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-slate-500">
                    <Upload className="w-6 h-6 text-emerald-700" />
                    <span className="text-xs font-semibold">Tap to select a photo</span>
                    <span className="text-[10px] text-slate-400">JPEG, PNG or Camera</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Name & Relationship */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Relationship *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grandson"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>

            {/* Story / Memory Caption */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Story Caption (Shown on success)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Rahul holding his football trophy after winning on Saturday!"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium resize-none"
              />
            </div>

            {/* Voice Audio Note */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Optional Voice Caption (Plays for {activeElder.name.split(' ')[0]})
              </label>
              <div className="flex items-center gap-2">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startVoiceRecording}
                    className="flex-1 py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-amber-900 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Mic className="w-4 h-4 text-amber-700" />
                    <span>{recordedAudioUrl ? 'Re-record voice' : 'Record voice caption'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopVoiceRecording}
                    className="flex-1 py-2 px-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
                  >
                    <Square className="w-4 h-4 text-rose-600 fill-rose-600" />
                    <span>Stop recording</span>
                  </button>
                )}

                {recordedAudioUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      const audio = new Audio(recordedAudioUrl);
                      audio.play();
                    }}
                    className="w-9 h-9 rounded-xl bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center text-emerald-800 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full h-12 bg-[#064e3b] hover:bg-[#053d2e] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer mt-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Save to Memory Lane</span>
            </button>
          </form>
        ) : (
          /* Gallery List */
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {memoryLanePhotos.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-6">
                No photos in Memory Lane yet. Add one above!
              </p>
            ) : (
              memoryLanePhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="bg-slate-50 rounded-2xl p-2.5 border border-slate-200 flex items-center justify-between gap-3"
                >
                  <img
                    src={photo.photoUrl}
                    alt={photo.name}
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {photo.name}
                    </h4>
                    <p className="text-[11px] text-emerald-800 font-semibold truncate flex items-center gap-1">
                      <Heart className="w-3 h-3 fill-emerald-700 text-emerald-700 inline" />
                      {photo.relationship}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{photo.caption}</p>
                  </div>
                  <button
                    onClick={() => deleteMemoryLanePhoto(photo.id)}
                    className="w-8 h-8 rounded-full hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

