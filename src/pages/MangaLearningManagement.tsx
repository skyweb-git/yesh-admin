import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Upload, Image, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export const MangaLearningManagement = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<any>({
    isVisible: true,
    sectionTitle: 'Your Learning Journey',
    sectionDescription: 'Discover new skills and build your future.',
    dialogText: 'Your journey to success starts with one step.',
    dialogSecondaryText: 'Learn. Practice. Grow.',
    characterImage: 'https://cdn.pixabay.com/photo/2023/08/19/13/26/anime-8200639_1280.png',
    animationEnabled: true,
    animationSpeed: 50,
    galleryImages: []
  });

  const [newImage, setNewImage] = useState('');
  const [newImageAlt, setNewImageAlt] = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/home-learning`)
      .then(async res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        if (data && data._id) {
          setConfig(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching config:', err);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/home-learning`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        alert('Saved successfully!');
      } else {
        alert('Failed to save.');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving configuration.');
    }
    setSaving(false);
  };

  const handleHeroImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      if (!reader.result) return;
      const base64Data = reader.result as string;

      try {
        const res = await fetch(`${API_BASE_URL}/api/upload-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileData: base64Data,
            fileName: file.name
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.imageUrl) {
            setConfig((prev: any) => ({ ...prev, heroImage: data.imageUrl }));
            return;
          }
        }
        setConfig((prev: any) => ({ ...prev, heroImage: base64Data }));
      } catch (err) {
        setConfig((prev: any) => ({ ...prev, heroImage: base64Data }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCharacterImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig({ ...config, characterImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      if (!reader.result) return;
      const base64Data = reader.result as string;

      try {
        const res = await fetch(`${API_BASE_URL}/api/upload-image`, {

          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileData: base64Data,
            fileName: file.name
          })
        });

        let finalUrl = base64Data;
        if (res.ok) {
          const data = await res.json();
          if (data.imageUrl) finalUrl = data.imageUrl;
        }

        const currentGallery = config.galleryImages || [];
        const newGalleryItem = {
          image: finalUrl,
          altText: file.name || 'Study Image',
          active: true,
          order: currentGallery.length
        };
        setConfig({
          ...config,
          galleryImages: [...currentGallery, newGalleryItem]
        });
      } catch (err) {
        console.warn('Image upload fallback to base64:', err);
        const currentGallery = config.galleryImages || [];
        const newGalleryItem = {
          image: base64Data,
          altText: file.name || 'Study Image',
          active: true,
          order: currentGallery.length
        };
        setConfig({
          ...config,
          galleryImages: [...currentGallery, newGalleryItem]
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const addGalleryImage = () => {
    if (!newImage.trim()) {
      alert('Please paste an image URL or choose a file to upload first.');
      return;
    }
    const currentGallery = config.galleryImages || [];
    const newGalleryItem = {
      image: newImage.trim(),
      altText: newImageAlt || 'Study Image',
      active: true,
      order: currentGallery.length
    };
    setConfig({
      ...config,
      galleryImages: [...currentGallery, newGalleryItem]
    });
    setNewImage('');
    setNewImageAlt('');
  };

  const loadDefaultGalleryImages = () => {
    const defaults = [
      'https://images.unsplash.com/photo-1513258496099-48168024aec0?w=500&q=80',
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&q=80',
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=500&q=80',
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=500&q=80',
      'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=500&q=80',
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&q=80'
    ].map((imgUrl, i) => ({
      image: imgUrl,
      altText: `Study Image ${i + 1}`,
      active: true,
      order: i
    }));

    setConfig({
      ...config,
      galleryImages: defaults
    });
  };

  const removeGalleryImage = (index: number) => {
    const newGallery = [...(config.galleryImages || [])];
    newGallery.splice(index, 1);
    setConfig({ ...config, galleryImages: newGallery });
  };

  const toggleGalleryImageActive = (index: number) => {
    const newGallery = [...(config.galleryImages || [])];
    if(newGallery[index]) {
      newGallery[index].active = !newGallery[index].active;
      setConfig({ ...config, galleryImages: newGallery });
    }
  };

  const moveGalleryImage = (index: number, direction: 'up' | 'down') => {
    const newGallery = [...(config.galleryImages || [])];
    if (direction === 'up' && index > 0) {
      const temp = newGallery[index];
      newGallery[index] = newGallery[index - 1];
      newGallery[index - 1] = temp;
    } else if (direction === 'down' && index < newGallery.length - 1) {
      const temp = newGallery[index];
      newGallery[index] = newGallery[index + 1];
      newGallery[index + 1] = temp;
    }
    // Update order property just in case
    newGallery.forEach((item, i) => item.order = i);
    setConfig({ ...config, galleryImages: newGallery });
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Configuration...</div>;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manga Learning Section</h2>
          <p className="text-gray-500 text-sm">Manage the dynamic manga-inspired section on the Home Page</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Left Column: General & Hero Settings */}
        <div className="space-y-6">
          
          {/* Hero Section Configuration Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-lg text-gray-900 border-b pb-2 flex items-center justify-between">
              <span>Hero Section Settings</span>
              <span className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-bold">Main Banner</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Tagline Badge Text</label>
                <input 
                  type="text" 
                  className="border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                  value={config.heroBadgeText || 'QUALITY EDUCATION. BRIGHTER FUTURES.'}
                  onChange={e => setConfig({...config, heroBadgeText: e.target.value})}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Heading Line 1</label>
                <input 
                  type="text" 
                  className="border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                  value={config.heroTitleLine1 || 'Learn Without'}
                  onChange={e => setConfig({...config, heroTitleLine1: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Heading Highlight (Red Text)</label>
                <input 
                  type="text" 
                  className="border border-gray-300 p-2.5 rounded-lg text-sm font-bold text-red-600 focus:ring-2 focus:ring-red-500 outline-none"
                  value={config.heroTitleLine2 || 'Limits.'}
                  onChange={e => setConfig({...config, heroTitleLine2: e.target.value})}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Button Text</label>
                <input 
                  type="text" 
                  className="border border-gray-300 p-2.5 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-red-500 outline-none"
                  value={config.heroButtonText || 'Start Learning'}
                  onChange={e => setConfig({...config, heroButtonText: e.target.value})}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Paragraph 1 Text</label>
              <textarea 
                rows={2}
                className="border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                value={config.heroDescription1 || 'Give your child the right guidance, personal attention, and strong academic foundation they need to succeed.'}
                onChange={e => setConfig({...config, heroDescription1: e.target.value})}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Paragraph 2 Text</label>
              <textarea 
                rows={2}
                className="border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                value={config.heroDescription2 || 'Our tuition program provides a supportive and engaging learning environment for every student. We focus on helping students understand concepts clearly rather than simply memorizing answers.'}
                onChange={e => setConfig({...config, heroDescription2: e.target.value})}
              />
            </div>

            {/* Hero Image Upload */}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Hero Main Image</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Paste Image URL or choose file below" 
                  className="border border-gray-300 p-2.5 rounded-lg flex-1 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                  value={config.heroImage || ''}
                  onChange={e => setConfig({...config, heroImage: e.target.value})}
                />
              </div>
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-red-400 p-3 rounded-xl cursor-pointer bg-gray-50 hover:bg-red-50/50 transition-colors text-xs font-bold text-gray-700">
                <Upload className="w-4 h-4 text-red-600" />
                <span>Upload New Hero Image</span>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleHeroImageUpload}
                  className="hidden"
                />
              </label>
              {config.heroImage && (
                <div className="mt-2 h-32 rounded-xl overflow-hidden border border-gray-200">
                  <img src={config.heroImage} alt="Hero Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Floating Stat Cards Settings */}
            <div className="pt-3 border-t border-gray-100 space-y-3">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Floating Stat Cards</label>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1 border border-gray-200 p-2.5 rounded-xl bg-emerald-50/30">
                  <span className="text-[11px] font-bold text-emerald-700">Stat 1 (Green)</span>
                  <input 
                    type="text" 
                    placeholder="Value (50K+)"
                    className="border border-gray-300 p-1.5 rounded text-xs font-bold bg-white"
                    value={config.heroStat1Value || '50K+'}
                    onChange={e => setConfig({...config, heroStat1Value: e.target.value})}
                  />
                  <input 
                    type="text" 
                    placeholder="Label (Students)"
                    className="border border-gray-300 p-1.5 rounded text-xs bg-white mt-1"
                    value={config.heroStat1Label || 'Students'}
                    onChange={e => setConfig({...config, heroStat1Label: e.target.value})}
                  />
                </div>

                <div className="flex flex-col gap-1 border border-gray-200 p-2.5 rounded-xl bg-red-50/30">
                  <span className="text-[11px] font-bold text-red-700">Stat 2 (Red)</span>
                  <input 
                    type="text" 
                    placeholder="Value (Live Classes)"
                    className="border border-gray-300 p-1.5 rounded text-xs font-bold bg-white"
                    value={config.heroStat2Value || 'Live Classes'}
                    onChange={e => setConfig({...config, heroStat2Value: e.target.value})}
                  />
                  <input 
                    type="text" 
                    placeholder="Label (Daily)"
                    className="border border-gray-300 p-1.5 rounded text-xs bg-white mt-1"
                    value={config.heroStat2Label || 'Daily'}
                    onChange={e => setConfig({...config, heroStat2Label: e.target.value})}
                  />
                </div>

                <div className="flex flex-col gap-1 border border-gray-200 p-2.5 rounded-xl bg-blue-50/30">
                  <span className="text-[11px] font-bold text-blue-700">Stat 3 (Blue)</span>
                  <input 
                    type="text" 
                    placeholder="Value (500+)"
                    className="border border-gray-300 p-1.5 rounded text-xs font-bold bg-white"
                    value={config.heroStat3Value || '500+'}
                    onChange={e => setConfig({...config, heroStat3Value: e.target.value})}
                  />
                  <input 
                    type="text" 
                    placeholder="Label (Courses)"
                    className="border border-gray-300 p-1.5 rounded text-xs bg-white mt-1"
                    value={config.heroStat3Label || 'Courses'}
                    onChange={e => setConfig({...config, heroStat3Label: e.target.value})}
                  />
                </div>
              </div>
            </div>

          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-lg text-gray-900 border-b pb-2">Global Visibility</h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={config.isVisible} onChange={e => setConfig({...config, isVisible: e.target.checked})} />
                <div className={`block w-14 h-8 rounded-full transition-colors ${config.isVisible ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${config.isVisible ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </div>
              <span className="font-medium text-gray-700">Show this section on the Home Page</span>
            </label>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-lg text-gray-900 border-b pb-2">Manga Dialog Box</h3>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-600">Main Dialog Text</label>
              <input 
                type="text" 
                className="border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-red-500 outline-none w-full"
                value={config.dialogText}
                onChange={e => setConfig({...config, dialogText: e.target.value})}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-600">Secondary Dialog Text (Small)</label>
              <input 
                type="text" 
                className="border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-red-500 outline-none w-full"
                value={config.dialogSecondaryText}
                onChange={e => setConfig({...config, dialogSecondaryText: e.target.value})}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-lg text-gray-900 border-b pb-2">Character Settings</h3>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-600">Upload Character Image (Use transparent PNG)</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleCharacterImageUpload}
                className="border border-gray-300 p-2 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
              />
            </div>
            {config.characterImage && (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center h-48 pattern-checkered">
                <img src={config.characterImage} alt="Character Preview" className="h-full object-contain drop-shadow-lg" />
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-lg text-gray-900">Parent Progress Tracking Banner</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500" 
                  checked={config.showParentProgress !== false} 
                  onChange={e => setConfig({...config, showParentProgress: e.target.checked})} 
                />
                <span className="text-sm font-semibold text-gray-700">Enable Banner</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Banner Title</label>
                <input 
                  type="text" 
                  className="border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                  value={config.parentProgressTitle || 'Parent Progress Live Tracking'}
                  onChange={e => setConfig({...config, parentProgressTitle: e.target.value})}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Status Badge Text</label>
                <input 
                  type="text" 
                  className="border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                  value={config.parentProgressStatusText || 'Active Live'}
                  onChange={e => setConfig({...config, parentProgressStatusText: e.target.value})}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Banner Subtitle</label>
              <input 
                type="text" 
                className="border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                value={config.parentProgressSubtitle || 'Real-time student growth, regular tests & report updates'}
                onChange={e => setConfig({...config, parentProgressSubtitle: e.target.value})}
              />
            </div>

            <div className="pt-2 border-t border-gray-100">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">Metric Cards Values</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-gray-500">Quiz Score</label>
                  <input 
                    type="text" 
                    className="border border-gray-300 p-2 rounded-lg text-sm font-bold text-center"
                    value={config.parentProgressQuizScore || '96%'}
                    onChange={e => setConfig({...config, parentProgressQuizScore: e.target.value})}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-gray-500">Attendance</label>
                  <input 
                    type="text" 
                    className="border border-gray-300 p-2 rounded-lg text-sm font-bold text-center"
                    value={config.parentProgressAttendance || '98%'}
                    onChange={e => setConfig({...config, parentProgressAttendance: e.target.value})}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-gray-500">Regular Tests</label>
                  <input 
                    type="text" 
                    className="border border-gray-300 p-2 rounded-lg text-sm font-bold text-center"
                    value={config.parentProgressRegularTests || 'Weekly'}
                    onChange={e => setConfig({...config, parentProgressRegularTests: e.target.value})}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-gray-500">Batch Rank</label>
                  <input 
                    type="text" 
                    className="border border-gray-300 p-2 rounded-lg text-sm font-bold text-center"
                    value={config.parentProgressBatchRank || 'Top 5%'}
                    onChange={e => setConfig({...config, parentProgressBatchRank: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Gallery & Animation */}
        <div className="space-y-6">

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-lg text-gray-900">Diagonal Collage Gallery</h3>
              <button
                type="button"
                onClick={loadDefaultGalleryImages}
                className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200 flex items-center gap-1 transition-colors"
                title="Load 6 high quality demo study images"
              >
                <Sparkles className="w-3.5 h-3.5" /> Load Preset Images
              </button>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600">Option 1: Paste Image URL & Click Add</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Paste image URL (e.g. https://images.unsplash.com/...)" 
                  className="border border-gray-300 p-2.5 rounded-lg flex-1 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                  value={newImage}
                  onChange={e => setNewImage(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addGalleryImage();
                    }
                  }}
                />
                <button 
                  type="button"
                  onClick={addGalleryImage}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-bold text-sm transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 space-y-2">
              <label className="text-xs font-semibold text-gray-600">Option 2: Upload Image File from Computer</label>
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-red-400 p-3 rounded-xl cursor-pointer bg-gray-50 hover:bg-red-50/50 transition-colors text-xs font-bold text-gray-700">
                <Upload className="w-4 h-4 text-red-600" />
                <span>Choose Image File to Upload</span>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleGalleryFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="mt-4 space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {!(config.galleryImages?.length > 0) ? (
                <p className="text-gray-500 text-sm text-center py-4">No images added. Collage will be empty.</p>
              ) : (
                config.galleryImages.map((item: any, index: number) => (
                  <div key={index} className={`flex items-center gap-4 p-3 rounded-xl border ${item.active ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                    <img src={item.image} alt={item.altText} className="w-16 h-12 object-cover rounded shadow-sm" />
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.image}</p>
                      <p className="text-xs text-gray-500">{item.active ? 'Active' : 'Inactive'}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggleGalleryImageActive(index)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Toggle Visibility">
                        {item.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button onClick={() => moveGalleryImage(index, 'up')} disabled={index === 0} className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded disabled:opacity-30">
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button onClick={() => moveGalleryImage(index, 'down')} disabled={index === config.galleryImages.length - 1} className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded disabled:opacity-30">
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button onClick={() => removeGalleryImage(index)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-lg text-gray-900 border-b pb-2">Animation Settings</h3>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-red-600 rounded focus:ring-red-500" checked={config.animationEnabled} onChange={e => setConfig({...config, animationEnabled: e.target.checked})} />
              <span className="text-sm font-medium text-gray-700">Enable Diagonal Animation</span>
            </label>

            <div className="flex flex-col gap-1 mt-4">
              <label className="text-sm font-medium text-gray-600">Animation Speed (Base Duration in Seconds)</label>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="20" max="150" 
                  className="flex-1"
                  value={config.animationSpeed}
                  onChange={e => setConfig({...config, animationSpeed: parseInt(e.target.value)})}
                />
                <span className="text-sm font-bold w-12 text-center bg-gray-100 py-1 rounded">{config.animationSpeed}s</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Lower value = Faster animation.</p>
            </div>
          </div>

        </div>
      </div>

      {/* Classes We Teach Section Management */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h3 className="font-bold text-xl text-gray-900">Classes We Teach Section Management</h3>
            <p className="text-sm text-gray-500">Configure the grade level cards displayed on the Home Page</p>
          </div>
          <button
            onClick={() => {
              const currentCards = config.classesWeTeachCards || [];
              const newCard = {
                title: `Classes ${currentCards.length + 1}`,
                tag: 'Special',
                description: 'Custom class description',
                highlights: ['Interactive Sessions', 'Dedicated Mentorship'],
                themeColor: 'red',
                buttonText: 'Explore Classes',
                linkUrl: '/courses',
                active: true
              };
              setConfig({ ...config, classesWeTeachCards: [...currentCards, newCard] });
            }}
            className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Class Card
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Section Main Title</label>
            <input 
              type="text" 
              className="border border-gray-300 p-2.5 rounded-lg text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none"
              value={config.classesWeTeachSectionTitle || 'Classes We Teach'}
              onChange={e => setConfig({...config, classesWeTeachSectionTitle: e.target.value})}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Section Subtitle</label>
            <input 
              type="text" 
              className="border border-gray-300 p-2.5 rounded-lg text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none"
              value={config.classesWeTeachSectionSubtitle || 'Tailored curriculum and expert coaching designed for every milestone of your academic journey.'}
              onChange={e => setConfig({...config, classesWeTeachSectionSubtitle: e.target.value})}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pt-4">
          {((config.classesWeTeachCards?.length > 0) ? config.classesWeTeachCards : [
            { title: 'Classes 1 – 5', tag: 'Primary', description: 'Building strong fundamentals in Math, Science & Language with activity-based learning.', highlights: ['Activity-Based Learning', 'Core Math & Science', 'Interactive Live Quizzes'], themeColor: 'red', active: true },
            { title: 'Classes 6 – 8', tag: 'Middle School', description: 'Conceptual clarity, analytical problem solving, and early Olympiad foundation.', highlights: ['Conceptual Deep Dives', 'Olympiad Preparation', 'Dedicated Doubt Clearing'], themeColor: 'blue', active: true },
            { title: 'Classes 9 – 10', tag: 'Boards Prep', description: 'Board Exam mastery, mock test series, and strong competitive foundation.', highlights: ['Board Exam Preparation', 'Timed Mock Test Series', '1-on-1 Academic Mentorship'], themeColor: 'amber', active: true },
            { title: 'Classes 11 – 12', tag: 'Senior & Entrance', description: 'Advanced Science & Commerce streams, JEE/NEET prep & board strategies.', highlights: ['JEE / NEET Focused Tracks', 'Science & Commerce Specialization', 'Live Problem Solving'], themeColor: 'purple', active: true }
          ]).map((card: any, index: number) => (
            <div key={index} className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50 space-y-3 relative">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Card #{index + 1}</span>
                <button
                  onClick={() => {
                    const currentCards = [...(config.classesWeTeachCards || [])];
                    currentCards.splice(index, 1);
                    setConfig({ ...config, classesWeTeachCards: currentCards });
                  }}
                  className="text-gray-400 hover:text-red-600 p-1 rounded"
                  title="Remove Card"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-gray-600">Card Title</label>
                <input 
                  type="text"
                  className="border border-gray-300 p-2 rounded-lg text-sm font-bold bg-white"
                  value={card.title}
                  onChange={e => {
                    const currentCards = [...(config.classesWeTeachCards || [])];
                    currentCards[index] = { ...currentCards[index], title: e.target.value };
                    setConfig({ ...config, classesWeTeachCards: currentCards });
                  }}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-gray-600">Badge Tag</label>
                <input 
                  type="text"
                  className="border border-gray-300 p-2 rounded-lg text-xs font-medium bg-white"
                  value={card.tag}
                  onChange={e => {
                    const currentCards = [...(config.classesWeTeachCards || [])];
                    currentCards[index] = { ...currentCards[index], tag: e.target.value };
                    setConfig({ ...config, classesWeTeachCards: currentCards });
                  }}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-gray-600">Description</label>
                <textarea 
                  rows={2}
                  className="border border-gray-300 p-2 rounded-lg text-xs bg-white"
                  value={card.description}
                  onChange={e => {
                    const currentCards = [...(config.classesWeTeachCards || [])];
                    currentCards[index] = { ...currentCards[index], description: e.target.value };
                    setConfig({ ...config, classesWeTeachCards: currentCards });
                  }}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-gray-600">Highlights (Comma separated)</label>
                <input 
                  type="text"
                  className="border border-gray-300 p-2 rounded-lg text-xs bg-white"
                  value={Array.isArray(card.highlights) ? card.highlights.join(', ') : card.highlights}
                  onChange={e => {
                    const currentCards = [...(config.classesWeTeachCards || [])];
                    currentCards[index] = { 
                      ...currentCards[index], 
                      highlights: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean)
                    };
                    setConfig({ ...config, classesWeTeachCards: currentCards });
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Our Teaching Method Section Management */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2">
              Our Teaching Method Section Management
            </h3>
            <p className="text-sm text-gray-500">Configure the 4-step learning journey section (Learn → Practice → Test → Improve) on the Home Page</p>
          </div>
          <label className="flex items-center gap-3 cursor-pointer bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
            <input 
              type="checkbox" 
              className="w-4 h-4 text-red-600 rounded focus:ring-red-500" 
              checked={config.teachingMethodVisible !== false} 
              onChange={e => setConfig({ ...config, teachingMethodVisible: e.target.checked })} 
            />
            <span className="text-sm font-semibold text-gray-700">Section Visible</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Section Badge</label>
            <input 
              type="text" 
              className="border border-gray-300 p-2.5 rounded-lg text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none"
              value={config.teachingMethodBadge || 'Our Teaching Method'}
              onChange={e => setConfig({ ...config, teachingMethodBadge: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Main Heading</label>
            <input 
              type="text" 
              className="border border-gray-300 p-2.5 rounded-lg text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none"
              value={config.teachingMethodTitle || 'Our 4-Step Learning Journey'}
              onChange={e => setConfig({ ...config, teachingMethodTitle: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Section Subtitle / Description</label>
            <input 
              type="text" 
              className="border border-gray-300 p-2.5 rounded-lg text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none"
              value={config.teachingMethodDescription || 'A proven methodology that helps students learn better, practice smarter, and achieve more.'}
              onChange={e => setConfig({ ...config, teachingMethodDescription: e.target.value })}
            />
          </div>
        </div>

        {/* Steps Management */}
        <div className="pt-2">
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-bold text-gray-800 uppercase tracking-wider block">4-Step Learning Journey Cards</label>
            <button
              onClick={() => {
                const currentSteps = config.teachingMethodSteps || [
                  { step: '01', title: 'Learn', description: 'Understand concepts clearly with simple explanations and real-life examples.', badge: 'Phase 1 of 4', themeColor: 'red', active: true },
                  { step: '02', title: 'Practice', description: 'Strengthen knowledge through worksheets, assignments, and regular practice.', badge: 'Phase 2 of 4', themeColor: 'blue', active: true },
                  { step: '03', title: 'Test', description: 'Regular assessments and quizzes to evaluate understanding and track progress.', badge: 'Phase 3 of 4', themeColor: 'amber', active: true },
                  { step: '04', title: 'Improve', description: 'Personalized feedback and doubt clearing to help students improve continuously.', badge: 'Phase 4 of 4', themeColor: 'emerald', active: true }
                ];
                const newStep = {
                  step: `0${currentSteps.length + 1}`,
                  title: 'New Step',
                  description: 'Step description goes here...',
                  badge: `Step ${currentSteps.length + 1}`,
                  themeColor: 'purple',
                  active: true
                };
                setConfig({ ...config, teachingMethodSteps: [...currentSteps, newStep] });
              }}
              className="flex items-center gap-1.5 bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Step
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {((config.teachingMethodSteps?.length > 0) ? config.teachingMethodSteps : [
              { step: '01', title: 'Learn', description: 'Understand concepts clearly with simple explanations and real-life examples.', badge: 'Phase 1 of 4', themeColor: 'red', active: true },
              { step: '02', title: 'Practice', description: 'Strengthen knowledge through worksheets, assignments, and regular practice.', badge: 'Phase 2 of 4', themeColor: 'blue', active: true },
              { step: '03', title: 'Test', description: 'Regular assessments and quizzes to evaluate understanding and track progress.', badge: 'Phase 3 of 4', themeColor: 'amber', active: true },
              { step: '04', title: 'Improve', description: 'Personalized feedback and doubt clearing to help students improve continuously.', badge: 'Phase 4 of 4', themeColor: 'emerald', active: true }
            ]).map((stepItem: any, sIdx: number) => (
              <div key={sIdx} className="border border-gray-200 rounded-2xl p-4 bg-gray-50/60 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Step #{sIdx + 1}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const steps = [...(config.teachingMethodSteps || [])];
                        if (steps[sIdx]) {
                          steps.splice(sIdx, 1);
                          setConfig({ ...config, teachingMethodSteps: steps });
                        }
                      }}
                      className="text-gray-400 hover:text-red-600 p-1 rounded"
                      title="Remove Step"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-gray-600">Step Number</label>
                    <input 
                      type="text"
                      className="border border-gray-300 p-2 rounded-lg text-xs font-bold bg-white"
                      value={stepItem.step || `0${sIdx + 1}`}
                      onChange={e => {
                        const steps = [...(config.teachingMethodSteps || [])];
                        steps[sIdx] = { ...steps[sIdx], step: e.target.value };
                        setConfig({ ...config, teachingMethodSteps: steps });
                      }}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-gray-600">Theme Color</label>
                    <select 
                      className="border border-gray-300 p-2 rounded-lg text-xs bg-white font-medium"
                      value={stepItem.themeColor || 'red'}
                      onChange={e => {
                        const steps = [...(config.teachingMethodSteps || [])];
                        steps[sIdx] = { ...steps[sIdx], themeColor: e.target.value };
                        setConfig({ ...config, teachingMethodSteps: steps });
                      }}
                    >
                      <option value="red">Red</option>
                      <option value="blue">Blue</option>
                      <option value="amber">Amber</option>
                      <option value="emerald">Emerald</option>
                      <option value="purple">Purple</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-gray-600">Step Title</label>
                  <input 
                    type="text"
                    className="border border-gray-300 p-2 rounded-lg text-sm font-bold bg-white"
                    value={stepItem.title}
                    onChange={e => {
                      const steps = [...(config.teachingMethodSteps || [])];
                      steps[sIdx] = { ...steps[sIdx], title: e.target.value };
                      setConfig({ ...config, teachingMethodSteps: steps });
                    }}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-gray-600">Badge Label</label>
                  <input 
                    type="text"
                    className="border border-gray-300 p-2 rounded-lg text-xs font-medium bg-white"
                    value={stepItem.badge || `Step ${sIdx + 1}`}
                    onChange={e => {
                      const steps = [...(config.teachingMethodSteps || [])];
                      steps[sIdx] = { ...steps[sIdx], badge: e.target.value };
                      setConfig({ ...config, teachingMethodSteps: steps });
                    }}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-gray-600">Description</label>
                  <textarea 
                    rows={2}
                    className="border border-gray-300 p-2 rounded-lg text-xs bg-white"
                    value={stepItem.description}
                    onChange={e => {
                      const steps = [...(config.teachingMethodSteps || [])];
                      steps[sIdx] = { ...steps[sIdx], description: e.target.value };
                      setConfig({ ...config, teachingMethodSteps: steps });
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assurance Callout Banner Settings */}
        <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Assurance Banner Title</label>
            <input 
              type="text" 
              className="border border-gray-300 p-2.5 rounded-lg text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none"
              value={config.teachingMethodAssuranceTitle || 'Why Parents Trust Our Methodology'}
              onChange={e => setConfig({ ...config, teachingMethodAssuranceTitle: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Assurance Banner Description</label>
            <input 
              type="text" 
              className="border border-gray-300 p-2.5 rounded-lg text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none"
              value={config.teachingMethodAssuranceDesc || 'Every student gets personalized attention with weekly updates delivered directly to parents.'}
              onChange={e => setConfig({ ...config, teachingMethodAssuranceDesc: e.target.value })}
            />
          </div>
        </div>
      </div>

    </div>
  );
};
