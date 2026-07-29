import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Folder, 
  FileJson, 
  FileCode, 
  Download, 
  X, 
  Minus, 
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Search,
  LayoutGrid,
  List,
  Terminal,
  Info
} from 'lucide-react';
import { format } from 'date-fns';

// --- Mock File System Data ---

type FileType = 'folder' | 'markdown' | 'pdf' | 'json' | 'vcf' | 'code';

interface FileNode {
  id: string;
  name: string;
  type: FileType;
  size?: string;
  date?: string;
  content?: string;
  isDownload?: boolean;
  children?: FileNode[];
}

const fileSystem: FileNode = {
  id: "root",
  name: "Home",
  type: "folder",
  children: [
    {
      id: "readme",
      name: "README.md",
      type: "markdown",
      content: "# Welcome.\n\nI'm a software engineer who builds things. Mostly good things. Sometimes weird things.\n\nClick around to see my work.",
      size: "2 KB",
      date: "2024-05-12",
    },
    {
      id: "resume",
      name: "resume.pdf",
      type: "pdf",
      size: "1.2 MB",
      date: "2024-05-10",
      isDownload: true
    },
    {
      id: "projects",
      name: "projects",
      type: "folder",
      children: [
        {
          id: "proj1",
          name: "Sentient_Toaster.md",
          type: "markdown",
          content: "# Sentient Toaster\n\nIt burns your bread, but it apologizes afterward. Built with Rust and some spare Arduino parts.",
          size: "45 KB",
          date: "2023-11-20"
        },
        {
          id: "proj2",
          name: "Hack_The_Planet.md",
          type: "markdown",
          content: "# Hack The Planet\n\nA 3D visualization of global cyber attacks. Rendered with Three.js and WebGL.",
          size: "128 KB",
          date: "2022-08-05"
        }
      ]
    },
    {
      id: "experience",
      name: "experience.md",
      type: "markdown",
      content: "## Senior Developer @ TechCorp (2021-Present)\n- Scaled the backend to handle 10k RPS.\n- Reduced cloud costs by 20%.\n\n## Developer @ Startup (2019-2021)\n- Built the MVP in a weekend.\n- Drank way too much coffee.",
      size: "15 KB",
      date: "2024-01-15",
    },
    {
      id: "skills",
      name: "skills.json",
      type: "json",
      content: "{\n  \"languages\": [\"TypeScript\", \"Python\", \"Rust\"],\n  \"frameworks\": [\"React\", \"Node.js\", \"Next.js\"],\n  \"databases\": [\"PostgreSQL\", \"Redis\"],\n  \"soft_skills\": [\"Overthinking\", \"Coffee Consumption\"]\n}",
      size: "1 KB",
      date: "2024-05-11",
    },
    {
      id: "contact",
      name: "contact.vcf",
      type: "vcf",
      size: "4 KB",
      date: "2024-05-01",
      isDownload: true
    },
    {
      id: "trash",
      name: "trash",
      type: "folder",
      children: [
        {
          id: "bug1",
          name: "prod_db_drop_script.sql",
          type: "code",
          content: "DROP TABLE users; -- Oops",
          size: "0 bytes",
          date: "2020-04-01"
        },
        {
          id: "rej1",
          name: "rejected_startup_idea.txt",
          type: "markdown",
          content: "Uber but for passing butter. \n\nStatus: Rejected by all VCs.",
          size: "12 KB",
          date: "2018-02-14"
        }
      ]
    }
  ]
};

// --- Intro Sequence Component ---

