'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';

// Define types
type Subject = {
  id: string;
  name: string;
  color?: string;
  icon?: string;
};

type QuestionImage = {
  id: string;
  url: string;
  processingStatus: string;
  createdAt: string;
};

type QuestionFormData = {
  subjectId: string;
  content: string;
  wrongAnswer: string;
  rightAnswer: string;
  difficulty: number;
  imageIds: string[];
};

export default function AddPage() {
  const t = useTranslations('navigation');
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en'; // Extract locale from path
  const [activeSource, setActiveSource] = useState<'camera' | 'gallery' | 'manual'>('camera');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [recentImages, setRecentImages] = useState<QuestionImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<QuestionFormData>({
    subjectId: '',
    content: '',
    wrongAnswer: '',
    rightAnswer: '',
    difficulty: 3,
    imageIds: [],
  });
  
  // Camera ref and state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch subjects on mount
  useEffect(() => {
    fetchSubjects();
    fetchRecentImages();
  }, []);
  
  // Initialize camera when camera source is active
  useEffect(() => {
    if (activeSource === 'camera') {
      initCamera();
    } else if (cameraActive) {
      stopCamera();
    }
  }, [activeSource]);
  
  const fetchSubjects = async () => {
    try {
      const response = await fetch(`/${locale}/api/subjects`);
      const data = await response.json();
      if (data.success) {
        setSubjects(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };
  
  const fetchRecentImages = async () => {
    try {
      const response = await fetch(`/${locale}/api/images?limit=5`);
      const data = await response.json();
      if (data.images) {
        setRecentImages(data.images);
      }
    } catch (err) {
      console.error('Error fetching recent images:', err);
    }
  };
  
  const initCamera = async () => {
    try {
      if (videoRef.current && !cameraActive) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' }
        });
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please check permissions.');
    }
  };
  
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };
  
  const takePhoto = async () => {
    if (!videoRef.current || !cameraActive) return;
    
    try {
      setIsLoading(true);
      
      // Create canvas and capture image
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      
      // Upload image
      await uploadImage(dataUrl);
      
      // Refresh recent images
      fetchRecentImages();
    } catch (err) {
      console.error('Error taking photo:', err);
      setError('Failed to capture or upload image');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    
    try {
      setIsLoading(true);
      
      // Create FormData and upload
      const uploadForm = new FormData();
      uploadForm.append('image', file);
      
      // Upload using FormData
      await uploadImageFile(uploadForm);
      
      // Refresh recent images
      fetchRecentImages();
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload image');
    } finally {
      setIsLoading(false);
    }
  };
  
  const uploadImage = async (base64Data: string) => {
    try {
      const response = await fetch(`/${locale}/api/images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ base64: base64Data.split(',')[1] }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      return data.image;
    } catch (err) {
      console.error('Error uploading image:', err);
      throw err;
    }
  };
  
  const uploadImageFile = async (uploadForm: FormData) => {
    try {
      const response = await fetch(`/${locale}/api/images`, {
        method: 'POST',
        body: uploadForm,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      return data.image;
    } catch (err) {
      console.error('Error uploading image file:', err);
      throw err;
    }
  };
  
  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subjectId || !formData.content) {
      setError('Subject and content are required');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`/${locale}/api/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subjectId: formData.subjectId,
          content: formData.content,
          wrongAnswer: formData.wrongAnswer,
          rightAnswer: formData.rightAnswer,
          difficulty: formData.difficulty,
          imageIds: formData.imageIds,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save question');
      }
      
      // Reset form and navigate
      setFormData({
        subjectId: '',
        content: '',
        wrongAnswer: '',
        rightAnswer: '',
        difficulty: 3,
        imageIds: [],
      });
      
      router.push(`/${locale}/questions`);
    } catch (err) {
      console.error('Error saving question:', err);
      setError(err instanceof Error ? err.message : 'Failed to save question');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const setDifficulty = (level: number) => {
    setFormData(prev => ({ ...prev, difficulty: level }));
  };
  
  const deleteImage = async (imageId: string) => {
    try {
      setIsLoading(true);
      // Instead of deleting, we'll set processingStatus to DELETED
      const response = await fetch(`/${locale}/api/images`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: imageId,
          processingStatus: 'DELETED',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete image');
      }
      
      // Refresh recent images
      fetchRecentImages();
    } catch (err) {
      console.error('Error deleting image:', err);
      setError('Failed to delete image');
    } finally {
      setIsLoading(false);
    }
  };
  
  const editImage = (imageId: string) => {
    // Set the current image ID to the form's imageIds array
    setFormData(prev => ({ 
      ...prev, 
      imageIds: [imageId] 
    }));
    
    // Switch to manual mode to edit the question details
    setActiveSource('manual');
  };

  return (
    <div className="container mx-auto px-4 pb-16">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-2xl font-bold">{t('add')}</h1>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
          <button 
            className="ml-2 text-red-700" 
            onClick={() => setError('')}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
      
      {/* Source Options */}
      <div className="flex gap-3 mb-6">
        <div 
          className={`flex-1 bg-white rounded-xl p-4 shadow-sm flex flex-col items-center transition-all cursor-pointer border-2 ${activeSource === 'camera' ? 'border-indigo-600' : 'border-transparent'}`}
          onClick={() => setActiveSource('camera')}
        >
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-xl text-indigo-600 mb-2">
            <i className="fas fa-camera"></i>
          </div>
          <div className="text-sm font-semibold">拍照</div>
        </div>
        
        <div 
          className={`flex-1 bg-white rounded-xl p-4 shadow-sm flex flex-col items-center transition-all cursor-pointer border-2 ${activeSource === 'gallery' ? 'border-indigo-600' : 'border-transparent'}`}
          onClick={() => setActiveSource('gallery')}
        >
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-xl text-indigo-600 mb-2">
            <i className="fas fa-image"></i>
          </div>
          <div className="text-sm font-semibold">相册</div>
        </div>
        
        <div 
          className={`flex-1 bg-white rounded-xl p-4 shadow-sm flex flex-col items-center transition-all cursor-pointer border-2 ${activeSource === 'manual' ? 'border-indigo-600' : 'border-transparent'}`}
          onClick={() => setActiveSource('manual')}
        >
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-xl text-indigo-600 mb-2">
            <i className="fas fa-keyboard"></i>
          </div>
          <div className="text-sm font-semibold">手动输入</div>
        </div>
      </div>
      
      {/* Camera UI */}
      {activeSource === 'camera' && (
        <>
          <div className="relative bg-gray-900 rounded-2xl overflow-hidden mb-6 shadow-md">
            <div className="w-full h-[350px] bg-gray-800">
              {/* Video feed for camera */}
              <video 
                ref={videoRef}
                autoPlay 
                playsInline
                className="w-full h-full object-cover"
              />
              {!cameraActive && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <i className="fas fa-camera text-6xl"></i>
                </div>
              )}
            </div>
            
            <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-between p-4">
              <div className="flex justify-between">
                <button className="w-11 h-11 rounded-full bg-black/30 flex items-center justify-center text-white">
                  <i className="fas fa-bolt"></i>
                </button>
                <button className="w-11 h-11 rounded-full bg-black/30 flex items-center justify-center text-white">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="flex justify-around items-center">
                <button 
                  className="w-12 h-12 rounded-xl bg-white/30 flex items-center justify-center text-white text-xl"
                  onClick={() => setActiveSource('gallery')}
                >
                  <i className="fas fa-image"></i>
                </button>
                <button 
                  className="w-16 h-16 rounded-full bg-white flex items-center justify-center"
                  onClick={takePhoto}
                  disabled={isLoading || !cameraActive}
                >
                  <div className={`w-14 h-14 rounded-full border-2 ${isLoading ? 'border-gray-400 animate-pulse' : 'border-gray-200'}`}></div>
                </button>
                <button 
                  className="w-12 h-12 rounded-xl bg-white/30 flex items-center justify-center text-white text-xl"
                  onClick={() => {
                    // Flip camera (front/back) - simplified version
                    stopCamera();
                    initCamera();
                  }}
                >
                  <i className="fas fa-sync-alt"></i>
                </button>
              </div>
            </div>
          </div>
          
          <h2 className="text-xl font-bold mb-4">最近拍摄</h2>
          
          <div className="flex gap-4 overflow-x-auto pb-2 mb-6">
            {recentImages.length > 0 ? recentImages.map((image) => (
              <div key={image.id} className="flex-shrink-0 w-[120px] h-[160px] relative rounded-xl overflow-hidden shadow-md">
                <Image 
                  src={image.url}
                  alt="Captured Question"
                  width={120}
                  height={160}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-0 left-0 w-full h-full bg-black/30 flex flex-col justify-between p-2">
                  <div className="text-xs font-semibold text-white bg-black/50 self-start px-2 py-1 rounded-lg">
                    {image.processingStatus}
                  </div>
                  <div className="flex justify-between">
                    <button 
                      className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-white text-xs"
                      onClick={() => deleteImage(image.id)}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                    <button 
                      className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-white text-xs"
                      onClick={() => editImage(image.id)}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-gray-500 italic">No recent images</div>
            )}
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center mb-3 font-bold">
              <i className="fas fa-lightbulb text-indigo-600 mr-2"></i>
              <span>拍摄小技巧</span>
            </div>
            <ul className="space-y-2">
              <li className="flex text-sm text-gray-600">
                <i className="fas fa-check-circle text-indigo-600 mt-1 mr-2"></i>
                <span>拍摄时保持纸张平整，避免褶皱</span>
              </li>
              <li className="flex text-sm text-gray-600">
                <i className="fas fa-check-circle text-indigo-600 mt-1 mr-2"></i>
                <span>保持充足的光线，避免阴影遮挡文字</span>
              </li>
              <li className="flex text-sm text-gray-600">
                <i className="fas fa-check-circle text-indigo-600 mt-1 mr-2"></i>
                <span>确保文字清晰可见，适当调整距离</span>
              </li>
              <li className="flex text-sm text-gray-600">
                <i className="fas fa-check-circle text-indigo-600 mt-1 mr-2"></i>
                <span>将批改痕迹和错误答案一同拍摄</span>
              </li>
            </ul>
          </div>
        </>
      )}
      
      {/* Gallery UI */}
      {activeSource === 'gallery' && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-2xl text-indigo-600 mb-4">
              <i className="fas fa-cloud-upload-alt"></i>
            </div>
            <p className="text-gray-600 mb-4 text-center">点击或拖拽图片到此处上传</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />
            <button 
              className="py-2 px-4 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              {isLoading ? '上传中...' : '从相册选择'}
            </button>
          </div>
          
          {recentImages.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">最近上传</h3>
              <div className="grid grid-cols-3 gap-3">
                {recentImages.map(image => (
                  <div key={image.id} className="relative rounded-lg overflow-hidden shadow-sm">
                    <Image 
                      src={image.url}
                      alt="Uploaded Image"
                      width={120}
                      height={120}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1 flex justify-between items-center">
                      <span className="text-white text-xs">{new Date(image.createdAt).toLocaleDateString()}</span>
                      <button 
                        className="text-white text-xs"
                        onClick={() => editImage(image.id)}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Manual Input UI */}
      {activeSource === 'manual' && (
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">添加错题</h2>
          
          <form className="space-y-4" onSubmit={handleSubmitQuestion}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">科目</label>
              <select 
                name="subjectId"
                value={formData.subjectId}
                onChange={handleInputChange}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">选择科目</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">题目内容</label>
              <textarea 
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows={4} 
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500" 
                placeholder="输入题目内容"
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">错误答案</label>
              <textarea 
                name="wrongAnswer"
                value={formData.wrongAnswer}
                onChange={handleInputChange}
                rows={3} 
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500" 
                placeholder="输入错误答案"
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">正确答案</label>
              <textarea 
                name="rightAnswer"
                value={formData.rightAnswer}
                onChange={handleInputChange}
                rows={3} 
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500" 
                placeholder="输入正确答案"
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">难度</label>
              <div className="flex text-yellow-500">
                {[1, 2, 3, 4, 5].map(level => (
                  <i 
                    key={level}
                    className={`${level <= formData.difficulty ? 'fas' : 'far'} fa-star mr-1 cursor-pointer`}
                    onClick={() => setDifficulty(level)}
                  ></i>
                ))}
              </div>
            </div>
            
            {formData.imageIds.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">已选图片</label>
                <div className="flex gap-2">
                  {formData.imageIds.map(id => {
                    const image = recentImages.find(img => img.id === id);
                    return image ? (
                      <div key={id} className="relative w-20 h-20 rounded-md overflow-hidden">
                        <Image 
                          src={image.url}
                          alt="Selected image"
                          width={80}
                          height={80}
                          className="object-cover"
                        />
                        <button
                          type="button"
                          className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-bl-md"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            imageIds: prev.imageIds.filter(imgId => imgId !== id)
                          }))}
                        >
                          <i className="fas fa-times text-xs"></i>
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
            
            <div className="pt-4">
              <button 
                type="submit" 
                disabled={isLoading || !formData.subjectId || !formData.content}
                className={`w-full py-3 px-4 rounded-lg shadow-sm text-white font-medium 
                  ${isLoading || !formData.subjectId || !formData.content 
                    ? 'bg-indigo-400' 
                    : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {isLoading ? '保存中...' : '保存错题'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 