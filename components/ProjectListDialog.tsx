import React from 'react';
import { Folder, Plus, Trash2, X, Clock } from 'lucide-react';
import { ProjectMetadata } from '../types';

interface ProjectListDialogProps {
    isOpen: boolean;
    onClose: () => void;
    projects: ProjectMetadata[];
    onSelect: (projectId: string) => void;
    onSelect: (projectId: string) => void;
    onCreate: (title: string) => void;
    onDelete: (projectId: string) => void;
    isLoading: boolean;
    currentProjectId?: string;
}

export const ProjectListDialog = ({
    isOpen,
    onClose,
    projects,
    onSelect,
    onCreate,
    onDelete,
    isLoading,
    currentProjectId
}: ProjectListDialogProps) => {
    const [isCreating, setIsCreating] = React.useState(false);
    const [newProjectTitle, setNewProjectTitle] = React.useState("");

    if (!isOpen) return null;

    const handleCreate = () => {
        if (newProjectTitle.trim()) {
            onCreate(newProjectTitle);
            setNewProjectTitle("");
            setIsCreating(false);
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-forge-900 border border-forge-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-forge-700 flex items-center justify-between bg-forge-950">
                    <div>
                        <h2 className="text-xl font-bold text-forge-text">My Projects</h2>
                        <p className="text-sm text-forge-muted mt-1">Manage your design workspaces ({projects.length}/5 used)</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-forge-muted hover:text-forge-text hover:bg-forge-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forge-accent"></div>
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-forge-800 rounded-xl bg-forge-800/20">
                            <Folder className="w-12 h-12 text-forge-600 mx-auto mb-4" />
                            <p className="text-forge-text font-medium">No projects yet</p>
                            <p className="text-forge-muted text-sm mt-1">Create your first project to get started</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {projects.map((project) => (
                                <div
                                    key={project.id}
                                    className={`group flex items-center justify-between p-4 rounded-xl border transition-all ${currentProjectId === project.id
                                        ? 'bg-forge-800 border-forge-accent/50 shadow-sm'
                                        : 'bg-forge-950 border-forge-800 hover:border-forge-600 hover:shadow-md'
                                        }`}
                                >
                                    <div
                                        onClick={() => onSelect(project.id)}
                                        className="flex-1 cursor-pointer"
                                    >
                                        <h3 className={`font-semibold mb-1 ${currentProjectId === project.id ? 'text-forge-accent' : 'text-forge-text group-hover:text-forge-accent transition-colors'}`}>
                                            {project.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-forge-500">
                                            <Clock className="w-3 h-3" />
                                            <span>Last edited: {formatDate(project.updatedAt)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {currentProjectId === project.id && (
                                            <span className="text-xs font-bold bg-forge-accent/10 text-forge-accent px-2 py-1 rounded-full mr-2">
                                                Active
                                            </span>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
                                            className="p-2 text-forge-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete Project"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-forge-700 bg-forge-950">
                    {!isCreating ? (
                        <div className="flex justify-end">
                            <button
                                onClick={() => setIsCreating(true)}
                                disabled={projects.length >= 5 || isLoading}
                                className="bg-forge-accent hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                {projects.length >= 5 ? 'Limit Reached' : 'New Project'}
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 animate-fade-in">
                            <input
                                type="text"
                                value={newProjectTitle}
                                onChange={(e) => setNewProjectTitle(e.target.value)}
                                placeholder="Enter project name..."
                                className="flex-1 bg-forge-900 text-forge-text border border-forge-700 rounded-xl px-4 py-3 focus:outline-none focus:border-forge-accent"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newProjectTitle.trim()) handleCreate();
                                    if (e.key === 'Escape') setIsCreating(false);
                                }}
                            />
                            <button
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-3 text-forge-muted hover:text-forge-text font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={!newProjectTitle.trim() || isLoading}
                                className="bg-forge-accent hover:bg-orange-600 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-orange-500/20 transition-all"
                            >
                                Create
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
