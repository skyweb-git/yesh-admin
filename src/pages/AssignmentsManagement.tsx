import { useState, useEffect } from 'react';
import { Plus, Search, FileText, Calendar, Download, CheckCircle, Camera, User, Eye, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { io } from 'socket.io-client';
import { AddAssignmentModal } from './AddAssignmentModal';
import { API_BASE_URL } from '../config/api';

export const AssignmentsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'assignments' | 'submissions'>('assignments');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  const fetchAssignmentsAndSubmissions = async () => {
    try {
      const [resAssignments, resSubmissions] = await Promise.all([
        fetch(`${API_BASE_URL}/api/assignments`),
        fetch(`${API_BASE_URL}/api/assignments/submissions/all`)
      ]);

      if (resAssignments.ok) {
        const dataA = await resAssignments.json();
        setAssignments(Array.isArray(dataA) ? dataA : []);
      }
      if (resSubmissions.ok) {
        const dataS = await resSubmissions.json();
        setSubmissions(Array.isArray(dataS) ? dataS : []);
      }
    } catch (err) {
      console.error('Failed to fetch assignments data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignmentsAndSubmissions();

    // Auto refresh every 3 seconds to fetch new student photo uploads
    const interval = setInterval(() => {
      fetchAssignmentsAndSubmissions();
    }, 3000);

    // Socket real-time push event listener
    const socket = io(API_BASE_URL);
    socket.on('newSubmission', (newSub) => {
      console.log('Real-time assignment submission received:', newSub);
      setSubmissions(prev => {
        const exists = prev.some(s => s._id === newSub._id);
        if (exists) return prev.map(s => s._id === newSub._id ? newSub : s);
        return [newSub, ...prev];
      });
    });

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  const filteredAssignments = assignments.filter(a =>
    a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSubmissions = submissions.filter(s => {
    const sName = s.studentId?.fullName || '';
    const sId = s.studentId?.studentId || '';
    const aTitle = s.assignmentId?.title || '';
    const term = searchTerm.toLowerCase();
    return sName.toLowerCase().includes(term) || sId.toLowerCase().includes(term) || aTitle.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Assignments & Submissions Management</h2>
          <p className="text-sm text-gray-500">Live automatic synchronization of student uploaded assignment photos</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-md transition-colors text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Assignment
        </button>
      </div>

      {/* Tabs & Search Bar Header */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'assignments' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4 text-red-600" />
            <span>Master Assignments</span>
            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px]">{assignments.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('submissions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'submissions' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Camera className="w-4 h-4 text-green-600" />
            <span>Completed Submissions (Photos)</span>
            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px]">{submissions.length}</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={activeTab === 'assignments' ? "Search assignments..." : "Search student submissions..."} 
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
          />
        </div>
      </div>
      
      {/* Content Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-red-600" />
            <p className="text-sm font-semibold">Loading assignments & live submissions...</p>
          </div>
        ) : activeTab === 'assignments' ? (
          /* TAB 1: MASTER ASSIGNMENTS TABLE */
          filteredAssignments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-t border-gray-100">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-bold">Assignment</th>
                    <th className="px-6 py-4 font-bold">Subject</th>
                    <th className="px-6 py-4 font-bold">Target Audience</th>
                    <th className="px-6 py-4 font-bold">Attached File</th>
                    <th className="px-6 py-4 font-bold">Due Date</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredAssignments.map((assignment) => {
                    const assignId = assignment._id || assignment.id;
                    const targetLabel = assignment.targetType === 'INDIVIDUAL' 
                      ? 'Specific Student' 
                      : assignment.targetType === 'GROUP' 
                      ? 'Specific Group' 
                      : 'All Students';

                    return (
                      <tr key={assignId} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900">{assignment.title}</p>
                          {assignment.description && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{assignment.description}</p>}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-red-50 text-red-700 font-bold rounded-full text-xs border border-red-100">
                            {assignment.subject || 'General'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            assignment.targetType === 'INDIVIDUAL' 
                              ? 'bg-purple-100 text-purple-700' 
                              : assignment.targetType === 'GROUP' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {targetLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg w-fit border border-red-100">
                            <FileText className="w-4 h-4 flex-shrink-0" />
                            <span className="font-semibold text-xs max-w-[150px] truncate" title={assignment.fileName}>{assignment.fileName || 'Assignment.pdf'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-700">
                          <div className="flex items-center gap-2 text-xs">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {new Date(assignment.dueDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Active</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <a 
                              href={assignment.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-block"
                              title="Download PDF"
                            >
                              <Download className="w-5 h-5" />
                            </a>
                            <button
                              onClick={async () => {
                                if (!confirm('Are you sure you want to delete this assignment?')) return;
                                try {
                                  const res = await fetch(`${API_BASE_URL}/api/assignments/${assignId}`, { method: 'DELETE' });
                                  if (res.ok) {
                                    setAssignments(assignments.filter(a => (a._id || a.id) !== assignId));
                                  }
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Assignment"
                            >
                              ✕
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
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No assignments found</h3>
              <p className="text-sm">Click "Add Assignment" to create your first assignment.</p>
            </div>
          )
        ) : (
          /* TAB 2: COMPLETED STUDENT SUBMISSIONS (PHOTOS) TABLE */
          filteredSubmissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-t border-gray-100">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-bold">Student Name & ID</th>
                    <th className="px-6 py-4 font-bold">Assignment Title</th>
                    <th className="px-6 py-4 font-bold">Uploaded Solution Photo</th>
                    <th className="px-6 py-4 font-bold">Submission Date</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredSubmissions.map((submission) => {
                    const stName = submission.studentId?.fullName || 'Student';
                    const stId = submission.studentId?.studentId || 'N/A';
                    const stEmail = submission.studentId?.email || '';
                    const assignTitle = submission.assignmentId?.title || 'Assignment Solution';

                    return (
                      <tr key={submission._id} className="hover:bg-gray-50/80 transition-colors">
                        {/* Student Details */}
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-gray-900">{stName}</p>
                            <p className="text-xs text-red-600 font-mono font-semibold">{stId} {stEmail && `• ${stEmail}`}</p>
                          </div>
                        </td>

                        {/* Assignment Title */}
                        <td className="px-6 py-4 font-bold text-gray-800">
                          {assignTitle}
                        </td>

                        {/* Submitted Photo / File badges (Up to 6) */}
                        <td className="px-6 py-4">
                          {submission.photos && submission.photos.length > 0 ? (
                            <div className="space-y-1.5 max-w-[220px]">
                              {submission.photos.slice(0, 6).map((photo: any, pIdx: number) => (
                                <div key={pIdx} className="flex items-center justify-between gap-2 bg-green-50 text-green-800 px-2.5 py-1 rounded-xl border border-green-200 text-xs">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <Camera className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                                    <span className="font-bold text-[11px] truncate" title={photo.fileName || `Photo ${pIdx + 1}`}>
                                      #{pIdx + 1}: {photo.fileName || 'Photo.jpg'}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => setPreviewPhotoUrl(photo.fileUrl)}
                                    className="text-[11px] font-bold text-green-700 hover:text-green-900 underline flex-shrink-0"
                                  >
                                    View
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 bg-green-50 text-green-800 px-3 py-1.5 rounded-xl border border-green-200 w-fit">
                              <Camera className="w-4 h-4 text-green-600 flex-shrink-0" />
                              <span className="font-bold text-xs max-w-[180px] truncate" title={submission.fileName}>
                                {submission.fileName || 'Submitted_Photo.jpg'}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Submission Date */}
                        <td className="px-6 py-4 font-medium text-gray-600 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {new Date(submission.submittedAt || submission.createdAt || Date.now()).toLocaleString()}
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                            <CheckCircle className="w-3.5 h-3.5 text-green-600" /> Completed
                          </span>
                        </td>

                        {/* Actions: View & Download Photo */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {/* View Photo Button */}
                            <button
                              onClick={() => setPreviewPhotoUrl(submission.fileUrl)}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-xs transition-colors shadow-sm flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> View Photo
                            </button>

                            {/* Download File Button */}
                            <a
                              href={submission.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg transition-colors border border-gray-200"
                              title="Download Photo"
                            >
                              <Download className="w-4 h-4" />
                            </a>
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
                <Camera className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No completed assignment photos submitted yet</h3>
              <p className="text-sm">When students upload assignment photos, they will show up here automatically.</p>
            </div>
          )
        )}
      </div>

      {/* Add Assignment Modal */}
      {isAddModalOpen && (
        <AddAssignmentModal 
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={(newAssignment) => {
            setAssignments([newAssignment, ...assignments]);
            setIsAddModalOpen(false);
          }}
        />
      )}

      {/* Photo Lightbox / Preview Modal */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 relative overflow-hidden">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-green-700 font-bold text-sm">
                <Camera className="w-5 h-5" />
                <span>Student Submitted Assignment Photo</span>
              </div>
              <button 
                onClick={() => setPreviewPhotoUrl(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto flex items-center justify-center bg-gray-900 rounded-2xl p-2 border border-gray-200">
              {previewPhotoUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe src={previewPhotoUrl} className="w-full h-[500px] rounded-xl" title="Assignment Submission PDF" />
              ) : (
                <img src={previewPhotoUrl} alt="Submitted Assignment Photo" className="max-w-full max-h-[500px] object-contain rounded-xl" />
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <a
                href={previewPhotoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md"
              >
                <Download className="w-4 h-4" /> Download Original Photo
              </a>
              <button
                onClick={() => setPreviewPhotoUrl(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
