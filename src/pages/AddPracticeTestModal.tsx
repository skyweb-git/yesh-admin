import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, CheckCircle, FileText, Upload, User, Users, Globe, Download, FileSpreadsheet } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface AddPracticeTestModalProps {
  onClose: () => void;
  onSuccess: (newTest: any) => void;
}

interface QuestionInput {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
}

export const AddPracticeTestModal = ({ onClose, onSuccess }: AddPracticeTestModalProps) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [passingScore, setPassingScore] = useState(50);
  
  // Target Audience Selection state
  const [targetType, setTargetType] = useState<'ALL' | 'INDIVIDUAL' | 'GROUP'>('ALL');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  const [students, setStudents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);

  // File upload state for PDF test papers
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Questions builder state
  const [questions, setQuestions] = useState<QuestionInput[]>([
    {
      questionText: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0
    }
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Fetch students list for individual target selection
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

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0
      }
    ]);
  };

  const handleRemoveQuestion = (qIndex: number) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, idx) => idx !== qIndex));
  };

  const handleQuestionTextChange = (qIndex: number, text: string) => {
    const updated = [...questions];
    updated[qIndex].questionText = text;
    setQuestions(updated);
  };

  const handleOptionTextChange = (qIndex: number, oIndex: number, text: string) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = text;
    setQuestions(updated);
  };

  const handleCorrectOptionChange = (qIndex: number, oIndex: number) => {
    const updated = [...questions];
    updated[qIndex].correctOptionIndex = oIndex;
    setQuestions(updated);
  };

  const [convertingPdf, setConvertingPdf] = useState(false);
  const [conversionMsg, setConversionMsg] = useState('');

  const parseCsvToMcq = (csvText: string): QuestionInput[] => {
    const lines = csvText
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) return [];

    const parsedQuestions: QuestionInput[] = [];

    const parseCsvLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^"|"$/g, ''));
      return result;
    };

    let startIdx = 0;
    const firstRowCols = parseCsvLine(lines[0]);
    if (
      firstRowCols.length >= 2 &&
      (firstRowCols[0].toLowerCase().includes('question') ||
       firstRowCols[1].toLowerCase().includes('option') ||
       firstRowCols[0].toLowerCase().includes('q text'))
    ) {
      startIdx = 1;
    }

    for (let i = startIdx; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      if (cols.length < 3) continue;

      const questionText = cols[0];
      if (!questionText) continue;

      let rawOptions: string[] = [];
      let rawAns = '';

      if (cols.length >= 6) {
        rawOptions = cols.slice(1, 5);
        rawAns = cols[5] || '';
      } else if (cols.length === 5) {
        const lastCol = cols[4].trim();
        if (/^(a|b|c|d|1|2|3|4|opt[a-d])$/i.test(lastCol)) {
          rawOptions = cols.slice(1, 4);
          rawAns = lastCol;
        } else {
          rawOptions = cols.slice(1, 5);
        }
      } else {
        rawOptions = cols.slice(1);
      }

      const options = [...rawOptions];
      while (options.length < 4) {
        options.push(`Option ${String.fromCharCode(65 + options.length)}`);
      }

      let correctOptionIndex = 0;
      const cleanAns = rawAns.toLowerCase().trim();
      if (cleanAns === 'a' || cleanAns === '1' || cleanAns === 'option a' || cleanAns === 'opt a') correctOptionIndex = 0;
      else if (cleanAns === 'b' || cleanAns === '2' || cleanAns === 'option b' || cleanAns === 'opt b') correctOptionIndex = 1;
      else if (cleanAns === 'c' || cleanAns === '3' || cleanAns === 'option c' || cleanAns === 'opt c') correctOptionIndex = 2;
      else if (cleanAns === 'd' || cleanAns === '4' || cleanAns === 'option d' || cleanAns === 'opt d') correctOptionIndex = 3;
      else if (rawAns) {
        const matchIdx = options.findIndex(o => o.toLowerCase().trim() === cleanAns);
        if (matchIdx !== -1) correctOptionIndex = matchIdx;
      }

      parsedQuestions.push({
        questionText,
        options: options.slice(0, 4),
        correctOptionIndex
      });
    }

    return parsedQuestions;
  };

  const handleConvertCsvToMcq = (csvFile: File) => {
    setConvertingPdf(true);
    setConversionMsg('');
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCsvToMcq(text);
        if (parsed.length > 0) {
          setQuestions(parsed);
          setConversionMsg(`✓ Successfully converted CSV into ${parsed.length} Multiple Choice Questions!`);
        } else {
          setError('Could not parse any MCQs from the CSV file. Please check format.');
        }
      } catch (err: any) {
        console.error('Error parsing CSV:', err);
        setError('Failed to parse CSV file. Make sure it is a valid CSV format.');
      } finally {
        setConvertingPdf(false);
      }
    };
    reader.onerror = () => {
      setError('Error reading CSV file.');
      setConvertingPdf(false);
    };
    reader.readAsText(csvFile);
  };

  const handleConvertPdfToMcq = async (pdfFile: File) => {
    setConvertingPdf(true);
    setConversionMsg('');
    setError('');

    try {
      const base64Data = await toBase64(pdfFile);
      const res = await fetch(`${API_BASE_URL}/api/convert-pdf-to-mcq`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileData: base64Data })
      });

      if (!res.ok) {
        throw new Error('Failed to convert PDF to MCQs');
      }

      const data = await res.json();
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        setQuestions(data.questions);
        setConversionMsg(`✓ Successfully converted PDF into ${data.questions.length} Multiple Choice Questions!`);
      } else {
        setConversionMsg('Uploaded PDF, but could not detect MCQs automatically.');
      }
    } catch (err: any) {
      console.error('Error converting PDF to MCQ:', err);
      setError('Could not extract MCQs from PDF automatically. You can add questions manually below.');
    } finally {
      setConvertingPdf(false);
    }
  };

  const downloadSampleCsv = () => {
    const sampleContent = 
      `Question,Option A,Option B,Option C,Option D,Correct Answer\n` +
      `"What is the capital of France?","Paris","London","Berlin","Madrid","A"\n` +
      `"What is 15 + 25?","30","35","40","45","C"\n` +
      `"Which planet is known as the Red Planet?","Earth","Mars","Jupiter","Venus","B"`;
      
    const blob = new Blob([sampleContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_mcq_test_paper.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const name = selectedFile.name.toLowerCase();
      const type = selectedFile.type.toLowerCase();
      const isPdf = type === 'application/pdf' || name.endsWith('.pdf');
      const isCsv = type.includes('csv') || name.endsWith('.csv') || type.includes('excel');

      if (!isPdf && !isCsv) {
        setError('Please upload a PDF or CSV file only.');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError('');

      if (isCsv) {
        handleConvertCsvToMcq(selectedFile);
      } else {
        handleConvertPdfToMcq(selectedFile);
      }
    }
  };

  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Test title is required.');
      return;
    }
    if (targetType === 'INDIVIDUAL' && selectedStudentIds.length === 0) {
      setError('Please select at least one student checkbox for individual test assignment.');
      return;
    }
    if (targetType === 'GROUP' && !selectedGroupId) {
      setError('Please select a group for group test assignment.');
      return;
    }

    // Validate questions if any were entered
    const validQuestions = questions.filter(q => q.questionText.trim() !== '');
    for (let i = 0; i < validQuestions.length; i++) {
      const q = validQuestions[i];
      const validOpts = q.options.filter(o => o.trim() !== '');
      if (validOpts.length < 2) {
        setError(`Question #${i + 1} must have at least 2 valid options.`);
        return;
      }
    }

    setSaving(true);
    setError('');

    try {
      let fileUrl = '';
      let fileName = '';

      // Upload PDF test paper if selected
      if (file) {
        const base64Data = await toBase64(file);
        const uploadRes = await fetch(`${API_BASE_URL}/api/upload-pdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileData: base64Data,
            fileName: file.name
          })
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          fileUrl = uploadData.fileUrl;
          fileName = uploadData.fileName;
        }
      }

      // Save Practice Test to backend
      const res = await fetch(`${API_BASE_URL}/api/tests`, {

        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subject,
          description,
          targetType,
          studentIds: targetType === 'INDIVIDUAL' ? selectedStudentIds : undefined,
          groupId: targetType === 'GROUP' ? selectedGroupId : undefined,
          durationMinutes: Number(durationMinutes),
          passingScore: Number(passingScore),
          fileUrl,
          fileName,
          questions: validQuestions
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to create practice test.');
      }

      const newTest = await res.json();
      setSuccess(true);
      setTimeout(() => {
        onSuccess(newTest);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while creating test.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Create New Practice Test</h2>
            <p className="text-xs text-gray-500 mt-1">Configure test details, target audience and add questions</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {success ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Practice Test Created!</h3>
              <p className="text-gray-500 text-sm">The practice test is now active and available for students.</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 font-medium">
                  {error}
                </div>
              )}

              {/* General Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Test Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Mathematics Mid-Term Mock Test"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Subject *</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900 bg-white"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="English">English</option>
                    <option value="General Science">General Science</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    min={5}
                    max={300}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Passing Score (%)</label>
                  <input
                    type="number"
                    value={passingScore}
                    onChange={(e) => setPassingScore(Number(e.target.value))}
                    min={0}
                    max={100}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900"
                  />
                </div>
              </div>

              {/* Assign To (Target Audience) Section */}
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
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-red-500 text-gray-900 bg-gray-50"
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
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900 bg-white"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    min={5}
                    max={300}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Passing Score (%)</label>
                  <input
                    type="number"
                    value={passingScore}
                    onChange={(e) => setPassingScore(Number(e.target.value))}
                    min={0}
                    max={100}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description / Instructions</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide instructions or syllabus coverage for the test..."
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900 resize-none h-20"
                />
              </div>

              {/* Optional PDF or CSV Test Upload */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <label className="block text-xs font-bold text-gray-700">
                      Upload PDF or CSV Test Paper (Auto-converts to MCQs)
                    </label>
                    <button
                      type="button"
                      onClick={downloadSampleCsv}
                      className="text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors"
                      title="Download sample CSV template"
                    >
                      <Download className="w-3 h-3" /> Sample CSV
                    </button>
                  </div>
                  {convertingPdf && (
                    <span className="text-xs text-red-600 font-semibold animate-pulse flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span> Converting File to MCQs...
                    </span>
                  )}
                </div>

                <div
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors ${
                    file ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-red-400 hover:bg-gray-50'
                  }`}
                  onClick={() => !saving && !convertingPdf && fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    accept=".pdf, .csv, application/pdf, text/csv, application/vnd.ms-excel"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />

                  {file ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-3">
                        <div className="flex items-center gap-2 max-w-[75%]">
                          {file.name.toLowerCase().endsWith('.csv') ? (
                            <FileSpreadsheet className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <FileText className="w-6 h-6 text-red-600 flex-shrink-0" />
                          )}
                          <span className="text-xs font-bold text-gray-900 truncate" title={file.name}>{file.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (file.name.toLowerCase().endsWith('.csv')) {
                                handleConvertCsvToMcq(file);
                              } else {
                                handleConvertPdfToMcq(file);
                              }
                            }}
                            className="text-xs font-bold text-red-600 hover:text-red-700 bg-white border border-red-200 px-2.5 py-1 rounded-lg shadow-xs"
                          >
                            Re-extract MCQs
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFile(null);
                              setConversionMsg('');
                            }}
                            className="text-xs font-bold text-red-500 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-gray-500 py-2">
                      <Upload className="w-4 h-4 text-red-600" />
                      <span className="text-xs font-medium">Click to upload question paper <b>PDF or CSV</b> (Auto-extracts questions into MCQs below)</span>
                    </div>
                  )}
                </div>

                {conversionMsg && (
                  <div className="mt-2 p-2.5 bg-green-50 text-green-800 text-xs font-bold rounded-xl border border-green-200 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>{conversionMsg}</span>
                  </div>
                )}
              </div>

              {/* Questions Section */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-gray-900">Multiple Choice Questions</h3>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Question
                  </button>
                </div>

                <div className="space-y-4">
                  {questions.map((q, qIdx) => (
                    <div key={qIdx} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3 relative">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-red-600 bg-red-100 px-2.5 py-0.5 rounded-full">
                          Question #{qIdx + 1}
                        </span>
                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(qIdx)}
                            className="text-gray-400 hover:text-red-600 transition-colors p-1"
                            title="Remove question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        value={q.questionText}
                        onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                        placeholder={`Enter Question #${qIdx + 1} text...`}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 bg-white"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-opt-${qIdx}`}
                              checked={q.correctOptionIndex === oIdx}
                              onChange={() => handleCorrectOptionChange(qIdx, oIdx)}
                              className="accent-red-600 w-4 h-4 cursor-pointer"
                              title="Mark as correct option"
                            />
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleOptionTextChange(qIdx, oIdx, e.target.value)}
                              placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                              className={`flex-1 px-3 py-1.5 border rounded-lg text-xs outline-none bg-white ${
                                q.correctOptionIndex === oIdx ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-200'
                              }`}
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400 italic">Radio button selects the correct answer option.</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? 'Saving...' : 'Create Practice Test'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
