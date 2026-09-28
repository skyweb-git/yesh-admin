import { useState, useEffect } from 'react';
import { Download, Upload, FileText, CheckCircle, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export const AcademicsManagement = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [editingMaxMarks, setEditingMaxMarks] = useState<any>({
    Mathematics: 100,
    Physics: 100,
    Chemistry: 100,
    Biology: 100,
    English: 100
  });
  const [editingMarksObtained, setEditingMarksObtained] = useState<any>({
    Mathematics: 0,
    Physics: 0,
    Chemistry: 0,
    Biology: 0,
    English: 0
  });
  const [editingRemarks, setEditingRemarks] = useState('');
  const [isSavingScores, setIsSavingScores] = useState(false);

  const selectedStudent = students.find(s => s._id === selectedStudentId) || (students.length > 0 ? students[0] : null);

  useEffect(() => {
    if (selectedStudent) {
      const maxM = selectedStudent.maxMarks || {
        Mathematics: 100,
        Physics: 100,
        Chemistry: 100,
        Biology: 100,
        English: 100
      };
      const obtainedM = selectedStudent.marksObtained || selectedStudent.performanceScores || {
        Mathematics: 0,
        Physics: 0,
        Chemistry: 0,
        Biology: 0,
        English: 0
      };
      setEditingMaxMarks(maxM);
      setEditingMarksObtained(obtainedM);
      setEditingRemarks(selectedStudent.teacherRemarks || '');
    }
  }, [selectedStudent?._id]);

  const handleSaveStudentScores = async () => {
    if (!selectedStudent) return;
    setIsSavingScores(true);
    
    // Calculate performance scores percentages for chart compatibility
    const calcPerformanceScores: any = {};
    const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'];
    subjects.forEach(subj => {
      const maxVal = Number(editingMaxMarks[subj] ?? 100) || 100;
      const obtVal = Number(editingMarksObtained[subj] ?? 0) || 0;
      calcPerformanceScores[subj] = maxVal > 0 ? Math.round((obtVal / maxVal) * 100) : 0;
    });

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/id/${selectedStudent._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxMarks: editingMaxMarks,
          marksObtained: editingMarksObtained,
          performanceScores: calcPerformanceScores,
          teacherRemarks: editingRemarks
        })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setStudents(prev => prev.map(s => s._id === updatedUser._id ? updatedUser : s));
        setStatusBanner({ type: 'success', text: `Successfully updated max marks, marks obtained & teacher remarks for ${selectedStudent.fullName}!` });
      } else {
        setStatusBanner({ type: 'error', text: 'Failed to update student marks.' });
      }
    } catch (err) {
      console.error('Error saving marks:', err);
      setStatusBanner({ type: 'error', text: 'Error connecting to server.' });
    } finally {
      setIsSavingScores(false);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users?role=student`);
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching academic records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const [statusBanner, setStatusBanner] = useState<{ type: string; text: string }>({ type: '', text: '' });

  const handleFileUpload = (student: any, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatusBanner({ type: '', text: '' });
    setUploadingId(student._id);
    const reader = new FileReader();

    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      try {
        // Step 1: Save file to backend uploads directory
        const uploadRes = await fetch(`${API_BASE_URL}/api/upload-pdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileData: dataUrl,
            fileName: file.name
          })
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          throw new Error(errData.message || 'Error saving file on server');
        }

        const uploadData = await uploadRes.json();

        // Step 2: Store file URL in student MongoDB document
        const res = await fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(student.email)}?role=student`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reportCardUrl: uploadData.fileUrl,
            reportCardName: uploadData.fileName
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Server error linking report card URL');
        }

        setStatusBanner({ type: 'success', text: `Successfully uploaded report card "${file.name}" for ${student.fullName}!` });
        await fetchStudents();
      } catch (err: any) {
        console.error('Failed to upload report card:', err);
        setStatusBanner({ type: 'error', text: `Error uploading PDF: ${err.message || 'Failed to connect to backend server'}` });
      } finally {
        setUploadingId(null);
        event.target.value = '';
      }
    };

    reader.onerror = () => {
      setUploadingId(null);
      setStatusBanner({ type: 'error', text: 'Error reading PDF file from browser.' });
      event.target.value = '';
    };

    reader.readAsDataURL(file);
  };

  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const handleGeneratePdfReportCard = async (student: any) => {
    setGeneratingId(student._id);
    setStatusBanner({ type: '', text: '' });

    const isSelected = selectedStudent && selectedStudent._id === student._id;
    const targetMaxMarks = isSelected ? editingMaxMarks : (student.maxMarks || {});
    const targetMarksObtained = isSelected ? editingMarksObtained : (student.marksObtained || student.performanceScores || {});
    const targetRemarks = isSelected ? editingRemarks : (student.teacherRemarks || '');

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/generate-report-card`, {

        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student._id,
          maxMarks: targetMaxMarks,
          marksObtained: targetMarksObtained,
          teacherRemarks: targetRemarks,
          attendance: student.attendance || '0%',
          attendanceStatus: student.attendanceStatus || 'Not Marked'
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to generate report card PDF');
      }

      const data = await res.json();
      setStatusBanner({
        type: 'success',
        text: `✓ Official PDF Report Card for ${student.fullName} has been generated and sent to the parent account!`
      });
      await fetchStudents();
    } catch (err: any) {
      console.error('Error generating report card:', err);
      setStatusBanner({ type: 'error', text: `Error generating PDF: ${err.message || 'Server error'}` });
    } finally {
      setGeneratingId(null);
    }
  };

  const handleDownloadReportCard = (student: any) => {
    if (student.reportCardUrl) {
      const link = document.createElement('a');
      link.href = student.reportCardUrl;
      link.download = student.reportCardName || `${student.fullName}_ReportCard.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(`No report card PDF generated yet for ${student.fullName}. Click "Generate & Send PDF to Parent" to create one.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Academic Records & Generated Report Cards</h2>
          <p className="text-sm text-gray-500">Generate formatted PDF report cards from student scores and send directly to parent accounts</p>
        </div>
      </div>

      {statusBanner.text && (
        <div className={`p-4 rounded-xl text-sm font-semibold flex justify-between items-center ${
          statusBanner.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <span>{statusBanner.text}</span>
          <button onClick={() => setStatusBanner({ type: '', text: '' })} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}

      {/* Performance Analytics Bar Chart Section - Dynamic Per Student */}
      <div className="bg-white rounded-3xl p-6 md:p-10 border border-gray-100 shadow-sm relative overflow-hidden space-y-6">
        <style>{`
          .candy-bg-acad {
            background-color: rgba(243, 244, 246, 0.6);
            background-image: linear-gradient(
              135deg,
              rgba(229, 231, 235, 0.4) 25%,
              transparent 25.5%,
              transparent 50%,
              rgba(229, 231, 235, 0.4) 50.5%,
              rgba(229, 231, 235, 0.4) 75%,
              transparent 75.5%,
              transparent
            );
            background-size: 12px 12px;
          }
        `}</style>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-100">
          <div>
            <span className="px-4 py-1.5 bg-red-50 text-red-600 rounded-full text-xs font-bold uppercase tracking-wider mb-2 inline-block">
              PERFORMANCE ANALYTICS
            </span>
            <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              We don't believe in talk, we Deliver Results
            </h3>
            <p className="mt-1 text-gray-500 text-xs md:text-sm">
              Viewing & managing subject performance scores per student.
            </p>
          </div>

          {/* Student Selector Dropdown */}
          <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-200">
            <span className="text-xs font-bold text-gray-600 pl-2">Student:</span>
            <select
              value={selectedStudent?._id || ''}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 shadow-sm focus:border-red-600 focus:outline-none"
            >
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.fullName} ({s.studentId || 'N/A'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedStudent ? (
          <div>
            {/* Dynamic Subject Bars */}
            <div className="relative mx-auto mt-8 flex h-80 md:h-96 max-w-3xl items-end justify-center gap-3 md:gap-6 pb-8">
              {[
                'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'
              ].map((subj, index) => {
                const maxM = Number(editingMaxMarks[subj] ?? 100) || 100;
                const obtM = Number(editingMarksObtained[subj] ?? 0) || 0;
                const pct = maxM > 0 ? Math.round((obtM / maxM) * 100) : 0;
                
                const allPcts = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'].map(s => {
                  const m = Number(editingMaxMarks[s] ?? 100) || 100;
                  const o = Number(editingMarksObtained[s] ?? 0) || 0;
                  return m > 0 ? Math.round((o / m) * 100) : 0;
                });
                const maxVal = Math.max(...allPcts);
                const isMax = maxVal > 0 && pct === maxVal;
                
                return (
                  <div key={index} className="h-full w-full flex flex-col justify-end">
                    <div className="group relative h-full w-full flex flex-col justify-end">
                      <div className="candy-bg-acad relative h-full w-full overflow-hidden rounded-[24px] md:rounded-[36px] border border-gray-200/60">
                        <div
                          style={{ height: `${Math.min(100, Math.max(10, pct))}%` }}
                          className={`absolute bottom-0 w-full rounded-[24px] md:rounded-[36px] ${isMax ? 'bg-emerald-500 shadow-emerald-200' : 'bg-red-600'} p-2 text-white flex items-center justify-center shadow-lg transition-all duration-500`}
                        >
                          <span className="font-extrabold text-xs md:text-sm tracking-tight bg-white/20 px-2.5 py-1 rounded-full">
                            {pct}%
                          </span>
                        </div>
                      </div>

                      {isMax && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-2.5 py-1 rounded-xl text-[11px] font-bold shadow-md whitespace-nowrap z-20">
                          Top Performer
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-emerald-600" />
                        </div>
                      )}
                      <p className="mx-auto mt-3 w-fit text-xs md:text-sm font-bold text-gray-700 text-center">
                        {subj}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Score Controls Panel */}
            <div className="mt-6 p-6 bg-gray-50 rounded-2xl border border-gray-200 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-gray-200">
                <div>
                  <h4 className="font-bold text-gray-900 text-base">
                    Edit Marks & Evaluation for <span className="text-red-600">{selectedStudent.fullName}</span> ({selectedStudent.studentId || 'N/A'})
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">Enter Maximum Marks and Marks Obtained for each subject</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveStudentScores}
                    disabled={isSavingScores}
                    className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
                  >
                    {isSavingScores ? 'Saving...' : 'Save Subject Scores'}
                  </button>

                  <button
                    onClick={() => handleGeneratePdfReportCard(selectedStudent)}
                    disabled={generatingId === selectedStudent._id}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    {generatingId === selectedStudent._id ? 'Generating PDF...' : 'Generate & Send PDF to Parent'}
                  </button>
                </div>
              </div>

              {/* Subject Marks Input Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'].map((subject) => {
                  const maxM = editingMaxMarks[subject] !== undefined ? editingMaxMarks[subject] : 100;
                  const obtM = editingMarksObtained[subject] !== undefined ? editingMarksObtained[subject] : 0;
                  const pct = Number(maxM) > 0 ? Math.round((Number(obtM) / Number(maxM)) * 100) : 0;
                  const grade = pct >= 90 ? 'A+' : pct >= 75 ? 'A' : pct >= 60 ? 'B' : pct >= 40 ? 'C' : 'F';

                  return (
                    <div key={subject} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="font-bold text-xs text-gray-900">{subject}</span>
                        <span className="text-[11px] font-extrabold text-red-600 bg-red-50 px-2 py-0.5 rounded">{grade} ({pct}%)</span>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">MAX MARKS</label>
                        <input
                          type="number"
                          min="1"
                          value={maxM}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Number(e.target.value);
                            setEditingMaxMarks((prev: any) => ({ ...prev, [subject]: val }));
                          }}
                          className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-900 focus:bg-white focus:border-red-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">MARKS OBTAINED</label>
                        <input
                          type="number"
                          min="0"
                          value={obtM}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Number(e.target.value);
                            setEditingMarksObtained((prev: any) => ({ ...prev, [subject]: val }));
                          }}
                          className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-900 focus:bg-white focus:border-red-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Live Subject Marks Table Display */}
              <div className="pt-2">
                <h5 className="font-bold text-gray-900 text-sm mb-3">Subject Marks Breakdown Preview</h5>
                <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#6B0000] text-white uppercase font-bold">
                      <tr>
                        <th className="px-5 py-3">SUBJECT</th>
                        <th className="px-5 py-3">MAX MARKS</th>
                        <th className="px-5 py-3">MARKS OBTAINED</th>
                        <th className="px-5 py-3">PERCENTAGE</th>
                        <th className="px-5 py-3">GRADE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'].map((subj, idx) => {
                        const maxM = Number(editingMaxMarks[subj] ?? 100) || 100;
                        const obtM = Number(editingMarksObtained[subj] ?? 0) || 0;
                        const pct = maxM > 0 ? Math.round((obtM / maxM) * 100) : 0;
                        const grade = pct >= 90 ? 'A+' : pct >= 75 ? 'A' : pct >= 60 ? 'B' : pct >= 40 ? 'C' : 'F';

                        return (
                          <tr key={subj} className={idx % 2 === 0 ? 'bg-white' : 'bg-red-50/30'}>
                            <td className="px-5 py-3 font-bold text-gray-900">{subj}</td>
                            <td className="px-5 py-3 font-semibold text-gray-600">{maxM}</td>
                            <td className="px-5 py-3 font-extrabold text-gray-900">{obtM}</td>
                            <td className="px-5 py-3 font-bold text-red-600">{pct}%</td>
                            <td className="px-5 py-3 font-extrabold text-green-700">{grade}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Summary Box */}
                  {(() => {
                    const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'];
                    let totMax = 0;
                    let totObt = 0;
                    subjects.forEach(s => {
                      totMax += Number(editingMaxMarks[s] ?? 100) || 100;
                      totObt += Number(editingMarksObtained[s] ?? 0) || 0;
                    });
                    const overallPct = totMax > 0 ? Math.round((totObt / totMax) * 100) : 0;
                    const overallGrade = overallPct >= 90 ? 'A+' : overallPct >= 75 ? 'A' : overallPct >= 60 ? 'B' : overallPct >= 40 ? 'C' : 'F';

                    return (
                      <div className="p-4 bg-[#FEF3C7] border-t border-[#D4AF37] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs font-bold text-[#6B0000]">
                        <div>
                          TOTAL AGGREGATE: <span className="font-extrabold text-sm">{totObt} / {totMax}</span>
                        </div>
                        <div>
                          OVERALL PERCENTAGE: <span className="font-extrabold text-sm">{overallPct}%</span>
                        </div>
                        <div className="text-blue-900">
                          ATTENDANCE RECORD: <span className="font-extrabold text-sm">{selectedStudent?.attendance || '0%'}</span>
                        </div>
                        <div className="text-green-800">
                          OVERALL GRADE: <span className="font-extrabold text-sm">{overallGrade}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Teacher & Academic Remarks (Shared with Parent in PDF Report Card)
                </label>
                <textarea
                  rows={2}
                  value={editingRemarks}
                  onChange={(e) => setEditingRemarks(e.target.value)}
                  placeholder="Enter custom remarks for student performance (e.g. Excellent progress in Mathematics & Physics. Shows great analytical problem-solving ability.)"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:border-red-600 focus:outline-none placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400 text-sm">No students available.</div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-900">Student Report Cards Directory</h3>
          <span className="text-xs font-medium text-gray-500">Total Students: {students.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">Student Photo</th>
                <th className="px-6 py-4 font-bold">Student Name</th>
                <th className="px-6 py-4 font-bold">Student ID</th>
                <th className="px-6 py-4 font-bold">PDF Report Card Status</th>
                <th className="px-6 py-4 font-bold">Actions / Report Card</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="p-6 text-center text-gray-500">Loading academic records...</td></tr>
              ) : students.length > 0 ? (
                students.map((st) => {
                  const isUploading = uploadingId === st._id;
                  const isGenerating = generatingId === st._id;
                  const hasFile = Boolean(st.reportCardUrl);

                  const handleUploadPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = async (e) => {
                        const base64 = e.target?.result as string;
                        try {
                          await fetch(`${API_BASE_URL}/api/users/id/${st._id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ profilePicUrl: base64 })
                          });
                          fetchStudents();

                        } catch (err) {
                          console.error('Error updating student photo:', err);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  };

                  return (
                    <tr key={st._id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Student Photo */}
                      <td className="px-6 py-4">
                        <label className="relative group cursor-pointer block w-11 h-11">
                          {st.profilePicUrl ? (
                            <img 
                              src={st.profilePicUrl} 
                              alt={st.fullName} 
                              className="w-11 h-11 rounded-xl object-cover border border-red-200 shadow-xs"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-red-100 text-red-700 font-bold flex items-center justify-center text-sm border border-red-200">
                              {st.fullName?.charAt(0) || 'S'}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                            Edit
                          </div>
                          <input type="file" accept="image/*" onChange={handleUploadPhoto} className="hidden" />
                        </label>
                      </td>

                      <td className="px-6 py-4 font-bold text-gray-900">
                        <div>
                          <p>{st.fullName}</p>
                          <p className="text-xs text-gray-400 font-normal">{st.email}</p>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-mono text-red-600 font-bold">
                        {st.studentId || 'N/A'}
                      </td>

                      {/* Uploaded / Generated File Info */}
                      <td className="px-6 py-4">
                        {hasFile ? (
                          <div className="flex items-center gap-2 text-xs">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span className="font-semibold text-gray-800 truncate max-w-[200px]" title={st.reportCardName || 'Report Card PDF'}>
                              {st.reportCardName || 'Official_Report_Card.pdf'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full font-medium border border-amber-200">
                            No PDF Report Card
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Generate & Send PDF to Parent */}
                          <button
                            onClick={() => handleGeneratePdfReportCard(st)}
                            disabled={isGenerating}
                            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <FileText className="w-4 h-4" />
                            <span>{isGenerating ? 'Generating...' : 'Send Score (Generate PDF)'}</span>
                          </button>

                          {hasFile && (
                            <button 
                              onClick={() => handleDownloadReportCard(st)}
                              className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-lg text-xs transition-colors border border-red-100 flex items-center gap-1.5"
                            >
                              <Download className="w-4 h-4" /> View PDF
                            </button>
                          )}

                          <label className="px-3 py-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 font-bold rounded-lg text-xs transition-colors border border-gray-200 cursor-pointer flex items-center gap-1.5">
                            {isUploading ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-red-600" />
                            ) : (
                              <Upload className="w-4 h-4 text-gray-500" />
                            )}
                            <span>{isUploading ? 'Uploading...' : 'Upload PDF'}</span>
                            <input 
                              type="file" 
                              accept=".pdf,image/*" 
                              onChange={(e) => handleFileUpload(st, e)} 
                              className="hidden" 
                            />
                          </label>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={4} className="p-6 text-center text-gray-500">No student academic records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
