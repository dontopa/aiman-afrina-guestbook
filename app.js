// Digital Wedding Guestbook & Live Photo Gallery - Aiman & Afrina
const { useState, useEffect, useRef, useMemo, Component } = React;

// Supabase Cloud Credentials Provided by User
const SUPABASE_URL = "https://nqxnkukeacguhgkbzmum.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xeG5rdWtlYWNndWhna2J6bXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMTU1OTgsImV4cCI6MjEwMTY5MTU5OH0.qLLVSBV_oGh2gkvFmBcCE2otz5wwLT8akDblU0rOKIg";

// Initialize Supabase Client
let supabaseClient = null;
try {
  if (window.supabase && window.supabase.createClient) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (e) {
  console.warn("Supabase init error:", e);
}

// Helper: Automatic Image Compression (< 1MB) using Canvas
function compressImageFile(file, maxDimension = 1000, quality = 0.7) {
  return new Promise((resolve) => {
    if (file.type && file.type.startsWith('video/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve({ dataUrl: e.target.result, blob: file });
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        canvas.toBlob((blob) => {
          resolve({ dataUrl, blob: blob || file });
        }, 'image/jpeg', quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Error Boundary to prevent blank screens
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("React Error Caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textCenter: 'center', color: '#6d1e4a', fontFamily: 'sans-serif' }}>
          <h2>Ralat aplikasi berlaku.</h2>
          <p style={{ fontSize: '12px' }}>{String(this.state.error)}</p>
          <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', background: '#c2417c', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            Muat Semula Halaman
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Initial Sample Gallery Memories (Fallback)
const INITIAL_MEMORIES = [
  {
    id: 'mem-1',
    type: 'photo',
    guestName: 'Siti Sarah & Zafri',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    imageUrl: 'assets/images/polaroid1.png',
    isVideo: false,
    caption: 'Selamat Pengantin Baru Aiman & Afrina! Semoga perkahwinan ini dilimpahi rahmat & kebahagiaan hingga ke syurga ❤️✨',
    timestamp: '21 saat lalu',
    createdAt: Date.now() - 21000,
    likes: 34,
    isLiked: false,
    challengeTag: 'Pose Gempak',
    isBoomerang: false
  },
  {
    id: 'mem-2',
    type: 'boomerang',
    guestName: 'Khairul & Geng Kolej',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    imageUrl: 'assets/images/polaroid4.png',
    isVideo: false,
    caption: 'Congrats bro Aiman! Akhirnya ke jenjang pelamin jugak! Geng kolej doakan kebahagiaan selamanya 🥂🔥',
    timestamp: '2 minit lalu',
    createdAt: Date.now() - 120000,
    likes: 58,
    isLiked: true,
    challengeTag: 'Gaya Pengantin',
    isBoomerang: true
  },
  {
    id: 'mem-3',
    type: 'photo',
    guestName: 'Dato\' Iskandar & Datin',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    imageUrl: 'assets/images/polaroid3.png',
    isVideo: false,
    caption: 'Tahniah buat kedua mempelai. Cantik molek berseri pengantin hari ini. Mawaddah wa rahmah sentiasa.',
    timestamp: '15 minit lalu',
    createdAt: Date.now() - 900000,
    likes: 42,
    isLiked: false,
    challengeTag: 'Ucapan Ringkas',
    isBoomerang: false
  },
  {
    id: 'mem-4',
    type: 'photo',
    guestName: 'Amira & Farhan',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    imageUrl: 'assets/images/polaroid2.png',
    isVideo: false,
    caption: 'Photobooth paling meriah! Love giler pelamin blush pink & vibes majlis hari ni 🎉🌸 #AimanAfrina',
    timestamp: '42 minit lalu',
    createdAt: Date.now() - 2520000,
    likes: 29,
    isLiked: false,
    challengeTag: 'Pose Gempak',
    isBoomerang: false
  }
];

const MORE_MEMORIES = [
  {
    id: 'mem-5',
    type: 'photo',
    guestName: 'Farah & Cousins',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
    imageUrl: 'assets/images/polaroid1.png',
    isVideo: false,
    caption: 'Sepupu tersayang pengantin perempuan! Afrina look like a queen today 👑✨',
    timestamp: '1 jam lalu',
    createdAt: Date.now() - 3600000,
    likes: 19,
    isLiked: false,
    challengeTag: 'Gaya Pengantin',
    isBoomerang: false
  },
  {
    id: 'mem-6',
    type: 'boomerang',
    guestName: 'Zafran Tech Squad',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&q=80',
    imageUrl: 'assets/images/polaroid2.png',
    isVideo: false,
    caption: 'Boomerang challenge accepted! Happy wedding Aiman & Afrina 📹🥳',
    timestamp: '2 jam lalu',
    createdAt: Date.now() - 7200000,
    likes: 31,
    isLiked: false,
    challengeTag: 'Pose Gempak',
    isBoomerang: true
  }
];

const GUEST_AVATARS = [
  { name: 'Siti Sarah', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80', isLive: true },
  { name: 'Khairul N.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80', isLive: true },
  { name: 'Amira R.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80', isLive: true },
  { name: 'Dato Iskandar', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80', isLive: false },
  { name: 'Farah H.', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80', isLive: true },
  { name: 'Zafri K.', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&q=80', isLive: false },
  { name: 'Nadia B.', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80', isLive: true }
];

// Curated Gift Registry Ideas (Linked to Shopee)
const GIFT_IDEAS = [
  {
    id: 'gift-1',
    title: 'Philips Digital Air Fryer XL 4.1L',
    category: 'Kelengkapan Dapur',
    price: 'RM 299 - RM 399',
    image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=400&q=80',
    shopeeQuery: 'Philips Air Fryer XL'
  },
  {
    id: 'gift-2',
    title: 'Nespresso Essenza Mini Coffee Machine',
    category: 'Minuman & Barista',
    price: 'RM 450 - RM 520',
    image: 'https://images.unsplash.com/photo-1517668808822-9ebe02f2a698?auto=format&fit=crop&w=400&q=80',
    shopeeQuery: 'Nespresso Essenza Mini'
  },
  {
    id: 'gift-3',
    title: 'Giselle Stand Mixer 5L Gold Edition',
    category: 'Baking & Pastry',
    price: 'RM 189 - RM 240',
    image: 'https://images.unsplash.com/photo-1594385208974-2e75f8d7bb48?auto=format&fit=crop&w=400&q=80',
    shopeeQuery: 'Stand Mixer 5L'
  },
  {
    id: 'gift-4',
    title: 'Russell Hobbs 2-Slice Retro Toaster',
    category: 'Sarapan Pagi',
    price: 'RM 149 - RM 180',
    image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=400&q=80',
    shopeeQuery: 'Retro 2 Slice Toaster'
  },
  {
    id: 'gift-5',
    title: 'Luxury Microfiber Bedsheet Set King (Blush)',
    category: 'Bilik Tidur',
    price: 'RM 129 - RM 169',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=400&q=80',
    shopeeQuery: 'Luxury Bedsheet King Blush Pink'
  },
  {
    id: 'gift-6',
    title: 'Deerma Cordless Handheld Vacuum Cleaner',
    category: 'Kebersihan Rumah',
    price: 'RM 199 - RM 250',
    image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=400&q=80',
    shopeeQuery: 'Deerma Cordless Vacuum Cleaner'
  }
];

function App() {
  const [activeTab, setActiveTab] = useState('home');
  
  const [memories, setMemories] = useState(INITIAL_MEMORIES);
  
  const [filterMode, setFilterMode] = useState('latest');
  const [selectedGuestFilter, setSelectedGuestFilter] = useState(null);
  const [hasLoadedMore, setHasLoadedMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const audioRef = useRef(null);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState('photo');
  const [guestName, setGuestName] = useState('');
  const [wishCaption, setWishCaption] = useState('');
  const [selectedChallenge, setSelectedChallenge] = useState('Pose Gempak');
  const [previewMedia, setPreviewMedia] = useState(null);
  const [selectedFileObj, setSelectedFileObj] = useState(null);
  const [isVideoMedia, setIsVideoMedia] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [activeLightboxMedia, setActiveLightboxMedia] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [shutterEffect, setShutterEffect] = useState(false);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Toast Helper
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3500);
  };

  // 1. FETCH MEMORIES FROM SUPABASE DATABASE ON MOUNT & PERIODICALLY
  const fetchSupabaseMemories = async () => {
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient
        .from('memories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn("Supabase fetch error:", error.message);
        return;
      }

      if (data && data.length > 0) {
        const mapped = data.map(item => ({
          id: String(item.id),
          type: item.is_boomerang ? 'boomerang' : 'photo',
          guestName: item.guest_name || 'Tetamu',
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(item.guest_name || 'Guest')}`,
          imageUrl: item.image_url,
          isVideo: item.is_video || false,
          caption: item.caption || '',
          timestamp: item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Baru sahaja',
          createdAt: new Date(item.created_at).getTime() || Date.now(),
          likes: item.likes || 1,
          isLiked: false,
          challengeTag: item.challenge_tag || 'Pose Gempak',
          isBoomerang: item.is_boomerang || false
        }));

        // Merge cloud items with sample initial items so nothing is lost
        const sampleItemsNotDuplicate = INITIAL_MEMORIES.filter(
          init => !mapped.some(m => m.id === init.id)
        );
        setMemories([...mapped, ...sampleItemsNotDuplicate]);
      }
    } catch (err) {
      console.warn("Fetch Supabase catch:", err);
    }
  };

  useEffect(() => {
    fetchSupabaseMemories();

    // Auto-poll every 8 seconds so all devices stay updated instantly
    const interval = setInterval(fetchSupabaseMemories, 8000);

    // Realtime Postgres Subscription
    let channel = null;
    if (supabaseClient) {
      try {
        channel = supabaseClient
          .channel('public:memories')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'memories' }, payload => {
            fetchSupabaseMemories();
            triggerToast(`Memori baharu dimasukkan! 📸✨`);
          })
          .subscribe();
      } catch (err) {
        console.warn("Realtime error:", err);
      }
    }

    return () => {
      clearInterval(interval);
      if (channel && supabaseClient) {
        supabaseClient.removeChannel(channel);
      }
    };
  }, []);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingMusic(true);
      }).catch(err => {
        triggerToast('Tekan sekali lagi untuk memainkan muzik 🎵');
      });
    }
  };

  // Toggle Like Heart (Updates Supabase + Local State)
  const handleToggleLike = async (id, e) => {
    if (e) e.stopPropagation();
    
    let targetItem = null;
    setMemories(prev => prev.map(item => {
      if (item.id === id) {
        targetItem = item;
        const nextLiked = !item.isLiked;
        const countDiff = nextLiked ? 1 : -1;
        if (nextLiked && window.confetti) {
          window.confetti({
            particleCount: 25,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#c2417c', '#f3c7d0', '#ffffff']
          });
        }
        return {
          ...item,
          isLiked: nextLiked,
          likes: item.likes + countDiff
        };
      }
      return item;
    }));

    if (supabaseClient && targetItem && !isNaN(Number(targetItem.id))) {
      try {
        const updatedLikes = targetItem.isLiked ? targetItem.likes - 1 : targetItem.likes + 1;
        await supabaseClient.from('memories').update({ likes: updatedLikes }).eq('id', targetItem.id);
      } catch (e) {}
    }
  };

  // Handle File Input Selection with AUTO-COMPRESSION (< 1MB)
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const isVid = file.type.startsWith('video/');
      setIsVideoMedia(isVid);

      // Auto compress photo to < 1MB
      const { dataUrl, blob } = await compressImageFile(file, 1000, 0.7);
      setSelectedFileObj(blob);
      setPreviewMedia(dataUrl);
    }
  };

  const handleOpenUpload = (type) => {
    setUploadType(type);
    setIsUploadOpen(true);
  };

  // Submit New Memory
  const handleSubmitMemory = async (e) => {
    e.preventDefault();
    if (!guestName.trim()) {
      triggerToast('Sila masukkan nama anda ✍️');
      return;
    }
    if (!wishCaption.trim()) {
      triggerToast('Sila tuliskan ucapan & wish anda ❤️');
      return;
    }

    setIsSubmitting(true);
    setShutterEffect(true);
    setTimeout(() => setShutterEffect(false), 400);

    let finalUploadedUrl = null;

    // A. Upload File to Supabase Cloud Storage if available
    if (supabaseClient && selectedFileObj) {
      try {
        const fileExt = isVideoMedia ? 'mp4' : 'jpg';
        const fileName = `memory-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data: uploadData, error: uploadErr } = await supabaseClient.storage
          .from('wedding-memories')
          .upload(fileName, selectedFileObj, { cacheControl: '3600', upsert: true });

        if (!uploadErr && uploadData) {
          const { data: publicUrlObj } = supabaseClient.storage
            .from('wedding-memories')
            .getPublicUrl(fileName);
          
          if (publicUrlObj && publicUrlObj.publicUrl) {
            finalUploadedUrl = publicUrlObj.publicUrl;
          }
        } else if (uploadErr) {
          console.warn("Storage upload notice:", uploadErr.message);
        }
      } catch (err) {
        console.warn("Supabase Storage exception:", err);
      }
    }

    // Fallback images if no cloud URL or file
    const fallbackImages = [
      'assets/images/polaroid1.png',
      'assets/images/polaroid2.png',
      'assets/images/polaroid3.png',
      'assets/images/polaroid4.png'
    ];
    const randomFallback = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
    const finalMedia = finalUploadedUrl || previewMedia || randomFallback;

    // B. Save Record to Supabase Database `memories` table
    if (supabaseClient) {
      try {
        let payload = {
          guest_name: guestName.trim(),
          caption: wishCaption.trim(),
          image_url: finalMedia,
          is_video: isVideoMedia,
          likes: 1,
          challenge_tag: selectedChallenge,
          is_boomerang: uploadType === 'boomerang'
        };

        let { data: insertedRows, error: insertErr } = await supabaseClient
          .from('memories')
          .insert([payload])
          .select();

        // If challenge_tag column is missing, retry with basic fields
        if (insertErr && insertErr.message && insertErr.message.includes('challenge_tag')) {
          delete payload.challenge_tag;
          delete payload.is_boomerang;
          const retryRes = await supabaseClient.from('memories').insert([payload]).select();
          insertErr = retryRes.error;
          insertedRows = retryRes.data;
        }

        if (insertErr) {
          console.error("Insert error:", insertErr.message);
          alert(`⚠️ Amaran Simpanan: "${insertErr.message}". Sila jalankan skrip SQL di Supabase Editor.`);
        } else {
          console.log("Successfully saved to Supabase DB:", insertedRows);
          fetchSupabaseMemories();
        }
      } catch (err) {
        console.error("Database insert exception:", err);
        alert(`⚠️ Exception: ${err.message}`);
      }
    } else {
      // Offline fallback
      const newMemoryObj = {
        id: `mem-${Date.now()}`,
        type: uploadType,
        guestName: guestName.trim(),
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(guestName)}`,
        imageUrl: finalMedia,
        isVideo: isVideoMedia,
        caption: wishCaption.trim(),
        timestamp: 'Baru sahaja',
        createdAt: Date.now(),
        likes: 1,
        isLiked: true,
        challengeTag: selectedChallenge,
        isBoomerang: uploadType === 'boomerang'
      };
      setMemories(prev => [newMemoryObj, ...prev]);
    }

    setIsSubmitting(false);
    setIsUploadOpen(false);
    setPreviewMedia(null);
    setSelectedFileObj(null);
    setIsVideoMedia(false);
    setGuestName('');
    setWishCaption('');

    if (window.confetti) {
      window.confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#c2417c', '#f3c7d0', '#d4af37', '#ffffff']
      });
    }

    triggerToast('Memori anda berjaya dikongsi! 🎉✨');
    setActiveTab('gallery');
  };

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setMemories(prev => [...prev, ...MORE_MEMORIES]);
      setHasLoadedMore(true);
      setIsLoadingMore(false);
      triggerToast('Memori lama berjaya dimuat naik! 📸');
    }, 800);
  };

  const displayedMemories = useMemo(() => {
    let result = [...memories];
    if (selectedGuestFilter) {
      result = result.filter(m => m.guestName.toLowerCase().includes(selectedGuestFilter.toLowerCase()));
    }
    if (filterMode === 'popular') {
      result.sort((a, b) => b.likes - a.likes);
    } else {
      result.sort((a, b) => b.createdAt - a.createdAt);
    }
    return result;
  }, [memories, filterMode, selectedGuestFilter]);

  const totalMemories = memories.length + (hasLoadedMore ? 0 : 42);
  const totalGuests = 80 + memories.length;
  const totalLikes = useMemo(() => memories.reduce((acc, curr) => acc + curr.likes, 1140), [memories]);

  const handleShare = (item, e) => {
    if (e) e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: 'Memori Perkahwinan Aiman & Afrina',
        text: `Lihat ucapan daripada ${item.guestName}: "${item.caption}" #AimanAfrina`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      triggerToast('Pautan memori disalin ke papan klip! 📋');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8ecee] text-[#331525] flex justify-center pb-20 selection:bg-blush-500 selection:text-white">
      <audio
        ref={audioRef}
        loop
        src="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=romantic-wedding-acoustic-112191.mp3"
      />

      {shutterEffect && <div className="fixed inset-0 bg-white z-[9999] flash-screen pointer-events-none" />}

      <div className="w-full max-w-md bg-[#fcf0f2] min-h-screen shadow-2xl relative flex flex-col border-x border-pink-100/60">
        
        {/* Floating Sound Toggle Button */}
        <button
          onClick={toggleMusic}
          className={`fixed top-4 right-4 z-40 w-11 h-11 rounded-full bg-white/90 shadow-lg border border-pink-200 flex items-center justify-center text-[#c2417c] transition-transform active:scale-95 backdrop-blur-sm ${isPlayingMusic ? 'glow-pulsing' : ''}`}
          title="Kawalan Muzik Ambient"
        >
          <div className={`${isPlayingMusic ? 'spin-disc' : ''}`}>
            <i className="fa-solid fa-compact-disc text-xl text-[#c2417c]"></i>
          </div>
        </button>

        {/* ------------------- APP HEADER ------------------- */}
        <header className="sticky top-0 z-30 bg-[#fcf0f2]/90 backdrop-blur-md border-b border-pink-100 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            {activeTab !== 'home' ? (
              <button
                onClick={() => setActiveTab('home')}
                className="p-1.5 rounded-full hover:bg-pink-100 text-blush-600 transition"
              >
                <i className="fa-solid fa-arrow-left text-base text-[#c2417c]"></i>
              </button>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blush-500 to-pink-300 text-white font-bold flex items-center justify-center text-xs shadow-md">
                A&A
              </div>
            )}
            <div>
              <span className="text-[11px] font-bold tracking-widest text-[#c2417c] uppercase block">#AimanAfrina</span>
              <h1 className="text-xs font-semibold text-gray-700">Digital Guestbook & Live Gallery</h1>
            </div>
          </div>

          <button
            onClick={() => handleOpenUpload('photo')}
            className="flex items-center gap-1.5 bg-gradient-to-r from-[#c2417c] to-pink-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md hover:opacity-90 active:scale-95 transition"
          >
            <i className="fa-solid fa-camera"></i>
            <span>+ Kongsi</span>
          </button>
        </header>

        {/* ------------------- MAIN CONTENT SWITCHER ------------------- */}
        <main className="flex-1">
          {activeTab === 'home' && (
            <HeroSection
              onOpenUpload={handleOpenUpload}
              onGoToGallery={() => setActiveTab('gallery')}
              totalMemories={totalMemories}
              totalGuests={totalGuests}
            />
          )}

          {activeTab === 'gallery' && (
            <LiveGalleryView
              memories={displayedMemories}
              totalMemories={totalMemories}
              totalGuests={totalGuests}
              totalLikes={totalLikes}
              filterMode={filterMode}
              setFilterMode={setFilterMode}
              selectedGuestFilter={selectedGuestFilter}
              setSelectedGuestFilter={setSelectedGuestFilter}
              onToggleLike={handleToggleLike}
              onShare={handleShare}
              onOpenUpload={handleOpenUpload}
              onLightbox={setActiveLightboxMedia}
              onLoadMore={handleLoadMore}
              hasLoadedMore={hasLoadedMore}
              isLoadingMore={isLoadingMore}
            />
          )}

          {activeTab === 'salamkaut' && (
            <SalamKautSection
              triggerToast={triggerToast}
              onLightbox={setActiveLightboxMedia}
            />
          )}

          {activeTab === 'hadiah' && (
            <HadiahSection triggerToast={triggerToast} />
          )}
        </main>

        {/* ------------------- STICKY BOTTOM NAVIGATION BAR ------------------- */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-md border-t border-pink-100 z-40 px-2 py-2 flex items-center justify-around shadow-lg">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-0.5 text-[10.5px] font-medium transition ${activeTab === 'home' ? 'text-[#c2417c] font-bold' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <i className="fa-solid fa-house text-lg"></i>
            <span>Utama</span>
          </button>

          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex flex-col items-center gap-0.5 text-[10.5px] font-medium transition ${activeTab === 'gallery' ? 'text-[#c2417c] font-bold' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <i className="fa-solid fa-image text-lg"></i>
            <span>Galeri Live</span>
          </button>

          {/* Quick Capture Camera Floating CTA */}
          <button
            onClick={() => handleOpenUpload('photo')}
            className="-mt-5 w-12 h-12 rounded-full bg-gradient-to-tr from-[#c2417c] to-pink-500 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition border-2 border-white"
            title="Muat Naik Memori Foto/Boomerang"
          >
            <i className="fa-solid fa-camera text-xl"></i>
          </button>

          <button
            onClick={() => setActiveTab('salamkaut')}
            className={`flex flex-col items-center gap-0.5 text-[10.5px] font-medium transition ${activeTab === 'salamkaut' ? 'text-[#c2417c] font-bold' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <i className="fa-solid fa-qrcode text-lg"></i>
            <span>Salam Kaut</span>
          </button>

          <button
            onClick={() => setActiveTab('hadiah')}
            className={`flex flex-col items-center gap-0.5 text-[10.5px] font-medium transition ${activeTab === 'hadiah' ? 'text-[#c2417c] font-bold' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <i className="fa-solid fa-gift text-lg"></i>
            <span>Idea Hadiah</span>
          </button>
        </nav>

        {/* ------------------- UPLOAD MODAL ------------------- */}
        {isUploadOpen && (
          <UploadModal
            uploadType={uploadType}
            setUploadType={setUploadType}
            guestName={guestName}
            setGuestName={setGuestName}
            wishCaption={wishCaption}
            setWishCaption={setWishCaption}
            selectedChallenge={selectedChallenge}
            setSelectedChallenge={setSelectedChallenge}
            previewMedia={previewMedia}
            isVideoMedia={isVideoMedia}
            onFileChange={handleFileChange}
            onSubmit={handleSubmitMemory}
            onClose={() => setIsUploadOpen(false)}
            isSubmitting={isSubmitting}
            cameraInputRef={cameraInputRef}
            galleryInputRef={galleryInputRef}
          />
        )}

        {/* ------------------- LIGHTBOX MODAL ------------------- */}
        {activeLightboxMedia && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <button
              onClick={() => setActiveLightboxMedia(null)}
              className="absolute top-4 right-4 text-white p-2 rounded-full bg-white/10 hover:bg-white/20"
            >
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
            <div className="max-w-md w-full bg-white p-3 rounded-2xl shadow-2xl relative">
              <div className="polaroid-tape" />
              {activeLightboxMedia.isVideo ? (
                <video
                  src={activeLightboxMedia.imageUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-auto rounded-lg max-h-[70vh] object-cover"
                />
              ) : (
                <img
                  src={activeLightboxMedia.imageUrl}
                  alt="Full Polaroid"
                  className="w-full h-auto rounded-lg max-h-[70vh] object-cover"
                />
              )}
              <div className="mt-3 px-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-blush-800 text-sm">{activeLightboxMedia.guestName || 'Mempelai Aiman & Afrina'}</h4>
                  <span className="text-xs text-gray-400">{activeLightboxMedia.timestamp || 'Imbasan QR'}</span>
                </div>
                {activeLightboxMedia.caption && (
                  <p className="text-xs text-gray-600 mt-1 italic">"{activeLightboxMedia.caption}"</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ------------------- TOAST NOTIFICATION ------------------- */}
        {showToast && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#6d1e4a] text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl border border-pink-300/30 flex items-center gap-2 animate-bounce max-w-[90vw] text-center">
            <i className="fa-solid fa-wand-magic-sparkles text-pink-300"></i>
            <span>{toastMessage}</span>
          </div>
        )}

      </div>
    </div>
  );
}

/* HERO SECTION */
function HeroSection({ onOpenUpload, onGoToGallery, totalMemories, totalGuests }) {
  return (
    <div className="flex flex-col items-center text-center px-4 py-6 space-y-6">
      
      <div className="flex flex-col items-center space-y-1">
        <div className="w-14 h-14 rounded-full bg-white border-2 border-blush-400 p-1 shadow-md flex items-center justify-center">
          <div className="w-full h-full rounded-full border border-dashed border-blush-400 flex items-center justify-center bg-blush-50">
            <span className="font-script text-2xl text-blush-600 font-bold">A&A</span>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-blush-600 uppercase tracking-widest mt-1">
          Walimatulurus
        </span>
      </div>

      <div>
        <h2 className="font-script text-5xl text-[#c2417c] font-bold drop-shadow-sm leading-tight">
          Aiman & Afrina
        </h2>
        <p className="font-script text-2xl text-blush-800 -mt-1">
          MAJLIS PERKAHWINAN
        </p>
        <h3 className="text-xs font-bold text-gray-600 tracking-wider uppercase mt-1">
          Tangkap Memori Bersama
        </h3>
      </div>

      <div className="flex items-center justify-center gap-2 flex-wrap">
        <span className="bg-white/80 border border-pink-200 text-[#c2417c] text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
          <i className="fa-regular fa-calendar-days text-[#c2417c]"></i>
          12 DISEMBER 2026
        </span>
        <span className="bg-[#c2417c] text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
          <i className="fa-solid fa-hashtag text-pink-200"></i>
          AimanAfrina
        </span>
      </div>

      <div className="relative w-full max-w-[320px] h-[250px] my-2 flex items-center justify-center">
        <div className="absolute left-2 top-2 w-[170px] bg-white p-2.5 rounded-xl shadow-polaroid transform -rotate-6 transition-transform hover:rotate-0 hover:z-20 animate-float-slow border border-pink-100">
          <div className="polaroid-tape" />
          <img
            src="assets/images/polaroid1.png"
            alt="Polaroid 1"
            className="w-full h-[120px] object-cover rounded-md"
          />
          <div className="mt-2 text-left">
            <p className="text-[11px] font-bold text-blush-800 truncate">Aiman & Afrina ❤️</p>
            <p className="text-[9px] text-gray-400">12 Disember 2026</p>
          </div>
        </div>

        <div className="absolute right-2 top-8 w-[165px] bg-white p-2.5 rounded-xl shadow-polaroid transform rotate-6 transition-transform hover:rotate-0 hover:z-20 animate-float-reverse border border-pink-100">
          <div className="polaroid-tape" />
          <img
            src="assets/images/polaroid2.png"
            alt="Polaroid 2"
            className="w-full h-[115px] object-cover rounded-md"
          />
          <div className="mt-2 text-left">
            <p className="text-[11px] font-bold text-blush-800 truncate">Siti & Geng Photobooth</p>
            <p className="text-[9px] text-gray-400">2 minit lalu</p>
          </div>
        </div>

        <div className="absolute top-16 w-[150px] bg-white p-2 rounded-xl shadow-2xl transform -rotate-1 border border-pink-200 z-10">
          <img
            src="assets/images/polaroid3.png"
            alt="Polaroid 3"
            className="w-full h-[105px] object-cover rounded-md"
          />
          <div className="mt-1 text-center">
            <span className="text-[10px] font-bold text-blush-600">#MemoriAbadi ✨</span>
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-2 gap-3 px-2 pt-2">
        <button
          onClick={() => onOpenUpload('photo')}
          className="w-full bg-white border-2 border-[#c2417c] text-[#c2417c] hover:bg-pink-50 text-xs font-bold py-3 px-3 rounded-2xl shadow-md flex items-center justify-center gap-2 transition active:scale-95"
        >
          <i className="fa-solid fa-camera text-base"></i>
          <span>📷 FOTO</span>
        </button>

        <button
          onClick={() => onOpenUpload('boomerang')}
          className="w-full bg-[#c2417c] hover:bg-blush-600 text-white text-xs font-bold py-3 px-3 rounded-2xl shadow-md flex items-center justify-center gap-2 transition active:scale-95 glow-pulsing"
        >
          <i className="fa-solid fa-video text-base"></i>
          <span>📹 BOOMERANG</span>
        </button>
      </div>

      <button
        onClick={onGoToGallery}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#c2417c] hover:underline pt-1 transition"
      >
        <span>LIHAT GALERI</span>
        <i className="fa-solid fa-chevron-right text-xs"></i>
      </button>

      <div className="w-full bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-pink-100 shadow-sm mt-4">
        <h4 className="text-xs font-bold text-blush-800 uppercase tracking-wider mb-3 flex items-center justify-center gap-1.5">
          <i className="fa-solid fa-wand-magic-sparkles text-[#c2417c]"></i>
          Statistik Memori Live
        </h4>
        <div className="grid grid-cols-2 gap-4 divide-x divide-pink-100">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-black text-[#c2417c]">{totalMemories}</span>
            <span className="text-[11px] font-semibold text-gray-500">Memori Dikongsi</span>
          </div>
          <div className="flex flex-col items-center pl-4">
            <span className="text-2xl font-black text-blush-800">{totalGuests}</span>
            <span className="text-[11px] font-semibold text-gray-500">Tetamu Menyertai</span>
          </div>
        </div>
      </div>

    </div>
  );
}

/* LIVE GALLERY VIEW */
function LiveGalleryView({
  memories,
  totalMemories,
  totalGuests,
  totalLikes,
  filterMode,
  setFilterMode,
  selectedGuestFilter,
  setSelectedGuestFilter,
  onToggleLike,
  onShare,
  onOpenUpload,
  onLightbox,
  onLoadMore,
  hasLoadedMore,
  isLoadingMore
}) {
  return (
    <div className="px-3 py-4 space-y-4">
      
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-pink-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <i className="fa-solid fa-camera text-[#c2417c]"></i>
            <h3 className="text-xs font-bold text-blush-800">Galeri Perkahwinan Live</h3>
          </div>
          <span className="text-[10px] font-bold text-white bg-[#c2417c] px-2 py-0.5 rounded-full">
            #AimanAfrina
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 bg-pink-50/60 p-2 rounded-xl text-center">
          <div>
            <span className="block text-xs font-extrabold text-[#c2417c]">{totalMemories}</span>
            <span className="text-[10px] text-gray-500 font-medium">Memori</span>
          </div>
          <div>
            <span className="block text-xs font-extrabold text-blush-800">{totalGuests}</span>
            <span className="text-[10px] text-gray-500 font-medium">Tetamu</span>
          </div>
          <div>
            <span className="block text-xs font-extrabold text-[#c2417c]">{totalLikes}</span>
            <span className="text-[10px] text-gray-500 font-medium">Likes</span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Tetamu Terkini</span>
          {selectedGuestFilter && (
            <button
              onClick={() => setSelectedGuestFilter(null)}
              className="text-[10px] text-[#c2417c] underline font-bold"
            >
              Set Semula Filter
            </button>
          )}
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar py-1 px-1">
          {GUEST_AVATARS.map((g, idx) => {
            const isSelected = selectedGuestFilter === g.name;
            return (
              <button
                key={idx}
                onClick={() => setSelectedGuestFilter(isSelected ? null : g.name)}
                className={`flex-shrink-0 flex flex-col items-center gap-1 transition ${isSelected ? 'scale-105' : 'opacity-90 hover:opacity-100'}`}
              >
                <div className={`relative w-11 h-11 rounded-full p-0.5 ${isSelected ? 'ring-2 ring-[#c2417c] bg-white' : 'border border-pink-200'}`}>
                  <img
                    src={g.avatar}
                    alt={g.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                  {g.isLive && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <span className={`text-[10px] font-medium max-w-[55px] truncate ${isSelected ? 'text-[#c2417c] font-bold' : 'text-gray-600'}`}>
                  {g.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#c2417c] to-blush-600 rounded-2xl p-3.5 text-white shadow-md flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <span className="inline-block bg-white/20 backdrop-blur-sm text-pink-100 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            🎯 CHALLENGE AKTIF
          </span>
          <p className="text-xs font-bold leading-tight">
            Misi pose & gaya paling gempak bersama pengantin!
          </p>
        </div>
        <button
          onClick={() => onOpenUpload('photo')}
          className="flex-shrink-0 bg-white text-[#c2417c] text-[11px] font-extrabold px-3 py-2 rounded-xl shadow hover:bg-pink-50 transition active:scale-95"
        >
          Sertai Misi
        </button>
      </div>

      <div className="flex items-center justify-between border-b border-pink-200 pb-1">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterMode('latest')}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${filterMode === 'latest' ? 'bg-[#c2417c] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            Terbaru
          </button>
          <button
            onClick={() => setFilterMode('popular')}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${filterMode === 'popular' ? 'bg-[#c2417c] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            Popular 🔥
          </button>
        </div>
        <span className="text-[10px] text-gray-400 font-medium">
          Showing {memories.length} memori
        </span>
      </div>

      {memories.length === 0 ? (
        <div className="text-center py-10 bg-white/60 rounded-2xl p-6 border border-pink-100">
          <i className="fa-solid fa-camera text-3xl text-pink-300 mb-2"></i>
          <p className="text-xs text-gray-500 font-semibold">Tiada memori ditemui untuk carian ini.</p>
          <button
            onClick={() => setSelectedGuestFilter(null)}
            className="mt-2 text-xs font-bold text-[#c2417c] underline"
          >
            Lihat Semua Memori
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {memories.map((item, idx) => (
            <PolaroidCard
              key={item.id}
              item={item}
              index={idx}
              onToggleLike={onToggleLike}
              onShare={onShare}
              onLightbox={onLightbox}
            />
          ))}
        </div>
      )}

      {!hasLoadedMore && (
        <div className="pt-2 text-center">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="w-full bg-white border border-pink-200 text-[#c2417c] hover:bg-pink-50 text-xs font-extrabold py-2.5 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 transition"
          >
            {isLoadingMore ? (
              <span>Memuat naik memori...</span>
            ) : (
              <>
                <span>LOAD MORE MEMORI...</span>
                <i className="fa-solid fa-chevron-down text-xs"></i>
              </>
            )}
          </button>
        </div>
      )}

    </div>
  );
}

/* POLAROID CARD */
function PolaroidCard({ item, index, onToggleLike, onShare, onLightbox }) {
  const tiltClass = index % 2 === 0 ? '-rotate-1' : 'rotate-1';

  return (
    <div
      onClick={() => onLightbox(item)}
      className={`bg-white p-2 rounded-xl shadow-polaroid relative border border-pink-100/80 transition-transform duration-200 hover:-translate-y-1 cursor-pointer flex flex-col justify-between ${tiltClass}`}
    >
      <div className="polaroid-tape" />

      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-pink-50 mt-1">
        {item.isVideo ? (
          <video
            src={item.imageUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={item.imageUrl}
            alt={item.guestName}
            className={`w-full h-full object-cover ${item.isBoomerang ? 'animate-boomerang-loop' : ''}`}
          />
        )}

        {item.isBoomerang && (
          <span className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-md text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-1">
            <i className="fa-solid fa-video text-pink-400"></i>
            BOOMERANG
          </span>
        )}

        {item.challengeTag && (
          <span className="absolute bottom-1.5 right-1.5 bg-white/90 backdrop-blur-sm text-blush-800 text-[8px] font-bold px-1.5 py-0.5 rounded-md border border-pink-200 shadow-sm">
            {item.challengeTag}
          </span>
        )}
      </div>

      <div className="mt-2 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-blush-900 truncate max-w-[100px]">
            {item.guestName}
          </span>
          <span className="text-[8.5px] font-medium text-gray-400">
            {item.timestamp}
          </span>
        </div>

        <p className="text-[10px] text-gray-600 line-clamp-2 leading-snug italic">
          "{item.caption}"
        </p>

        <div className="flex items-center justify-between pt-1 border-t border-pink-50">
          <button
            onClick={(e) => onToggleLike(item.id, e)}
            className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md transition ${item.isLiked ? 'text-[#c2417c] bg-pink-50 heart-pop' : 'text-gray-400 hover:text-pink-500'}`}
          >
            <i className={`fa-solid fa-heart ${item.isLiked ? 'text-[#c2417c]' : 'text-gray-300'}`}></i>
            <span>{item.likes}</span>
          </button>

          <button
            onClick={(e) => onShare(item, e)}
            className="text-gray-400 hover:text-blush-600 p-1"
            title="Kongsi Memori"
          >
            <i className="fa-solid fa-share-nodes text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

/* UPLOAD MODAL (USER-FRIENDLY & AUTO-OPTIMIZED < 1MB) */
function UploadModal({
  uploadType,
  setUploadType,
  guestName,
  setGuestName,
  wishCaption,
  setWishCaption,
  selectedChallenge,
  setSelectedChallenge,
  previewMedia,
  isVideoMedia,
  onFileChange,
  onSubmit,
  onClose,
  isSubmitting,
  cameraInputRef,
  galleryInputRef
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-pink-100 overflow-hidden max-h-[90vh] flex flex-col">
        
        <div className="bg-[#fcf0f2] px-4 py-3 border-b border-pink-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-[#c2417c] text-[#c2417c] fa-camera"></i>
            <h3 className="text-xs font-extrabold text-blush-800 uppercase tracking-wider">
              Kongsi Memori Perkahwinan
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-pink-100">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-4 space-y-4 overflow-y-auto">
          
          <div className="grid grid-cols-2 gap-2 bg-pink-50 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setUploadType('photo')}
              className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${uploadType === 'photo' ? 'bg-white text-[#c2417c] shadow-sm' : 'text-gray-500'}`}
            >
              <i className="fa-solid fa-camera text-xs"></i>
              <span>📷 FOTO</span>
            </button>
            <button
              type="button"
              onClick={() => setUploadType('boomerang')}
              className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${uploadType === 'boomerang' ? 'bg-[#c2417c] text-white shadow-sm' : 'text-gray-500'}`}
            >
              <i className="fa-solid fa-video text-xs"></i>
              <span>📹 BOOMERANG</span>
            </button>
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept={uploadType === 'photo' ? 'image/*' : 'video/*,image/*'}
            capture="environment"
            onChange={onFileChange}
            className="hidden"
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept={uploadType === 'photo' ? 'image/*' : 'video/*,image/*'}
            onChange={onFileChange}
            className="hidden"
          />

          <div className="space-y-2">
            <label className="block text-[11px] font-extrabold text-gray-700 uppercase">
              1. Tangkap Kamera / Muat Naik {uploadType === 'photo' ? 'Foto' : 'Video Boomerang'}
            </label>

            {previewMedia ? (
              <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-black flex items-center justify-center border-2 border-[#c2417c]">
                {isVideoMedia ? (
                  <video
                    src={previewMedia}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={previewMedia}
                    alt="Preview"
                    className={`w-full h-full object-cover ${uploadType === 'boomerang' ? 'animate-boomerang-loop' : ''}`}
                  />
                )}
                <div className="absolute bottom-2 right-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current && cameraInputRef.current.click()}
                    className="bg-black/70 hover:bg-black text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md"
                  >
                    📷 Kamera
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current && galleryInputRef.current.click()}
                    className="bg-[#c2417c] hover:bg-blush-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow"
                  >
                    📁 Galeri
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current && cameraInputRef.current.click()}
                  className="p-4 rounded-2xl border-2 border-dashed border-[#c2417c] bg-pink-50/60 hover:bg-pink-100/80 transition flex flex-col items-center justify-center gap-1.5 text-center"
                >
                  <div className="w-10 h-10 rounded-full bg-[#c2417c] text-white flex items-center justify-center shadow-md">
                    <i className="fa-solid fa-camera text-base"></i>
                  </div>
                  <span className="text-xs font-bold text-[#c2417c]">📷 Buka Kamera</span>
                  <span className="text-[9.5px] text-gray-400">Tangkap terus</span>
                </button>

                <button
                  type="button"
                  onClick={() => galleryInputRef.current && galleryInputRef.current.click()}
                  className="p-4 rounded-2xl border-2 border-dashed border-pink-300 bg-white hover:bg-pink-50/50 transition flex flex-col items-center justify-center gap-1.5 text-center"
                >
                  <div className="w-10 h-10 rounded-full bg-pink-100 text-blush-800 flex items-center justify-center shadow-sm">
                    <i className="fa-solid fa-folder-open text-base"></i>
                  </div>
                  <span className="text-xs font-bold text-blush-800">📁 Muat Naik Galeri</span>
                  <span className="text-[9.5px] text-gray-400">Pilih fail peranti</span>
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-extrabold text-gray-700 uppercase mb-1">
                2. Nama Anda / Tetamu
              </label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Cth: Siti & Aiman"
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-blush-400 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-gray-700 uppercase mb-1">
                3. Ucapan & Wish Buat Mempelai
              </label>
              <textarea
                value={wishCaption}
                onChange={(e) => setWishCaption(e.target.value)}
                rows="3"
                placeholder="Tuliskan titipan ucapan manis anda..."
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-blush-400 bg-white"
              />
              
              <div className="flex gap-1.5 mt-1.5">
                {['❤️', '🥂', '🎉', '💍', '🌸', '✨'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setWishCaption(prev => prev + ' ' + emoji)}
                    className="text-xs bg-pink-50 hover:bg-pink-100 px-2 py-1 rounded-md border border-pink-200"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-gray-700 uppercase mb-1">
                4. Tag Pose Challenge
              </label>
              <select
                value={selectedChallenge}
                onChange={(e) => setSelectedChallenge(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200 bg-white focus:outline-none"
              >
                <option value="Pose Gempak">📸 Pose & Gaya Gempak</option>
                <option value="Gaya Pengantin">👑 Gaya Pengantin Sejoli</option>
                <option value="Ucapan Ringkas">💌 Titipan Doa Ringkas</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#c2417c] to-blush-600 text-white font-extrabold text-xs py-3.5 px-4 rounded-xl shadow-md hover:opacity-95 transition flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Menghantar Memori...</span>
            ) : (
              <>
                <i className="fa-solid fa-paper-plane text-pink-200"></i>
                <span>Hantar Memori Sekarang ✨</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}

/* SALAM KAUT SECTION */
function SalamKautSection({ triggerToast, onLightbox }) {
  return (
    <div className="p-4 space-y-4 text-center">
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-[#c2417c] uppercase tracking-widest">
          Salam Kaut Digital
        </span>
        <h2 className="font-script text-4xl text-[#c2417c] font-bold">
          Ingatan Tulus & Restu
        </h2>
        <p className="text-xs text-gray-600 max-w-xs mx-auto leading-relaxed pt-1">
          Kehadiran dan doa restu anda adalah hadiah paling bermakna buat kami. Bagi yang berhajat memberikan salam kaut secara digital via Maybank DuitNow QR:
        </p>
      </div>

      <div className="space-y-4">
        {/* GROOM MAYBANK DUITNOW QR CARD */}
        <div className="bg-white rounded-3xl p-4 shadow-md border border-amber-200 relative overflow-hidden text-left space-y-3">
          <div className="bg-[#ffcc00] text-black px-3 py-2 rounded-2xl flex items-center justify-between font-extrabold text-xs shadow-sm">
            <div className="flex items-center gap-1.5">
              <i className="fa-solid fa-building-columns text-base"></i>
              <span>MAYBANK DUITNOW QR</span>
            </div>
            <span className="text-[9.5px] bg-black/10 px-2 py-0.5 rounded-full font-bold">PENGANTIN LELAKI</span>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="space-y-1 flex-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Penerima</p>
              <h4 className="font-bold text-blush-900 text-sm">Aiman Hazim bin Rozali</h4>
              <p className="text-xs font-black text-[#c2417c]">1623 4567 8901</p>
              <button
                onClick={() => {
                  try { navigator.clipboard.writeText('162345678901'); } catch(e) {}
                  triggerToast('Nombor Akaun Maybank Aiman disalin! 📋');
                }}
                className="mt-2 bg-pink-50 hover:bg-pink-100 text-[#c2417c] text-[10px] font-bold px-3 py-1.5 rounded-xl border border-pink-200 flex items-center gap-1.5 transition"
              >
                <i className="fa-solid fa-copy"></i>
                <span>Salin Nombor Akaun</span>
              </button>
            </div>

            <div
              onClick={() => onLightbox({ imageUrl: 'assets/images/qr_aiman.png', guestName: 'DuitNow QR Maybank - Aiman Hazim' })}
              className="w-24 h-24 bg-amber-50 rounded-2xl border-2 border-amber-300 p-1 flex-shrink-0 cursor-pointer shadow-sm hover:scale-105 transition"
              title="Tekan untuk besarkan QR"
            >
              <img
                src="assets/images/qr_aiman.png"
                alt="QR Maybank Aiman"
                className="w-full h-full object-cover rounded-xl"
              />
              <span className="block text-[8px] text-center font-bold text-gray-400 mt-0.5">Tekan untuk Zoom</span>
            </div>
          </div>
        </div>

        {/* BRIDE MAYBANK DUITNOW QR CARD */}
        <div className="bg-white rounded-3xl p-4 shadow-md border border-pink-200 relative overflow-hidden text-left space-y-3">
          <div className="bg-[#ffcc00] text-black px-3 py-2 rounded-2xl flex items-center justify-between font-extrabold text-xs shadow-sm">
            <div className="flex items-center gap-1.5">
              <i className="fa-solid fa-building-columns text-base"></i>
              <span>MAYBANK DUITNOW QR</span>
            </div>
            <span className="text-[9.5px] bg-[#c2417c] text-white px-2 py-0.5 rounded-full font-bold">PENGANTIN PEREMPUAN</span>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="space-y-1 flex-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Penerima</p>
              <h4 className="font-bold text-blush-900 text-sm">Nur Afrina binti Ahmad</h4>
              <p className="text-xs font-black text-[#c2417c]">7012 3456 7890</p>
              <button
                onClick={() => {
                  try { navigator.clipboard.writeText('701234567890'); } catch(e) {}
                  triggerToast('Nombor Akaun Maybank Afrina disalin! 📋');
                }}
                className="mt-2 bg-pink-50 hover:bg-pink-100 text-[#c2417c] text-[10px] font-bold px-3 py-1.5 rounded-xl border border-pink-200 flex items-center gap-1.5 transition"
              >
                <i className="fa-solid fa-copy"></i>
                <span>Salin Nombor Akaun</span>
              </button>
            </div>

            <div
              onClick={() => onLightbox({ imageUrl: 'assets/images/qr_afrina.png', guestName: 'DuitNow QR Maybank - Nur Afrina' })}
              className="w-24 h-24 bg-pink-50 rounded-2xl border-2 border-pink-300 p-1 flex-shrink-0 cursor-pointer shadow-sm hover:scale-105 transition"
              title="Tekan untuk besarkan QR"
            >
              <img
                src="assets/images/qr_afrina.png"
                alt="QR Maybank Afrina"
                className="w-full h-full object-cover rounded-xl"
              />
              <span className="block text-[8px] text-center font-bold text-gray-400 mt-0.5">Tekan untuk Zoom</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* HADIAH SECTION */
function HadiahSection({ triggerToast }) {
  return (
    <div className="p-4 space-y-4 text-center">
      <div className="space-y-1">
        <span className="text-[10.5px] font-bold text-[#c2417c] uppercase tracking-widest">
          Senarai Hajat & Gift Registry
        </span>
        <h2 className="font-script text-4xl text-[#c2417c] font-bold">
          Idea Hadiah Buat Mempelai
        </h2>
        <p className="text-xs text-gray-600 max-w-xs mx-auto leading-relaxed pt-1">
          Bagi tetamu yang berhajat menghadiahkan barangan kelengkapan rumah tangga baharu Aiman & Afrina, berikut adalah beberapa idea hadiah pilihan:
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2 text-left">
        {GIFT_IDEAS.map((gift) => (
          <div
            key={gift.id}
            className="bg-[#ffffff] rounded-2xl p-2.5 shadow-sm border border-pink-100 flex flex-col justify-between hover:shadow-md transition"
          >
            <div className="space-y-2">
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-pink-50">
                <img
                  src={gift.image}
                  alt="Product"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-1.5 left-1.5 bg-white/95 backdrop-blur-sm text-blush-800 text-[8px] font-extrabold px-1.5 py-0.5 rounded-md border border-pink-100 shadow-sm">
                  {gift.category}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-extrabold text-blush-900 leading-snug line-clamp-2">
                  {gift.title}
                </h4>
                <p className="text-[10px] font-bold text-[#c2417c] mt-0.5">
                  Anggaran: {gift.price}
                </p>
              </div>
            </div>

            <a
              href={`https://shopee.com.my/search?keyword=${encodeURIComponent(gift.shopeeQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full bg-[#ee4d2d] hover:bg-[#d73211] text-white text-[10.5px] font-extrabold py-2 px-2 rounded-xl shadow-sm flex items-center justify-center gap-1 transition active:scale-95 text-center"
            >
              <i className="fa-solid fa-cart-shopping text-xs"></i>
              <span>Beli di Shopee</span>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

// Render App
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
