import { useState, useEffect } from 'react';
import { Plus, Search, CheckSquare, Trash2, FileText, Clock, Award, RefreshCw, HelpCircle, UserCheck, Eye, CheckCircle2, XCircle } from 'lucide-react';
import { AddPracticeTestModal } from './AddPracticeTestModal';
import { API_BASE_URL } from '../config/api';

export const PracticeTestsManagement = () => {
  const [activeTab, setActiveTab] = useState<'tests' | 'results'>('tests');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [tests, setTests] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTestModal, setSelectedTestModal] = useState<any | null>(null);
  const [selectedResultTest, setSelectedResultTest] = useState<any | null>(null);
  const [selectedAttemptModal, setSelectedAttemptModal] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [testsRes, attemptsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/tests`),
        fetch(`${API_BASE_URL}/api/tests/results`)
      ]);

      if (testsRes.ok) {
        const testData = await testsRes.json();
        setTests(Array.isArray(testData) ? testData : []);
      }

      if (attemptsRes.ok) {
        const attemptData = await attemptsRes.json();
        setAttempts(Array.isArray(attemptData) ? attemptData : []);
      }
    } catch (err) {
      console.error('Failed to fetch practice test data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteTest = async (id: string) => {
    if (!confirm('Are you sure you want to delete this practice test?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/tests/${id}`, {

        method: 'DELETE'
      });
      if (res.ok) {
        setTests(tests.filter(t => (t._id || t.id) !== id));
      } else {
        alert('Failed to delete practice test');
      }
    } catch (err) {
      console.error('Error deleting test:', err);
      alert('Error deleting practice test');
    }
  };

  const filteredTests = tests.filter(t =>
    t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAttempts = attempts.filter(att => {
    const studentName = typeof att.studentId === 'object' ? (att.studentId?.fullName || att.studentId?.email || '') : String(att.studentId || '');
    const testTitle = typeof att.testId === 'object' ? (att.testId?.title || '') : String(att.testId || '');
    const term = searchTerm.toLowerCase();
    return studentName.toLowerCase().includes(term) || testTitle.toLowerCase().includes(term);
  });

  const getTestAttempts = (testId: string) => {
    return attempts.filter(a => {
      const aTestId = typeof a.testId === 'object' ? (a.testId?._id || a.testId?.id) : a.testId;
      return aTestId?.toString() === testId?.toString();
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Practice Tests & Student Evaluation</h2>
          <p className="text-sm text-gray-500">Manage mock exams, view student submissions, and analyze test performance</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-md transition-colors text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Test
        </button>
      </div>

      {/* Navigation Tabs & Search Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'tests'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Practice Tests ({tests.length})
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'results'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Student Results & Submissions ({attempts.length})
          </button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={activeTab === 'tests' ? "Search practice tests..." : "Search student results..."} 
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm text-gray-900"
            />
          </div>
          <button
            onClick={fetchData}
            title="Refresh Data"
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Content Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-red-600" />
            <p className="text-sm font-semibold">Loading practice tests and student results...</p>
          </div>
        ) : activeTab === 'tests' ? (
          filteredTests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-bold">Test Info</th>
                    <th className="px-6 py-4 font-bold">Subject</th>
                    <th className="px-6 py-4 font-bold">Duration</th>
                    <th className="px-6 py-4 font-bold">Passing Score</th>
                    <th className="px-6 py-4 font-bold">Questions</th>
                    <th className="px-6 py-4 font-bold">Student Submissions</th>
                    <th className="px-6 py-4 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredTests.map((test) => {
                    const testId = test._id || test.id;
                    const questionCount = test.questions ? test.questions.length : 0;
                    const testSubmissions = getTestAttempts(testId);

                    return (
                      <tr key={testId} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900">{test.title}</p>
                          {test.description && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{test.description}</p>}
                        </td>

                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-red-50 text-red-700 font-bold rounded-full text-xs border border-red-100">
                            {test.subject || 'General'}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-gray-700 font-medium text-xs">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span>{test.durationMinutes || 30} Mins</span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-gray-700 font-medium text-xs">
                          <div className="flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-amber-500" />
                            <span>{test.passingScore || 50}%</span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold text-gray-800 flex items-center gap-1">
                              <HelpCircle className="w-3.5 h-3.5 text-red-500" />
                              {questionCount} Questions
                            </span>
                          </div>
                        </td>

                        {/* Submissions Column */}
                        <td className="px-6 py-4">
                          {testSubmissions.length > 0 ? (
                            <button
                              onClick={() => setSelectedResultTest({ test, attempts: testSubmissions })}
                              className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{testSubmissions.length} Student Result(s)</span>
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No submissions yet</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {questionCount > 0 && (
                              <button
                                onClick={() => setSelectedTestModal(test)}
                                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" /> Questions
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteTest(testId)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete test"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 flex flex-col items-center justify-center text-gray-500">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <CheckSquare className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No practice tests found</h3>
              <p className="text-sm">Click "Create Test" to add a new practice test.</p>
            </div>
          )
        ) : (
          /* Student Submissions Tab */
          filteredAttempts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-bold">Student</th>
                    <th className="px-6 py-4 font-bold">Test Title & Subject</th>
                    <th className="px-6 py-4 font-bold">Score</th>
                    <th className="px-6 py-4 font-bold">Percentage</th>
                    <th className="px-6 py-4 font-bold">Result Status</th>
                    <th className="px-6 py-4 font-bold">Date Submitted</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredAttempts.map((attempt) => {
                    const student = attempt.studentId || {};
                    const test = attempt.testId || {};
                    const passScore = test.passingScore || 50;
                    const isPassed = attempt.percentage >= passScore;

                    return (
                      <tr key={attempt._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center text-sm border border-red-200">
                              {(student.fullName || 'S').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{student.fullName || 'Student'}</p>
                              <p className="text-xs text-gray-500">{student.email || student.studentId || 'N/A'}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900">{test.title || 'Practice Test'}</p>
                          <span className="px-2.5 py-0.5 bg-red-50 text-red-700 font-bold rounded-full text-[11px]">
                            {test.subject || 'General'}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-gray-900 font-bold">
                          {attempt.score} Marks
                          <span className="text-xs text-gray-400 font-normal block">({attempt.correctCount} Correct)</span>
                        </td>

                        <td className="px-6 py-4 font-extrabold text-base">
                          <span className={isPassed ? 'text-emerald-600' : 'text-red-600'}>
                            {attempt.percentage}%
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          {isPassed ? (
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold rounded-full text-xs flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> PASSED
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 font-bold rounded-full text-xs flex items-center gap-1 w-fit">
                              <XCircle className="w-3.5 h-3.5 text-red-600" /> NEEDS IMPROVEMENT
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                          {new Date(attempt.submittedAt).toLocaleDateString()} {new Date(attempt.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedAttemptModal(attempt)}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ml-auto shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Answers
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 flex flex-col items-center justify-center text-gray-500">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <UserCheck className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No student results recorded yet</h3>
              <p className="text-sm">When students attempt practice tests on their dashboard, their results will display here.</p>
            </div>
          )
        )}
      </div>

      {/* Create Practice Test Modal */}
      {isAddModalOpen && (
        <AddPracticeTestModal 
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={(newTest) => {
            setTests([newTest, ...tests]);
            setIsAddModalOpen(false);
          }}
        />
      )}

      {/* View Questions Detail Modal */}
      {selectedTestModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-lg text-gray-900">{selectedTestModal.title}</h3>
                <p className="text-xs text-gray-500">{selectedTestModal.subject} • {selectedTestModal.questions?.length} Questions</p>
              </div>
              <button 
                onClick={() => setSelectedTestModal(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {selectedTestModal.questions?.map((q: any, idx: number) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                  <p className="font-bold text-sm text-gray-900">Q{idx + 1}. {q.questionText}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {q.options?.map((opt: string, oIdx: number) => (
                      <div 
                        key={oIdx} 
                        className={`p-2 rounded-lg border ${
                          q.correctOptionIndex === oIdx 
                            ? 'bg-green-50 border-green-300 text-green-800 font-bold' 
                            : 'bg-white border-gray-200 text-gray-600'
                        }`}
                      >
                        {String.fromCharCode(65 + oIdx)}. {opt} {q.correctOptionIndex === oIdx && '✓'}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                onClick={() => setSelectedTestModal(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Test Submissions / Results Modal per Test */}
      {selectedResultTest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-3xl w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div>
                <span className="px-3 py-1 bg-red-50 text-red-700 font-bold rounded-full text-xs">
                  {selectedResultTest.test.subject || 'General'}
                </span>
                <h3 className="font-extrabold text-xl text-gray-900 mt-1">{selectedResultTest.test.title}</h3>
                <p className="text-xs text-gray-500">Student Results Breakdown ({selectedResultTest.attempts?.length} Submissions)</p>
              </div>
              <button 
                onClick={() => setSelectedResultTest(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-bold">Student</th>
                    <th className="px-4 py-3 font-bold">Score</th>
                    <th className="px-4 py-3 font-bold">Percentage</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 font-bold">Submitted Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {selectedResultTest.attempts?.map((att: any) => {
                    const student = att.studentId || {};
                    const isPassed = att.percentage >= (selectedResultTest.test.passingScore || 50);

                    return (
                      <tr key={att._id} className="hover:bg-gray-50/80">
                        <td className="px-4 py-3">
                          <p className="font-bold text-gray-900">{student.fullName || 'Student'}</p>
                          <p className="text-xs text-gray-500">{student.email || student.studentId || 'N/A'}</p>
                        </td>

                        <td className="px-4 py-3 font-bold text-gray-900">
                          {att.score} Marks
                        </td>

                        <td className="px-4 py-3 font-extrabold">
                          <span className={isPassed ? 'text-emerald-600' : 'text-red-600'}>
                            {att.percentage}%
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          {isPassed ? (
                            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold rounded-full text-xs">
                              PASSED
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-200 font-bold rounded-full text-xs">
                              NEEDS IMPROVEMENT
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-xs text-gray-500">
                          {new Date(att.submittedAt).toLocaleDateString()} {new Date(att.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button
                onClick={() => setSelectedResultTest(null)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Answers & Evaluation Modal */}
      {selectedAttemptModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 bg-gray-900 text-white flex items-center justify-between">
              <div>
                <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full uppercase tracking-wider">
                  Student Answer Breakdown
                </span>
                <h3 className="text-xl font-bold mt-2">
                  {selectedAttemptModal.testId?.title || 'Practice Test Evaluation'}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Submitted by <strong className="text-white">{selectedAttemptModal.studentId?.fullName || 'Student'}</strong> ({selectedAttemptModal.studentId?.email || 'N/A'}) on {new Date(selectedAttemptModal.submittedAt).toLocaleDateString()} {new Date(selectedAttemptModal.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button 
                onClick={() => setSelectedAttemptModal(null)}
                className="w-9 h-9 rounded-full bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 flex items-center justify-center font-bold text-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Score Card Summary */}
            <div className="bg-gray-50 p-6 border-b border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <p className="text-xs font-bold text-gray-500 uppercase">Score</p>
                <p className="text-2xl font-black text-gray-900">{selectedAttemptModal.score} Marks</p>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <p className="text-xs font-bold text-gray-500 uppercase">Percentage</p>
                <p className={`text-2xl font-black ${selectedAttemptModal.percentage >= (selectedAttemptModal.testId?.passingScore || 50) ? 'text-emerald-600' : 'text-red-600'}`}>
                  {selectedAttemptModal.percentage}%
                </p>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <p className="text-xs font-bold text-gray-500 uppercase">Correct / Wrong</p>
                <p className="text-lg font-bold text-emerald-600">
                  {selectedAttemptModal.correctCount} <span className="text-gray-400 font-normal">/</span> <span className="text-red-600">{selectedAttemptModal.wrongCount || 0}</span>
                </p>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Result Status</p>
                {selectedAttemptModal.percentage >= (selectedAttemptModal.testId?.passingScore || 50) ? (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 font-extrabold rounded-full text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> PASSED
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-red-100 text-red-700 font-extrabold rounded-full text-xs flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> NEEDS IMPROVEMENT
                  </span>
                )}
              </div>
            </div>

            {/* Questions & Student Answers List */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              {(() => {
                const targetTestId = typeof selectedAttemptModal.testId === 'object' ? (selectedAttemptModal.testId?._id || selectedAttemptModal.testId?.id) : selectedAttemptModal.testId;
                const matchingTest = tests.find(t => String(t._id || t.id) === String(targetTestId));

                const questions = (selectedAttemptModal.testId?.questions && Array.isArray(selectedAttemptModal.testId.questions) && selectedAttemptModal.testId.questions.length > 0)
                  ? selectedAttemptModal.testId.questions
                  : (matchingTest?.questions || []);

                const studentAnswers = selectedAttemptModal.answers || [];

                if (!questions || questions.length === 0) {
                  return (
                    <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-2xl border border-gray-200">
                      <p className="font-bold text-base text-gray-800">Test details evaluated successfully</p>
                      <p className="text-sm mt-1 text-gray-500">Total Score: <strong>{selectedAttemptModal.score} Marks</strong> ({selectedAttemptModal.correctCount} Correct Questions)</p>
                      {studentAnswers.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200 text-left space-y-2">
                          <p className="text-xs font-bold text-gray-700 uppercase">Student Answered Options:</p>
                          <div className="flex flex-wrap gap-2">
                            {studentAnswers.map((ans: any, idx: number) => (
                              <span key={idx} className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700">
                                Q{ans.questionIndex + 1}: Option {String.fromCharCode(65 + (ans.selectedOptionIndex ?? 0))}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return questions.map((q: any, qIdx: number) => {
                  const studentAns = studentAnswers.find((a: any) => a.questionIndex === qIdx);
                  const selectedOptIdx = studentAns !== undefined ? studentAns.selectedOptionIndex : null;
                  const correctOptIdx = q.correctOptionIndex;
                  const isCorrect = selectedOptIdx === correctOptIdx;

                  return (
                    <div key={qIdx} className={`p-6 rounded-2xl border ${isCorrect ? 'bg-emerald-50/40 border-emerald-200' : 'bg-red-50/40 border-red-200'} space-y-4`}>
                      
                      {/* Question Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Question #{qIdx + 1}</span>
                          <h4 className="text-base font-bold text-gray-900">{q.questionText}</h4>
                        </div>
                        {isCorrect ? (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-xs flex items-center gap-1 flex-shrink-0 border border-emerald-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Correct (+{selectedAttemptModal.testId?.marksPerQuestion || 1} Marks)
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-red-100 text-red-800 font-bold rounded-full text-xs flex items-center gap-1 flex-shrink-0 border border-red-300">
                            <XCircle className="w-4 h-4 text-red-600" /> Incorrect (0 Marks)
                          </span>
                        )}
                      </div>

                      {/* Options List */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {(q.options || []).map((opt: string, optIdx: number) => {
                          const isStudentChoice = selectedOptIdx === optIdx;
                          const isCorrectChoice = correctOptIdx === optIdx;

                          let optionStyle = "bg-white border-gray-200 text-gray-700";
                          let badge = null;

                          if (isCorrectChoice) {
                            optionStyle = "bg-emerald-100 border-emerald-400 text-emerald-900 font-bold ring-2 ring-emerald-500/20";
                            badge = <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-200/80 px-2 py-0.5 rounded-full border border-emerald-300">✓ Correct Answer</span>;
                          }
                          
                          if (isStudentChoice && !isCorrectChoice) {
                            optionStyle = "bg-red-100 border-red-400 text-red-900 font-bold ring-2 ring-red-500/20";
                            badge = <span className="text-[11px] font-extrabold text-red-700 bg-red-200/80 px-2 py-0.5 rounded-full border border-red-300">✕ Student Selected</span>;
                          } else if (isStudentChoice && isCorrectChoice) {
                            badge = <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-300/80 px-2 py-0.5 rounded-full border border-emerald-400">✓ Student Selected (Correct)</span>;
                          }

                          return (
                            <div 
                              key={optIdx} 
                              className={`p-3.5 rounded-xl border flex items-center justify-between text-sm transition-all ${optionStyle}`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-extrabold text-xs flex items-center justify-center flex-shrink-0 border border-gray-300">
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span>{opt}</span>
                              </div>
                              {badge}
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  );
                });
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedAttemptModal(null)}
                className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-sm transition-all shadow"
              >
                Close Evaluation
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

