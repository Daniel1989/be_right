'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

// Define types for the data
type Subject = {
  id: string;
  name: string;
  color: string;
  icon: string;
};

type QuestionImage = {
  id: string;
  url: string;
};

type Question = {
  id: string;
  text: string;
  answer: string;
  notes: string;
  difficulty: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  subject: Subject;
  images: QuestionImage[];
};

type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export default function CollectionPage() {
  const t = useTranslations('navigation');
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchSubjects();
    fetchQuestions();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [selectedSubjectId, pagination.page]);

  const fetchSubjects = async () => {
    try {
      const response = await fetch(`/${locale}/api/subjects`);
      if (!response.ok) {
        throw new Error('Failed to fetch subjects');
      }
      
      const data = await response.json();
      if (data.success) {
        setSubjects(data.data);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError('Failed to load subjects');
    }
  };

  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      
      // Build the API URL with query parameters
      let url = `/${locale}/api/questions?page=${pagination.page}&limit=${pagination.limit}`;
      if (selectedSubjectId) {
        url += `&subjectId=${selectedSubjectId}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }
      
      const data = await response.json();
      if (data.success) {
        setQuestions(data.data);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubjectFilter = (subjectId: string | null) => {
    setSelectedSubjectId(subjectId);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleDeleteQuestion = async (questionId: string) => {
    // If not confirmed yet, just set the confirmation state
    if (confirmDelete !== questionId) {
      setConfirmDelete(questionId);
      return;
    }
    
    try {
      setIsDeleting(questionId);
      setError('');
      
      const response = await fetch(`/${locale}/api/questions`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questionId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete question');
      }
      
      // Remove the deleted question from the state
      setQuestions(prevQuestions => 
        prevQuestions.filter(q => q.id !== questionId)
      );
      
      // Reset confirmation state
      setConfirmDelete(null);
      
      // Check if we need to adjust pagination
      if (questions.length === 1 && pagination.page > 1) {
        setPagination(prev => ({
          ...prev,
          page: prev.page - 1
        }));
      }
    } catch (err) {
      console.error('Error deleting question:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete question');
    } finally {
      setIsDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SOLVED':
        return 'bg-green-50 text-green-700';
      case 'PENDING':
        return 'bg-yellow-50 text-yellow-700';
      case 'SKIPPED':
        return 'bg-red-50 text-red-700';
      case 'REVIEWED':
        return 'bg-blue-50 text-blue-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SOLVED':
        return '已解决';
      case 'PENDING':
        return '待解决';
      case 'SKIPPED':
        return '已跳过';
      case 'REVIEWED':
        return '已复习';
      default:
        return status;
    }
  };

  return (
    <div className="container mx-auto p-4 pb-16">
      <h1 className="text-2xl font-bold mb-6">{t('collection')}</h1>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 flex justify-between">
          <div>{error}</div>
          <button onClick={() => setError('')} className="text-red-700">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium">科目筛选</h3>
          <button 
            className="text-indigo-600 text-sm"
            onClick={() => handleSubjectFilter(null)}
          >
            查看全部
          </button>
        </div>
        
        <div className="flex overflow-x-auto pb-2 space-x-2">
          <div 
            className={`px-3 py-1 ${selectedSubjectId === null ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'} rounded-full text-sm whitespace-nowrap cursor-pointer`}
            onClick={() => handleSubjectFilter(null)}
          >
            全部
          </div>
          
          {subjects.map(subject => (
            <div 
              key={subject.id}
              className={`px-3 py-1 ${selectedSubjectId === subject.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'} rounded-full text-sm whitespace-nowrap cursor-pointer`}
              onClick={() => handleSubjectFilter(subject.id)}
              style={{ borderColor: subject.color }}
            >
              {subject.name}
            </div>
          ))}
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : questions.length > 0 ? (
        <div className="bg-white rounded-lg shadow divide-y">
          {questions.map(question => (
            <div key={question.id} className="p-4">
              <div className="flex items-center mb-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
                  style={{ backgroundColor: `${question.subject.color}25`, color: question.subject.color }}
                >
                  <i className={`fas fa-${question.subject.icon || 'book'}`}></i>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{question.subject.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">添加于: {formatDate(question.createdAt)}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`${getStatusColor(question.status)} text-xs px-2 py-1 rounded`}>
                    {getStatusText(question.status)}
                  </div>
                  <button 
                    className={`text-gray-400 hover:text-red-500 transition-colors ${isDeleting === question.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => handleDeleteQuestion(question.id)}
                    disabled={isDeleting === question.id}
                  >
                    {isDeleting === question.id ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : confirmDelete === question.id ? (
                      <i className="fas fa-check text-red-500"></i>
                    ) : (
                      <i className="fas fa-trash-alt"></i>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="mb-3">
                <p className="text-sm text-gray-800">{question.text}</p>
              </div>
              
              {question.images.length > 0 && (
                <div className="flex gap-2 mb-3 overflow-x-auto">
                  {question.images.map(image => (
                    <div key={image.id} className="w-20 h-20 flex-shrink-0 rounded overflow-hidden">
                      <Image 
                        src={image.url} 
                        alt="Question" 
                        width={80} 
                        height={80} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-red-50 rounded">
                  <span className="text-red-700 font-medium">错误答案:</span>
                  <p className="mt-1">{question.notes || '无'}</p>
                </div>
                <div className="p-2 bg-green-50 rounded">
                  <span className="text-green-700 font-medium">正确答案:</span>
                  <p className="mt-1">{question.answer || '无'}</p>
                </div>
              </div>
              
              {confirmDelete === question.id && (
                <div className="mt-3 p-2 bg-red-50 rounded-lg text-sm text-center">
                  <p className="text-red-700 mb-2">确认删除此题目吗？此操作不可撤销。</p>
                  <div className="flex space-x-2 justify-center">
                    <button 
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded"
                      onClick={() => setConfirmDelete(null)}
                    >
                      取消
                    </button>
                    <button 
                      className="px-3 py-1 bg-red-600 text-white rounded"
                      onClick={() => handleDeleteQuestion(question.id)}
                      disabled={isDeleting === question.id}
                    >
                      {isDeleting === question.id ? '删除中...' : '确认删除'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
          <div className="text-4xl text-gray-300 mb-3">
            <i className="fas fa-book-open"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">暂无错题</h3>
          <p className="text-gray-500 text-sm">
            您还没有添加任何错题，可以通过"添加"页面添加新的错题。
          </p>
        </div>
      )}
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex space-x-1">
            <button 
              className="px-3 py-1 rounded bg-gray-100 text-gray-600 disabled:opacity-50"
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              上一页
            </button>
            
            <span className="px-3 py-1">
              {pagination.page} / {pagination.totalPages}
            </span>
            
            <button 
              className="px-3 py-1 rounded bg-gray-100 text-gray-600 disabled:opacity-50"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 