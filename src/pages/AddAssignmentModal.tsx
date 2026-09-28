import { useState, useEffect, useRef } from 'react';
import { X, Upload, FileText, CheckCircle, User, Users, Globe } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface AddAssignmentModalProps {
  onClose: () => void;
  onSuccess: (assignment: any) => void;
}

export const AddAssignmentModal = ({ onClose, onSuccess }: AddAssignmentModalProps) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [targetType, setTargetType] = useState<'ALL' | 'INDIVIDUAL' | 'GROUP'>('ALL');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  const [students, setStudents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch students list for individual assignment target selection
    fetch(`${API_BASE_URL}/api/users?role=student`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setStudents(data);
      })
      .catch(err => console.error('Error fetching students:', err));

    // Fetch groups list for group target selection
    fetch(`${API_BASE_URL}/api/groups`)

      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setGroups(data);
      })
      .catch(err => console.error('Error fetching groups:', err));
  }, []);

  const handleStudentCheckboxToggle = (studentId: string) => {
    if (selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds(selectedStudentIds.filter(id => id !== studentId));
    } else {
      setSelectedStudentIds([...selectedStudentIds, studentId]);
    }
  };

  const filteredStudentsList = students.filter(st => 
    st.fullName?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    st.studentId?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    st.email?.toLowerCase().includes(studentSearchTerm.toLowerCase())
  );

  const handleSelectAllStudents = () => {
    if (selectedStudentIds.length === filteredStudentsList.length && filteredStudentsList.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudentsList.map(st => st._id));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Please upload a PDF file only.');
        setFile(null);
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size should not exceed 10MB.');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  const handleUpload = async () => {
    if (!title.trim() || !dueDate) {
      setError('Title and Due Date are required.');
      return;
    }
    if (!file) {
      setError('Please select a PDF file to upload.');
      return;
    }
    if (targetType === 'INDIVIDUAL' && selectedStudentIds.length === 0) {
      setError('Please select at least one student checkbox for individual assignment.');
      return;
    }
    if (targetType === 'GROUP' && !selectedGroupId) {
      setError('Please select a group for group assignment.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // 1. Convert to base64
      const base64Data = await toBase64(file);

      // 2. Upload file to backend server
      const uploadRes = await fetch(`${API_BASE_URL}/api/upload-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: base64Data,
          fileName: file.name
        })
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to upload PDF file.');
      }
      const uploadData = await uploadRes.json();

      // 3. Save assignment to backend database
      const assignRes = await fetch(`${API_BASE_URL}/api/assignments`, {

        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subject,
          description,
          dueDate,
          targetType,
          studentIds: targetType === 'INDIVIDUAL' ? selectedStudentIds : undefined,
          groupId: targetType === 'GROUP' ? selectedGroupId : undefined,
          fileUrl: uploadData.fileUrl,
          fileName: uploadData.fileName
        })
      });

      if (!assignRes.ok) {
        const errData = await assignRes.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to create assignment record.');
      }
      const newAssignment = await assignRes.json();

      setSuccess(true);
      setTimeout(() => {
        onSuccess(newAssignment);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl my-8">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add New Assignment</h2>
            <p className="text-xs text-gray-500 mt-1">Upload a PDF assignment and select target students</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Assignment Created!</h3>
              <p className="text-gray-500 text-sm">The assignment has been successfully created and sent.</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Assignment Title *</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Chapter 4 Math Exercises"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Subject *</label>
                  <select 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900 bg-white"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="English">English</option>
                    <option value="General Science">General Science</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Due Date *</label>
                  <input 
                    type="date" 
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900"
                  />
                </div>
              </div>

              {/* Target Audience Select Options */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold text-gray-700">Assign To (Target Audience) *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetType('ALL')}
                    className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      targetType === 'ALL'
                        ? 'bg-red-50 border-red-500 text-red-700 shadow-xs'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" /> All Students
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('INDIVIDUAL')}
                    className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      targetType === 'INDIVIDUAL'
                        ? 'bg-red-50 border-red-500 text-red-700 shadow-xs'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" /> Select Students
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('GROUP')}
                    className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      targetType === 'GROUP'
                        ? 'bg-red-50 border-red-500 text-red-700 shadow-xs'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" /> Specific Group
                  </button>
                </div>

                {/* Checkbox multi-select if INDIVIDUAL selected */}
                {targetType === 'INDIVIDUAL' && (
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-gray-700">
                        Select Students ({selectedStudentIds.length} selected) *
                      </label>
                      {filteredStudentsList.length > 0 && (
                        <button
                          type="button"
                          onClick={handleSelectAllStudents}
                          className="text-[11px] font-bold text-red-600 hover:underline"
                        >
                          {selectedStudentIds.length === filteredStudentsList.length ? 'Deselect All' : 'Select All'}
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      placeholder="Search students by name or ID..."
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-red-500 text-gray-900 bg-gray-50"
                    />

                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-2 bg-white space-y-1 divide-y divide-gray-100">
                      {filteredStudentsList.length > 0 ? (
                        filteredStudentsList.map((st) => {
                          const isChecked = selectedStudentIds.includes(st._id);
                          return (
                            <label
                              key={st._id}
                              className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                                isChecked ? 'bg-red-50/80 text-red-900 font-bold' : 'hover:bg-gray-50 text-gray-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleStudentCheckboxToggle(st._id)}
                                className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                              />
                              <span className="flex-1 truncate">
                                {st.fullName} <span className="text-gray-400 font-mono text-[11px]">({st.studentId || st.email})</span>
                              </span>
                            </label>
                          );
                        })
                      ) : (
                        <p className="text-xs text-gray-400 p-3 text-center">No students found.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Dropdown if GROUP selected */}
                {targetType === 'GROUP' && (
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Select Group *</label>
                    <select
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900 bg-white"
                    >
                      <option value="">-- Choose Group --</option>
                      {groups.map((grp) => (
                        <option key={grp._id} value={grp._id}>
                          {grp.name} ({grp.members?.length || 0} members)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description (Optional)</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional instructions for the students..."
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900 resize-none h-16"
                />
              </div>

              <div 
                className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-colors ${
                  file ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-red-400 hover:bg-gray-50'
                }`}
                onClick={() => !uploading && fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  accept="application/pdf"
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                
                {file ? (
                  <div className="flex flex-col items-center">
                    <FileText className="w-8 h-8 text-red-600 mb-1" />
                    <p className="text-xs font-bold text-gray-900 line-clamp-1">{file.name}</p>
                    <p className="text-[10px] text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="mt-2 text-[11px] font-bold text-red-500 hover:text-red-700 underline"
                      disabled={uploading}
                    >
                      Remove File
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
                      <Upload className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-bold text-gray-900 mb-0.5">Click to select PDF assignment</p>
                    <p className="text-[10px] text-gray-500">PDF documents only (Max 10MB)</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={onClose}
                  disabled={uploading}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  {uploading ? 'Uploading...' : 'Upload & Create'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

