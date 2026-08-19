import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Folder,
  FileText,
  FileJson,
  FileCode,
  UserCheck,
  Download,
  X,
  Minus,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Search,
  LayoutGrid,
  List,
  Columns,
  Image as ImageIcon,
  HardDrive,
  Clock,
  Trash2,
  Share2,
  Lock,
  Wifi,
  Sliders,
  Sun,
  Moon,
  Eye,
  Terminal,
  Server,
  KeyRound,
  User,
  ExternalLink,
  Copy,
  Check,
  BookOpen,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  ArrowLeft,
  Smartphone,
  Monitor,
  ShieldAlert,
  FolderKanban,
  FileSpreadsheet
} from 'lucide-react';
import { format } from 'date-fns';
import { fetchPersonal, fetchCategories, fetchPostsByCategory } from '@/api/client';
import { buildFileSystem, type FileNode, type FileType } from '@/api/buildFS';

// Helper to flat search files
function searchFiles(node: FileNode, query: string): FileNode[] {
  let results: FileNode[] = [];
  if (node.name.toLowerCase().includes(query.toLowerCase()) && node.id !== 'root') {
    results.push(node);
  }
  if (node.children) {
    for (const child of node.children) {
      if (!child.isRestricted) {
        results = results.concat(searchFiles(child, query));
      }
    }
  }
  return results;
}

// --- DATA FETCHING ---

function useFileSystem() {
  const [fileSystem, setFileSystem] = useState<FileNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [personal, categories] = await Promise.all([
          fetchPersonal(),
          fetchCategories(),
        ]);

        const allPosts = [];
        for (const cat of categories) {
          const res = await fetchPostsByCategory(cat.slug);
          allPosts.push(...res.posts);
        }

        const fs = buildFileSystem(personal, categories, allPosts);
        setFileSystem(fs);
      } catch (err) {
        console.error('Failed to load data:', err);
        setFetchError('Failed to connect to server');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return { fileSystem, isLoading, fetchError };
}

// --- HELPER COMPONENTS ---

