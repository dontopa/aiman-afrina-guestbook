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

// Helper: Human-Readable Relative Time Ago (Handles UTC & Local Timezone Offsets)
function formatTimeAgo(dateInput) {
  if (!dateInput) return 'Baru sahaja';

  let timeMs = 0;
  if (typeof dateInput === 'number') {
    timeMs = dateInput;
  } else {
    let str = String(dateInput).trim();
    if (!str) return 'Baru sahaja';
    if (!str.endsWith('Z') && !str.includes('+') && (str.includes('T') || str.includes(' '))) {
      str = str.replace(' ', 'T') + 'Z';
    }
    const d = new Date(str);
    timeMs = isNaN(d.getTime()) ? Date.now() : d.getTime();
  }

  const now = Date.now();
  let diffInSeconds = Math.floor((now - timeMs) / 1000);

  // Correct UTC+8 Timezone Offset mismatch (28800 seconds = 8 hours) for all uploads today
  if (diffInSeconds >= 27000 && diffInSeconds <= 115000) {
    diffInSeconds = diffInSeconds - 28800;
  }

  if (diffInSeconds < 45 || diffInSeconds < 0) return 'Baru sahaja';
  if (diffInSeconds < 60) return `${diffInSeconds} saat lalu`;
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minit lalu`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} jam lalu`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} hari lalu`;

  return new Date(timeMs).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' });
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

// Initial Sample Gallery Memories (Fallback with fixed old timestamps so real uploads always sort to top)
const INITIAL_MEMORIES = [
  {
    id: 'mem-1',
    type: 'photo',
    guestName: 'Siti Sarah & Zafri',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    imageUrl: 'assets/images/polaroid1.png',
    isVideo: false,
    caption: 'Selamat Pengantin Baru Aiman & Afrina! Semoga perkahwinan ini dilimpahi rahmat & kebahagiaan hingga ke syurga ❤️✨',
    timestamp: '1 hari lalu',
    createdAt: 1700000000004,
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
    timestamp: '1 hari lalu',
    createdAt: 1700000000003,
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
    timestamp: '1 hari lalu',
    createdAt: 1700000000002,
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
    timestamp: '1 hari lalu',
    createdAt: 1700000000001,
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

// Curated Gift Registry Ideas (Linked to Shopee) - Limit 10 items
const INITIAL_GIFT_IDEAS = [
  {
    id: 'gift-1',
    title: 'Philips Digital Air Fryer XL 4.1L',
    image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=400&q=80',
    shopeeQuery: 'https://shopee.com.my/search?keyword=Philips%20Air%20Fryer%20XL'
  },
  {
    id: 'gift-2',
    title: 'Nespresso Essenza Mini Coffee Machine',
    image: 'https://images.unsplash.com/photo-1517668808822-9ebe02f2a698?auto=format&fit=crop&w=400&q=80',
    shopeeQuery: 'https://shopee.com.my/search?keyword=Nespresso%20Essenza%20Mini'
  },
  {
    id: 'gift-3',
    title: 'Giselle Stand Mixer 5L Gold Edition',
    image: 'https://images.unsplash.com/photo-1594385208974-2e75f8d7bb48?auto=format&fit=crop&w=400&q=80',
    shopeeQuery: 'https://shopee.com.my/search?keyword=Stand%20Mixer%205L'
  },
  {
    id: 'gift-4',
    title: 'Russell Hobbs 2-Slice Retro Toaster',
    image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=400&q=80',
    shopeeQuery: 'https://shopee.com.my/search?keyword=Retro%202%20Slice%20Toaster'
  },
  {
    id: 'gift-5',
    title: 'Luxury Microfiber Bedsheet Set King (Blush)',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=400&q=80',
    shopeeQuery: 'https://shopee.com.my/search?keyword=Luxury%20Bedsheet%20King'
  },
  {
    id: 'gift-6',
    title: 'Deerma Cordless Handheld Vacuum Cleaner',
    image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=400&q=80',
    shopeeQuery: 'https://shopee.com.my/search?keyword=Deerma%20Cordless%20Vacuum'
  }
];

function App() {
  const [activeTab, setActiveTab] = useState('home');
  
  const [memories, setMemories] = useState(INITIAL_MEMORIES);

  // Editable Event Details (Locked Couple Names to Aiman & Afrina)
  const [eventDetails, setEventDetails] = useState(() => {
    try {
      const saved = localStorage.getItem('wedding_event_details');
      return saved ? JSON.parse(saved) : {
        coupleNames: 'Aiman & Afrina',
        badgeText: 'WALIMATULURUS',
        eventDate: '12 DISEMBER 2026',
        hashtag: '#AimanAfrina',
        heroPhoto1: 'assets/images/polaroid1.png',
        heroPhoto1Caption: 'Aiman & Afrina ❤️',
        heroPhoto2: 'assets/images/polaroid2.png',
        heroPhoto2Caption: 'Kenangan Indah',
        heroPhoto3: 'assets/images/polaroid3.png',
        heroPhoto3Caption: '#MemoriAbadi ✨'
      };
    } catch(e) {
      return {
        coupleNames: 'Aiman & Afrina',
        badgeText: 'WALIMATULURUS',
        eventDate: '12 DISEMBER 2026',
        hashtag: '#AimanAfrina',
        heroPhoto1: 'assets/images/polaroid1.png',
        heroPhoto1Caption: 'Aiman & Afrina ❤️',
        heroPhoto2: 'assets/images/polaroid2.png',
        heroPhoto2Caption: 'Kenangan Indah',
        heroPhoto3: 'assets/images/polaroid3.png',
        heroPhoto3Caption: '#MemoriAbadi ✨'
      };
    }
  });

  // Editable Salam Kaut Details
  const [salamKautDetails, setSalamKautDetails] = useState(() => {
    try {
      const saved = localStorage.getItem('wedding_salamkaut_details');
      return saved ? JSON.parse(saved) : {
        groomName: 'Aiman Hazim bin Rozali',
        groomBank: 'MAYBANK DUITNOW QR',
        groomAcc: '1623 4567 8901',
        groomQr: 'assets/images/qr_aiman.png',
        brideName: 'Nur Afrina binti Ahmad',
        brideBank: 'MAYBANK DUITNOW QR',
        brideAcc: '7012 3456 7890',
        brideQr: 'assets/images/qr_afrina.png'
      };
    } catch(e) {
      return {
        groomName: 'Aiman Hazim bin Rozali',
        groomBank: 'MAYBANK DUITNOW QR',
        groomAcc: '1623 4567 8901',
        groomQr: 'assets/images/qr_aiman.png',
        brideName: 'Nur Afrina binti Ahmad',
        brideBank: 'MAYBANK DUITNOW QR',
        brideAcc: '7012 3456 7890',
        brideQr: 'assets/images/qr_afrina.png'
      };
    }
  });

  // Editable Gift Ideas (Max 10 items)
  const [giftRegistry, setGiftRegistry] = useState(() => {
    try {
      const saved = localStorage.getItem('wedding_gift_registry');
      return saved ? JSON.parse(saved) : INITIAL_GIFT_IDEAS;
    } catch(e) {
      return INITIAL_GIFT_IDEAS;
    }
  });

  // Admin Login State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    try {
      return sessionStorage.getItem('is_wedding_admin') === 'true';
    } catch(e) { return false; }
  });

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminTab, setAdminTab] = useState('details');

  const [filterMode, setFilterMode] = useState('latest');
  const [selectedGuestFilter, setSelectedGuestFilter] = useState(null);
  const [hasLoadedMore, setHasLoadedMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

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

  // Sync Global Settings to Supabase Cloud for Cross-Device Real-time Updates
  const syncSettingsToCloud = async (newEv, newSal, newGift) => {
    if (!supabaseClient) return;
    try {
      const payload = {
        id: 'global_config',
        event_details: newEv || eventDetails,
        salamkaut_details: newSal || salamKautDetails,
        gift_registry: newGift || giftRegistry,
        updated_at: new Date().toISOString()
      };
      await supabaseClient.from('wedding_config').upsert(payload, { onConflict: 'id' });
    } catch(e) {
      console.warn("Cloud config sync exception:", e);
    }
  };

  const fetchGlobalSettingsFromCloud = async () => {
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient
        .from('wedding_config')
        .select('*')
        .eq('id', 'global_config')
        .single();

      if (!error && data) {
        if (data.event_details) {
          const merged = { ...data.event_details, coupleNames: 'Aiman & Afrina' };
          setEventDetails(merged);
          try { localStorage.setItem('wedding_event_details', JSON.stringify(merged)); } catch(e) {}
        }
        if (data.salamkaut_details) {
          setSalamKautDetails(data.salamkaut_details);
          try { localStorage.setItem('wedding_salamkaut_details', JSON.stringify(data.salamkaut_details)); } catch(e) {}
        }
        if (data.gift_registry) {
          setGiftRegistry(data.gift_registry);
          try { localStorage.setItem('wedding_gift_registry', JSON.stringify(data.gift_registry)); } catch(e) {}
        }
      }
    } catch(e) {
      console.warn("Fetch cloud config catch:", e);
    }
  };

  // Save Event Details (Ensuring coupleNames stays locked)
  const updateEventDetails = (newDetails) => {
    const fixedDetails = { ...newDetails, coupleNames: 'Aiman & Afrina' };
    setEventDetails(fixedDetails);
    try { localStorage.setItem('wedding_event_details', JSON.stringify(fixedDetails)); } catch(e) {}
    syncSettingsToCloud(fixedDetails, null, null);
  };

  const updateSalamKautDetails = (newDetails) => {
    setSalamKautDetails(newDetails);
    try { localStorage.setItem('wedding_salamkaut_details', JSON.stringify(newDetails)); } catch(e) {}
    syncSettingsToCloud(null, newDetails, null);
  };

  const updateGiftRegistry = (newRegistry) => {
    setGiftRegistry(newRegistry);
    try { localStorage.setItem('wedding_gift_registry', JSON.stringify(newRegistry)); } catch(e) {}
    syncSettingsToCloud(null, null, newRegistry);
  };

  // Toast Helper
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3500);
  };

  // FETCH MEMORIES & GLOBAL SETTINGS FROM SUPABASE DATABASE (SORTED LATEST FIRST & MERGING LIKES)
  const fetchSupabaseMemories = async () => {
    let localUploads = [];
    try {
      localUploads = JSON.parse(localStorage.getItem('local_user_uploads') || '[]');
    } catch(e) {}

    if (!supabaseClient) {
      const combined = [...localUploads, ...INITIAL_MEMORIES];
      combined.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
      setMemories(combined);
      return;
    }

    try {
      fetchGlobalSettingsFromCloud();

      const { data, error } = await supabaseClient
        .from('memories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn("Supabase fetch error:", error.message);
        return;
      }

      if (data && data.length > 0) {
        let userLikes = {};
        let localLikeCounts = {};
        try {
          userLikes = JSON.parse(localStorage.getItem('user_liked_memories') || '{}');
          localLikeCounts = JSON.parse(localStorage.getItem('user_memory_likes') || '{}');
        } catch(e) {}

        const mapped = data.map(item => {
          const itemId = String(item.id);
          const dbLikes = Math.max(1, Number(item.likes) || 1);
          const finalLikes = localLikeCounts[itemId] !== undefined ? Math.max(dbLikes, localLikeCounts[itemId]) : dbLikes;

          // Fallback timestamp for old rows missing created_at in Supabase (fixed past timestamp, not dynamic Date.now())
          let rawTime = 1700000000000 + (Number(item.id) || 0);
          if (item.created_at) {
            const parsed = new Date(item.created_at).getTime();
            if (!isNaN(parsed) && parsed > 1000000000000) {
              rawTime = parsed;
            }
          }

          return {
            id: itemId,
            type: item.is_boomerang ? 'boomerang' : 'photo',
            guestName: item.guest_name || 'Tetamu',
            avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(item.guest_name || 'Guest')}`,
            imageUrl: item.image_url,
            isVideo: item.is_video || false,
            caption: item.caption || '',
            timestamp: item.created_at ? formatTimeAgo(item.created_at) : 'Baru sahaja',
            createdAt: rawTime,
            likes: finalLikes,
            isLiked: Boolean(userLikes[itemId]),
            challengeTag: item.challenge_tag || 'Pose Gempak',
            isBoomerang: item.is_boomerang || false
          };
        });

        const sampleItemsNotDuplicate = INITIAL_MEMORIES.filter(
          init => !mapped.some(m => m.id === init.id)
        );

        // Combine local pending uploads, Supabase rows, and sample items
        const combined = [...localUploads, ...mapped, ...sampleItemsNotDuplicate];
        
        // Remove duplicates by unique guestName + imageUrl combination OR id
        const unique = [];
        const seenIds = new Set();
        const seenKeys = new Set();
        for (const item of combined) {
          const comboKey = `${(item.guestName || '').trim().toLowerCase()}-${item.imageUrl}`;
          if (!seenIds.has(item.id) && !seenKeys.has(comboKey)) {
            seenIds.add(item.id);
            seenKeys.add(comboKey);
            unique.push(item);
          }
        }

        // STRICT SORT BY CREATEDAT DESCENDING (NEWEST ALWAYS ON TOP AT INDEX 0)
        unique.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));

        setMemories(unique);
      }
    } catch (err) {
      console.warn("Fetch Supabase catch:", err);
    }
  };

  useEffect(() => {
    fetchSupabaseMemories();
    const interval = setInterval(fetchSupabaseMemories, 8000);

    let channel = null;
    if (supabaseClient) {
      try {
        channel = supabaseClient
          .channel('public:wedding_app')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'memories' }, payload => {
            fetchSupabaseMemories();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'wedding_config' }, payload => {
            fetchGlobalSettingsFromCloud();
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

  // Bin Memories State (Soft Deleted Photos stored locally so Admin can restore or permanently delete)
  const [binMemories, setBinMemories] = useState(() => {
    try {
      const saved = localStorage.getItem('wedding_bin_memories');
      return saved ? JSON.parse(saved) : [];
    } catch(e) { return []; }
  });

  const saveBinMemories = (newBin) => {
    setBinMemories(newBin);
    try { localStorage.setItem('wedding_bin_memories', JSON.stringify(newBin)); } catch(e) {}
  };

  // 1. Soft Delete: Move Memory to BIN (Recycle Bin)
  const handleSoftDeleteMemory = (id, guestName, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const stringId = String(id);
    const targetItem = memories.find(m => String(m.id) === stringId);
    if (!targetItem) return;

    if (!window.confirm(`Pindahkan memori daripada "${guestName}" ke BIN (Tong Sampah)?`)) return;

    setMemories(prev => prev.filter(m => String(m.id) !== stringId));
    const updatedBin = [targetItem, ...binMemories.filter(b => String(b.id) !== stringId)];
    saveBinMemories(updatedBin);
    triggerToast(`Memori dipindahkan ke BIN (Tong Sampah) 🗑️`);
  };

  // 2. Restore Memory from BIN back to Active Gallery
  const handleRestoreMemory = (id) => {
    const stringId = String(id);
    const targetItem = binMemories.find(b => String(b.id) === stringId);
    if (!targetItem) return;

    const updatedBin = binMemories.filter(b => String(b.id) !== stringId);
    saveBinMemories(updatedBin);
    setMemories(prev => [targetItem, ...prev]);
    triggerToast(`Memori daripada "${targetItem.guestName}" berjaya dipulihkan! 🔄✨`);
  };

// Helper: Extract Storage file path from Supabase Public URL
function extractSupabaseStoragePath(url) {
  if (!url || typeof url !== 'string') return null;
  let rawPath = null;
  if (url.includes('/storage/v1/object/public/wedding-memories/')) {
    const parts = url.split('/storage/v1/object/public/wedding-memories/');
    if (parts.length > 1) rawPath = parts[1];
  } else if (url.includes('wedding-memories/')) {
    const parts = url.split('wedding-memories/');
    if (parts.length > 1) rawPath = parts[1];
  }
  if (rawPath) {
    try {
      return decodeURIComponent(rawPath.split('?')[0]);
    } catch(e) {
      return rawPath.split('?')[0];
    }
  }
  return null;
}

  // 3. Permanent Delete from BIN & Supabase Database & Supabase Storage Bucket
  const handlePermanentDeleteMemory = async (id, guestName) => {
    if (!window.confirm(`⚠️ AMARAN: Adakah anda pasti mahu MEMADAM SEPENUHNYA memori daripada "${guestName}" daripada DATABASE & STORAGE? Tindakan ini tidak boleh dibatalkan!`)) return;

    const stringId = String(id);
    const targetItem = binMemories.find(b => String(b.id) === stringId) || memories.find(m => String(m.id) === stringId);

    const updatedBin = binMemories.filter(b => String(b.id) !== stringId);
    saveBinMemories(updatedBin);
    setMemories(prev => prev.filter(m => String(m.id) !== stringId));

    if (supabaseClient) {
      try {
        // A. Delete Row from Supabase Database Table 'memories'
        const targetIdNum = Number(id);
        if (!isNaN(targetIdNum) && targetIdNum > 0 && String(targetIdNum) === stringId) {
          await supabaseClient.from('memories').delete().eq('id', targetIdNum);
        } else {
          await supabaseClient.from('memories').delete().eq('id', stringId);
        }

        // B. Delete File from Supabase Storage Bucket 'wedding-memories'
        if (targetItem && targetItem.imageUrl) {
          const filePath = extractSupabaseStoragePath(targetItem.imageUrl);
          if (filePath) {
            console.log("Memadam fail daripada Storage Bucket 'wedding-memories':", filePath);
            const { data: removeRes, error: storageErr } = await supabaseClient.storage
              .from('wedding-memories')
              .remove([filePath]);
            
            if (storageErr) {
              console.error("Supabase Storage Delete Policy Error:", storageErr.message || storageErr);
              triggerToast(`⚠️ Rekod dipadam, tetapi Storage file perlukan kebenaran DELETE di Supabase Dashboard.`);
            } else {
              console.log("Fail Storage berjaya dipadam:", removeRes);
            }
          }
        }
      } catch (err) {
        console.warn("Permanent delete error:", err);
      }
    }
    triggerToast(`Memori daripada ${guestName} dipadam SEPENUHNYA daripada Database & Storage ❌🗑️`);
  };

  // Admin Login Verification (Default PIN: 1234 or 8888)
  const handleAdminLoginSubmit = (e) => {
    e.preventDefault();
    if (adminPinInput === '1234' || adminPinInput === '8888') {
      setIsAdminLoggedIn(true);
      sessionStorage.setItem('is_wedding_admin', 'true');
      setIsAdminModalOpen(false);
      setAdminPinInput('');
      setActiveTab('admin');
      triggerToast('Log masuk Admin Berjaya! 🔑 Panel Kawalan Aktif');
    } else {
      alert('PIN Admin Tidak Sah. (Sila cuba PIN: 1234)');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('is_wedding_admin');
    setIsAdminModalOpen(false);
    if (activeTab === 'admin') {
      setActiveTab('home');
    }
    triggerToast('Anda telah keluar daripada akaun Admin 🚪');
  };

  // FIXED LIKE FUNCTION (INSTANT STATE UPDATE + LOCAL STORAGE PERSISTENCE + SUPABASE DB SYNC)
  const handleToggleLike = async (id, e) => {
    if (e) e.stopPropagation();
    
    let isNowLiked = false;
    let newLikesCount = 1;
    const stringId = String(id);

    setMemories(prev => prev.map(item => {
      if (String(item.id) === stringId) {
        isNowLiked = !item.isLiked;
        newLikesCount = isNowLiked ? item.likes + 1 : Math.max(1, item.likes - 1);

        if (isNowLiked && window.confetti) {
          window.confetti({
            particleCount: 30,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#c2417c', '#f3c7d0', '#ffffff']
          });
        }
        return {
          ...item,
          isLiked: isNowLiked,
          likes: newLikesCount
        };
      }
      return item;
    }));

    // Save Liked state & Like counts locally so polling never wipes them out
    try {
      const userLikes = JSON.parse(localStorage.getItem('user_liked_memories') || '{}');
      userLikes[stringId] = isNowLiked;
      localStorage.setItem('user_liked_memories', JSON.stringify(userLikes));

      const customLikeCounts = JSON.parse(localStorage.getItem('user_memory_likes') || '{}');
      customLikeCounts[stringId] = newLikesCount;
      localStorage.setItem('user_memory_likes', JSON.stringify(customLikeCounts));
    } catch (err) {}

    // Persist to Supabase Database
    if (supabaseClient) {
      try {
        const targetNumberId = Number(id);
        if (!isNaN(targetNumberId) && targetNumberId > 0 && String(targetNumberId) === stringId) {
          await supabaseClient.from('memories').update({ likes: newLikesCount }).eq('id', targetNumberId);
        } else {
          await supabaseClient.from('memories').update({ likes: newLikesCount }).eq('id', stringId);
        }
      } catch (err) {
        console.warn("Like update catch:", err);
      }
    }
  };

  // Handle File Selection: AUTO DETECT MOTION/LIVE PHOTOS (<= 6s) & COMPRESS STACK
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isVid = file.type.startsWith('video/');
    
    if (isVid) {
      // Check video duration to distinguish Live/Motion Photo (<= 6s) from long videos
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      tempVideo.src = URL.createObjectURL(file);

      tempVideo.onloadedmetadata = async () => {
        URL.revokeObjectURL(tempVideo.src);
        if (tempVideo.duration > 6.5) {
          alert('⚠️ Video Biasa Dihalang: Muat naik video biasa tidak dibenarkan. Hanya Foto & Live Photos / Motion Photos (di bawah 5-6 saat) sahaja dibenarkan!');
          e.target.value = '';
          return;
        }

        triggerToast('✨ Live Photo / Motion Photo dikesan & diproses (Short Clip)!');
        setUploadType('boomerang'); // Tag as Live Photo
        setIsVideoMedia(true);
        setSelectedFileObj(file);
        setPreviewMedia(URL.createObjectURL(file));
      };
      return;
    }

    setUploadType('photo');
    setIsVideoMedia(false);
    triggerToast('⚡ Memampatkan foto guestbook...');
    const { dataUrl, blob } = await compressImageFile(file, 800, 0.65);
    setSelectedFileObj(blob);
    setPreviewMedia(dataUrl);
  };

  const handleOpenUpload = (type) => {
    setUploadType(type);
    setIsUploadOpen(true);
  };

  // Submit New Memory (GUARANTEES TOP PLACEMENT VIA LATEST TIMESTAMP)
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
        }
      } catch (err) {
        console.warn("Supabase Storage exception:", err);
      }
    }

    const fallbackImages = [
      'assets/images/polaroid1.png',
      'assets/images/polaroid2.png',
      'assets/images/polaroid3.png',
      'assets/images/polaroid4.png'
    ];
    const randomFallback = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
    const finalMedia = finalUploadedUrl || previewMedia || randomFallback;

    const nowTime = Date.now();
    const newMemoryObj = {
      id: `mem-${nowTime}`,
      type: uploadType,
      guestName: guestName.trim(),
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(guestName)}`,
      imageUrl: finalMedia,
      isVideo: isVideoMedia,
      caption: wishCaption.trim(),
      timestamp: 'Baru sahaja',
      createdAt: nowTime,
      likes: 1,
      isLiked: true,
      challengeTag: selectedChallenge,
      isBoomerang: uploadType === 'boomerang'
    };

    // Save to local storage for immediate persistence
    try {
      const localUploads = JSON.parse(localStorage.getItem('local_user_uploads') || '[]');
      localStorage.setItem('local_user_uploads', JSON.stringify([newMemoryObj, ...localUploads]));
    } catch(e) {}

    // Prepend locally so new upload appears instantly at index 0
    setMemories(prev => {
      const filtered = prev.filter(m => m.id !== newMemoryObj.id);
      const updated = [newMemoryObj, ...filtered];
      updated.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
      return updated;
    });

    if (supabaseClient) {
      try {
        let payload = {
          guest_name: guestName.trim(),
          caption: wishCaption.trim(),
          image_url: finalMedia,
          is_video: isVideoMedia,
          likes: 1,
          challenge_tag: selectedChallenge,
          is_boomerang: uploadType === 'boomerang',
          created_at: new Date(nowTime).toISOString()
        };

        let { data: insertedRows, error: insertErr } = await supabaseClient
          .from('memories')
          .insert([payload])
          .select();

        if (insertErr && insertErr.message && insertErr.message.includes('challenge_tag')) {
          delete payload.challenge_tag;
          delete payload.is_boomerang;
          const retryRes = await supabaseClient.from('memories').insert([payload]).select();
          insertErr = retryRes.error;
          insertedRows = retryRes.data;
        }

        if (!insertErr) {
          try {
            const localUploads = JSON.parse(localStorage.getItem('local_user_uploads') || '[]');
            const filtered = localUploads.filter(u => u.id !== newMemoryObj.id);
            localStorage.setItem('local_user_uploads', JSON.stringify(filtered));
          } catch(e) {}
          fetchSupabaseMemories();
        }
      } catch (err) {
        console.error("Database insert exception:", err);
      }
    }

    setIsSubmitting(false);
    setIsUploadOpen(false);
    setPreviewMedia(null);
    setSelectedFileObj(null);
    setIsVideoMedia(false);
    setGuestName('');
    setWishCaption('');
    setFilterMode('latest'); // Reset view to latest so top upload is shown
    setSelectedGuestFilter(null);

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

  // DISPLAYED MEMORIES (STRICT SORT BY LATEST CREATED_AT DESCENDING)
  const displayedMemories = useMemo(() => {
    let result = [...memories];
    if (selectedGuestFilter) {
      result = result.filter(m => m.guestName.toLowerCase().includes(selectedGuestFilter.toLowerCase()));
    }
    if (filterMode === 'popular') {
      result.sort((a, b) => b.likes - a.likes);
    } else {
      // DEFAULT SORT BY LATEST: NEWEST CREATED AT IS ALWAYS AT THE TOP (INDEX 0)
      result.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
    }
    return result;
  }, [memories, filterMode, selectedGuestFilter]);

  // EXACT REAL DATABASE COUNTERS FOR GUESTBOOK SUMMARY
  const totalMemories = memories.length;
  const totalGuests = useMemo(() => {
    const names = new Set(memories.map(m => (m.guestName || '').trim().toLowerCase()));
    return names.size || memories.length;
  }, [memories]);
  const totalLikes = useMemo(() => {
    return memories.reduce((acc, curr) => acc + (Number(curr.likes) || 1), 0);
  }, [memories]);

  const handleShare = (item, e) => {
    if (e) e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: `Memori Perkahwinan ${eventDetails.coupleNames}`,
        text: `Lihat ucapan daripada ${item.guestName}: "${item.caption}" ${eventDetails.hashtag}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      triggerToast('Pautan memori disalin ke papan klip! 📋');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8ecee] text-[#331525] flex justify-center pb-20 selection:bg-blush-500 selection:text-white">

      {shutterEffect && <div className="fixed inset-0 bg-white z-[9999] flash-screen pointer-events-none" />}

      <div className="w-full max-w-md bg-[#fcf0f2] min-h-screen shadow-2xl relative flex flex-col border-x border-pink-100/60">

        {/* ------------------- APP HEADER (ONLY SHOWN ON NON-HOME PAGES FOR CLEAN HOMEPAGE) ------------------- */}
        {activeTab !== 'home' && (
          <header className="sticky top-0 z-30 bg-[#fcf0f2]/90 backdrop-blur-md border-b border-pink-100 px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('home')}
                className="p-1.5 rounded-full hover:bg-pink-100 text-blush-600 transition flex items-center gap-1.5 text-xs font-bold text-[#c2417c]"
              >
                <i className="fa-solid fa-arrow-left text-base"></i>
                <span>Utama</span>
              </button>
              <span className="text-xs font-extrabold text-[#c2417c]">{eventDetails.hashtag}</span>
            </div>

            {/* LOGIN / LOGOUT BUTTON (EXACT WORDS 'LOGIN' / 'LOGOUT') */}
            <button
              onClick={() => {
                if (isAdminLoggedIn) {
                  handleAdminLogout();
                } else {
                  setIsAdminModalOpen(true);
                }
              }}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full shadow-md transition active:scale-95 ${isAdminLoggedIn ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gradient-to-r from-[#c2417c] to-pink-600 text-white hover:opacity-90'}`}
            >
              <i className={`fa-solid ${isAdminLoggedIn ? 'fa-right-from-bracket' : 'fa-right-to-bracket'}`}></i>
              <span>{isAdminLoggedIn ? 'Logout' : 'Login'}</span>
            </button>
          </header>
        )}

        {/* ------------------- MAIN CONTENT SWITCHER ------------------- */}
        <main className="flex-1">
          {activeTab === 'home' && (
            <HeroSection
              onOpenUpload={handleOpenUpload}
              onGoToGallery={() => setActiveTab('gallery')}
              totalMemories={totalMemories}
              totalGuests={totalGuests}
              eventDetails={eventDetails}
            />
          )}

          {activeTab === 'gallery' && (
            <LiveGalleryView
              memories={displayedMemories}
              binMemories={binMemories}
              totalMemories={totalMemories}
              totalGuests={totalGuests}
              totalLikes={totalLikes}
              filterMode={filterMode}
              setFilterMode={setFilterMode}
              selectedGuestFilter={selectedGuestFilter}
              setSelectedGuestFilter={setSelectedGuestFilter}
              onToggleLike={handleToggleLike}
              onDeleteMemory={handleSoftDeleteMemory}
              onRestoreMemory={handleRestoreMemory}
              onPermanentDeleteMemory={handlePermanentDeleteMemory}
              isAdminLoggedIn={isAdminLoggedIn}
              onShare={handleShare}
              onOpenUpload={handleOpenUpload}
              onLightbox={setActiveLightboxMedia}
              eventDetails={eventDetails}
            />
          )}

          {activeTab === 'salamkaut' && (
            <SalamKautSection
              triggerToast={triggerToast}
              onLightbox={setActiveLightboxMedia}
              salamKautDetails={salamKautDetails}
            />
          )}

          {activeTab === 'hadiah' && (
            <HadiahSection
              triggerToast={triggerToast}
              giftRegistry={giftRegistry}
              eventDetails={eventDetails}
            />
          )}

          {/* DEDICATED IN-PAGE ADMIN PANEL TAB (SHOWN WHEN LOGGED IN) */}
          {activeTab === 'admin' && isAdminLoggedIn && (
            <AdminSection
              eventDetails={eventDetails}
              updateEventDetails={updateEventDetails}
              salamKautDetails={salamKautDetails}
              updateSalamKautDetails={updateSalamKautDetails}
              giftRegistry={giftRegistry}
              updateGiftRegistry={updateGiftRegistry}
              adminTab={adminTab}
              setAdminTab={setAdminTab}
              triggerToast={triggerToast}
              handleAdminLogout={handleAdminLogout}
            />
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
            title="Tulis / Muat Naik Guestbook"
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

          {/* EXTRA DEDICATED ADMIN TAB (SHOWN ONLY WHEN LOGGED IN) */}
          {isAdminLoggedIn && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex flex-col items-center gap-0.5 text-[10.5px] font-medium transition ${activeTab === 'admin' ? 'text-amber-600 font-bold' : 'text-gray-400 hover:text-amber-600'}`}
            >
              <i className="fa-solid fa-user-gear text-lg text-amber-500"></i>
              <span className="text-amber-600 font-bold">Admin</span>
            </button>
          )}
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

        {/* ------------------- LOGIN MODAL ------------------- */}
        {isAdminModalOpen && !isAdminLoggedIn && (
          <AdminClientModal
            isLoggedIn={isAdminLoggedIn}
            pinInput={adminPinInput}
            setPinInput={setAdminPinInput}
            onLogin={handleAdminLoginSubmit}
            onLogout={handleAdminLogout}
            onClose={() => setIsAdminModalOpen(false)}
            eventDetails={eventDetails}
            updateEventDetails={updateEventDetails}
            salamKautDetails={salamKautDetails}
            updateSalamKautDetails={updateSalamKautDetails}
            giftRegistry={giftRegistry}
            updateGiftRegistry={updateGiftRegistry}
            adminTab={adminTab}
            setAdminTab={setAdminTab}
            triggerToast={triggerToast}
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
                  <h4 className="font-bold text-blush-800 text-sm">{activeLightboxMedia.guestName || eventDetails.coupleNames}</h4>
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

/* DEDICATED IN-PAGE ADMIN SECTION (EDIT WALIMATULURUS BADGE & 3 POLAROID CAPTIONS, NO COUPLE NAMES EDITING) */
function AdminSection({
  eventDetails,
  updateEventDetails,
  salamKautDetails,
  updateSalamKautDetails,
  giftRegistry,
  updateGiftRegistry,
  adminTab,
  setAdminTab,
  triggerToast,
  handleAdminLogout
}) {
  const [newGiftTitle, setNewGiftTitle] = useState('');
  const [newGiftShopee, setNewGiftShopee] = useState('');
  const [newGiftImageDataUrl, setNewGiftImageDataUrl] = useState('');

  const handleGiftImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      triggerToast('⚡ Memampatkan gambar produk hadiah...');
      const { dataUrl } = await compressImageFile(file, 500, 0.65);
      setNewGiftImageDataUrl(dataUrl);
      triggerToast('Gambar hadiah berjaya dimampatkan & sedia! 📦✨');
    }
  };

  const handleAddGift = (e) => {
    e.preventDefault();
    if (giftRegistry.length >= 10) {
      alert('Had maksimum 10 idea hadiah telah dicapai!');
      return;
    }
    if (!newGiftTitle.trim()) {
      alert('Sila masukkan nama hadiah');
      return;
    }

    const newItem = {
      id: `gift-${Date.now()}`,
      title: newGiftTitle.trim(),
      image: newGiftImageDataUrl || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80',
      shopeeQuery: newGiftShopee.trim() || `https://shopee.com.my/search?keyword=${encodeURIComponent(newGiftTitle.trim())}`
    };

    const updated = [...giftRegistry, newItem];
    updateGiftRegistry(updated);
    setNewGiftTitle('');
    setNewGiftShopee('');
    setNewGiftImageDataUrl('');
    triggerToast('Idea Hadiah Baharu Berjaya Ditambah! 🎁');
  };

  const handleDeleteGift = (giftId) => {
    if (!window.confirm('Adakah anda pasti nak buang idea hadiah ini?')) return;
    const updated = giftRegistry.filter(g => g.id !== giftId);
    updateGiftRegistry(updated);
    triggerToast('Item Hadiah Berjaya Dibuang 🗑️');
  };

  const handleHeroPhotoUpload = async (photoKey, e) => {
    const file = e.target.files[0];
    if (file) {
      triggerToast('⚡ Memampatkan foto muka depan...');
      const { dataUrl } = await compressImageFile(file, 650, 0.65);
      const updatedDetails = {
        ...eventDetails,
        [photoKey]: dataUrl
      };
      updateEventDetails(updatedDetails);
      triggerToast('Foto Muka Depan Berjaya Dimampatkan & Disimpan! 📸⚡');
    }
  };

  const handleQrCodeUpload = async (personKey, e) => {
    const file = e.target.files[0];
    if (file) {
      triggerToast('⚡ Memampatkan QR Code...');
      const { dataUrl } = await compressImageFile(file, 550, 0.7);
      const updated = {
        ...salamKautDetails,
        [personKey]: dataUrl
      };
      updateSalamKautDetails(updated);
      triggerToast('Gambar QR Code Berjaya Dimampatkan & Disimpan! 📲⚡');
    }
  };

  const handleSaveEventTextDetails = (e) => {
    e.preventDefault();
    updateEventDetails(eventDetails);
    triggerToast('Tetapan Majlis Berjaya Disimpan & Disinkronkan! ⚙️✨');
  };

  const handleSaveSalamKautText = (e) => {
    e.preventDefault();
    updateSalamKautDetails(salamKautDetails);
    triggerToast('Maklumat Salam Kaut & Bank Berjaya Disimpan! 💳✨');
  };

  return (
    <div className="p-4 space-y-4 text-center">
      <div className="space-y-1.5 pt-2">
        <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
          🔑 PANEL KAWALAN ADMIN
        </span>
        <h2 className="font-script text-4xl text-[#6d1e4a] font-bold">
          Pengurusan Majlis Perkahwinan
        </h2>
        <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
          Kemaskini teks tajuk, tarikh, 3 foto muka depan, akaun bank, QR Code, dan senarai hadiah.
        </p>
      </div>

      {/* Admin Sub-Tabs */}
      <div className="grid grid-cols-3 gap-1 bg-pink-50 p-1 rounded-2xl text-center shadow-sm">
        <button
          type="button"
          onClick={() => setAdminTab('details')}
          className={`py-2 text-[11px] font-bold rounded-xl transition ${adminTab === 'details' ? 'bg-[#c2417c] text-white shadow' : 'text-gray-600 hover:text-gray-800'}`}
        >
          ⚙️ Info Majlis
        </button>
        <button
          type="button"
          onClick={() => setAdminTab('salamkaut')}
          className={`py-2 text-[11px] font-bold rounded-xl transition ${adminTab === 'salamkaut' ? 'bg-[#c2417c] text-white shadow' : 'text-gray-600 hover:text-gray-800'}`}
        >
          💳 Salam Kaut
        </button>
        <button
          type="button"
          onClick={() => setAdminTab('gifts')}
          className={`py-2 text-[11px] font-bold rounded-xl transition ${adminTab === 'gifts' ? 'bg-[#c2417c] text-white shadow' : 'text-gray-600 hover:text-gray-800'}`}
        >
          🎁 Hadiah ({giftRegistry.length})
        </button>
      </div>

      {/* TAB 1: INFO MAJLIS & HERO PHOTOS (NAMA PENGANTIN DIKUNCI / LOCKED) */}
      {adminTab === 'details' && (
        <div className="space-y-4 text-left">
          <form onSubmit={handleSaveEventTextDetails} className="space-y-3 bg-white p-4 rounded-2xl border border-pink-100 shadow-sm">
            <h4 className="text-xs font-extrabold text-[#c2417c] uppercase">1. Teks Tajuk & Maklumat Majlis</h4>

            {/* WALIMATULURUS BADGE TEXT INPUT */}
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase">Teks Badge Tajuk (Cth: WALIMATULURUS)</label>
              <input
                type="text"
                value={eventDetails.badgeText || 'WALIMATULURUS'}
                onChange={(e) => updateEventDetails({ ...eventDetails, badgeText: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200 bg-white font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase">Tarikh Perkahwinan</label>
              <input
                type="text"
                value={eventDetails.eventDate}
                onChange={(e) => updateEventDetails({ ...eventDetails, eventDate: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200 bg-white font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase">Hashtag Perkahwinan</label>
              <input
                type="text"
                value={eventDetails.hashtag}
                onChange={(e) => updateEventDetails({ ...eventDetails, hashtag: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200 bg-white font-bold"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#c2417c] text-white text-xs font-extrabold py-2.5 rounded-xl shadow mt-1"
            >
              💾 Simpan Maklumat Majlis
            </button>
          </form>

          {/* 3 HERO POLAROID PHOTOS & CAPTION EDITING */}
          <div className="space-y-3 bg-white p-4 rounded-2xl border border-pink-100 shadow-sm">
            <h4 className="text-xs font-extrabold text-[#c2417c] uppercase">2. Muat Naik & Teks 3 Foto Polaroid Muka Depan</h4>

            <div className="space-y-3">
              {[
                { key: 'heroPhoto1', capKey: 'heroPhoto1Caption', label: 'Foto #1 (Kiri)', defaultCap: 'Aiman & Afrina ❤️' },
                { key: 'heroPhoto2', capKey: 'heroPhoto2Caption', label: 'Foto #2 (Kanan)', defaultCap: 'Kenangan Indah' },
                { key: 'heroPhoto3', capKey: 'heroPhoto3Caption', label: 'Foto #3 (Tengah)', defaultCap: '#MemoriAbadi ✨' }
              ].map(({ key, capKey, label, defaultCap }, idx) => (
                <div key={key} className="p-3 bg-pink-50/60 rounded-xl border border-pink-100 space-y-2">
                  <div className="flex items-center gap-3">
                    <img src={eventDetails[key]} alt={`Hero ${idx+1}`} className="w-14 h-14 object-cover rounded-xl border border-pink-200 bg-white flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <span className="text-xs font-bold text-gray-700 block">{label}</span>
                      <input
                        type="text"
                        placeholder="Tulis teks caption biasa..."
                        value={eventDetails[capKey] || defaultCap}
                        onChange={(e) => updateEventDetails({ ...eventDetails, [capKey]: e.target.value })}
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-pink-200 bg-white font-bold"
                      />
                    </div>
                  </div>
                  <label className="bg-[#c2417c] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer text-center block w-full shadow hover:bg-blush-600">
                    📁 Tukar Gambar #{idx+1}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleHeroPhotoUpload(key, e)}
                      className="hidden"
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SALAM KAUT & BANK DETAILS */}
      {adminTab === 'salamkaut' && (
        <form onSubmit={handleSaveSalamKautText} className="space-y-4 text-left">
          
          {/* GROOM BANK CONTROL */}
          <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm space-y-2">
            <h4 className="text-xs font-extrabold text-amber-800 uppercase flex items-center justify-between">
              <span>Pengantin Lelaki</span>
              <i className="fa-solid fa-building-columns text-amber-600"></i>
            </h4>

            <div>
              <label className="block text-[9.5px] font-bold text-gray-600 uppercase">Nama Penerima</label>
              <input
                type="text"
                value={salamKautDetails.groomName}
                onChange={(e) => updateSalamKautDetails({ ...salamKautDetails, groomName: e.target.value })}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-amber-200 bg-white font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9.5px] font-bold text-gray-600 uppercase">Nama Bank</label>
                <input
                  type="text"
                  value={salamKautDetails.groomBank}
                  onChange={(e) => updateSalamKautDetails({ ...salamKautDetails, groomBank: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-amber-200 bg-white font-bold"
                />
              </div>
              <div>
                <label className="block text-[9.5px] font-bold text-gray-600 uppercase">No. Akaun Bank</label>
                <input
                  type="text"
                  value={salamKautDetails.groomAcc}
                  onChange={(e) => updateSalamKautDetails({ ...salamKautDetails, groomAcc: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-amber-200 bg-white font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9.5px] font-bold text-gray-600 uppercase mb-1">Muat Naik Gambar QR Code</label>
              <div className="flex items-center gap-3">
                <img src={salamKautDetails.groomQr} alt="QR Groom" className="w-12 h-12 object-cover rounded-xl border border-amber-300 bg-white" />
                <label className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-2 rounded-xl cursor-pointer shadow">
                  📲 Muat Naik QR Lelaki
                  <input type="file" accept="image/*" onChange={(e) => handleQrCodeUpload('groomQr', e)} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* BRIDE BANK CONTROL */}
          <div className="bg-white p-4 rounded-2xl border border-pink-200 shadow-sm space-y-2">
            <h4 className="text-xs font-extrabold text-[#c2417c] uppercase flex items-center justify-between">
              <span>Pengantin Perempuan</span>
              <i className="fa-solid fa-building-columns text-[#c2417c]"></i>
            </h4>

            <div>
              <label className="block text-[9.5px] font-bold text-gray-600 uppercase">Nama Penerima</label>
              <input
                type="text"
                value={salamKautDetails.brideName}
                onChange={(e) => updateSalamKautDetails({ ...salamKautDetails, brideName: e.target.value })}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-pink-200 bg-white font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9.5px] font-bold text-gray-600 uppercase">Nama Bank</label>
                <input
                  type="text"
                  value={salamKautDetails.brideBank}
                  onChange={(e) => updateSalamKautDetails({ ...salamKautDetails, brideBank: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-pink-200 bg-white font-bold"
                />
              </div>
              <div>
                <label className="block text-[9.5px] font-bold text-gray-600 uppercase">No. Akaun Bank</label>
                <input
                  type="text"
                  value={salamKautDetails.brideAcc}
                  onChange={(e) => updateSalamKautDetails({ ...salamKautDetails, brideAcc: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-pink-200 bg-white font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9.5px] font-bold text-gray-600 uppercase mb-1">Muat Naik Gambar QR Code</label>
              <div className="flex items-center gap-3">
                <img src={salamKautDetails.brideQr} alt="QR Bride" className="w-12 h-12 object-cover rounded-xl border border-pink-300 bg-white" />
                <label className="bg-[#c2417c] hover:bg-blush-600 text-white text-xs font-bold px-3 py-2 rounded-xl cursor-pointer shadow">
                  📲 Muat Naik QR Perempuan
                  <input type="file" accept="image/*" onChange={(e) => handleQrCodeUpload('brideQr', e)} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#c2417c] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow"
          >
            💾 Simpan Maklumat Salam Kaut
          </button>
        </form>
      )}

      {/* TAB 3: MANAGE GIFT IDEAS */}
      {adminTab === 'gifts' && (
        <div className="space-y-4 text-left">
          
          {/* ADD NEW GIFT FORM (3 FIELDS ONLY) */}
          {giftRegistry.length < 10 && (
            <form onSubmit={handleAddGift} className="bg-white p-4 rounded-2xl border border-pink-100 shadow-sm space-y-2">
              <h4 className="text-xs font-extrabold text-[#c2417c] uppercase">+ Tambah Idea Hadiah Baharu</h4>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">1. Nama Hadiah</label>
                <input
                  type="text"
                  placeholder="Cth: Air Fryer XL 4.1L"
                  value={newGiftTitle}
                  onChange={(e) => setNewGiftTitle(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-pink-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">2. Link Shopee</label>
                <input
                  type="url"
                  placeholder="Cth: https://shopee.com.my/..."
                  value={newGiftShopee}
                  onChange={(e) => setNewGiftShopee(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-pink-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">3. Muat Naik Gambar Hadiah</label>
                {newGiftImageDataUrl ? (
                  <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-pink-200">
                    <img src={newGiftImageDataUrl} alt="Preview" className="w-10 h-10 object-cover rounded-lg" />
                    <span className="text-[10px] text-green-600 font-bold">Gambar sedia!</span>
                  </div>
                ) : (
                  <label className="bg-white border-2 border-dashed border-[#c2417c] text-[#c2417c] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-pink-50">
                    <i className="fa-solid fa-camera text-[#c2417c]"></i>
                    <span>Pilih Gambar Produk</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleGiftImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-[#c2417c] text-white text-xs font-extrabold py-2.5 px-3 rounded-xl shadow hover:bg-blush-600 mt-2"
              >
                + Simpan Idea Hadiah
              </button>
            </form>
          )}

          {/* CURRENT GIFTS LIST */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase">Senarai Hadiah Semasa ({giftRegistry.length}/10):</span>
            {giftRegistry.map((item) => (
              <div key={item.id} className="bg-white p-2.5 rounded-xl border border-pink-100 flex items-center justify-between gap-2 shadow-sm">
                <div className="flex items-center gap-2 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-pink-50"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80'; }}
                  />
                  <div className="truncate">
                    <h5 className="text-xs font-bold truncate text-gray-800">{item.title}</h5>
                    <span className="text-[9.5px] text-[#c2417c] font-medium truncate block">Shopee Linked</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteGift(item.id)}
                  className="text-red-500 hover:text-red-700 p-1 text-xs"
                  title="Buang Item Ini"
                >
                  <i className="fa-solid fa-trash-can text-sm"></i>
                </button>
              </div>
            ))}
          </div>

        </div>
      )}

      <button
        onClick={handleAdminLogout}
        className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-xs py-3 px-4 rounded-xl border border-red-200 transition text-center shadow-sm flex items-center justify-center gap-2 mt-4"
      >
        <i className="fa-solid fa-right-from-bracket"></i>
        <span>Log Keluar Daripada Akaun Admin</span>
      </button>

    </div>
  );
}

/* HERO SECTION */
function HeroSection({ onOpenUpload, onGoToGallery, totalMemories, totalGuests, eventDetails }) {
  return (
    <div className="flex flex-col items-center text-center px-4 py-6 space-y-5">
      
      {/* WALIMATULURUS BADGE (EDITABLE VIA ADMIN) */}
      <div className="flex flex-col items-center pt-2">
        <span className="bg-pink-100/90 border border-pink-200 text-[#c2417c] text-[11px] font-extrabold px-4 py-1 rounded-full uppercase tracking-[0.25em] shadow-sm">
          {eventDetails.badgeText || 'WALIMATULURUS'}
        </span>
      </div>

      {/* COUPLE NAMES (LOCKED TO AIMAN & AFRINA) */}
      <div className="space-y-1">
        <h2 className="font-script text-5xl sm:text-6xl text-[#c2417c] font-bold drop-shadow-sm leading-tight py-1">
          Aiman & Afrina
        </h2>
        <p className="font-cinzel text-lg sm:text-xl font-extrabold text-[#6d1e4a] tracking-[0.2em] uppercase">
          MAJLIS PERKAHWINAN
        </p>
        <h3 className="font-sans text-xs font-bold text-gray-500 tracking-[0.18em] uppercase pt-1">
          Tangkap Memori Bersama
        </h3>
      </div>

      <div className="flex items-center justify-center gap-2 flex-wrap">
        <span className="bg-white/80 border border-pink-200 text-[#c2417c] text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
          <i className="fa-regular fa-calendar-days text-[#c2417c]"></i>
          {eventDetails.eventDate}
        </span>
        <span className="bg-[#c2417c] text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
          <i className="fa-solid fa-hashtag text-pink-200"></i>
          {eventDetails.hashtag.replace(/^#/, '')}
        </span>
      </div>

      {/* 3 FLOATING POLAROID PHOTO PREVIEW (PLAIN TEXT CAPTIONS, NO DATE UNDER PHOTO 1) */}
      <div className="relative w-full max-w-[340px] h-[215px] mt-2 flex items-center justify-center">
        
        {/* POLAROID 1 (LEFT) */}
        <div className="absolute -left-1 top-1 w-[165px] bg-white p-2.5 rounded-xl shadow-polaroid transform -rotate-12 transition-all hover:rotate-0 hover:z-20 border border-pink-100">
          <div className="polaroid-tape" />
          <img
            src={eventDetails.heroPhoto1}
            alt="Hero 1"
            className="w-full h-[115px] object-cover rounded-md"
          />
          <div className="mt-2 text-left">
            <p className="text-[10.5px] font-bold text-blush-800 truncate">
              {eventDetails.heroPhoto1Caption || 'Aiman & Afrina ❤️'}
            </p>
          </div>
        </div>

        {/* POLAROID 2 (RIGHT) */}
        <div className="absolute -right-1 top-6 w-[160px] bg-white p-2.5 rounded-xl shadow-polaroid transform rotate-12 transition-all hover:rotate-0 hover:z-20 border border-pink-100">
          <div className="polaroid-tape" />
          <img
            src={eventDetails.heroPhoto2}
            alt="Hero 2"
            className="w-full h-[110px] object-cover rounded-md"
          />
          <div className="mt-2 text-left">
            <p className="text-[10.5px] font-bold text-blush-800 truncate">
              {eventDetails.heroPhoto2Caption || 'Kenangan Indah'}
            </p>
          </div>
        </div>

        {/* POLAROID 3 (CENTER) */}
        <div className="absolute top-12 w-[145px] bg-white p-2 rounded-xl shadow-2xl transform -rotate-1 border border-pink-200 z-10">
          <img
            src={eventDetails.heroPhoto3}
            alt="Hero 3"
            className="w-full h-[100px] object-cover rounded-md"
          />
          <div className="mt-1 text-center">
            <span className="text-[9.5px] font-bold text-blush-600">
              {eventDetails.heroPhoto3Caption || '#MemoriAbadi ✨'}
            </span>
          </div>
        </div>
      </div>

      {/* QUOTE TEXT BANNER (MOVED CLOSER UP & CLEAN READABLE FONT) */}
      <div className="w-full text-center py-2.5 px-3 bg-pink-50/90 rounded-2xl border border-pink-100/90 shadow-sm -mt-1 mb-1">
        <p className="font-serif italic text-xs sm:text-sm text-[#6d1e4a] font-semibold tracking-wide leading-relaxed">
          "Setiap tetamu ada cerita. Setiap gambar ada kenangan."
        </p>
      </div>

      <div className="w-full grid grid-cols-2 gap-2.5 px-1 pt-1">
        <button
          onClick={onGoToGallery}
          className="w-full bg-gradient-to-r from-[#c2417c] to-pink-600 hover:opacity-95 text-white text-xs font-extrabold py-3.5 px-2 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition active:scale-95 glow-pulsing text-center"
        >
          <i className="fa-solid fa-book-open text-sm"></i>
          <span>Masuk Guestbook</span>
        </button>

        <button
          onClick={() => onOpenUpload('photo')}
          className="w-full bg-white border-2 border-[#c2417c] text-[#c2417c] hover:bg-pink-50 text-xs font-extrabold py-3.5 px-2 rounded-2xl shadow-md flex items-center justify-center gap-2 transition active:scale-95 text-center"
        >
          <i className="fa-solid fa-pen-to-square text-sm"></i>
          <span>Tulis Guestbook</span>
        </button>
      </div>

      <div className="w-full bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-pink-100 shadow-sm mt-3">
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

/* LIVE GALLERY VIEW (WITH 10 ITEMS PER PAGE PAGINATION & RECYCLE BIN) */
function LiveGalleryView({
  memories,
  binMemories = [],
  totalMemories,
  totalGuests,
  totalLikes,
  filterMode,
  setFilterMode,
  selectedGuestFilter,
  setSelectedGuestFilter,
  onToggleLike,
  onDeleteMemory,
  onRestoreMemory,
  onPermanentDeleteMemory,
  isAdminLoggedIn,
  onShare,
  onOpenUpload,
  onLightbox,
  eventDetails
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
    if (!isAdminLoggedIn && filterMode === 'bin') {
      setFilterMode('latest');
    }
  }, [isAdminLoggedIn, filterMode, selectedGuestFilter, setFilterMode]);

  const totalPages = Math.ceil(memories.length / itemsPerPage) || 1;

  const paginatedMemories = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return memories.slice(start, start + itemsPerPage);
  }, [memories, currentPage, itemsPerPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      const galleryHeader = document.getElementById('guestbook-summary-header');
      if (galleryHeader) {
        galleryHeader.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 300, behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="px-3 py-4 space-y-4">
      
      {/* REDESIGNED GUESTBOOK SUMMARY CARD (MATCHING REFERENCE IMAGE) */}
      <div id="guestbook-summary-header" className="bg-gradient-to-r from-[#fdf2f4] via-[#fcf0f2] to-[#fdf2f4] rounded-3xl p-3.5 shadow-sm border border-pink-200/70 space-y-3 relative overflow-hidden">
        
        {/* Header Title (NO Camera Icon, NO Hashtag) */}
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black text-[#331525] tracking-tight">
            Guestbook Summary
          </h3>
        </div>

        {/* 3 Stat Items with Colored Circle Icons */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 shadow-inner border border-pink-100/90 grid grid-cols-3 gap-1 divide-x divide-pink-100">
          
          {/* Stat 1: Memori */}
          <div className="flex items-center justify-center gap-2 pl-1">
            <div className="w-8 h-8 rounded-full bg-pink-100 text-[#c2417c] flex items-center justify-center text-xs flex-shrink-0 shadow-sm">
              <i className="fa-regular fa-image"></i>
            </div>
            <div className="text-left">
              <span className="block text-xs font-black text-gray-800 leading-none">{totalMemories}</span>
              <span className="text-[9.5px] text-gray-400 font-bold uppercase tracking-wider">Memori</span>
            </div>
          </div>

          {/* Stat 2: Tetamu */}
          <div className="flex items-center justify-center gap-2 pl-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs flex-shrink-0 shadow-sm">
              <i className="fa-solid fa-users"></i>
            </div>
            <div className="text-left">
              <span className="block text-xs font-black text-gray-800 leading-none">{totalGuests}</span>
              <span className="text-[9.5px] text-gray-400 font-bold uppercase tracking-wider">Tetamu</span>
            </div>
          </div>

          {/* Stat 3: Likes */}
          <div className="flex items-center justify-center gap-2 pl-2">
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center text-xs flex-shrink-0 shadow-sm">
              <i className="fa-solid fa-heart"></i>
            </div>
            <div className="text-left">
              <span className="block text-xs font-black text-gray-800 leading-none">{totalLikes}</span>
              <span className="text-[9.5px] text-gray-400 font-bold uppercase tracking-wider">Likes</span>
            </div>
          </div>

        </div>
      </div>

      {/* ------------------- GUEST SEARCH BAR ------------------- */}
      <div className="relative">
        <div className="relative flex items-center w-full">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 text-gray-400 text-xs"></i>
          <input
            type="text"
            value={selectedGuestFilter || ''}
            onChange={(e) => setSelectedGuestFilter(e.target.value || null)}
            placeholder="Cari ucapan mengikut nama tetamu..."
            className="w-full pl-9 pr-8 py-2.5 bg-white border border-pink-200 rounded-2xl text-xs text-gray-800 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#c2417c] transition font-medium"
          />
          {selectedGuestFilter && (
            <button
              onClick={() => setSelectedGuestFilter(null)}
              className="absolute right-3 text-gray-400 hover:text-gray-600 p-1"
              title="Padam carian"
            >
              <i className="fa-solid fa-xmark text-xs"></i>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-pink-200 pb-1">
        <div className="flex gap-1.5 flex-wrap">
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

          {/* BIN BUTTON (SHOWN ONLY WHEN CLIENT / ADMIN IS LOGGED IN) */}
          {isAdminLoggedIn && (
            <button
              onClick={() => setFilterMode('bin')}
              className={`text-xs font-extrabold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${filterMode === 'bin' ? 'bg-rose-700 text-white shadow-md ring-2 ring-rose-300' : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'}`}
            >
              <i className="fa-solid fa-trash-can text-xs"></i>
              <span>BIN ({binMemories.length})</span>
            </button>
          )}
        </div>

        <span className="text-[10px] text-gray-400 font-bold">
          {filterMode === 'bin' ? `${binMemories.length} Dalam Bin` : `${memories.length} Memori`}
        </span>
      </div>

      {filterMode === 'bin' ? (
        /* RECYCLE BIN SECTION */
        <div className="space-y-3 pt-1">
          <div className="bg-rose-50/90 border border-rose-200 rounded-2xl p-3 text-center text-rose-900 space-y-1 shadow-sm">
            <h4 className="text-xs font-black uppercase flex items-center justify-center gap-1.5 text-rose-700">
              <i className="fa-solid fa-trash-can text-rose-600"></i>
              Section BIN (Tong Sampah Memori)
            </h4>
            <p className="text-[10.5px] text-rose-600 font-medium leading-relaxed">
              Memori yang dipadam disimpan di sini. Anda boleh memulihkan (*restore*) gambar ke Galeri Live atau memadam sepenuhnya daripada database.
            </p>
          </div>

          {binMemories.length === 0 ? (
            <div className="text-center py-10 bg-white/80 rounded-2xl p-6 border border-pink-100 space-y-2">
              <i className="fa-solid fa-trash-can text-4xl text-gray-300"></i>
              <p className="text-xs text-gray-500 font-bold">Tong sampah (BIN) kosong. Tiada memori dipadam.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {binMemories.map((item) => (
                <div key={item.id} className="bg-white p-2 rounded-xl shadow-md border border-rose-200 relative flex flex-col justify-between">
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img src={item.imageUrl} alt={item.guestName} className="w-full h-full object-cover grayscale opacity-75" />
                    <span className="absolute top-1.5 left-1.5 bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md shadow">
                      DALAM BIN
                    </span>
                  </div>

                  <div className="mt-2 space-y-1.5">
                    <h5 className="text-[11px] font-black text-gray-800 truncate">{item.guestName}</h5>
                    <p className="text-[9.5px] text-gray-500 italic line-clamp-1">"{item.caption}"</p>

                    <div className="grid grid-cols-2 gap-1 pt-1 border-t border-gray-100">
                      <button
                        onClick={() => onRestoreMemory(item.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9.5px] font-black py-1.5 px-1 rounded-lg flex items-center justify-center gap-1 shadow-sm transition active:scale-95"
                        title="Pulihkan Memori ke Galeri"
                      >
                        <i className="fa-solid fa-rotate-left text-[10px]"></i>
                        <span>Restore</span>
                      </button>

                      <button
                        onClick={() => onPermanentDeleteMemory(item.id, item.guestName)}
                        className="bg-red-600 hover:bg-red-700 text-white text-[9.5px] font-black py-1.5 px-1 rounded-lg flex items-center justify-center gap-1 shadow-sm transition active:scale-95"
                        title="Padam Sepenuhnya dari Database"
                      >
                        <i className="fa-solid fa-xmark text-[10px]"></i>
                        <span>Padam</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* REGULAR GALLERY GRID & PAGINATION */
        <>
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
              {paginatedMemories.map((item, idx) => (
                <PolaroidCard
                  key={item.id}
                  item={item}
                  index={idx}
                  onToggleLike={onToggleLike}
                  onDeleteMemory={onDeleteMemory}
                  isAdminLoggedIn={isAdminLoggedIn}
                  onShare={onShare}
                  onLightbox={onLightbox}
                />
              ))}
            </div>
          )}

          {/* ------------------- PAGINATION BAR (10 ITEMS PER PAGE) ------------------- */}
          {memories.length > 0 && (
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3 border border-pink-100 shadow-sm space-y-2 text-center mt-3">
              <div className="text-[10.5px] font-bold text-gray-500">
                Menunjukkan {Math.min((currentPage - 1) * itemsPerPage + 1, memories.length)} - {Math.min(currentPage * itemsPerPage, memories.length)} daripada {memories.length} memori
              </div>

              <div className="flex items-center justify-center gap-1.5 pt-1">
                {/* PREVIOUS PAGE BUTTON */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition flex items-center gap-1 ${currentPage === 1 ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50' : 'bg-white text-[#c2417c] border-pink-200 hover:bg-pink-50 shadow-sm active:scale-95'}`}
                >
                  <i className="fa-solid fa-chevron-left text-[10px]"></i>
                  <span>Sebelah</span>
                </button>

                {/* PAGE NUMBERS */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-7 h-7 text-xs font-black rounded-xl transition flex items-center justify-center ${pageNum === currentPage ? 'bg-[#c2417c] text-white shadow-md' : 'bg-white text-gray-600 border border-pink-100 hover:bg-pink-50'}`}
                  >
                    {pageNum}
                  </button>
                ))}

                {/* NEXT PAGE BUTTON */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition flex items-center gap-1 ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50' : 'bg-white text-[#c2417c] border-pink-200 hover:bg-pink-50 shadow-sm active:scale-95'}`}
                >
                  <span>Selanjutnya</span>
                  <i className="fa-solid fa-chevron-right text-[10px]"></i>
                </button>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}

/* POLAROID CARD (WITH ADMIN DELETE BUTTON & ENHANCED LIKE BUTTON) */
function PolaroidCard({ item, index, onToggleLike, onDeleteMemory, isAdminLoggedIn, onShare, onLightbox }) {
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

        {/* CLIENT ADMIN DELETE BUTTON (MOVES TO BIN) */}
        {isAdminLoggedIn && (
          <button
            type="button"
            onClick={(e) => onDeleteMemory(item.id, item.guestName, e)}
            className="absolute top-1.5 right-1.5 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow hover:bg-red-700 z-30 flex items-center gap-1 active:scale-95"
            title="Pindahkan ke BIN (Tong Sampah)"
          >
            <i className="fa-solid fa-trash-can text-[9px]"></i>
            <span>Padam</span>
          </button>
        )}

        {item.isBoomerang && (
          <span className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-md text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-1">
            <i className="fa-solid fa-video text-pink-400"></i>
            LIVE PHOTO
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
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleLike(item.id, e);
            }}
            className={`flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-1 rounded-lg transition active:scale-125 select-none ${item.isLiked ? 'text-[#c2417c] bg-pink-100/90 font-black shadow-sm' : 'text-gray-400 hover:text-pink-500 hover:bg-pink-50'}`}
          >
            <i className={`fa-solid fa-heart ${item.isLiked ? 'text-[#c2417c] scale-110' : 'text-gray-300'}`}></i>
            <span>{item.likes}</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onShare(item, e);
            }}
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

/* ADMIN LOGIN MODAL */
function AdminClientModal({
  isLoggedIn,
  pinInput,
  setPinInput,
  onLogin,
  onLogout,
  onClose,
  triggerToast
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-pink-100 overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="bg-[#6d1e4a] text-white px-4 py-3 border-b border-pink-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-user-shield text-pink-300"></i>
            <h3 className="text-xs font-extrabold uppercase tracking-wider">
              Log Masuk Admin
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-pink-200 hover:bg-white/10">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* LOGIN FORM */}
        <form onSubmit={onLogin} className="p-6 space-y-4">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-full bg-pink-100 text-[#c2417c] flex items-center justify-center mx-auto mb-2 text-xl shadow-sm">
              <i className="fa-solid fa-lock"></i>
            </div>
            <h4 className="text-sm font-bold text-gray-800">Akses Admin</h4>
            <p className="text-xs text-gray-500">Sila masukkan PIN Admin anda untuk menguruskan majlis (Default PIN: 1234)</p>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-gray-700 uppercase mb-1">
              PIN Masuk Admin
            </label>
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Masukkan PIN (cth: 1234)"
              required
              className="w-full px-3 py-2.5 text-center text-sm font-bold tracking-widest rounded-xl border border-pink-200 focus:ring-2 focus:ring-[#c2417c] outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#c2417c] to-pink-600 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md hover:opacity-95 transition"
          >
            🔑 Masuk Admin
          </button>
        </form>

      </div>
    </div>
  );
}

/* UPLOAD MODAL */
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
            <i className="fa-solid fa-camera text-[#c2417c]"></i>
            <h3 className="text-xs font-extrabold text-blush-800 uppercase tracking-wider">
              Kongsi Memori Perkahwinan
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-pink-100">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-4 space-y-4 overflow-y-auto">
          
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onFileChange}
            className="hidden"
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*,video/mp4,video/quicktime,video/webm,.heic,.heif"
            onChange={onFileChange}
            className="hidden"
          />

          <div className="space-y-2">
            <label className="block text-[11px] font-extrabold text-gray-700 uppercase">
              1. Tangkap Kamera / Muat Naik Foto
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
                    className="bg-black/70 hover:bg-black text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md flex items-center gap-1"
                  >
                    <i className="fa-solid fa-camera text-xs"></i>
                    <span>Kamera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current && galleryInputRef.current.click()}
                    className="bg-[#c2417c] hover:bg-blush-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow flex items-center gap-1"
                  >
                    <i className="fa-solid fa-folder-open text-xs"></i>
                    <span>Galeri</span>
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
                  <span className="text-xs font-bold text-[#c2417c]">Buka Kamera</span>
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
                  <span className="text-xs font-bold text-blush-800">Muat Naik Galeri</span>
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
                className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-blush-400 bg-white font-semibold"
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
              
              {/* EMOJI PICKER (CHAMPAGNE '🥂' REMOVED) */}
              <div className="flex gap-1.5 mt-1.5">
                {['❤️', '🎉', '💍', '🌸', '✨', '🎁'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setWishCaption(prev => prev + ' ' + emoji)}
                    className="text-xs bg-pink-50 hover:bg-pink-100 px-2.5 py-1 rounded-md border border-pink-200 transition active:scale-95"
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
                className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200 bg-white focus:outline-none font-bold"
              >
                <option value="Pose Gempak">Pose & Gaya Gempak</option>
                <option value="Gaya Pengantin">Gaya Pengantin Sejoli</option>
                <option value="Ucapan Ringkas">Titipan Doa Ringkas</option>
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

/* SALAM KAUT SECTION (MATCHING EXACT REFERENCE SCREENSHOT DESIGN) */
function SalamKautSection({ triggerToast, onLightbox, salamKautDetails }) {
  return (
    <div className="p-4 space-y-6 text-center">
      
      {/* HEADER WITH CUTE HEART GRAPHIC */}
      <div className="relative pt-2 px-2">
        <div className="flex items-center justify-center gap-2">
          <span className="text-pink-400 text-sm">💕</span>
          <h2 className="font-script text-4xl sm:text-5xl text-[#6d1e4a] font-bold drop-shadow-sm">
            Salam Kaut
          </h2>
          <span className="text-pink-400 text-sm">💕</span>
        </div>
        
        <p className="text-xs text-gray-600 max-w-xs mx-auto leading-relaxed pt-2 font-medium">
          Kehadiran dan doa restu anda adalah hadiah paling bermakna buat kami. Bagi yang berhajat memberikan salam kaut secara digital:
        </p>
      </div>

      <div className="space-y-6 pt-2">
        
        {/* CARD 1: PENGANTIN LELAKI */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-4 shadow-lg border border-pink-100/90 relative text-left pt-6">
          
          {/* Top Centered Pill Badge */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#6d1e4a] text-white text-[10.5px] font-extrabold px-4 py-1 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap">
            <i className="fa-solid fa-mars text-xs"></i>
            <span>PENGANTIN LELAKI</span>
          </div>

          <div className="flex items-center justify-between gap-3">
            
            {/* Left Bank Details */}
            <div className="space-y-3 flex-1">
              
              {/* Bank Name (NO "Akaun Bank" label as requested!) */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#ffcc00] text-black flex items-center justify-center font-black text-xs shadow-sm flex-shrink-0">
                  <i className="fa-solid fa-building-columns text-black"></i>
                </div>
                <h3 className="font-black text-[#331525] text-xs uppercase tracking-wide">
                  {salamKautDetails.groomBank || 'MAYBANK DUITNOW QR'}
                </h3>
              </div>

              <div className="border-t border-dashed border-pink-100 pt-2 space-y-1">
                <div>
                  <p className="text-[10px] font-bold text-gray-400">Nama Penerima</p>
                  <h4 className="font-extrabold text-[#6d1e4a] text-xs leading-snug">
                    {salamKautDetails.groomName}
                  </h4>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-gray-400">Nombor Akaun</p>
                  <p className="text-xs font-black text-[#c2417c] tracking-wider">
                    {salamKautDetails.groomAcc}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  try { navigator.clipboard.writeText(salamKautDetails.groomAcc.replace(/\s+/g, '')); } catch(e) {}
                  triggerToast(`Nombor Akaun ${salamKautDetails.groomBank} disalin! 📋`);
                }}
                className="bg-[#fcf0f4] hover:bg-pink-100 text-[#c2417c] text-[10px] font-extrabold px-3 py-1.5 rounded-xl border border-pink-200 flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              >
                <i className="fa-solid fa-copy"></i>
                <span>Salin Nombor Akaun</span>
              </button>
            </div>

            {/* Right QR Box */}
            <div className="w-[125px] bg-[#fdf5f7] rounded-2xl p-2 border border-pink-200/80 flex flex-col items-center gap-1.5 flex-shrink-0 shadow-sm">
              <span className="bg-[#6d1e4a] text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                SCAN TO PAY
              </span>
              
              <div
                onClick={() => onLightbox({ imageUrl: salamKautDetails.groomQr, guestName: `QR Code - ${salamKautDetails.groomName}` })}
                className="w-full aspect-square rounded-xl overflow-hidden bg-white border border-amber-300 p-0.5 cursor-pointer hover:scale-105 transition"
              >
                <img
                  src={salamKautDetails.groomQr}
                  alt="QR Groom"
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => { e.target.src = 'assets/images/qr_aiman.png'; }}
                />
              </div>

              <button
                onClick={() => onLightbox({ imageUrl: salamKautDetails.groomQr, guestName: `QR Code - ${salamKautDetails.groomName}` })}
                className="w-full bg-[#6d1e4a] text-white text-[9px] font-bold py-1 rounded-xl shadow-sm flex items-center justify-center gap-1 hover:bg-[#521537]"
              >
                <i className="fa-solid fa-magnifying-glass text-[8px]"></i>
                <span>Zoom QR</span>
              </button>
            </div>

          </div>
        </div>

        {/* CARD 2: PENGANTIN PEREMPUAN */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-4 shadow-lg border border-pink-100/90 relative text-left pt-6">
          
          {/* Top Centered Pill Badge */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#c2417c] text-white text-[10.5px] font-extrabold px-4 py-1 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap">
            <i className="fa-solid fa-venus text-xs"></i>
            <span>PENGANTIN PEREMPUAN</span>
          </div>

          <div className="flex items-center justify-between gap-3">
            
            {/* Left Bank Details */}
            <div className="space-y-3 flex-1">
              
              {/* Bank Name (NO "Akaun Bank" label as requested!) */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#ffcc00] text-black flex items-center justify-center font-black text-xs shadow-sm flex-shrink-0">
                  <i className="fa-solid fa-building-columns text-black"></i>
                </div>
                <h3 className="font-black text-[#331525] text-xs uppercase tracking-wide">
                  {salamKautDetails.brideBank || 'MAYBANK DUITNOW QR'}
                </h3>
              </div>

              <div className="border-t border-dashed border-pink-100 pt-2 space-y-1">
                <div>
                  <p className="text-[10px] font-bold text-gray-400">Nama Penerima</p>
                  <h4 className="font-extrabold text-[#c2417c] text-xs leading-snug">
                    {salamKautDetails.brideName}
                  </h4>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-gray-400">Nombor Akaun</p>
                  <p className="text-xs font-black text-[#c2417c] tracking-wider">
                    {salamKautDetails.brideAcc}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  try { navigator.clipboard.writeText(salamKautDetails.brideAcc.replace(/\s+/g, '')); } catch(e) {}
                  triggerToast(`Nombor Akaun ${salamKautDetails.brideBank} disalin! 📋`);
                }}
                className="bg-[#fcf0f4] hover:bg-pink-100 text-[#c2417c] text-[10px] font-extrabold px-3 py-1.5 rounded-xl border border-pink-200 flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              >
                <i className="fa-solid fa-copy"></i>
                <span>Salin Nombor Akaun</span>
              </button>
            </div>

            {/* Right QR Box */}
            <div className="w-[125px] bg-[#fdf5f7] rounded-2xl p-2 border border-pink-200/80 flex flex-col items-center gap-1.5 flex-shrink-0 shadow-sm">
              <span className="bg-[#c2417c] text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                SCAN TO PAY
              </span>
              
              <div
                onClick={() => onLightbox({ imageUrl: salamKautDetails.brideQr, guestName: `QR Code - ${salamKautDetails.brideName}` })}
                className="w-full aspect-square rounded-xl overflow-hidden bg-white border border-pink-300 p-0.5 cursor-pointer hover:scale-105 transition"
              >
                <img
                  src={salamKautDetails.brideQr}
                  alt="QR Bride"
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => { e.target.src = 'assets/images/qr_afrina.png'; }}
                />
              </div>

              <button
                onClick={() => onLightbox({ imageUrl: salamKautDetails.brideQr, guestName: `QR Code - ${salamKautDetails.brideName}` })}
                className="w-full bg-[#c2417c] text-white text-[9px] font-bold py-1 rounded-xl shadow-sm flex items-center justify-center gap-1 hover:bg-blush-600"
              >
                <i className="fa-solid fa-magnifying-glass text-[8px]"></i>
                <span>Zoom QR</span>
              </button>
            </div>

          </div>
        </div>

        {/* BOTTOM THANK YOU BANNER */}
        <div className="bg-white/90 rounded-2xl p-3.5 shadow-sm border border-pink-100 flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-full bg-pink-100 text-[#c2417c] flex items-center justify-center text-lg flex-shrink-0">
            <i className="fa-solid fa-comment-dots"></i>
          </div>
          <div>
            <h4 className="font-script text-2xl text-[#6d1e4a] font-bold leading-none">Terima Kasih</h4>
            <p className="text-[10px] text-gray-500 font-medium leading-snug mt-1">
              Semoga setiap kebaikan yang anda beri dibalas dengan rahmat dan keberkatan.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

/* HADIAH SECTION (WITH CUSTOM REGISTRY CONTROL) */
function HadiahSection({ triggerToast, giftRegistry, eventDetails }) {
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
          Bagi tetamu yang berhajat menghadiahkan barangan kelengkapan rumah tangga baharu {eventDetails.coupleNames}, berikut adalah beberapa idea hadiah pilihan:
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2 text-left">
        {giftRegistry.map((gift) => {
          const targetShopeeUrl = gift.shopeeQuery && gift.shopeeQuery.startsWith('http')
            ? gift.shopeeQuery
            : `https://shopee.com.my/search?keyword=${encodeURIComponent(gift.shopeeQuery || gift.title)}`;

          return (
            <div
              key={gift.id}
              className="bg-[#ffffff] rounded-2xl p-2.5 shadow-sm border border-pink-100 flex flex-col justify-between hover:shadow-md transition"
            >
              <div className="space-y-2">
                <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-pink-50">
                  <img
                    src={gift.image}
                    alt={gift.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80'; }}
                  />
                  <span className="absolute top-1.5 left-1.5 bg-white/95 backdrop-blur-sm text-blush-800 text-[8px] font-extrabold px-1.5 py-0.5 rounded-md border border-pink-100 shadow-sm">
                    Idea Hadiah
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-extrabold text-blush-900 leading-snug line-clamp-2">
                    {gift.title}
                  </h4>
                </div>
              </div>

              <a
                href={targetShopeeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 w-full bg-[#ee4d2d] hover:bg-[#d73211] text-white text-[10.5px] font-extrabold py-2 px-2 rounded-xl shadow-sm flex items-center justify-center gap-1 transition active:scale-95 text-center"
              >
                <i className="fa-solid fa-cart-shopping text-xs"></i>
                <span>Beli di Shopee</span>
              </a>
            </div>
          );
        })}
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
