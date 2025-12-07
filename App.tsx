import React, { useState, createContext, useContext, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { 
  BookOpen, 
  Lightbulb, 
  Map, 
  Palette, 
  Code2, 
  ChevronRight, 
  Settings,
  Upload,
  Sparkles,
  Download,
  Copy,
  Terminal,
  Layout as LayoutIcon,
  Layers,
  FileText,
  Brain,
  RefreshCw,
  Edit2,
  File as FileIcon
} from 'lucide-react';
import { ProjectState, ProjectStep, ResearchDocument, NavItem } from './types';
import * as GeminiService from './services/geminiService';
import { MarkdownRenderer } from './components/MarkdownRenderer';

// --- Context Definition ---

interface ProjectContextType {
  state: ProjectState;
  addResearch: (file: File) => Promise<void>;
  updateIdea: (idea: string) => void;
  generateArtifact: (step: ProjectStep) => Promise<void>;
  resetProject: () => void;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("useProject must be used within ProjectProvider");
  return context;
};

// --- Initial State ---

const initialState: ProjectState = {
  title: "Untitled Project",
  currentStep: ProjectStep.IDEA,
  research: [],
  ideaInput: "",
  synthesizedIdea: "",
  prdOutput: "",
  roadmapOutput: "",
  designSystemOutput: "",
  codePromptOutput: "",
  isGenerating: false,
};

// --- Components ---

const SidebarLink = ({ item, isActive }: { item: NavItem, isActive: boolean }) => {
  return (
    <div 
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group border ${
        isActive 
          ? 'bg-forge-800 border-forge-700 text-forge-accent shadow-sm' 
          : 'border-transparent text-forge-muted hover:bg-forge-800 hover:text-forge-text'
      }`}
    >
      <item.icon className={`w-5 h-5 ${isActive ? 'text-forge-accent' : 'text-forge-600 group-hover:text-forge-text'}`} />
      <span className="font-medium text-sm">{item.label}</span>
      {isActive && <ChevronRight className="w-4 h-4 ml-auto text-forge-400" />}
    </div>
  );
};

const Header = () => (
  <header className="h-16 border-b border-forge-700 bg-forge-950 flex items-center justify-between px-8 sticky top-0 z-10">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-forge-accent flex items-center justify-center shadow-lg shadow-orange-500/20">
        <Sparkles className="w-5 h-5 text-white" />
      </div>
      <h1 className="font-bold text-xl tracking-tight text-forge-text">FORGE <span className="text-forge-muted font-normal">| AI Product Architect</span></h1>
    </div>
    <div className="flex items-center gap-4">
      <button className="p-2 text-forge-muted hover:text-forge-text transition-colors">
        <Settings className="w-5 h-5" />
      </button>
      <div className="h-8 w-8 rounded-full bg-forge-800 flex items-center justify-center text-xs font-bold border border-forge-700 text-forge-muted">
        PD
      </div>
    </div>
  </header>
);

// --- Pages ---

const IdeaPage = () => {
  const { state, updateIdea, generateArtifact } = useProject();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  const handleRefine = async () => {
    if (!state.ideaInput.trim()) return;
    await generateArtifact(ProjectStep.IDEA);
    setIsEditing(false);
  };

  const showInput = !state.synthesizedIdea || isEditing;

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-forge-text mb-2">The Spark</h2>
        <p className="text-forge-muted text-lg leading-relaxed">
          {showInput 
            ? "Everything starts with an idea. Describe what you want to build in as much detail as you have." 
            : "Your idea has been crystallized into a Product Vision. Review it before moving forward."}
        </p>
      </div>

      <div className="flex-1 flex flex-col min-h-0 mb-8 gap-6">
        {/* Input Area */}
        {showInput && (
          <div className="flex-1 flex flex-col">
            <div className="bg-forge-950 border border-forge-700 rounded-xl p-1 flex-1 flex flex-col shadow-sm focus-within:ring-2 focus-within:ring-forge-accent/50 transition-all">
                <div className="p-4 border-b border-forge-700 bg-forge-900/50 rounded-t-xl flex justify-between items-center">
                  <label className="text-sm font-semibold text-forge-500 uppercase tracking-wider flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Product Vision Input
                  </label>
                  <span className="text-xs text-forge-500">Markdown supported</span>
                </div>
                <textarea 
                  className="flex-1 w-full bg-forge-950 p-6 text-forge-text resize-none focus:outline-none placeholder-forge-400 leading-relaxed rounded-b-xl"
                  placeholder="Describe your idea...&#10;&#10;E.g., I want to build a fitness app for seniors that focuses on mobility and social connection. It should have large text, voice commands, and connect with Apple Watch..."
                  value={state.ideaInput}
                  onChange={(e) => updateIdea(e.target.value)}
                  autoFocus={!state.synthesizedIdea}
                />
            </div>
            
            <div className="flex justify-end mt-4">
              {state.synthesizedIdea && (
                 <button 
                  onClick={() => setIsEditing(false)}
                  className="mr-3 text-forge-muted hover:text-forge-text px-4 py-2 text-sm font-medium"
                >
                  Cancel
                </button>
              )}
              <button 
                onClick={handleRefine}
                disabled={!state.ideaInput.trim() || state.isGenerating}
                className="text-white bg-forge-accent hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-orange-500/20"
              >
                {state.isGenerating ? (
                  <>Thinking...</>
                ) : (
                  <>Refine & Synthesize <Sparkles className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Synthesized Result Area */}
        {!showInput && state.synthesizedIdea && (
          <div className="flex-1 flex flex-col min-h-0">
             <div className="bg-white border border-forge-700 rounded-xl flex flex-col flex-1 min-h-0 overflow-hidden shadow-sm ring-1 ring-forge-900">
                <div className="p-4 border-b border-forge-700 bg-orange-50 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-orange-800 font-semibold">
                      <Sparkles className="w-4 h-4" />
                      Product Vision Statement
                   </div>
                   <button 
                      onClick={() => setIsEditing(true)}
                      className="text-orange-700 hover:text-orange-900 text-xs font-medium flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit Original
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                   <MarkdownRenderer content={state.synthesizedIdea} />
                </div>
             </div>

             <div className="flex justify-end pt-6">
                <button 
                  onClick={() => navigate('/research')}
                  className="text-white bg-forge-text hover:bg-slate-700 px-6 py-3 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-lg"
                >
                  Next: Add Research <ChevronRight className="w-4 h-4" />
                </button>
              </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ResearchPage = () => {
  const { state, addResearch } = useProject();
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await addResearch(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number, isBase64: boolean) => {
    // Base64 is approx 1.33x larger than binary. Adjust if needed for display.
    const realBytes = isBase64 ? bytes * 0.75 : bytes;
    return (realBytes / 1024).toFixed(1) + ' KB';
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-forge-text mb-2">Research & Context</h2>
        <p className="text-forge-muted text-lg leading-relaxed">
          Upload knowledge (NotebookLM exports, PDFs, API docs) to ground the AI in your specific domain.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 flex-1 min-h-0">
        <div 
          className={`col-span-2 border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all bg-white ${isDragging ? 'border-forge-accent bg-orange-50' : 'border-forge-300 hover:border-forge-400 hover:bg-forge-50'}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={async (e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files[0]) await addResearch(e.dataTransfer.files[0]);
          }}
        >
          <div className="w-16 h-16 bg-forge-800 rounded-full flex items-center justify-center mb-4 border border-forge-700 shadow-sm">
            <Upload className="w-8 h-8 text-forge-accent" />
          </div>
          <h3 className="text-forge-text font-medium mb-1">Upload Research Files</h3>
          <p className="text-forge-muted text-sm text-center max-w-xs mb-6">
            Supports .pdf, .txt, .md, .json. <br/> Excellent for NotebookLM exports.
          </p>
          <label className="cursor-pointer bg-forge-900 hover:bg-forge-800 text-forge-text border border-forge-700 px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
            Browse Files
            <input type="file" className="hidden" accept=".pdf,.txt,.md,.json" onChange={handleFileChange} />
          </label>
        </div>

        <div className="bg-forge-950 border border-forge-700 rounded-xl p-6 flex flex-col shadow-sm">
          <h3 className="text-forge-text font-medium mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-forge-accent" />
            Active Sources
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {state.research.length === 0 ? (
              <div className="text-forge-500 text-sm text-center mt-10 italic">
                No files uploaded yet.<br/>
                Using only your idea input.
              </div>
            ) : (
              state.research.map((doc) => (
                <div key={doc.id} className="bg-forge-900 border border-forge-700 p-3 rounded-lg flex items-center justify-between group hover:border-forge-500 transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded bg-white border border-forge-700 flex items-center justify-center text-xs font-bold text-forge-500 uppercase">
                      {doc.mimeType === 'application/pdf' ? <FileIcon className="w-4 h-4" /> : 'TXT'}
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="text-sm text-forge-text truncate w-32 font-medium">{doc.name}</span>
                      <span className="text-xs text-forge-500">
                        {formatFileSize(doc.content.length, doc.mimeType === 'application/pdf')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-forge-700">
        <button 
          onClick={() => navigate('/prd')}
          className="text-white bg-forge-text hover:bg-slate-700 px-6 py-3 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-lg"
        >
          Next: Generate PRD <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const PrdPage = () => {
  const { state, generateArtifact } = useProject();
  const navigate = useNavigate();

  const handleGenerate = async () => {
    await generateArtifact(ProjectStep.PRD);
  };

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col animate-fade-in">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold text-forge-text mb-2">Product Requirements</h2>
          <p className="text-forge-muted">Synthesize your Idea and Research into a structured PRD.</p>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={state.isGenerating}
          className="bg-forge-accent hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"
        >
          {state.isGenerating ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Sparkles className="w-5 h-5" />}
          {state.prdOutput ? 'Regenerate PRD' : 'Generate PRD'}
        </button>
      </div>

      <div className="bg-forge-950 border border-forge-700 rounded-xl flex flex-col flex-1 min-h-0 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-forge-700 bg-forge-900/30 flex items-center justify-between">
          <span className="text-sm font-semibold text-forge-500 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4" />
            PRD Document
          </span>
          {state.prdOutput && (
              <button className="text-forge-500 hover:text-forge-text transition-colors" title="Copy">
                <Copy className="w-4 h-4" />
              </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
          {state.prdOutput ? (
            <MarkdownRenderer content={state.prdOutput} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-forge-muted">
              <div className="relative">
                <Brain className="w-16 h-16 mb-4 text-forge-300" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-forge-accent rounded-full animate-pulse"></div>
              </div>
              <p className="text-lg font-medium text-forge-text">Ready to Architect</p>
              <p className="text-sm text-forge-500 mt-2 max-w-md text-center">
                Click Generate to analyze your vision ({state.synthesizedIdea ? 'refined' : 'draft'}) and {state.research.length} research files.
              </p>
            </div>
          )}
        </div>
        {state.prdOutput && (
          <div className="p-4 border-t border-forge-700 bg-forge-900/30 flex justify-end">
            <button 
              onClick={() => navigate('/plan')}
              className="text-white bg-forge-text hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              Proceed to Planning <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const PlanningPage = () => {
  const { state, generateArtifact } = useProject();
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-forge-text mb-2">Implementation Roadmap</h2>
          <p className="text-forge-muted">Turn the PRD into a phased execution plan.</p>
        </div>
        <button 
          onClick={() => generateArtifact(ProjectStep.PLANNING)}
          disabled={state.isGenerating || !state.prdOutput}
          className="bg-forge-accent hover:bg-orange-600 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-lg shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"
        >
          {state.isGenerating ? "Thinking..." : "Generate Roadmap"}
        </button>
      </div>

      <div className="bg-forge-950 border border-forge-700 rounded-xl flex flex-col flex-1 min-h-0 overflow-hidden shadow-sm">
         <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
            {state.roadmapOutput ? (
              <MarkdownRenderer content={state.roadmapOutput} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-forge-muted">
                <Map className="w-12 h-12 mb-4 text-forge-300" />
                <p className="text-forge-text font-medium">Generate a roadmap to see the plan.</p>
                {!state.prdOutput && <p className="text-sm text-red-500 mt-2">Prerequisite: Generate PRD first.</p>}
              </div>
            )}
         </div>
         {state.roadmapOutput && (
            <div className="p-4 border-t border-forge-700 bg-forge-900/30 flex justify-end">
              <button 
                onClick={() => navigate('/design')}
                className="text-white bg-forge-text hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                Proceed to Design <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
      </div>
    </div>
  );
};

const DesignPage = () => {
  const { state, generateArtifact } = useProject();
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col animate-fade-in">
       <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-forge-text mb-2">Design Blueprint</h2>
          <p className="text-forge-muted">Establish the visual identity, components, and UX flow.</p>
        </div>
        <button 
          onClick={() => generateArtifact(ProjectStep.DESIGN)}
          disabled={state.isGenerating || !state.roadmapOutput}
          className="bg-forge-accent hover:bg-orange-600 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-lg shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"
        >
          {state.isGenerating ? "Designing..." : "Create Blueprint"}
        </button>
      </div>

      <div className="bg-forge-950 border border-forge-700 rounded-xl flex flex-col flex-1 min-h-0 overflow-hidden shadow-sm">
         <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
            {state.designSystemOutput ? (
              <MarkdownRenderer content={state.designSystemOutput} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-forge-muted">
                <Palette className="w-12 h-12 mb-4 text-forge-300" />
                <p className="text-forge-text font-medium">Design system will be rendered here.</p>
                {!state.roadmapOutput && <p className="text-sm text-red-500 mt-2">Prerequisite: Generate Roadmap first.</p>}
              </div>
            )}
         </div>
         {state.designSystemOutput && (
            <div className="p-4 border-t border-forge-700 bg-forge-900/30 flex justify-end">
              <button 
                onClick={() => navigate('/code')}
                className="text-white bg-forge-text hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                Proceed to Coding <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
      </div>
    </div>
  );
};

const CodePage = () => {
  const { state, generateArtifact } = useProject();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(state.codePromptOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col animate-fade-in">
       <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-forge-text mb-2">Engineering Prompt</h2>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => generateArtifact(ProjectStep.CODE)}
            disabled={state.isGenerating || !state.designSystemOutput}
            className="bg-forge-accent hover:bg-orange-600 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-lg shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"
          >
            {state.isGenerating ? "Compiling..." : "Generate Master Prompt"}
          </button>
        </div>
      </div>

      <div className="bg-forge-950 border border-forge-700 rounded-xl flex flex-col flex-1 min-h-0 overflow-hidden shadow-sm">
         <div className="p-4 border-b border-forge-700 bg-forge-900/30 flex items-center justify-between">
            <span className="text-sm font-semibold text-forge-500 uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              Master Prompt (Copy this to IDE)
            </span>
            {state.codePromptOutput && (
               <button 
                onClick={handleCopy}
                className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-transparent ${copied ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-forge-800 text-forge-text hover:bg-forge-200 border-forge-700'}`}
              >
                 {copied ? 'Copied!' : 'Copy to Clipboard'}
                 <Copy className="w-4 h-4" />
               </button>
            )}
          </div>
         <div className="flex-1 overflow-y-auto p-8 custom-scrollbar font-mono text-sm leading-relaxed bg-white">
            {state.codePromptOutput ? (
              <pre className="whitespace-pre-wrap text-forge-text font-mono">{state.codePromptOutput}</pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-forge-muted font-sans">
                <Code2 className="w-12 h-12 mb-4 text-forge-300" />
                <p className="text-forge-text font-medium">The final artifact will appear here.</p>
                {!state.designSystemOutput && <p className="text-sm text-red-500 mt-2">Prerequisite: Complete Design Step.</p>}
              </div>
            )}
         </div>
      </div>
    </div>
  );
};

// --- Layout ---

const Layout = () => {
  const location = useLocation();

  const navItems: NavItem[] = [
    { label: 'Idea', step: ProjectStep.IDEA, icon: Lightbulb, path: '/' },
    { label: 'Research', step: ProjectStep.RESEARCH, icon: BookOpen, path: '/research' },
    { label: 'PRD', step: ProjectStep.PRD, icon: FileText, path: '/prd' },
    { label: 'Planning', step: ProjectStep.PLANNING, icon: Layers, path: '/plan' },
    { label: 'Design', step: ProjectStep.DESIGN, icon: LayoutIcon, path: '/design' },
    { label: 'Code', step: ProjectStep.CODE, icon: Code2, path: '/code' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-forge-900 text-forge-text selection:bg-orange-100 selection:text-orange-900">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-forge-700 bg-forge-950 p-6 flex flex-col gap-2 hidden md:flex">
          <div className="text-xs font-bold text-forge-500 uppercase tracking-widest mb-4 px-4">Workflow</div>
          {navItems.map((item) => (
            <div key={item.path} onClick={() => window.location.hash = item.path} className="cursor-pointer">
              <SidebarLink 
                item={item} 
                isActive={location.pathname === item.path} 
              />
            </div>
          ))}
          
          <div className="mt-auto pt-6 border-t border-forge-700">
            <div className="bg-forge-800/50 p-4 rounded-xl border border-forge-700">
              <h4 className="font-medium text-forge-text text-sm mb-2">Pro Tip</h4>
              <p className="text-xs text-forge-muted leading-relaxed">
                Add NotebookLM exports in the Research tab to ground the model.
              </p>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-auto bg-forge-900 p-8 relative">
           {/* Mobile Nav Placeholder - hidden on md+ */}
           <div className="md:hidden mb-6 flex overflow-x-auto gap-2 pb-2">
             {navItems.map((item) => (
                <div key={item.path} onClick={() => window.location.hash = item.path} className={`
                   flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2
                   ${location.pathname === item.path ? 'bg-forge-accent text-white' : 'bg-white border border-forge-700 text-forge-muted'}
                `}>
                   <item.icon className="w-4 h-4" />
                   {item.label}
                </div>
             ))}
           </div>
           
           <div className="h-full">
            <Routes>
              <Route path="/" element={<IdeaPage />} />
              <Route path="/research" element={<ResearchPage />} />
              <Route path="/prd" element={<PrdPage />} />
              <Route path="/plan" element={<PlanningPage />} />
              <Route path="/design" element={<DesignPage />} />
              <Route path="/code" element={<CodePage />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
           </div>
        </main>
      </div>
    </div>
  );
};

// --- App Root & Provider ---

const App = () => {
  const [state, setState] = useState<ProjectState>(initialState);

  const addResearch = async (file: File) => {
    let content = "";
    let mimeType = file.type;

    if (file.type === 'application/pdf') {
       // Read as Base64 for PDF
       content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              const result = e.target.result as string;
              // Remove "data:application/pdf;base64," prefix
              resolve(result.split(',')[1]);
            } else {
              reject(new Error("Failed to read file"));
            }
          };
          reader.readAsDataURL(file);
       });
    } else {
       // Default to text for everything else (txt, md, json)
       content = await file.text();
       if (!mimeType) mimeType = 'text/plain';
    }

    const newDoc: ResearchDocument = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      content: content,
      mimeType: mimeType,
      source: 'upload'
    };
    setState(prev => ({ ...prev, research: [...prev.research, newDoc] }));
  };

  const updateIdea = (idea: string) => {
    setState(prev => ({ ...prev, ideaInput: idea }));
  };

  const generateArtifact = async (step: ProjectStep) => {
    setState(prev => ({ ...prev, isGenerating: true }));
    try {
      if (step === ProjectStep.IDEA) {
        // Synthesize Idea Step
        const result = await GeminiService.refineIdea(state.ideaInput);
        setState(prev => ({ ...prev, synthesizedIdea: result }));
      } else if (step === ProjectStep.PRD) {
        // Use synthesized idea if available, otherwise raw
        const inputIdea = state.synthesizedIdea || state.ideaInput;
        const result = await GeminiService.generatePRD(inputIdea, state.research);
        setState(prev => ({ ...prev, prdOutput: result }));
      } else if (step === ProjectStep.PLANNING) {
        const result = await GeminiService.generatePlan(state.prdOutput);
        setState(prev => ({ ...prev, roadmapOutput: result }));
      } else if (step === ProjectStep.DESIGN) {
        const result = await GeminiService.generateDesignSystem(state.prdOutput, state.roadmapOutput);
        setState(prev => ({ ...prev, designSystemOutput: result }));
      } else if (step === ProjectStep.CODE) {
        const result = await GeminiService.generateCodePrompt(state);
        setState(prev => ({ ...prev, codePromptOutput: result }));
      }
    } catch (error) {
      console.error("Generation failed:", error);
      alert("Failed to generate content. Please check your API key and try again.");
    } finally {
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const resetProject = () => {
    if(confirm("Are you sure? This will clear all progress.")) {
      setState(initialState);
    }
  };

  return (
    <ProjectContext.Provider value={{ state, addResearch, updateIdea, generateArtifact, resetProject }}>
      <HashRouter>
        <Layout />
      </HashRouter>
    </ProjectContext.Provider>
  );
};

export default App;