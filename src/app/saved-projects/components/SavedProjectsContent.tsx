'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  Plus,
  Search,
  Trash2,
  Heart,
  Eye,
  Edit3,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { useProjectStore } from '@/store/useProjectStore';
import type { SavedProject } from '@/features/mix-design/types';
import { getCentralizedMixStatus } from '@/features/mix-design/utils/status';

export default function SavedProjectsContent() {
  const { projects, deleteProject, toggleFavorite, fetchProjects, isLoading, error } = useProjectStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const favoriteCount = useMemo(() => projects.filter((p) => p.isFavorite).length, [projects]);

  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Filter by Favorites tab
    if (activeFilter === 'favorites') {
      result = result.filter((p) => p.isFavorite);
    }

    // Filter by Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          (p.input.projectDetails.projectName || '').toLowerCase().includes(q) ||
          (p.input.projectDetails.clientName || '').toLowerCase().includes(q) ||
          (p.input.designParameters.concreteGrade || '').toLowerCase().includes(q)
      );
    }

    // Sort by updatedAt DESC (fallback createdAt)
    result.sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();

      if (sortOrder === 'newest') {
        return timeB - timeA;
      } else if (sortOrder === 'oldest') {
        return timeA - timeB;
      } else if (sortOrder === 'name') {
        const nameA = a.input.projectDetails.projectName || '';
        const nameB = b.input.projectDetails.projectName || '';
        return nameA.localeCompare(nameB);
      }
      return 0;
    });

    return result;
  }, [projects, activeFilter, searchQuery, sortOrder]);

  const projectToDelete = useMemo(() => {
    return deleteConfirmId ? projects.find((p) => p.id === deleteConfirmId) : null;
  }, [deleteConfirmId, projects]);

  const handleDeleteConfirm = () => {
    if (deleteConfirmId) {
      deleteProject(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2 transition-colors font-mono-tech"
          >
            <ArrowLeft size={13} />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Project History</h1>
          <p className="text-xs text-muted-foreground font-mono-tech mt-0.5">
            Manage and inspect your concrete mix design project history and calculations.
          </p>
        </div>

        <Link
          href="/concrete-mix-design?mode=new"
          className="btn-primary flex items-center gap-2 flex-shrink-0 text-xs font-mono-tech font-bold"
        >
          <Plus size={16} />
          <span>Create New Mix Design</span>
        </Link>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* All vs Favorites Tabs */}
        <div className="flex items-center gap-1 bg-card border border-border rounded-sm p-1">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xs text-xs font-mono-tech font-bold transition-colors ${
              activeFilter === 'all'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Projects ({projects.length})
          </button>
          <button
            onClick={() => setActiveFilter('favorites')}
            className={`px-3 py-1.5 rounded-xs text-xs font-mono-tech font-bold transition-colors flex items-center gap-1.5 ${
              activeFilter === 'favorites'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Heart size={13} className={activeFilter === 'favorites' ? 'fill-current text-error' : 'text-muted-foreground'} />
            <span>Favorites ({favoriteCount})</span>
          </button>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-3 flex-1 md:max-w-md">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
              <Search size={14} />
            </div>
            <input
              type="text"
              className="w-full pl-9 pr-3 py-1.5 text-xs font-mono-tech bg-background border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              placeholder="Search by project, client, or grade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="px-2.5 py-1.5 text-xs font-mono-tech bg-background border border-border rounded-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
          >
            <option value="newest">Recently Updated</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Project Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Projects List View */}
      {isLoading ? (
        <div className="bg-card border border-border rounded-sm p-12 text-center space-y-3 font-mono-tech">
          <Loader2 size={24} className="animate-spin mx-auto text-primary" />
          <p className="text-xs text-muted-foreground">Loading Project History...</p>
        </div>
      ) : error ? (
        <div className="bg-card border border-error/40 bg-error/5 rounded-sm p-4 text-xs font-mono-tech text-error">
          {error}
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-card border border-border rounded-sm p-8 text-center">
          <EmptyState
            icon={<Clock size={28} className="text-muted-foreground/60" />}
            title="No projects in history yet"
            description="Create your first concrete mix design to see it stored in your project history."
            action={
              <Link href="/concrete-mix-design?mode=new" className="btn-primary mt-2 text-xs font-mono-tech font-bold">
                Create New Mix Design
              </Link>
            }
          />
        </div>
      ) : activeFilter === 'favorites' && favoriteCount === 0 ? (
        <div className="bg-card border border-border rounded-sm p-8 text-center space-y-3 font-mono-tech">
          <Heart size={32} className="mx-auto text-muted-foreground/40" />
          <p className="font-bold text-sm text-foreground">No favorite projects yet.</p>
          <p className="text-xs text-muted-foreground">
            Click the heart icon (♡) on any project card in your history to mark it as a favorite.
          </p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-card border border-border rounded-sm p-8 text-center text-xs font-mono-tech text-muted-foreground">
          No projects matching your search query.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProjects.map((project: SavedProject) => {
            const pd = project.input.projectDetails;
            const dp = project.input.designParameters;
            const result = project.result;
            const statusInfo = result ? getCentralizedMixStatus(result) : null;
            const isFav = project.isFavorite ?? false;

            return (
              <div
                key={project.id}
                className="bg-card border border-border rounded-sm shadow-xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/40 transition-all"
              >
                {/* Left Info Column */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {/* Heart Favorite Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      toggleFavorite(project.id);
                    }}
                    className="p-1 rounded-sm hover:bg-muted transition-colors flex-shrink-0 mt-0.5"
                    title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                    aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart
                      size={18}
                      className={isFav ? 'fill-error text-error' : 'text-muted-foreground/60 hover:text-error'}
                    />
                  </button>

                  <div className="space-y-1 min-w-0 flex-1 font-mono-tech">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-sm text-foreground truncate">
                        {pd.projectName || 'Untitled Mix Design Project'}
                      </h3>
                      {statusInfo && (
                        <span
                          className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border ${
                            statusInfo.status === 'COMPLIANT'
                              ? 'bg-success/15 text-success border-success/30'
                              : statusInfo.status === 'NON_COMPLIANT'
                              ? 'bg-error/15 text-error border-error/30'
                              : 'bg-warning/15 text-warning border-warning/30'
                          }`}
                        >
                          {statusInfo.heroBadge}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>Grade: <strong className="text-foreground">{dp.concreteGrade}</strong></span>
                      <span>• Exposure: <strong className="text-foreground capitalize">{dp.exposureCondition.replace('_', ' ')}</strong></span>
                      {pd.clientName && <span>• Client: <strong className="text-foreground">{pd.clientName}</strong></span>}
                      {result && result.mixRatioFineAggregate > 0 && (
                        <span>
                          • Ratio: <strong className="text-primary">1 : {result.mixRatioFineAggregate.toFixed(2)} : {result.mixRatioCoarseAggregate.toFixed(2)}</strong>
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-muted-foreground/80 flex items-center gap-3 pt-0.5">
                      <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                      <span>Updated: {new Date(project.updatedAt || project.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Right Action Column */}
                <div className="flex items-center gap-2 flex-shrink-0 font-mono-tech">
                  <Link
                    href={`/mix-design-results?projectId=${project.id}`}
                    className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                    title="View saved calculation trace"
                  >
                    <Eye size={13} />
                    <span>View</span>
                  </Link>
                  <Link
                    href={`/concrete-mix-design?projectId=${project.id}`}
                    className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 font-bold"
                    title="Edit project parameters"
                  >
                    <Edit3 size={13} />
                    <span>Edit</span>
                  </Link>
                  <button
                    onClick={() => setDeleteConfirmId(project.id)}
                    className="p-1.5 rounded-sm border border-border text-muted-foreground hover:text-error hover:border-error/40 hover:bg-error/10 transition-colors"
                    title="Delete project"
                    aria-label="Delete project"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs font-sans">
          <div className="bg-card border border-error/40 rounded-sm shadow-xl max-w-md w-full p-5 space-y-4 font-mono-tech">
            <div className="flex items-center gap-2 text-error pb-2 border-b border-border">
              <AlertTriangle size={18} />
              <h3 className="font-bold text-sm uppercase tracking-wider text-foreground">
                Delete Project Confirmation
              </h3>
            </div>

            <p className="text-xs text-foreground font-sans">
              Are you sure you want to delete <strong>{projectToDelete.input.projectDetails.projectName || 'Untitled Project'}</strong>?
              This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="btn-primary bg-error hover:bg-error/90 text-white border-error text-xs py-1.5 px-4 font-bold"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
