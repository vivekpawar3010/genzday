import React from 'react';
import { TaskItem as TaskItemType } from '../../types/index';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: TaskItemType[];
  onUpdateTask: (id: string, updates: Partial<TaskItemType>) => void;
  onDeleteTask: (id: string) => void;
  title: string;
  isOverdueSection?: boolean;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, onUpdateTask, onDeleteTask, title, isOverdueSection }) => {
  return (
    <div className={`content-card p-6 sm:p-8 shadow-xl mb-8 ${isOverdueSection ? 'border-l-4 border-l-red-500' : ''}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className={`text-sm font-black uppercase tracking-[0.2em] ${isOverdueSection ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>{title}</h3>
        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${isOverdueSection ? 'bg-red-500/10 text-red-500' : 'bg-[var(--accent)]/10 text-[var(--accent)]'}`}>
          {tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'}
        </span>
      </div>
      
      <div className="space-y-3">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskItem 
              key={task.id} 
              task={task} 
              onUpdate={onUpdateTask} 
              onDelete={onDeleteTask}
              isOverdue={isOverdueSection}
            />
          ))
        ) : (
          <div className="py-12 text-center opacity-30">
            <p className="text-[10px] font-black uppercase tracking-widest">No tasks for this section</p>
          </div>
        )}
      </div>
    </div>
  );
};