const IntroSequence = ({ onComplete }: { onComplete: () => void }) => {
  const [stage, setStage] = useState(0);
  const [browserInfo, setBrowserInfo] = useState<{ tz: string; browser: string; time: string; city: string }>({
    tz: 'Unknown', browser: 'Unknown', time: 'Unknown', city: 'Unknown'
  });

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const city = tz.split('/')[1]?.replace('_', ' ') || 'Unknown Location';
      const time = format(new Date(), 'HH:mm');
      
      let browser = 'Unknown';
      if (navigator.userAgent.includes('Chrome')) browser = 'Chrome';
      else if (navigator.userAgent.includes('Firefox')) browser = 'Firefox';
      else if (navigator.userAgent.includes('Safari')) browser = 'Safari';

      setBrowserInfo({ tz, browser, time, city });
    } catch (e) {
      // fallback silently
    }
  }, []);

  useEffect(() => {
    const sequence = [
      { delay: 500, stage: 1 }, // Establishing connection...
      { delay: 800, stage: 2 }, // Bypassing firewall...
      { delay: 600, stage: 3 }, // Access granted. Requesting access...
      { delay: 1200, stage: 4 }, // Target profile
      { delay: 1500, stage: 5 }, // RELAX
      { delay: 2000, stage: 6 }, // Done
    ];

    let currentDelay = 0;
    const timeouts: NodeJS.Timeout[] = [];

    sequence.forEach((step) => {
      currentDelay += step.delay;
      const timeout = setTimeout(() => {
        setStage(step.stage);
        if (step.stage === 6) {
          onComplete();
        }
      }, currentDelay);
      timeouts.push(timeout);
    });

    return () => timeouts.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-black text-primary font-mono p-6 sm:p-12 overflow-hidden select-none flex flex-col justify-end">
      {/* Fake scanline effect */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-10 opacity-20"></div>

      <div className="max-w-3xl space-y-2 text-sm sm:text-base relative z-20">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {">"} INIT SECURE CONNECTION...
        </motion.div>
        
        {stage >= 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {">"} ESTABLISHING CONNECTION... [OK]
          </motion.div>
        )}
        
        {stage >= 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {">"} BYPASSING FIREWALL... [SUCCESS]
          </motion.div>
        )}

        {stage >= 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
            <div className="border border-primary/30 bg-primary/5 p-4 rounded-md my-4 shadow-[0_0_15px_rgba(74,222,128,0.1)]">
              <div className="mb-2 uppercase font-bold text-primary/80">Permission Request</div>
              <div>Requesting access to: Location <span className="text-red-500">[DENIED — just kidding]</span></div>
              <div>Contacts <span className="text-muted-foreground">[N/A]</span></div>
              <div>Career History <span className="text-primary">[GRANTED]</span></div>
            </div>
          </motion.div>
        )}

        {stage >= 4 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mb-2 mt-4 text-primary/60">--- TARGET PROFILE IDENTIFIED ---</div>
            <div>Subject located: <span className="text-white">{browserInfo.city} ({browserInfo.tz})</span></div>
            <div>Browser: <span className="text-white">{browserInfo.browser}</span></div>
            <div>Local time: <span className="text-white">{browserInfo.time}</span></div>
            <div className="mt-2 text-primary/60">---------------------------------</div>
          </motion.div>
        )}

        {stage >= 5 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 text-xl sm:text-2xl font-bold text-white">
            RELAX. You clicked "view resume," not the other way around.
          </motion.div>
        )}

        <div className="mt-8">
          <span className="animate-pulse">_</span>
        </div>
      </div>

      <button 
        onClick={onComplete}
        className="absolute top-6 right-6 text-xs sm:text-sm text-primary/50 hover:text-primary underline z-30 tracking-widest uppercase transition-colors"
      >
        [ Skip Intro ]
      </button>
    </div>
  );
};

// --- File Explorer Components ---

const getIconForType = (type: FileType) => {
  switch (type) {
    case 'folder': return <Folder className="w-10 h-10 text-blue-400 fill-blue-400/20" />;
    case 'pdf': return <FileText className="w-10 h-10 text-red-400 fill-red-400/20" />;
    case 'json': return <FileJson className="w-10 h-10 text-yellow-400 fill-yellow-400/20" />;
    case 'code': return <FileCode className="w-10 h-10 text-green-400 fill-green-400/20" />;
    case 'vcf': return <FileText className="w-10 h-10 text-purple-400 fill-purple-400/20" />;
    case 'markdown': 
    default: return <FileText className="w-10 h-10 text-gray-400 fill-gray-400/20" />;
  }
};

const getSmallIconForType = (type: FileType) => {
  switch (type) {
    case 'folder': return <Folder className="w-5 h-5 text-blue-400 fill-blue-400/20" />;
    case 'pdf': return <FileText className="w-5 h-5 text-red-400 fill-red-400/20" />;
    case 'json': return <FileJson className="w-5 h-5 text-yellow-400 fill-yellow-400/20" />;
    case 'code': return <FileCode className="w-5 h-5 text-green-400 fill-green-400/20" />;
    case 'vcf': return <FileText className="w-5 h-5 text-purple-400 fill-purple-400/20" />;
    case 'markdown': 
    default: return <FileText className="w-5 h-5 text-gray-400 fill-gray-400/20" />;
  }
};

