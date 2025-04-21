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
  processingStatus?: string;
  createdAt: string;
  localPath?: string;
};

type QuestionFormData = {
  subjectId: string;
  content: string;
  wrongAnswer: string;
  rightAnswer: string;
  difficulty: number;
  imageIds: string[];
};

type AnalyzedQuestion = {
  subjectName: string;
  content: string;
  wrongAnswer: string;
  rightAnswer: string;
  difficulty: number;
  selected?: boolean; // Track selection state
};

export default function AddPage() {
  const t = useTranslations('navigation');
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en'; // Extract locale from path
  const [activeSource, setActiveSource] = useState<'camera' | 'gallery' | 'manual'>('camera');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectGroups, setSubjectGroups] = useState<{[key: string]: Subject[]}>({});
  const [recentImages, setRecentImages] = useState<QuestionImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<QuestionFormData[]>([
    {
      subjectId: '',
      content: '',
      wrongAnswer: '',
      rightAnswer: '',
      difficulty: 3,
      imageIds: [],
    }
  ]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  
  // Camera ref and state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Add new state for multiple questions
  const [analyzedQuestions, setAnalyzedQuestions] = useState<AnalyzedQuestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  
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
        const allSubjects = data.data || [];
        setSubjects(allSubjects);
        
        // Group subjects by level (小学/初中/高中)
        const groups: {[key: string]: Subject[]} = {
          '小学': [],
          '初中': [],
          '高中': [],
          '其他': []
        };
        
        allSubjects.forEach((subject: Subject) => {
          // Check if the subject name contains a level identifier
          if (subject.name.includes('小学')) {
            groups['小学'].push(subject);
          } else if (subject.name.includes('初中')) {
            groups['初中'].push(subject);
          } else if (subject.name.includes('高中')) {
            groups['高中'].push(subject);
          } else {
            groups['其他'].push(subject);
          }
        });
        
        setSubjectGroups(groups);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };
  
  const fetchRecentImages = async () => {
    try {
      console.log('Fetching recent images...');
      const response = await fetch(`/${locale}/api/images?limit=5`);
      const data = await response.json();
      
      console.log('Recent images response:', data);
      
      if (data.success && data.data) {
        setRecentImages(data.data);
      } else {
        console.error('Invalid response format:', data);
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
      
      // Convert canvas to Blob instead of data URL
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else throw new Error('Could not create image blob');
        }, 'image/jpeg', 0.9);
      });
      
      // Create a File object from the Blob
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      // Create FormData and upload
      const formData = new FormData();
      formData.append('image', file);
      
      // Upload using FormData
      await uploadImageFile(formData);
      
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
  
  const uploadImageFile = async (uploadForm: FormData) => {
    try {
      console.log('Uploading image file to server...');
      
      const response = await fetch(`/${locale}/api/images`, {
        method: 'POST',
        body: uploadForm,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upload error response:', errorData);
        throw new Error(errorData.error || 'Failed to upload image');
      }
      
      const data = await response.json();
      console.log('Upload success response:', data);
      
      // Add the uploaded image ID to the current form data
      if (data.data && data.data.id) {
        setFormData(prev => {
          const updated = [...prev];
          if (updated[currentQuestionIndex]) {
            updated[currentQuestionIndex] = {
              ...updated[currentQuestionIndex],
              imageIds: [...updated[currentQuestionIndex].imageIds, data.data.id]
            };
          }
          return updated;
        });
      }
      
      return data.data;
    } catch (err) {
      console.error('Error uploading image file:', err);
      throw err;
    }
  };
  
  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const currentForm = formData[currentQuestionIndex];
    if (!currentForm || !currentForm.subjectId || !currentForm.content) {
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
        body: JSON.stringify(currentForm),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save question');
      }
      
      // Remove the submitted question from the form data array
      setFormData(prev => {
        const updated = [...prev];
        updated.splice(currentQuestionIndex, 1);
        // Add an empty form if all questions are submitted
        if (updated.length === 0) {
          updated.push({
            subjectId: '',
            content: '',
            wrongAnswer: '',
            rightAnswer: '',
            difficulty: 3,
            imageIds: [],
          });
        }
        return updated;
      });
      
      // Adjust the current index if needed
      setCurrentQuestionIndex(prev => {
        const newIndex = Math.min(prev, formData.length - 2);
        return Math.max(0, newIndex);
      });
      
      // Navigate if all questions are submitted
      if (formData.length === 1) {
        router.push(`/${locale}/questions`);
      }
    } catch (err) {
      console.error('Error saving question:', err);
      setError(err instanceof Error ? err.message : 'Failed to save question');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = [...prev];
      if (updated[currentQuestionIndex]) {
        updated[currentQuestionIndex] = {
          ...updated[currentQuestionIndex],
          [name]: value
        };
      }
      return updated;
    });
  };
  
  const setDifficulty = (level: number) => {
    setFormData(prev => {
      const updated = [...prev];
      if (updated[currentQuestionIndex]) {
        updated[currentQuestionIndex] = {
          ...updated[currentQuestionIndex],
          difficulty: level
        };
      }
      return updated;
    });
  };
  
  const deleteImage = async (imageId: string) => {
    try {
      setIsLoading(true);
      
      // Use the new DELETE method for image deletion
      const response = await fetch(`/${locale}/api/images`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId: imageId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Delete error response:', errorData);
        throw new Error(errorData.error || 'Failed to delete image');
      }
      
      // Remove the deleted image ID from all form data entries
      setFormData(prev => prev.map(form => ({
        ...form,
        imageIds: form.imageIds.filter(id => id !== imageId)
      })));
      
      // Refresh recent images
      fetchRecentImages();
    } catch (err) {
      console.error('Error deleting image:', err);
      setError('Failed to delete image');
    } finally {
      setIsLoading(false);
    }
  };
  
  const analyzeImage = async (imageId: string) => {
    try {
      setIsAnalyzing(true);
      setAnalysisError('');
      
      // Find image URL
      const image = recentImages.find(img => img.id === imageId);
      if (!image) {
        throw new Error('Image not found');
      }
      
      console.log('Analyzing image:', image.url);
      
      // Call the analysis API
      const response = await fetch(`/${locale}/api/analyze-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: image.url }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Analysis error response:', errorData);
        throw new Error(errorData.error || 'Failed to analyze image');
      }
      
      const result = await response.json();
      console.log('Analysis result:', result);
      
      if (!result.success) {
        setAnalysisError(result.error || 'Analysis failed');
        return;
      }
      
      // Process analyzed questions and add directly to form data
      const analyzedQuestions = result.data || [];
      if (analyzedQuestions.length === 0) {
        setAnalysisError('No questions detected in the image');
        return;
      }
      
      // Convert analyzed questions to form data format
      const questionForms = analyzedQuestions.map((q: AnalyzedQuestion) => {
        // Find subject ID by name
        let matchedSubject: Subject | undefined;
        
        // First try to match by name
        matchedSubject = subjects.find(s => 
          s.name.toLowerCase() === q.subjectName.toLowerCase()
        );
        
        // If no exact match, try to find a subject that contains the subjectName
        if (!matchedSubject) {
          // Check for common subject patterns and map to appropriate subjects
          let subjectKeyword = q.subjectName.toLowerCase();
          
          // Map from detected keywords to likely subject areas
          const subjectMapping: {[key: string]: string[]} = {
            'math': ['数学', '算术'],
            'mathematics': ['数学', '算术'],
            'chinese': ['语文', '中文'],
            'english': ['英语', '外语'],
            'physics': ['物理'],
            'chemistry': ['化学'],
            'biology': ['生物'],
            'history': ['历史'],
            'geography': ['地理'],
            'politics': ['政治'],
            // Add more mappings as needed
          };
          
          // Look for keyword matches
          for (const [key, alternatives] of Object.entries(subjectMapping)) {
            if (subjectKeyword.includes(key)) {
              // Try to find a subject containing any of the alternative terms
              for (const alt of alternatives) {
                matchedSubject = subjects.find(s => s.name.includes(alt));
                if (matchedSubject) break;
              }
              if (matchedSubject) break;
            }
          }
          
          // If still no match, just find anything that contains part of the name
          if (!matchedSubject) {
            matchedSubject = subjects.find(s => 
              s.name.toLowerCase().includes(subjectKeyword) || 
              subjectKeyword.includes(s.name.toLowerCase())
            );
          }
        }
        
        // If still no match, use the first subject as fallback
        if (!matchedSubject && subjects.length > 0) {
          matchedSubject = subjects[0];
        }
        
        // Get current image IDs
        const currentImageIds = [imageId];
        
        // Convert to QuestionFormData format
        return {
          subjectId: matchedSubject?.id || '',
          content: q.content,
          wrongAnswer: q.wrongAnswer,
          rightAnswer: q.rightAnswer,
          difficulty: q.difficulty,
          imageIds: currentImageIds,
        };
      });
      
      // Replace form data with new questions if current form is empty,
      // otherwise add the new questions to the existing list
      setFormData(prev => {
        if (prev.length === 1 && 
            !prev[0].subjectId && 
            !prev[0].content && 
            !prev[0].wrongAnswer && 
            !prev[0].rightAnswer) {
          return questionForms;
        }
        return [...prev, ...questionForms];
      });
      
      // Set current question to the first new one
      const newIndex = formData.length > 0 && formData[0].content 
        ? formData.length 
        : 0;
      setCurrentQuestionIndex(newIndex);
      
      // Automatically switch to manual mode to edit
      setActiveSource('manual');
      
    } catch (err) {
      console.error('Error analyzing image:', err);
      setAnalysisError(err instanceof Error ? err.message : 'Failed to analyze image');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const toggleQuestionSelection = (index: number) => {
    setAnalyzedQuestions(prev => 
      prev.map((q, i) => i === index ? { ...q, selected: !q.selected } : q)
    );
  };
  
  const addSelectedQuestionsToQueue = () => {
    // Get selected questions
    const selectedQuestions = analyzedQuestions
      .filter(q => q.selected)
      .map((q: AnalyzedQuestion) => {
        // Find subject ID by name - improved matching logic
        let matchedSubject: Subject | undefined;
        
        // First try to match by name
        matchedSubject = subjects.find(s => 
          s.name.toLowerCase() === q.subjectName.toLowerCase()
        );
        
        // If no exact match, try to find a subject that contains the subjectName
        if (!matchedSubject) {
          // Check for common subject patterns and map to appropriate subjects
          let subjectKeyword = q.subjectName.toLowerCase();
          
          // Map from detected keywords to likely subject areas
          const subjectMapping: {[key: string]: string[]} = {
            'math': ['数学', '算术'],
            'mathematics': ['数学', '算术'],
            'chinese': ['语文', '中文'],
            'english': ['英语', '外语'],
            'physics': ['物理'],
            'chemistry': ['化学'],
            'biology': ['生物'],
            'history': ['历史'],
            'geography': ['地理'],
            'politics': ['政治'],
            // Add more mappings as needed
          };
          
          // Look for keyword matches
          for (const [key, alternatives] of Object.entries(subjectMapping)) {
            if (subjectKeyword.includes(key)) {
              // Try to find a subject containing any of the alternative terms
              for (const alt of alternatives) {
                matchedSubject = subjects.find(s => s.name.includes(alt));
                if (matchedSubject) break;
              }
              if (matchedSubject) break;
            }
          }
          
          // If still no match, just find anything that contains part of the name
          if (!matchedSubject) {
            matchedSubject = subjects.find(s => 
              s.name.toLowerCase().includes(subjectKeyword) || 
              subjectKeyword.includes(s.name.toLowerCase())
            );
          }
        }
        
        // If still no match, use the first subject as fallback
        if (!matchedSubject && subjects.length > 0) {
          matchedSubject = subjects[0];
        }
        
        // Get current question's imageIds
        const currentImageIds = formData[currentQuestionIndex]?.imageIds || [];
        
        // Convert to QuestionFormData format
        return {
          subjectId: matchedSubject?.id || '',
          content: q.content,
          wrongAnswer: q.wrongAnswer,
          rightAnswer: q.rightAnswer,
          difficulty: q.difficulty,
          imageIds: [...currentImageIds], // Keep existing image IDs
        };
      });
    
    if (selectedQuestions.length === 0) {
      setError('Please select at least one question');
      return;
    }
    
    // Add to formData
    setFormData(prev => {
      // If there's only one empty item, replace it
      if (prev.length === 1 && 
          !prev[0].subjectId && 
          !prev[0].content && 
          !prev[0].wrongAnswer && 
          !prev[0].rightAnswer) {
        return selectedQuestions;
      }
      // Otherwise add to the existing array
      return [...prev, ...selectedQuestions];
    });
    
    // Set current question to the first new one
    setCurrentQuestionIndex(formData.length > 0 && formData[0].content ? formData.length : 0);
    
    // Clear analyzed questions
    setAnalyzedQuestions([]);
  };
  
  const selectQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };
  
  const removeQuestion = (index: number) => {
    setFormData(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // Always have at least one form
      if (updated.length === 0) {
        updated.push({
          subjectId: '',
          content: '',
          wrongAnswer: '',
          rightAnswer: '',
          difficulty: 3,
          imageIds: [],
        });
      }
      return updated;
    });
    
    // Adjust current question index
    setCurrentQuestionIndex(prev => {
      if (prev >= index) {
        return Math.max(0, prev - 1);
      }
      return prev;
    });
  };
  
  const addNewQuestion = () => {
    // Add a new empty question to the form data
    setFormData(prev => [
      ...prev,
      {
        subjectId: '',
        content: '',
        wrongAnswer: '',
        rightAnswer: '',
        difficulty: 3,
        imageIds: [...(prev[currentQuestionIndex]?.imageIds || [])], // Copy images from current question
      }
    ]);
    
    // Set current index to the new question
    setCurrentQuestionIndex(formData.length);
  };
  
  const handleSubmitAllQuestions = async () => {
    if (formData.length === 0) {
      setError('No questions to submit');
      return;
    }
    
    setIsLoading(true);
    let failures = 0;
    
    for (let i = 0; i < formData.length; i++) {
      try {
        const question = formData[i];
        
        // Skip incomplete questions
        if (!question.subjectId || !question.content) {
          failures++;
          continue;
        }
        
        const response = await fetch(`/${locale}/api/questions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(question),
        });
        
        if (!response.ok) {
          failures++;
        }
      } catch (err) {
        failures++;
        console.error('Error submitting question:', err);
      }
    }
    
    setIsLoading(false);
    
    if (failures > 0) {
      alert(`已保存 ${formData.length - failures} 个问题，${failures} 个问题保存失败。`);
    } else {
      alert(`成功保存了 ${formData.length} 个问题！`);
    }
    
    // Reset form with one empty question
    setFormData([{
      subjectId: '',
      content: '',
      wrongAnswer: '',
      rightAnswer: '',
      difficulty: 3,
      imageIds: [],
    }]);
    setCurrentQuestionIndex(0);
    
    // Redirect to questions page
    router.push(`/${locale}/questions`);
  };

  const editImage = (imageId: string) => {
    // Set the current image ID to the current form's imageIds array
    setFormData(prev => {
      const updated = [...prev];
      if (updated[currentQuestionIndex]) {
        updated[currentQuestionIndex] = {
          ...updated[currentQuestionIndex],
          imageIds: [imageId]
        };
      }
      return updated;
    });
    
    // Analyze the image with OpenAI
    analyzeImage(imageId);
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
                    {image.processingStatus || 'UPLOADED'}
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
      
      {/* Error message for analysis */}
      {analysisError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {analysisError}
          <button 
            className="ml-2 text-red-700" 
            onClick={() => setAnalysisError('')}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
      
      {/* Loading indicator for analysis */}
      {isAnalyzing && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-3 rounded-lg mb-4 flex items-center">
          <i className="fas fa-spinner fa-spin mr-2"></i>
          Analyzing image with AI...
        </div>
      )}
      
      {/* Manual Input UI */}
      {activeSource === 'manual' && (
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">添加错题</h2>
          
          {/* Question tabs */}
          {formData.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium">题目列表 ({formData.length})</h3>
                <div className="flex space-x-2">
                  <button 
                    className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                    onClick={addNewQuestion}
                  >
                    新增题目
                  </button>
                  <button 
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                    onClick={handleSubmitAllQuestions}
                    disabled={isLoading}
                  >
                    {isLoading ? '提交中...' : '提交全部'}
                  </button>
                </div>
              </div>
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {formData.map((question, index) => (
                  <div 
                    key={index} 
                    className={`flex-shrink-0 w-40 border rounded-lg p-2 cursor-pointer ${
                      index === currentQuestionIndex 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-gray-200'
                    }`}
                    onClick={() => selectQuestion(index)}
                  >
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                      <button 
                        className="text-xs text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeQuestion(index);
                        }}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    <p className="text-xs text-gray-700 mb-1 truncate">{question.content || "空题目"}</p>
                    <div className="flex justify-between items-center">
                      <div className="text-yellow-500">
                        {[1, 2, 3, 4, 5].map(level => (
                          <i 
                            key={level}
                            className={`${level <= question.difficulty ? 'fas' : 'far'} fa-star text-xs`}
                            style={{ fontSize: '0.6rem' }}
                          ></i>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Question Form */}
          {formData.length > 0 && (
            <form className="space-y-4" onSubmit={handleSubmitQuestion}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">科目</label>
                <select 
                  name="subjectId"
                  value={formData[currentQuestionIndex]?.subjectId || ''}
                  onChange={handleInputChange}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">选择科目</option>
                  
                  {Object.keys(subjectGroups).map(level => (
                    subjectGroups[level].length > 0 && (
                      <optgroup key={level} label={level}>
                        {subjectGroups[level].map(subject => (
                          <option key={subject.id} value={subject.id}>
                            {subject.name}
                          </option>
                        ))}
                      </optgroup>
                    )
                  ))}
                  
                  {/* Fallback to flat list if grouping doesn't work */}
                  {Object.keys(subjectGroups).length === 0 && subjects.map(subject => (
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
                  value={formData[currentQuestionIndex]?.content || ''}
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
                  value={formData[currentQuestionIndex]?.wrongAnswer || ''}
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
                  value={formData[currentQuestionIndex]?.rightAnswer || ''}
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
                      className={`${level <= (formData[currentQuestionIndex]?.difficulty || 3) ? 'fas' : 'far'} fa-star mr-1 cursor-pointer`}
                      onClick={() => setDifficulty(level)}
                    ></i>
                  ))}
                </div>
              </div>
              
              {formData[currentQuestionIndex]?.imageIds.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">已选图片</label>
                  <div className="flex gap-2">
                    {formData[currentQuestionIndex]?.imageIds.map(id => {
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
                            onClick={() => {
                              setFormData(prev => {
                                const updated = [...prev];
                                if (updated[currentQuestionIndex]) {
                                  updated[currentQuestionIndex] = {
                                    ...updated[currentQuestionIndex],
                                    imageIds: updated[currentQuestionIndex].imageIds.filter(imgId => imgId !== id)
                                  };
                                }
                                return updated;
                              });
                            }}
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
                  disabled={isLoading || !formData[currentQuestionIndex]?.subjectId || !formData[currentQuestionIndex]?.content}
                  className={`w-full py-3 px-4 rounded-lg shadow-sm text-white font-medium 
                    ${isLoading || !formData[currentQuestionIndex]?.subjectId || !formData[currentQuestionIndex]?.content 
                      ? 'bg-indigo-400' 
                      : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                  {isLoading ? '保存中...' : `保存当前题目 (${currentQuestionIndex + 1}/${formData.length})`}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
} 