import { useState } from 'react';
import { 
  User, GraduationCap, Calendar, FileText, CheckCircle, CreditCard, 
  MessageSquare, Download, X, Award, Check, CheckSquare, Plus, Trash2, Save
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface StudentDetailModalProps {

  student: any;
  parent?: any;
  onClose: () => void;
  onUpdate?: () => void;
}

const DEFAULT_CHECKLIST_ITEMS = [
  { id: 'profile', text: 'Enrollment & Profile Completed', completed: true },
  { id: 'fees', text: 'Fee Payment Verified', completed: true },
  { id: 'documents', text: 'Identity & Report Card Uploaded', completed: false },
  { id: 'attendance', text: 'Attendance Marked', completed: false },
  { id: 'homework', text: 'Homework & Assignments Assigned', completed: false },
  { id: 'parent', text: 'Parent Account Linked', completed: false }
];

export const StudentDetailModal = ({ student, parent, onClose, onUpdate }: StudentDetailModalProps) => {
  const [activeTab, setActiveTab] = useState('Overview');

  const initialChecklist = (student?.checklist && Array.isArray(student.checklist) && student.checklist.length > 0)
    ? student.checklist
    : DEFAULT_CHECKLIST_ITEMS;

  const [checklist, setChecklist] = useState<any[]>(initialChecklist);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [savingChecklist, setSavingChecklist] = useState(false);

  if (!student && !parent) return null;

  const fullName = student?.fullName || parent?.fullName || 'Student Account';
  const studentId = student?.studentId || parent?.studentId || 'N/A';
  const email = student?.email || parent?.email || 'N/A';
  const phone = student?.phone || parent?.phone || 'N/A';
  const status = student?.status || parent?.status || 'Paid';

  const completedCount = checklist.filter(item => item.completed).length;
  const progressPercent = Math.round((completedCount / (checklist.length || 1)) * 100);

  const handleToggleChecklist = (id: string) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    const newItem = {
      id: `task_${Date.now()}`,
      text: newChecklistItem.trim(),
      completed: false
    };
    setChecklist([...checklist, newItem]);
    setNewChecklistItem('');
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklist(checklist.filter(item => item.id !== id));
  };

  const handleSaveChecklist = async () => {
    if (!student?._id) return;
    setSavingChecklist(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${student._id}`, {

        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklist })
      });
      if (res.ok) {
        alert('Student checklist saved successfully!');
        if (onUpdate) onUpdate();
      } else {
        alert('Failed to save checklist.');
      }
    } catch (err) {
      console.error('Error saving checklist:', err);
      alert('Error saving checklist.');
    } finally {
      setSavingChecklist(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header Banner */}
        <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pr-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-2xl font-extrabold">
                {fullName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 bg-white/20 text-white border border-white/30 rounded-full text-[10px] font-bold uppercase tracking-wide">
                    Student Details Overview
                  </span>
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-200 border border-green-400/30 rounded-full text-[10px] font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> {status}
                  </span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight">{fullName}</h2>
                <p className="text-red-100 text-xs mt-0.5 flex items-center gap-2">
                  <span>Student ID: <strong className="font-mono text-white bg-red-900/40 px-2 py-0.5 rounded">{studentId}</strong></span>
                  <span>• {email}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => alert(`Report card PDF for ${fullName} downloaded successfully.`)}
                className="px-4 py-2 bg-white text-red-600 hover:bg-red-50 font-semibold rounded-xl transition-all shadow-md text-xs flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Download Report Card PDF
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'Overview', label: 'Child Overview', icon: GraduationCap },
            { id: 'Checklist', label: `Checklist (${completedCount}/${checklist.length})`, icon: CheckSquare },
            { id: 'Profile', label: 'Child Profile', icon: User },
            { id: 'Attendance', label: 'Attendance', icon: Calendar },
            { id: 'Academics', label: 'Academics', icon: FileText },
            { id: 'Fees', label: 'Fee Payments', icon: CreditCard },
            { id: 'Messages', label: 'Teacher Messages', icon: MessageSquare }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs transition-all whitespace-nowrap ${
                  active 
                    ? 'border-red-600 text-red-600 bg-white' 
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'Checklist' && (
            <div className="space-y-6">
              {/* Progress Header Card */}
              <div className="bg-gradient-to-br from-red-50 to-amber-50 border border-red-100 rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                      <CheckSquare className="w-5 h-5 text-red-600" />
                      Student Task Checklist
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">Track administrative and academic completion tasks for {fullName}</p>
                  </div>
                  <span className="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-bold shadow-sm">
                    {progressPercent}% Completed
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-500 to-green-500 transition-all duration-500 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Add Custom Task Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  placeholder="Add custom task item (e.g. Science Lab Safety Form Signed)..."
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-red-500 text-gray-900"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddChecklistItem();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddChecklistItem}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4" /> Add Task
                </button>
              </div>

              {/* Checklist Items */}
              <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden shadow-xs">
                {checklist.map((item) => (
                  <div 
                    key={item.id}
                    className={`flex items-center justify-between p-4 transition-colors ${
                      item.completed ? 'bg-green-50/50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <label className="flex items-center gap-3 cursor-pointer flex-1 select-none">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleChecklist(item.id)}
                        className="w-5 h-5 accent-red-600 rounded cursor-pointer"
                      />
                      <span className={`text-xs font-semibold ${item.completed ? 'line-through text-gray-400 font-normal' : 'text-gray-800'}`}>
                        {item.text}
                      </span>
                    </label>
                    
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklistItem(item.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1"
                      title="Remove task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveChecklist}
                  disabled={savingChecklist}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {savingChecklist ? 'Saving Checklist...' : 'Save Checklist Changes'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'Overview' && (
            <div className="space-y-6">
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center justify-center">
                  <div className="w-14 h-14 rounded-full border-4 border-red-500 flex items-center justify-center mb-3 bg-red-50">
                    <span className="text-lg font-bold text-red-700">{student?.attendance || '0%'}</span>
                  </div>
                  <h4 className="text-gray-900 font-bold text-sm">Attendance Record</h4>
                  <p className="text-xs text-gray-500">{student?.attendanceStatus ? `Status: ${student.attendanceStatus}` : 'Not Marked'}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-3">
                    <FileText className="w-7 h-7" />
                  </div>
                  <h4 className="text-gray-900 font-bold text-sm">2 Homework Due</h4>
                  <p className="text-xs text-gray-500">Maths & Physics</p>
                </div>

                <div className="bg-gradient-to-br from-red-600 to-red-700 text-white p-5 rounded-2xl shadow-md flex flex-col items-center text-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-3">
                    <Download className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-sm">Term Report Card</h4>
                  <button 
                    onClick={() => alert(`Report card PDF for ${fullName} downloaded.`)}
                    className="mt-1 text-xs text-red-100 hover:text-white underline font-semibold"
                  >
                    Download Official PDF
                  </button>
                </div>
              </div>

              {/* Detailed Academic & Information Grid */}
              <div className="grid grid-cols-1 gap-6">
                
                {/* Account & Profile Summary */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3 text-xs">
                  <h4 className="font-bold text-gray-900 text-sm mb-3">Student Information Summary</h4>
                  <div className="flex justify-between pb-2 border-b border-gray-50">
                    <span className="text-gray-500">Full Name</span>
                    <span className="font-bold text-gray-900">{fullName}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-gray-50">
                    <span className="text-gray-500">Student ID</span>
                    <span className="font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">{studentId}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-gray-50">
                    <span className="text-gray-500">Email Address</span>
                    <span className="font-medium text-gray-800">{email}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-gray-50">
                    <span className="text-gray-500">Phone Number</span>
                    <span className="font-medium text-gray-800">{phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Current Status</span>
                    <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{status}</span>
                  </div>
                </div>

                {/* Performance Analytics Chart Component */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
                  <style>{`
                    .candy-bg-modal {
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
                      background-size: 10px 10px;
                    }
                  `}</style>
                  <div className="mx-auto max-w-xl text-center mb-6">
                    <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 inline-block">
                      PERFORMANCE ANALYTICS
                    </span>
                    <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">
                      We don't believe in talk, we Deliver Results
                    </h3>
                    <p className="mt-1 text-gray-500 text-xs">
                      Compare progress and learning outcomes with standard benchmarks.
                    </p>
                  </div>

                  <div className="relative mx-auto mt-8 flex h-64 max-w-lg items-end justify-center gap-3 pb-6">
                    {[
                      { value: Number(student?.performanceScores?.Mathematics ?? 0), label: "Mathematics", delay: 0.1 },
                      { value: Number(student?.performanceScores?.Physics ?? 0), label: "Physics", delay: 0.2 },
                      { value: Number(student?.performanceScores?.Chemistry ?? 0), label: "Chemistry", delay: 0.3 },
                      { value: Number(student?.performanceScores?.Biology ?? 0), label: "Biology", delay: 0.4 },
                      { value: Number(student?.performanceScores?.English ?? 0), label: "English", delay: 0.5 },
                    ].map((props, index) => {
                      const maxVal = Math.max(...['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'].map(k => Number(student?.performanceScores?.[k]) || 0));
                      const isMax = maxVal > 0 && props.value === maxVal;
                      return (
                        <div key={index} className="h-full w-full flex flex-col justify-end">
                          <div className="group relative h-full w-full flex flex-col justify-end">
                            <div className="candy-bg-modal relative h-full w-full overflow-hidden rounded-2xl border border-gray-200/60">
                              <div
                                style={{ height: `${Math.min(100, Math.max(10, props.value))}%` }}
                                className={`absolute bottom-0 w-full rounded-2xl ${isMax ? 'bg-emerald-500 shadow-emerald-200' : 'bg-red-600'} p-1 text-white flex items-center justify-center shadow-md transition-all duration-500`}
                              >
                                <span className="font-extrabold text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">
                                  {props.value}%
                                </span>
                              </div>
                            </div>

                            {isMax && (
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-2 py-0.5 rounded-lg text-[9px] font-bold shadow-md whitespace-nowrap z-20">
                                Top Performer
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-emerald-600" />
                              </div>
                            )}
                            <p className="mx-auto mt-2 text-[10px] font-bold text-gray-700 text-center">
                              {props.label}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'Profile' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 text-sm">
              <h4 className="font-bold text-gray-900 text-base mb-4">Personal Profile Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-xs text-gray-500">Full Name</span>
                  <p className="font-bold text-gray-900">{fullName}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-xs text-gray-500">YashEdu Student ID</span>
                  <p className="font-mono font-bold text-red-600">{studentId}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-xs text-gray-500">Email</span>
                  <p className="font-medium text-gray-900">{email}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-xs text-gray-500">Phone</span>
                  <p className="font-medium text-gray-900">{phone}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Academics' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <div>
                  <h4 className="font-bold text-gray-900 text-base">Academic Performance & Subject Marks</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Evaluation breakdown for {fullName} ({studentId})</p>
                </div>
                <button
                  onClick={() => alert(`Report card PDF for ${fullName} downloaded.`)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Download Official PDF Report
                </button>
              </div>

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
                      const maxM = Number(student?.maxMarks?.[subj] ?? 100) || 100;
                      const obtM = Number(student?.marksObtained?.[subj] ?? student?.performanceScores?.[subj] ?? 0);
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
                    totMax += Number(student?.maxMarks?.[s] ?? 100) || 100;
                    totObt += Number(student?.marksObtained?.[s] ?? student?.performanceScores?.[s] ?? 0);
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
                      <div className="text-green-800">
                        OVERALL GRADE: <span className="font-extrabold text-sm">{overallGrade}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {activeTab !== 'Overview' && activeTab !== 'Checklist' && activeTab !== 'Profile' && activeTab !== 'Academics' && (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
              <GraduationCap className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <h4 className="font-bold text-gray-900 text-base">{activeTab} Details</h4>
              <p className="text-gray-500 text-xs max-w-sm mx-auto mt-1">
                Displaying official {activeTab.toLowerCase()} records for {fullName} ({studentId}).
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