const FileExplorer = () => {
  const [currentPath, setCurrentPath] = useState<FileNode[]>([fileSystem]);
  const [activeFile, setActiveFile] = useState<FileNode | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredFile, setHoveredFile] = useState<FileNode | null>(null);

  const currentFolder = currentPath[currentPath.length - 1];

  // Initialize with README open if we are at root
  useEffect(() => {
    if (currentPath.length === 1 && !activeFile) {
      const readme = currentFolder.children?.find(f => f.id === 'readme');
      if (readme) {
        setActiveFile(readme);
      }
    }
  }, []);

  const handleNavigate = (folder: FileNode) => {
    setCurrentPath(prev => [...prev, folder]);
    setSearchQuery('');
  };

  const handleNavigateUp = () => {
    if (currentPath.length > 1) {
      setCurrentPath(prev => prev.slice(0, -1));
    }
  };

  const handleNavigateToBreadcrumb = (index: number) => {
    setCurrentPath(prev => prev.slice(0, index + 1));
  };

  const handleOpenFile = (file: FileNode) => {
    if (file.type === 'folder') {
      handleNavigate(file);
    } else if (file.isDownload) {
      // Simulate download
      const link = document.createElement('a');
      link.href = `data:text/plain;charset=utf-8,${encodeURIComponent('Mock Download')}`;
      link.download = file.name;
      link.click();
    } else {
      setActiveFile(file);
    }
  };

  const filteredFiles = useMemo(() => {
    let files = currentFolder.children || [];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      // Search only in current folder for simplicity, or could recursively search
      files = files.filter(f => 
        f.name.toLowerCase().includes(query) || 
        (f.content && f.content.toLowerCase().includes(query))
      );
    }
    return files;
  }, [currentFolder, searchQuery]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 sm:p-8 font-sans selection:bg-primary/30 overflow-hidden relative">
      
      {/* Background purely decorative */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(74,222,128,0.05),transparent_50%)] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-5xl h-[85vh] bg-card border border-border rounded-xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col z-10"
      >
        {/* Title Bar */}
        <div className="h-12 bg-secondary border-b border-border flex items-center px-4 justify-between select-none">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          
          <div className="text-xs font-medium text-muted-foreground flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            about_me.exe
          </div>
          
          <div className="w-16"></div> {/* Spacer for balance */}
        </div>

        {/* Toolbar */}
        <div className="h-14 border-b border-border bg-card/50 px-4 flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button 
              onClick={handleNavigateUp} 
              disabled={currentPath.length === 1}
              className="p-1.5 rounded-md hover:bg-secondary disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              disabled
              className="p-1.5 rounded-md hover:bg-secondary opacity-30 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Breadcrumbs */}
          <div className="flex-1 flex items-center gap-1 text-sm bg-secondary/50 rounded-md px-3 py-1.5 border border-border overflow-hidden">
            {currentPath.map((folder, idx) => (
              <React.Fragment key={folder.id}>
                <button 
                  onClick={() => handleNavigateToBreadcrumb(idx)}
                  className="hover:text-primary transition-colors truncate max-w-[120px]"
                >
                  {folder.name}
                </button>
                {idx < currentPath.length - 1 && <span className="text-muted-foreground/50">/</span>}
              </React.Fragment>
            ))}
          </div>

          <div className="relative w-48 hidden sm:block">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-md pl-9 pr-3 py-1.5 text-sm outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex items-center gap-1 border border-border rounded-md p-0.5 bg-secondary/50">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded-sm ${viewMode === 'grid' ? 'bg-secondary shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1 rounded-sm ${viewMode === 'list' ? 'bg-secondary shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden flex relative">
          
          {/* File Grid/List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6" onClick={() => setHoveredFile(null)}>
            {filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Search className="w-12 h-12 mb-4 opacity-20" />
                <p>No files found matching "{searchQuery}"</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4" : "flex flex-col gap-1"}>
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    onClick={(e) => { e.stopPropagation(); handleOpenFile(file); }}
                    onMouseEnter={() => setHoveredFile(file)}
                    className={`
                      group cursor-pointer rounded-lg transition-all
                      ${viewMode === 'grid' 
                        ? 'flex flex-col items-center gap-3 p-4 hover:bg-secondary/80' 
                        : 'flex items-center gap-4 p-2.5 hover:bg-secondary/80'
                      }
                      ${activeFile?.id === file.id ? 'bg-secondary/50 ring-1 ring-primary/30' : ''}
                    `}
                  >
                    <div className={viewMode === 'grid' ? '' : 'flex-shrink-0'}>
                      {viewMode === 'grid' ? getIconForType(file.type) : getSmallIconForType(file.type)}
                    </div>
                    
                    <div className={viewMode === 'grid' ? 'text-center' : 'flex-1 flex items-center justify-between'}>
                      <span className="text-sm font-medium line-clamp-2 break-all group-hover:text-primary transition-colors">
                        {file.name}
                      </span>
                      
                      {viewMode === 'list' && (
                        <div className="flex gap-8 text-xs text-muted-foreground hidden sm:flex">
                          <span className="w-24 text-right">{file.date}</span>
                          <span className="w-16 text-right">{file.type === 'folder' ? '--' : file.size}</span>
                        </div>
                      )}
                    </div>

                    {file.isDownload && viewMode === 'grid' && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 p-1 rounded-full text-primary">
                        <Download className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Properties Panel (Hover/Active) */}
          <AnimatePresence>
            {hoveredFile && viewMode === 'grid' && !activeFile && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute right-6 top-6 w-64 bg-secondary border border-border p-4 rounded-lg shadow-xl font-mono text-xs hidden md:block pointer-events-none"
              >
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                  <Info className="w-4 h-4 text-primary" />
                  <span className="font-bold text-foreground">Properties</span>
                </div>
                <div className="space-y-2 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Name:</span>
                    <span className="text-foreground truncate max-w-[120px]" title={hoveredFile.name}>{hoveredFile.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="text-foreground">{hoveredFile.type.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span className="text-foreground">{hoveredFile.type === 'folder' ? '12 items' : hoveredFile.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span className="text-foreground">{hoveredFile.date}</span>
                  </div>
                  {hoveredFile.id === 'readme' && (
                    <div className="mt-4 pt-2 border-t border-border text-primary">
                      {">"} Entry point. Start here.
                    </div>
                  )}
                  {hoveredFile.type === 'folder' && hoveredFile.id === 'trash' && (
                    <div className="mt-4 pt-2 border-t border-border text-red-400">
                      {">"} Highly radioactive.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preview Panel (Slide Over) */}
          <AnimatePresence>
            {activeFile && (
              <motion.div 
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute inset-y-0 right-0 w-full sm:w-1/2 md:w-[45%] bg-card border-l border-border shadow-2xl flex flex-col z-20"
              >
                <div className="h-14 border-b border-border bg-secondary/30 flex items-center justify-between px-4">
                  <div className="flex items-center gap-2">
                    {getSmallIconForType(activeFile.type)}
                    <span className="font-medium text-sm">{activeFile.name}</span>
                  </div>
                  <div className="flex gap-2">
                    {activeFile.isDownload && (
                      <button className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-primary transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => setActiveFile(null)}
                      className="p-1.5 hover:bg-red-500/20 rounded-md text-muted-foreground hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 bg-background/50">
                  {activeFile.type === 'markdown' && (
                    <div className="max-w-none space-y-4">
                      {/* Simple markdown parser for demo */}
                      {activeFile.content?.split('\n\n').map((paragraph, i) => {
                        if (paragraph.startsWith('## ')) {
                          return <h3 key={i} className="text-xl font-bold mt-6 mb-2 text-foreground">{paragraph.replace('## ', '')}</h3>;
                        }
                        if (paragraph.startsWith('# ')) {
                          return <h2 key={i} className="text-2xl font-bold mt-2 mb-4 text-primary">{paragraph.replace('# ', '')}</h2>;
                        }
                        if (paragraph.startsWith('- ')) {
                          return (
                            <ul key={i} className="list-disc pl-5 my-2 space-y-1 text-muted-foreground">
                              {paragraph.split('\n').map((item, j) => (
                                <li key={j}>{item.replace('- ', '')}</li>
                              ))}
                            </ul>
                          );
                        }
                        return <p key={i} className="text-muted-foreground leading-relaxed">{paragraph}</p>;
                      })}
                    </div>
                  )}
                  
                  {activeFile.type === 'json' && (
                    <div className="font-mono text-sm">
                      <pre className="text-green-400/90 whitespace-pre-wrap">
                        {activeFile.content}
                      </pre>
                    </div>
                  )}

                  {activeFile.type === 'code' && (
                    <div className="font-mono text-sm bg-black/50 p-4 rounded-md border border-border">
                      <pre className="text-red-400/90 whitespace-pre-wrap">
                        {activeFile.content}
                      </pre>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
        
        {/* Status Bar */}
        <div className="h-8 border-t border-border bg-secondary flex items-center px-4 justify-between text-xs text-muted-foreground font-mono select-none">
          <div>{currentFolder.children?.length || 0} items</div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> Connected</span>
          </div>
        </div>

      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [isHacked, setIsHacked] = useState(false);

  return (
    <>
      <AnimatePresence>
        {!isHacked && (
          <motion.div 
            key="intro"
            exit={{ opacity: 0, scale: 1.05 }} 
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="fixed inset-0 z-50"
          >
            <IntroSequence onComplete={() => setIsHacked(true)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Render explorer underneath so it's ready when intro fades */}
      <div className={isHacked ? 'opacity-100' : 'opacity-0'} style={{ transition: 'opacity 0.6s ease-in-out' }}>
        <FileExplorer />
      </div>
    </>
  );
}
