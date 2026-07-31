// app/dashboard/survey/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, ExternalLink, Trash2, Edit2, Link as LinkIcon, Eye, X, RefreshCw, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { surveyApi, Survey, SurveyStats } from '@/lib/surveyApi';

const ITEMS_PER_PAGE = 9;

// ---- Shared glass tokens (matching Dashboard / Sidebar / Header / News / VideoNews / RnD pages) ----
const GLASS_PANEL =
  'rounded-2xl border border-white/12 bg-white/[0.05] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.35)]';
const GLASS_OUTLINE_BTN =
  'border border-white/15 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white';

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const [jumpValue, setJumpValue] = useState('');

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
    .reduce<(number | '...')[]>((acc, p, idx, arr) => {
      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
      acc.push(p);
      return acc;
    }, []);

  const handleJump = () => {
    const page = parseInt(jumpValue, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page);
      setJumpValue('');
    }
  };

  if (totalPages <= 1) return null;

  return (
    <div className={`flex flex-wrap items-center justify-center gap-2 mt-8 p-3 ${GLASS_PANEL}`}>
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className={`px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-40 transition ${GLASS_OUTLINE_BTN}`}
      >
        Эхлэл
      </button>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-40 transition ${GLASS_OUTLINE_BTN}`}
      >
        Өмнөх
      </button>

      <div className="flex items-center gap-1">
        {pageNumbers.map((p, idx) =>
          p === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-sm text-white/35">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`w-9 h-9 rounded-lg text-sm font-semibold transition ${
                p === currentPage
                  ? 'bg-blue-500 text-white shadow-[0_0_16px_rgba(59,130,246,0.45)]'
                  : GLASS_OUTLINE_BTN
              }`}
            >
              {p}
            </button>
          )
        )}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-40 transition ${GLASS_OUTLINE_BTN}`}
      >
        Дараагийн
      </button>
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className={`px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-40 transition ${GLASS_OUTLINE_BTN}`}
      >
        Төгсгөл
      </button>

      <div className="flex items-center gap-1.5 ml-2 pl-3 border-l border-white/15">
        <span className="text-xs text-white/40 whitespace-nowrap">Хуудас:</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={jumpValue}
          onChange={(e) => setJumpValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleJump()}
          placeholder={`${currentPage}`}
          className="w-14 h-8 text-xs text-center rounded-lg border border-white/15 bg-white/5 text-white outline-none focus:border-white/30"
        />
        <span className="text-xs text-white/40">/ {totalPages}</span>
        <button
          onClick={handleJump}
          className={`px-2.5 h-8 rounded-lg text-xs font-semibold transition ${GLASS_OUTLINE_BTN}`}
        >
          Очих
        </button>
      </div>
    </div>
  );
}

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
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  useEffect(() => {
    setCurrentPage(1);
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
        await surveyApi.update(editingId, {
          title: surveyTitle,
          embed_url: surveyUrl,
          status: surveyStatus,
        });
      } else {
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
      active: 'bg-emerald-400/15 text-emerald-200 border-emerald-400/25',
      inactive: 'bg-white/10 text-white/60 border-white/15',
      draft: 'bg-amber-400/15 text-amber-200 border-amber-400/25',
    };

    const labels = {
      active: 'Идэвхтэй',
      inactive: 'Идэвхгүй',
      draft: 'Ноорог',
    };

    return (
      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const totalPages = Math.max(1, Math.ceil(surveys.length / ITEMS_PER_PAGE));
  const paginatedSurveys = surveys.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
            <p className="text-white/45 text-sm">Ачааллаж байна...</p>
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
            <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">
              Санал асуулага
            </h1>
            <p className="text-white/45 text-sm">
              Google Forms болон бусад санал асуулгын холбоосуудыг удирдах
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={fetchData}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${GLASS_OUTLINE_BTN}`}
            >
              <RefreshCw size={16} />
              Шинэчлэх
            </button>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-blue-500/90 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer shadow-[0_0_20px_rgba(59,130,246,0.35)]"
            >
              <Plus size={16} />
              Шинэ санал асуулага
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className={`p-4 ${GLASS_PANEL}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-400/15">
                  <BarChart3 size={18} className="text-blue-300" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{stats.total}</p>
                  <p className="text-xs text-white/45">Нийт</p>
                </div>
              </div>
            </div>

            <div className={`p-4 ${GLASS_PANEL}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-400/15">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{stats.active}</p>
                  <p className="text-xs text-white/45">Идэвхтэй</p>
                </div>
              </div>
            </div>

            <div className={`p-4 ${GLASS_PANEL}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/10">
                  <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{stats.inactive}</p>
                  <p className="text-xs text-white/45">Идэвхгүй</p>
                </div>
              </div>
            </div>

            <div className={`p-4 ${GLASS_PANEL}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-400/15">
                  <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{stats.draft}</p>
                  <p className="text-xs text-white/45">Ноорог</p>
                </div>
              </div>
            </div>

            <div className={`p-4 ${GLASS_PANEL}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-400/15">
                  <Trash2 size={16} className="text-red-300" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{stats.deleted}</p>
                  <p className="text-xs text-white/45">Устгасан</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2">
          {[
            { value: '', label: 'Бүгд', active: 'bg-blue-500 shadow-[0_0_16px_rgba(59,130,246,0.4)]' },
            { value: 'active', label: 'Идэвхтэй', active: 'bg-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.4)]' },
            { value: 'draft', label: 'Ноорог', active: 'bg-amber-500 shadow-[0_0_16px_rgba(245,158,11,0.4)]' },
            { value: 'inactive', label: 'Идэвхгүй', active: 'bg-white/25' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterStatus(f.value)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${
                filterStatus === f.value
                  ? `${f.active} text-white`
                  : GLASS_OUTLINE_BTN
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-400/10 border border-red-400/30 backdrop-blur-xl rounded-2xl p-3">
          <p className="text-red-200 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Surveys Grid */}
      {surveys.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedSurveys.map((survey) => (
              <div
                key={survey.id}
                className={`overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:bg-white/[0.08] ${GLASS_PANEL}`}
              >
                <div
                  className="relative h-32 bg-white/[0.03] overflow-hidden group cursor-pointer"
                  onClick={() => handlePreview(survey)}
                >
                  <iframe
                    src={getEmbedUrl(survey.embed_url)}
                    className="w-full h-full pointer-events-none scale-50 origin-top-left"
                    style={{ width: '200%', height: '200%' }}
                    title={survey.title}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <div className="text-white text-center">
                      <Eye size={24} className="mx-auto mb-1" />
                      <p className="text-xs font-semibold">Харах</p>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="mb-3">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="text-sm font-semibold text-white line-clamp-2 flex-1">
                        {survey.title}
                      </h3>
                      {getStatusBadge(survey.status)}
                    </div>
                    <p className="text-xs text-white/35">
                      {new Date(survey.created_at).toLocaleDateString('mn-MN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  <a
                    href={survey.embed_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-blue-300 hover:text-blue-200 text-xs mb-3"
                  >
                    <LinkIcon size={13} />
                    <span className="truncate flex-1">{survey.embed_url}</span>
                    <ExternalLink size={13} />
                  </a>

                  <div className="flex gap-2 pt-3 border-t border-white/10">
                    <button
                      onClick={() => handleEdit(survey)}
                      disabled={actionLoading}
                      className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold transition disabled:opacity-50 cursor-pointer ${GLASS_OUTLINE_BTN}`}
                    >
                      <Edit2 size={13} />
                      Засах
                    </button>
                    <button
                      onClick={() => handleDelete(survey.id)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-300 h-8 rounded-lg text-xs font-semibold transition disabled:opacity-50 border border-red-400/20 cursor-pointer"
                    >
                      <Trash2 size={13} />
                      Устгах
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      ) : (
        <div className={`text-center py-16 ${GLASS_PANEL}`}>
          <div className="inline-block p-5 bg-white/5 rounded-full mb-4">
            <LinkIcon size={36} className="text-white/25" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">
            Санал асуулга байхгүй байна
          </h3>
          <p className="text-white/45 text-sm mb-5">
            {filterStatus
              ? `"${filterStatus}" статустай санал асуулга олдсонгүй`
              : 'Эхний санал асуулгаа үүсгэж эхлээрэй!'}
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-blue-500/90 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition shadow-[0_0_20px_rgba(59,130,246,0.35)] cursor-pointer"
          >
            <Plus size={16} />
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
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/85 z-50 flex flex-col"
          >
            <div className="bg-white/10 backdrop-blur-md border-b border-white/10 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold text-white">
                  {previewSurvey.title}
                </h3>
                {getStatusBadge(previewSurvey.status)}
                <a
                  href={previewSurvey.embed_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-blue-300 hover:text-blue-200 text-xs"
                >
                  <ExternalLink size={13} />
                  Шинэ tab-д нээх
                </a>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
              >
                <X size={18} className="text-white" />
              </button>
            </div>

            <div className="flex-1 p-4">
              <iframe
                src={getEmbedUrl(previewSurvey.embed_url)}
                className="w-full h-full rounded-xl bg-white"
                title={previewSurvey.title}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create/Edit Modal — plain white surface, same as the other editors, since typing over glass is hard to read */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-6 max-w-lg w-full"
            >
              <div className="mb-5">
                <h2 className="text-lg font-bold text-gray-800 mb-1">
                  {editingId ? 'Санал асуулга засах' : 'Шинэ санал асуулага'}
                </h2>
                <p className="text-gray-500 text-sm">
                  Санал асуулагын мэдээллийг оруулна уу
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Санал асуулагын нэр
                  </label>
                  <input
                    type="text"
                    value={surveyTitle}
                    onChange={(e) => setSurveyTitle(e.target.value)}
                    placeholder="Жишээ: Ажилчдын сэтгэл ханамжийн судалгаа"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    URL холбоос
                  </label>
                  <input
                    type="url"
                    value={surveyUrl}
                    onChange={(e) => setSurveyUrl(e.target.value)}
                    placeholder="https://forms.google.com/..."
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition outline-none"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1.5">
                    Google Forms эсвэл бусад санал асуулгын холбоос
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Статус
                  </label>
                  <select
                    value={surveyStatus}
                    onChange={(e) => setSurveyStatus(e.target.value as 'active' | 'inactive' | 'draft')}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition outline-none"
                  >
                    <option value="draft">Ноорог</option>
                    <option value="active">Идэвхтэй</option>
                    <option value="inactive">Идэвхгүй</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                  >
                    Болих
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
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