const macOSFileIcons: Record<FileType, { color: string; bg: string; badge: string }> = {
  folder: { color: 'text-sky-500', bg: 'bg-sky-500/10 border-sky-500/30', badge: 'DIR' },
  pdf: { color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/30', badge: 'PDF' },
  json: { color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/30', badge: 'JSON' },
  markdown: { color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/30', badge: 'DOC' },
  vcf: { color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/30', badge: 'VCF' },
  code: { color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/30', badge: 'CODE' }
};

const FileTypeIcon = ({ type, className = "w-10 h-10" }: { type: FileType; className?: string }) => {
  switch (type) {
    case 'folder':
      return (
        <div className={`relative flex items-center justify-center ${className}`}>
          <Folder className="w-full h-full text-sky-500 fill-sky-400/20 drop-shadow-md" />
        </div>
      );
    case 'pdf':
      return (
        <div className={`relative flex flex-col items-center justify-center bg-gradient-to-br from-red-500 to-rose-600 rounded-lg shadow-md border border-white/20 p-2 text-white ${className}`}>
          <FileText className="w-1/2 h-1/2 mb-0.5" />
          <span className="text-[9px] font-bold tracking-wider uppercase">PDF</span>
        </div>
      );
    case 'json':
      return (
        <div className={`relative flex flex-col items-center justify-center bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg shadow-md border border-white/20 p-2 text-white ${className}`}>
          <FileJson className="w-1/2 h-1/2 mb-0.5" />
          <span className="text-[9px] font-bold tracking-wider uppercase">JSON</span>
        </div>
      );
    case 'vcf':
      return (
        <div className={`relative flex flex-col items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-md border border-white/20 p-2 text-white ${className}`}>
          <User className="w-1/2 h-1/2 mb-0.5" />
          <span className="text-[9px] font-bold tracking-wider uppercase">vCard</span>
        </div>
      );
    case 'markdown':
    default:
      return (
        <div className={`relative flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-md border border-white/20 p-2 text-white ${className}`}>
          <FileCode className="w-1/2 h-1/2 mb-0.5" />
          <span className="text-[9px] font-bold tracking-wider uppercase">MD</span>
        </div>
      );
  }
};

// --- MAIN APP COMPONENT ---

export default function App() {
  // Navigation / Login state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [serverAddress, setServerAddress] = useState('smb://sina.macbook-pro.local');
  const [username, setUsername] = useState('visitor');
  const [password, setPassword] = useState('••••••••');

  // Desktop Theme state (Light / Dark)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const hour = new Date().getHours();
    return hour < 7 || hour >= 19;
  });

  // Fetch file system data from API
  const { fileSystem, isLoading, fetchError } = useFileSystem();

  // File System State
  const [currentPathNodes, setCurrentPathNodes] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [quickLookFile, setQuickLookFile] = useState<FileNode | null>(null);
  const [readingPost, setReadingPost] = useState<FileNode | null>(null);
  const [viewMode, setViewMode] = useState<'icon' | 'list' | 'column' | 'gallery'>('icon');
  const [searchQuery, setSearchQuery] = useState('');
  const [accessDeniedFolder, setAccessDeniedFolder] = useState<string | null>(null);

  // Initialize path when fileSystem loads
  useEffect(() => {
    if (fileSystem) {
      setCurrentPathNodes([fileSystem, fileSystem.children![0]]);
    }
  }, [fileSystem]);

  // Mobile viewport toggle / auto detect
  const [isMobileMode, setIsMobileMode] = useState(false);
  const [mobileTab, setMobileTab] = useState<'browse' | 'recents' | 'shared'>('browse');

  // Clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkViewport = () => {
      setIsMobileMode(window.innerWidth < 768);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Keyboard shortcut listener for Spacebar Quick Look
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && selectedFile && !quickLookFile && !readingPost) {
        // Prevent default page scroll
        e.preventDefault();
        setQuickLookFile(selectedFile);
      } else if (e.code === 'Escape') {
        if (quickLookFile) setQuickLookFile(null);
        if (readingPost) setReadingPost(null);
        if (accessDeniedFolder) setAccessDeniedFolder(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFile, quickLookFile, readingPost, accessDeniedFolder]);

  // Handle Login submission
  const handleConnect = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
    }, 1200);
  };

  // Current folder reference
  const currentFolder = currentPathNodes[currentPathNodes.length - 1];

  // Navigate folder
  const handleOpenNode = (node: FileNode) => {
    if (node.isRestricted) {
      setAccessDeniedFolder(node.name);
      return;
    }
    if (node.type === 'folder') {
      setCurrentPathNodes(prev => [...prev, node]);
      setSelectedFile(null);
      setSearchQuery('');
    } else {
      setSelectedFile(node);
    }
  };

  const handleDoubleClickNode = (node: FileNode) => {
    if (node.type === 'folder') {
      handleOpenNode(node);
    } else if (node.type === 'markdown' && node.category) {
      // Opening blog post in full reading view
      setReadingPost(node);
    } else {
      // Open Quick Look preview
      setQuickLookFile(node);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    setCurrentPathNodes(prev => prev.slice(0, index + 1));
    setSelectedFile(null);
  };

  const handleSidebarSelect = (targetId: string) => {
    if (!fileSystem) return;
    if (targetId === 'personal') {
      setCurrentPathNodes([fileSystem, fileSystem.children![0]]);
      setSelectedFile(null);
    } else if (targetId === 'blog') {
      setCurrentPathNodes([fileSystem, fileSystem.children![1]]);
      setSelectedFile(null);
    } else {
      setAccessDeniedFolder(targetId);
    }
  };

  const displayedFiles = useMemo(() => {
    if (!fileSystem || currentPathNodes.length === 0) return [];
    if (searchQuery.trim()) {
      return searchFiles(fileSystem, searchQuery.trim());
    }
    return currentFolder?.children || [];
  }, [currentFolder, searchQuery, fileSystem, currentPathNodes.length]);

  // Loading state
  if (isLoading || !fileSystem || currentPathNodes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="text-sm text-muted-foreground animate-pulse">
          Connecting to server...
        </div>
      </div>
    );
  }

  // Error state
  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="text-center space-y-2">
          <p className="text-sm text-rose-500">{fetchError}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-muted-foreground hover:text-primary underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full select-none font-sans overflow-hidden transition-colors duration-500 ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      
      {/* Wallpapers Background */}
      <div className="fixed inset-0 z-0 pointer-events-none transition-all duration-700">
        {isDarkMode ? (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950/80 to-slate-900">
            {/* Dynamic liquid light mesh dark */}
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/15 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-600/20 blur-[140px]" />
            <div className="absolute top-[30%] right-[20%] w-[40vw] h-[40vw] rounded-full bg-indigo-500/10 blur-[100px]" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-indigo-50/70 to-purple-100">
            {/* Dynamic liquid light mesh light */}
            <div className="absolute top-[-10%] left-[10%] w-[50vw] h-[50vw] rounded-full bg-sky-300/40 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[5%] w-[55vw] h-[55vw] rounded-full bg-violet-300/35 blur-[140px]" />
            <div className="absolute top-[40%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-amber-200/30 blur-[100px]" />
          </div>
        )}
      </div>

      {/* RENDER CONNECT SCREEN OR DESKTOP ENVIRONMENT */}
      <AnimatePresence mode="wait">
        {!isConnected ? (
          /* =======================================================================
             1. ENTRY SCREEN - macOS Connect to Server Modal
             ======================================================================= */
          <motion.div
            key="connect-modal"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04, filter: 'blur(10px)' }}
            transition={{ duration: 0.4 }}
            className="relative z-50 flex items-center justify-center min-h-screen p-4"
          >
            <div className="w-full max-w-lg bg-card/85 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col gap-6">
              
              {/* Remote Header */}
              <div className="flex items-center gap-4 border-b border-border/50 pb-5">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20 shadow-inner">
                  <Server className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">Connect to Server</h1>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Remote Machine: <span className="font-mono text-primary font-medium">sina.remote.dev</span>
                  </p>
                </div>
              </div>

              {/* Form Controls */}
              <form onSubmit={handleConnect} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5" />
                    Server Address
                  </label>
                  <input
                    type="text"
                    value={serverAddress}
                    onChange={(e) => setServerAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/60 border border-border/80 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      Name
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/60 border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5" />
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/60 border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                </div>

                {/* Info Note */}
                <div className="p-3 bg-secondary/40 rounded-xl border border-border/40 text-xs text-muted-foreground flex items-center justify-between">
                  <span>Guest authentication enabled for portfolio preview.</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold">
                    OPEN
                  </span>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleConnect()}
                    disabled={isConnecting}
                    className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-medium border border-border transition-all"
                  >
                    Connect as Guest
                  </button>

                  <button
                    type="submit"
                    disabled={isConnecting}
                    className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-lg shadow-primary/25 flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isConnecting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Connect'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        ) : (
          /* =======================================================================
             2. DESKTOP ENVIRONMENT & FINDER WORKSPACE
             ======================================================================= */
          <motion.div
            key="desktop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 flex flex-col h-screen overflow-hidden"
          >
            {/* Top macOS Menu Bar */}
            <header className="h-8 bg-card/60 backdrop-blur-xl border-b border-border/40 px-3 flex items-center justify-between text-xs font-medium select-none z-30">
              <div className="flex items-center gap-4">
                {/* Logo & System Name */}
                <button
                  onClick={() => setIsConnected(false)}
                  className="flex items-center gap-1.5 font-bold hover:opacity-80 transition-opacity"
                  title="Disconnect Remote Session"
                >
                  <Sparkles className="w-4 h-4 text-primary fill-primary/20" />
                  <span>Sina's Remote Server</span>
                </button>

                <div className="hidden sm:flex items-center gap-3 text-muted-foreground">
                  <span className="font-semibold text-foreground">Finder</span>
                  <span className="hover:text-foreground cursor-pointer">File</span>
                  <span className="hover:text-foreground cursor-pointer">Edit</span>
                  <span className="hover:text-foreground cursor-pointer">View</span>
                  <span className="hover:text-foreground cursor-pointer">Go</span>
                  <span className="hover:text-foreground cursor-pointer">Window</span>
                  <span className="hover:text-foreground cursor-pointer">Help</span>
                </div>
              </div>

              {/* Status Bar Indicators */}
              <div className="flex items-center gap-3 text-xs">
                {/* Remote Connection Pill */}
                <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  SMB Connected
                </div>

                {/* Mode Switch Button (Mobile / Desktop Viewport toggle) */}
                <button
                  onClick={() => setIsMobileMode(!isMobileMode)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  title="Toggle Mobile iOS / Desktop Finder view"
                >
                  {isMobileMode ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline text-[11px]">{isMobileMode ? 'Desktop' : 'iOS View'}</span>
                </button>

                {/* Theme Toggle */}
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-1 rounded-md hover:bg-secondary transition-colors"
                  title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                >
                  {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
                </button>

                <Wifi className="w-3.5 h-3.5 text-muted-foreground" />
                <Sliders className="w-3.5 h-3.5 text-muted-foreground" />

                {/* Live Clock */}
                <span className="font-mono font-medium">
                  {format(currentTime, 'EEE MMM d  h:mm aa')}
                </span>
              </div>
            </header>

            {/* MAIN WORKSPACE CONTENT AREA */}
            <main className="flex-1 relative overflow-hidden p-2 sm:p-6 flex items-center justify-center">

              {/* DESKTOP BACKGROUND SHORTCUTS (DESKTOP ONLY) */}
              {!isMobileMode && (
                <div className="absolute left-6 top-8 hidden lg:flex flex-col gap-6 z-0 pointer-events-auto">
                  <div
                    onClick={() => handleSidebarSelect('personal')}
                    className="flex flex-col items-center gap-1 group cursor-pointer w-20 text-center"
                  >
                    <div className="p-3 bg-card/60 backdrop-blur-md rounded-2xl border border-white/20 shadow-md group-hover:scale-105 transition-transform">
                      <Folder className="w-10 h-10 text-sky-500 fill-sky-400/20" />
                    </div>
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-100 bg-card/40 backdrop-blur-sm px-1.5 py-0.5 rounded shadow-sm">
                      Personal
                    </span>
                  </div>

                  <div
                    onClick={() => handleSidebarSelect('blog')}
                    className="flex flex-col items-center gap-1 group cursor-pointer w-20 text-center"
                  >
                    <div className="p-3 bg-card/60 backdrop-blur-md rounded-2xl border border-white/20 shadow-md group-hover:scale-105 transition-transform">
                      <BookOpen className="w-10 h-10 text-indigo-500 fill-indigo-400/20" />
                    </div>
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-100 bg-card/40 backdrop-blur-sm px-1.5 py-0.5 rounded shadow-sm">
                      Blog
                    </span>
                  </div>
                </div>
              )}

              {/* RENDER DESKTOP FINDER OR IOS FILES APP */}
              {!isMobileMode ? (
                /* =======================================================================
                   3 & 4. FINDER WINDOW (DESKTOP)
                   ======================================================================= */
                <motion.div
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="w-full max-w-6xl h-[85vh] bg-card/80 backdrop-blur-2xl border border-white/30 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10"
                >
                  {/* Window Chrome Titlebar */}
                  <div className="h-12 border-b border-border/40 px-4 flex items-center justify-between select-none bg-card/50">
                    <div className="flex items-center gap-2">
                      {/* Decorative macOS Traffic Light Buttons */}
                      <div className="flex items-center gap-2 group">
                        <button
                          onClick={() => setIsConnected(false)}
                          className="w-3 h-3 rounded-full bg-rose-500 hover:bg-rose-600 transition-colors flex items-center justify-center text-[8px] text-rose-950 font-bold"
                          title="Disconnect Session"
                        >
                          <X className="w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        <div className="w-3 h-3 rounded-full bg-amber-400 flex items-center justify-center text-[8px] text-amber-950 font-bold">
                          <Minus className="w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] text-emerald-950 font-bold">
                          <Maximize2 className="w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>

                    {/* Window Title */}
                    <div className="text-xs font-semibold text-foreground/80 flex items-center gap-2">
                      <Folder className="w-4 h-4 text-sky-500" />
                      <span>{currentFolder.name}</span>
                    </div>

                    {/* Empty Right Spacer */}
                    <div className="w-16" />
                  </div>

                  {/* Toolbar & Search */}
                  <div className="h-12 border-b border-border/40 px-4 flex items-center justify-between gap-3 bg-secondary/30">
                    {/* Navigation Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleBreadcrumbClick(currentPathNodes.length - 2)}
                        disabled={currentPathNodes.length <= 1}
                        className="p-1.5 rounded-lg hover:bg-secondary disabled:opacity-30 transition-colors"
                        title="Back"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        disabled
                        className="p-1.5 rounded-lg hover:bg-secondary opacity-30 transition-colors"
                        title="Forward"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Breadcrumbs Path */}
                    <div className="flex-1 flex items-center gap-1.5 text-xs bg-secondary/50 rounded-lg px-3 py-1.5 border border-border/50 overflow-x-auto scrollbar-none">
                      {currentPathNodes.map((node, idx) => (
                        <React.Fragment key={node.id}>
                          <button
                            onClick={() => handleBreadcrumbClick(idx)}
                            className={`hover:text-primary transition-colors font-medium whitespace-nowrap ${
                              idx === currentPathNodes.length - 1 ? 'text-foreground font-semibold' : 'text-muted-foreground'
                            }`}
                          >
                            {node.name}
                          </button>
                          {idx < currentPathNodes.length - 1 && <span className="text-muted-foreground/40">/</span>}
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-48 hidden sm:block">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-secondary/60 border border-border/60 rounded-lg pl-8 pr-3 py-1 text-xs outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* View Mode Switcher */}
                    <div className="flex items-center gap-0.5 p-0.5 bg-secondary/60 border border-border/50 rounded-lg">
                      <button
                        onClick={() => setViewMode('icon')}
                        className={`p-1 rounded-md transition-colors ${viewMode === 'icon' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        title="Icon View"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-1 rounded-md transition-colors ${viewMode === 'list' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        title="List View"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setViewMode('column')}
                        className={`p-1 rounded-md transition-colors ${viewMode === 'column' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        title="Column View"
                      >
                        <Columns className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Finder Window Body (Sidebar + Main Grid/List) */}
                  <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar */}
                    <aside className="w-48 bg-secondary/30 border-r border-border/40 p-3 hidden sm:flex flex-col gap-6 text-xs select-none">
                      {/* Favorites */}
                      <div className="space-y-1">
                        <div className="px-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                          Favorites
                        </div>
                        <button
                          onClick={() => handleSidebarSelect('personal')}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-colors font-medium ${
                            currentFolder.id === 'personal' ? 'bg-primary/15 text-primary font-semibold' : 'hover:bg-secondary/80 text-foreground/80'
                          }`}
                        >
                          <Folder className="w-4 h-4 text-sky-500" />
                          <span>Personal</span>
                        </button>

                        <button
                          onClick={() => handleSidebarSelect('blog')}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-colors font-medium ${
                            currentFolder.id === 'blog' ? 'bg-primary/15 text-primary font-semibold' : 'hover:bg-secondary/80 text-foreground/80'
                          }`}
                        >
                          <BookOpen className="w-4 h-4 text-indigo-500" />
                          <span>Blog</span>
                        </button>
                      </div>

                      {/* Locations */}
                      <div className="space-y-1">
                        <div className="px-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                          Locations
                        </div>
                        <button
                          onClick={() => handleBreadcrumbClick(0)}
                          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left hover:bg-secondary/80 text-foreground/80 transition-colors"
                        >
                          <HardDrive className="w-4 h-4 text-slate-500" />
                          <span className="truncate">Sina's Mac</span>
                        </button>
                        <button
                          onClick={() => handleSidebarSelect('System Root')}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left hover:bg-secondary/80 text-muted-foreground transition-colors"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Server className="w-4 h-4 text-slate-400" />
                            <span className="truncate">System Root</span>
                          </div>
                          <Lock className="w-3 h-3 text-rose-500" />
                        </button>
                        <button
                          onClick={() => handleSidebarSelect('Trash')}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left hover:bg-secondary/80 text-muted-foreground transition-colors"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Trash2 className="w-4 h-4 text-slate-400" />
                            <span className="truncate">Trash</span>
                          </div>
                          <Lock className="w-3 h-3 text-rose-500" />
                        </button>
                      </div>

                      {/* Quick Help Box */}
                      <div className="mt-auto p-3 rounded-xl bg-card/60 border border-border/40 text-[11px] text-muted-foreground space-y-1">
                        <p className="font-semibold text-foreground flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-primary" />
                          Quick Tip:
                        </p>
                        <p>Select any file and press <kbd className="px-1 py-0.5 bg-secondary border rounded font-mono text-[10px]">Space</kbd> for Quick Look preview.</p>
                      </div>
                    </aside>

                    {/* File Content Area */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-card/20">
                      {displayedFiles.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                          <Folder className="w-12 h-12 mb-3 text-muted-foreground/30" />
                          <p className="text-sm font-medium">No items found</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {searchQuery ? `No matches for "${searchQuery}"` : 'This folder is empty'}
                          </p>
                        </div>
                      ) : viewMode === 'icon' ? (
                        /* ICON VIEW */
                        <div
                          className="flex-1 overflow-y-auto p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 align-content-start"
                          onClick={() => setSelectedFile(null)}
                        >
                          {displayedFiles.map((file) => {
                            const isSelected = selectedFile?.id === file.id;
                            return (
                              <div
                                key={file.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenNode(file);
                                }}
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  handleDoubleClickNode(file);
                                }}
                                className={`group flex flex-col items-center justify-center p-3 rounded-2xl cursor-pointer transition-all border ${
                                  isSelected
                                    ? 'bg-primary/15 border-primary/40 ring-2 ring-primary/30 shadow-md'
                                    : 'border-transparent hover:bg-secondary/50 hover:border-border/30'
                                }`}
                              >
                                <div className="mb-2 transition-transform group-hover:scale-105">
                                  <FileTypeIcon type={file.type} className="w-14 h-14" />
                                </div>
                                <span className={`text-xs font-medium text-center line-clamp-2 px-1 rounded ${
                                  isSelected ? 'text-primary font-bold' : 'text-foreground'
                                }`}>
                                  {file.name}
                                </span>
                                {file.size && (
                                  <span className="text-[10px] text-muted-foreground mt-0.5">
                                    {file.size}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : viewMode === 'list' ? (
                        /* LIST VIEW */
                        <div className="flex-1 overflow-y-auto p-2">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-border/40 text-muted-foreground font-semibold">
                                <th className="py-2 px-3">Name</th>
                                <th className="py-2 px-3">Date Modified</th>
                                <th className="py-2 px-3">Size</th>
                                <th className="py-2 px-3">Kind</th>
                              </tr>
                            </thead>
                            <tbody>
                              {displayedFiles.map((file) => {
                                const isSelected = selectedFile?.id === file.id;
                                return (
                                  <tr
                                    key={file.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenNode(file);
                                    }}
                                    onDoubleClick={(e) => {
                                      e.stopPropagation();
                                      handleDoubleClickNode(file);
                                    }}
                                    className={`cursor-pointer transition-colors border-b border-border/20 ${
                                      isSelected ? 'bg-primary/20 text-foreground font-semibold' : 'hover:bg-secondary/50'
                                    }`}
                                  >
                                    <td className="py-2.5 px-3 flex items-center gap-2.5">
                                      <FileTypeIcon type={file.type} className="w-6 h-6" />
                                      <span>{file.name}</span>
                                    </td>
                                    <td className="py-2.5 px-3 text-muted-foreground">{file.date || '--'}</td>
                                    <td className="py-2.5 px-3 text-muted-foreground">{file.size || '--'}</td>
                                    <td className="py-2.5 px-3 text-muted-foreground uppercase">{file.type}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        /* COLUMN VIEW */
                        <div className="flex-1 flex overflow-x-auto divide-x divide-border/40 text-xs">
                          {/* Parent Column */}
                          <div className="w-56 p-2 overflow-y-auto space-y-1">
                            {displayedFiles.map((file) => {
                              const isSelected = selectedFile?.id === file.id;
                              return (
                                <button
                                  key={file.id}
                                  onClick={() => handleOpenNode(file)}
                                  onDoubleClick={() => handleDoubleClickNode(file)}
                                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors ${
                                    isSelected ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-secondary/60'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <FileTypeIcon type={file.type} className="w-5 h-5" />
                                    <span className="truncate">{file.name}</span>
                                  </div>
                                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                                </button>
                              );
                            })}
                          </div>

                          {/* Preview Column */}
                          {selectedFile ? (
                            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center overflow-y-auto">
                              <FileTypeIcon type={selectedFile.type} className="w-20 h-20 mb-4" />
                              <h3 className="text-base font-bold">{selectedFile.name}</h3>
                              <p className="text-xs text-muted-foreground mt-1">{selectedFile.size} • Modified {selectedFile.date}</p>
                              
                              <button
                                onClick={() => setQuickLookFile(selectedFile)}
                                className="mt-6 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-2 shadow-md hover:bg-primary/90 transition-all"
                              >
                                <Eye className="w-4 h-4" />
                                Quick Look Preview
                              </button>
                            </div>
                          ) : (
                            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                              Select a file to inspect
                            </div>
                          )}
                        </div>
                      )}

                      {/* Status Bar Footer */}
                      <div className="h-7 border-t border-border/40 px-4 bg-secondary/30 flex items-center justify-between text-[11px] text-muted-foreground select-none">
                        <span>{displayedFiles.length} item{displayedFiles.length !== 1 ? 's' : ''}</span>
                        {selectedFile && (
                          <span className="font-medium text-foreground">
                            Selected: {selectedFile.name}
                          </span>
                        )}
                        <span>SMB Remote Server • 1.2 GB Available</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* =======================================================================
                   6. MOBILE / RESPONSIVE (iOS Files App Adaptation)
                   ======================================================================= */
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-md h-[90vh] bg-card/90 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-20"
                >
                  {/* iOS Header */}
                  <div className="p-4 border-b border-border/40 bg-secondary/40 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {currentPathNodes.length > 1 && (
                          <button
                            onClick={() => handleBreadcrumbClick(currentPathNodes.length - 2)}
                            className="p-1 rounded-full bg-secondary text-primary"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                        )}
                        <h2 className="text-lg font-bold tracking-tight">{currentFolder.name}</h2>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                        iOS Files
                      </span>
                    </div>

                    {/* iOS Search */}
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search Files"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary/70 border border-border/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>

                  {/* iOS File List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {displayedFiles.map((file) => (
                      <div
                        key={file.id}
                        onClick={() => {
                          if (file.type === 'folder') {
                            handleOpenNode(file);
                          } else {
                            setQuickLookFile(file);
                          }
                        }}
                        className="flex items-center justify-between p-3 rounded-2xl bg-secondary/40 border border-border/30 active:scale-98 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <FileTypeIcon type={file.type} className="w-10 h-10" />
                          <div>
                            <p className="text-xs font-semibold text-foreground">{file.name}</p>
                            <p className="text-[10px] text-muted-foreground">{file.date} • {file.size || 'Folder'}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>

                  {/* iOS Bottom Navigation Bar */}
                  <div className="h-16 border-t border-border/40 bg-card/80 backdrop-blur-md px-6 flex items-center justify-around text-xs font-medium">
                    <button
                      onClick={() => setMobileTab('recents')}
                      className={`flex flex-col items-center gap-1 ${mobileTab === 'recents' ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                      <Clock className="w-5 h-5" />
                      <span className="text-[10px]">Recents</span>
                    </button>
                    <button
                      onClick={() => setMobileTab('browse')}
                      className={`flex flex-col items-center gap-1 ${mobileTab === 'browse' ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                      <Folder className="w-5 h-5" />
                      <span className="text-[10px]">Browse</span>
                    </button>
                    <button
                      onClick={() => setMobileTab('shared')}
                      className={`flex flex-col items-center gap-1 ${mobileTab === 'shared' ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                      <Share2 className="w-5 h-5" />
                      <span className="text-[10px]">Shared</span>
                    </button>
                  </div>
                </motion.div>
              )}

            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =======================================================================
         4. QUICK LOOK OVERLAY (SPACEBAR TRIGGERED)
         ======================================================================= */}
      <AnimatePresence>
        {quickLookFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setQuickLookFile(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[85vh] bg-card/90 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Quick Look Header */}
              <div className="h-12 border-b border-border/40 px-4 flex items-center justify-between bg-secondary/40 select-none">
                <div className="flex items-center gap-2.5">
                  <FileTypeIcon type={quickLookFile.type} className="w-6 h-6" />
                  <div>
                    <span className="text-xs font-bold text-foreground">{quickLookFile.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">{quickLookFile.size}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`data:text/plain;charset=utf-8,${encodeURIComponent(quickLookFile.content || '')}`}
                    download={quickLookFile.downloadName || quickLookFile.name}
                    className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
                    title="Download File"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => setQuickLookFile(null)}
                    className="p-1.5 rounded-lg hover:bg-rose-500/20 text-muted-foreground hover:text-rose-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Look Content Renderer Per File Type */}
              <div className="flex-1 overflow-y-auto p-6 bg-background/50">
                {/* 1. PDF PREVIEW (resume.pdf) */}
                {quickLookFile.type === 'pdf' && (
                  <div className="space-y-6 text-foreground font-sans max-w-xl mx-auto">
                    <div className="border-b border-border pb-4 flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-extrabold tracking-tight text-primary">Sina Chen</h2>
                        <p className="text-xs text-muted-foreground">Senior Full-Stack & UI Engineer • San Francisco, CA</p>
                      </div>
                      <a
                        href={`data:text/plain;charset=utf-8,${encodeURIComponent("Alex Chen Resume File")}`}
                        download="Alex_Chen_Resume.pdf"
                        className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download PDF
                      </a>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Work Experience</h3>
                      <div className="space-y-3 border-l-2 border-primary/30 pl-3 text-xs">
                        <div>
                          <div className="flex justify-between font-bold text-sm">
                            <span>Lead Frontend Architect @ TechPulse</span>
                            <span className="text-muted-foreground">2023 – Present</span>
                          </div>
                          <p className="text-muted-foreground mt-1">
                            Architected design systems and web application infrastructure. Scaled component library serving 4.5M monthly active users with 99.9% uptime.
                          </p>
                        </div>
                        <div>
                          <div className="flex justify-between font-bold text-sm">
                            <span>Senior Full-Stack Engineer @ CloudScale</span>
                            <span className="text-muted-foreground">2021 – 2023</span>
                          </div>
                          <p className="text-muted-foreground mt-1">
                            Built real-time collaboration canvas tools using WebSockets and React. Reduced bundle payload by 42%.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Core Skills</h3>
                      <div className="flex flex-wrap gap-1.5 text-[11px]">
                        {['TypeScript', 'React 18', 'Next.js', 'Tailwind CSS', 'Node.js', 'Rust', 'GraphQL', 'WebGL', 'Docker'].map((s) => (
                          <span key={s} className="px-2.5 py-1 rounded-lg bg-secondary border border-border font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. JSON VIEW (skills.json) */}
                {quickLookFile.type === 'json' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                      <span>Syntax Highlighted JSON Tree</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(quickLookFile.content || '')}
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy JSON
                      </button>
                    </div>
                    <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner leading-relaxed">
                      {quickLookFile.content}
                    </pre>
                  </div>
                )}

                {/* 3. MARKDOWN VIEW (projects.md / posts) */}
                {quickLookFile.type === 'markdown' && (
                  <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed space-y-4">
                    {quickLookFile.category && (
                      <div className="mb-4 p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                        <span className="font-semibold text-primary">Blog Post Article</span>
                        <button
                          onClick={() => {
                            setReadingPost(quickLookFile);
                            setQuickLookFile(null);
                          }}
                          className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1"
                        >
                          <BookOpen className="w-3.5 h-3.5" /> Read Full Article
                        </button>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap font-sans text-foreground/90">
                      {quickLookFile.content}
                    </div>
                  </div>
                )}

                {/* 4. CONTACT CARD VIEW (contact.vcf) */}
                {quickLookFile.type === 'vcf' && (
                  <div className="max-w-md mx-auto p-6 bg-card rounded-2xl border border-border shadow-xl flex flex-col items-center text-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                      AC
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Alex Chen</h3>
                      <p className="text-xs text-muted-foreground">Senior Software & UI Engineer</p>
                    </div>

                    <div className="w-full space-y-2 text-xs text-left pt-2 border-t border-border">
                      <div className="flex items-center gap-3 p-2 rounded-xl bg-secondary/50">
                        <Mail className="w-4 h-4 text-emerald-500" />
                        <span className="font-mono">alex.chen.dev@example.com</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 rounded-xl bg-secondary/50">
                        <Phone className="w-4 h-4 text-emerald-500" />
                        <span className="font-mono">+1 (555) 382-9104</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 rounded-xl bg-secondary/50">
                        <MapPin className="w-4 h-4 text-emerald-500" />
                        <span>San Francisco, California</span>
                      </div>
                    </div>

                    <a
                      href={`data:text/vcard;charset=utf-8,${encodeURIComponent(quickLookFile.content || '')}`}
                      download="Alex_Chen.vcf"
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
                    >
                      <Download className="w-4 h-4" /> Save to Contacts
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =======================================================================
         5. BLOG FULL-SCREEN READING VIEW (PAGES / TEXTEDIT METAPHOR)
         ======================================================================= */}
      <AnimatePresence>
        {readingPost && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-50 bg-background text-foreground flex flex-col overflow-hidden"
          >
            {/* Reading View Navigation Header */}
            <header className="h-14 border-b border-border/60 px-6 flex items-center justify-between bg-card/70 backdrop-blur-xl">
              <button
                onClick={() => setReadingPost(null)}
                className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Finder
              </button>

              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span>TextEdit • {readingPost.name}</span>
              </div>

              <button
                onClick={() => setReadingPost(null)}
                className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            {/* Reading View Article Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-12 max-w-3xl mx-auto w-full">
              <article className="prose dark:prose-invert max-w-none space-y-6">
                <div className="border-b border-border/60 pb-6">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                    {readingPost.category || 'Article'}
                  </span>
                  <h1 className="text-2xl sm:text-4xl font-black tracking-tight mt-4 text-foreground">
                    {readingPost.name.replace('.md', '').replaceAll('-', ' ').toUpperCase()}
                  </h1>
                  <p className="text-xs text-muted-foreground mt-2">
                    Published on {readingPost.date} • Written by Alex Chen
                  </p>
                </div>

                <div className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base font-sans text-foreground/90">
                  {readingPost.content}
                </div>
              </article>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =======================================================================
         ACCESS DENIED DIALOG MODAL (OUTSIDE BOUNDS NAVIGATION)
         ======================================================================= */}
      <AnimatePresence>
        {accessDeniedFolder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setAccessDeniedFolder(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card border border-rose-500/30 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center border border-rose-500/20">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Access Denied</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  You do not have permission to view the item <span className="font-mono text-rose-500 font-semibold">"{accessDeniedFolder}"</span>. Connection to remote machine limits visitor access strictly to <span className="text-foreground font-semibold">Personal</span> and <span className="text-foreground font-semibold">Blog</span> folders.
                </p>
              </div>

              <button
                onClick={() => setAccessDeniedFolder(null)}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow hover:bg-primary/90 transition-all"
              >
                Return to Safety
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
