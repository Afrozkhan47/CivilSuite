'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Plus, Search, Trash2 } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import { useProjectStore } from '@/store/useProjectStore';

export default function SavedProjectsContent() {
  const { projects, deleteProject } = useProjectStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'name'>('newest');

  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        (p.input.projectDetails.projectName || '').toLowerCase().includes(q) ||
        (p.input.projectDetails.clientName || '').toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortOrder === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortOrder === 'name') {
        const nameA = a.input.projectDetails.projectName || '';
        const nameB = b.input.projectDetails.projectName || '';
        return nameA.localeCompare(nameB);
      }
      return 0;
    });

    return result;
  }, [projects, searchQuery, sortOrder]);

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            <ArrowLeft size={13} />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Saved Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your concrete mix design projects and calculations.
          </p>
        </div>
        
        <Link href="/concrete-mix-design" className="btn-primary flex items-center gap-2 flex-shrink-0">
          <Plus size={16} />
          New Mix Design
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search size={16} className="text-muted-foreground" />
          </div>
          <input
            type="text"
            className="input-field pl-9"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <select 
            className="input-field max-w-[160px]"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Project Name (A-Z)</option>
          </select>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="card-base">
          <EmptyState
            icon={<Clock size={28} className="text-muted-foreground/60" />}
            title="No projects found"
            description="You haven't saved any concrete mix design projects yet."
            action={
              <Link href="/concrete-mix-design" className="btn-primary mt-2">
                Create your first project
              </Link>
            }
          />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="card-base text-center py-12 text-muted-foreground">
          No projects matching your search.
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredProjects.map((project: any) => (
            <div key={project.id} className="card-base card-hover p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-foreground truncate">{project.input.projectDetails.projectName || 'Untitled Project'}</h3>
                  <StatusBadge 
                    variant={project.status} 
                    label={project.status.charAt(0).toUpperCase() + project.status.slice(1)} 
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1 truncate">
                  Grade: {project.input.designParameters.concreteGrade} • 
                  Created: {new Date(project.createdAt).toLocaleDateString()}
                  {project.input.projectDetails.clientName && ` • Client: ${project.input.projectDetails.clientName}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/concrete-mix-design?projectId=${project.id}`} className="btn-secondary text-sm px-3 py-1.5 flex items-center gap-1.5">
                  View / Edit
                </Link>
                <button 
                  onClick={() => deleteProject(project.id)}
                  className="btn-ghost text-error hover:bg-error/10 p-2"
                  title="Delete project"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
