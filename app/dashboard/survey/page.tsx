// app/dashboard/survey/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, ExternalLink, Trash2, Edit2, Link as LinkIcon, Eye, X, RefreshCw, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { surveyApi, Survey, SurveyStats } from '@/lib/surveyApi';

export default function SurveyPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [stats, setStats] = useState<SurveyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewSurvey, setPreviewSurvey] = useState<Survey | null>(null);
  
  const [surveyTitle, setSurveyTitle] = useState('');
  const [surveyUrl, setSurveyUrl] = useState('');
  const [surveyStatus, setSurveyStatus] = useState<'active' | 'inactive' | 'draft'>('draft');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>('');

  // Load data
  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [surveysData, statsData] = await Promise.all([
        surveyApi.getAll(false, filterStatus),
        surveyApi.getStats(),
      ]);
      setSurveys(surveysData);
      setStats(statsData);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Өгөгдөл татахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  // Google Forms URL-ийг embed хэлбэрт хувиргах
  const getEmbedUrl = (url: string) => {
    if (url.includes('forms.google.com') || url.includes('docs.google.com/forms')) {
      return url.replace('/viewform', '/viewform?embedded=true');
    }
    return url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      if (editingId) {
        // Update
        await surveyApi.update(editingId, {
          title: surveyTitle,
          embed_url: surveyUrl,
          status: surveyStatus,
        });
      } else {
        // Create
        await surveyApi.create({
          title: surveyTitle,
          embed_url: surveyUrl,
          status: surveyStatus,
        });
      }

      await fetchData();
      handleCloseModal();
    } catch (err) {
      console.error('Submit error:', err);
      setError(editingId ? 'Шинэчлэхэд алдаа гарлаа' : 'Үүсгэхэд алдаа гарлаа');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (survey: Survey) => {
    setSurveyTitle(survey.title);
    setSurveyUrl(survey.embed_url);
    setSurveyStatus(survey.status);
    setEditingId(survey.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Энэ санал асуулгыг устгах уу?')) return;

    setActionLoading(true);
    try {
      await surveyApi.delete(id);
      await fetchData();
    } catch (err) {
      console.error('Delete error:', err);
      setError('Устгахад алдаа гарлаа');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePreview = (survey: Survey) => {
    setPreviewSurvey(survey);
    setShowPreviewModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSurveyTitle('');
    setSurveyUrl('');
    setSurveyStatus('draft');
    setEditingId(null);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-700 border-green-300',
      inactive: 'bg-gray-100 text-gray-700 border-gray-300',
      draft: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    };

    const labels = {
      active: 'Идэвхтэй',
      inactive: 'Идэвхгүй',
      draft: 'Ноорог',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-semibold">Ачааллаж байна...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header with Stats */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
              Санал асуулага
            </h1>
            <p className="text-gray-600 text-lg">
              Google Forms болон бусад санал асуулгын холбоосуудыг удирдах
            </p>
          </div>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchData}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-bold transition-all duration-300"
            >
              <RefreshCw size={20} />
              Шинэчлэх
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all duration-300"
            >
              <Plus size={20} />
              Шинэ санал асуулага
            </motion.button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-black text-gray-800">{stats.total}</p>
                  <p className="text-xs text-gray-600">Нийт</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <div>
                  <p className="text-2xl font-black text-gray-800">{stats.active}</p>
                  <p className="text-xs text-gray-600">Идэвхтэй</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                </div>
                <div>
                  <p className="text-2xl font-black text-gray-800">{stats.inactive}</p>
                  <p className="text-xs text-gray-600">Идэвхгүй</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                </div>
                <div>
                  <p className="text-2xl font-black text-gray-800">{stats.draft}</p>
                  <p className="text-xs text-gray-600">Ноорог</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Trash2 size={16} className="text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-black text-gray-800">{stats.deleted}</p>
                  <p className="text-xs text-gray-600">Устгасан</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filterStatus === '' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Бүгд
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filterStatus === 'active' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Идэвхтэй
          </button>
          <button
            onClick={() => setFilterStatus('draft')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filterStatus === 'draft' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Ноорог
          </button>
          <button
            onClick={() => setFilterStatus('inactive')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filterStatus === 'inactive' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Идэвхгүй
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-xl p-4">
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
      )}

      {/* Surveys Grid */}
      {surveys.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surveys.map((survey) => (
            <motion.div
              key={survey.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              {/* Preview Thumbnail */}
              <div
                className="relative h-48 bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden group cursor-pointer"
                onClick={() => handlePreview(survey)}
              >
                <iframe
                  src={getEmbedUrl(survey.embed_url)}
                  className="w-full h-full pointer-events-none scale-50 origin-top-left"
                  style={{ width: '200%', height: '200%' }}
                  title={survey.title}
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="text-white text-center">
                    <Eye size={40} className="mx-auto mb-2" />
                    <p className="font-bold">Харах</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Survey Title & Status */}
                <div className="mb-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-xl font-bold text-gray-800 line-clamp-2 flex-1">
                      {survey.title}
                    </h3>
                    {getStatusBadge(survey.status)}
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(survey.created_at).toLocaleDateString('mn-MN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                {/* URL */}
                <a
                  href={survey.embed_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm mb-4 group"
                >
                  <LinkIcon size={16} className="group-hover:rotate-12 transition-transform" />
                  <span className="truncate flex-1">{survey.embed_url}</span>
                  <ExternalLink size={16} />
                </a>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleEdit(survey)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50"
                  >
                    <Edit2 size={16} />
                    Засах
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDelete(survey.id)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                    Устгах
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="inline-block p-6 bg-gray-100 rounded-full mb-4">
            <LinkIcon size={48} className="text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            Санал асуулга байхгүй байна
          </h3>
          <p className="text-gray-600 mb-6">
            {filterStatus
              ? `"${filterStatus}" статустай санал асуулга олдсонгүй`
              : 'Эхний санал асуулгаа үүсгэж эхлээрэй!'}
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-bold"
          >
            <Plus size={20} />
            Шинэ санал асуулага
          </button>
        </div>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreviewModal && previewSurvey && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col"
          >
            <div className="bg-white/10 backdrop-blur-md border-b border-white/20 p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-bold text-white">
                  {previewSurvey.title}
                </h3>
                {getStatusBadge(previewSurvey.status)}
                <a
                  href={previewSurvey.embed_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-300 hover:text-blue-200 text-sm"
                >
                  <ExternalLink size={16} />
                  Шинэ tab-д нээх
                </a>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowPreviewModal(false)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300"
              >
                <X size={24} className="text-white" />
              </motion.button>
            </div>

            <div className="flex-1 p-4">
              <iframe
                src={getEmbedUrl(previewSurvey.embed_url)}
                className="w-full h-full rounded-2xl bg-white shadow-2xl"
                title={previewSurvey.title}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full"
            >
              <div className="mb-6">
                <h2 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
                  {editingId ? 'Санал асуулга засах' : 'Шинэ санал асуулага'}
                </h2>
                <p className="text-gray-600">
                  Санал асуулагын мэдээллийг оруулна уу
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Санал асуулагын нэр
                  </label>
                  <input
                    type="text"
                    value={surveyTitle}
                    onChange={(e) => setSurveyTitle(e.target.value)}
                    placeholder="Жишээ: Ажилчдын сэтгэл ханамжийн судалгаа"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    URL холбоос
                  </label>
                  <input
                    type="url"
                    value={surveyUrl}
                    onChange={(e) => setSurveyUrl(e.target.value)}
                    placeholder="https://forms.google.com/..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 outline-none"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Google Forms эсвэл бусад санал асуулгын холбоос
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Статус
                  </label>
                  <select
                    value={surveyStatus}
                    onChange={(e) => setSurveyStatus(e.target.value as 'active' | 'inactive' | 'draft')}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 outline-none"
                  >
                    <option value="draft">Ноорог</option>
                    <option value="active">Идэвхтэй</option>
                    <option value="inactive">Идэвхгүй</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={actionLoading}
                    className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all duration-300 disabled:opacity-50"
                  >
                    Болих
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        Түр хүлээнэ үү...
                      </>
                    ) : (
                      <>{editingId ? 'Хадгалах' : 'Үүсгэх'}</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}