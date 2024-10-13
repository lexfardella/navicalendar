import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isAfter } from 'date-fns';
import { Task } from '../../types';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, AlertTriangle, Edit2, Trash2, Link, ExternalLink } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => Promise<void>;
  onUpdateTask: (updatedTask: Task) => void;
  view: 'day' | 'week';
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete, onUpdateTask, view }) => {
  const [expanded, setExpanded] = useState(false);

  const completedSteps = task.steps.filter(step => step.completed).length;
  const progress = task.steps.length > 0 ? (completedSteps / task.steps.length) * 100 : 0;

  const handleStepToggle = (stepId: number) => {
    const updatedSteps = task.steps.map(step => 
      step.id === stepId ? { ...step, completed: !step.completed } : step
    );
    onUpdateTask({ ...task, steps: updatedSteps });
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'bg-gradient-to-r from-red-500 to-pink-500';
      case 'medium': return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 'low': return 'bg-gradient-to-r from-green-400 to-emerald-500';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-500';
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'todo': return 'border-l-4 border-gray-300';
      case 'in-progress': return 'border-l-4 border-blue-400';
      case 'done': return 'border-l-4 border-green-400';
      default: return 'border-l-4 border-gray-300';
    }
  };

  const isOverdue = isAfter(new Date(), new Date(task.dueDate)) && task.status !== 'done';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "bg-white rounded-xl overflow-hidden transition-all duration-300",
        getStatusColor(task.status),
        expanded ? "shadow-lg" : "shadow-md",
        view === 'week' ? "p-4" : "p-5"
      )}
    >
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center space-x-4 flex-grow">
          <div className={cn("w-4 h-4 rounded-full", getPriorityColor(task.priority))} />
          <span className={cn(
            "font-semibold truncate",
            view === 'week' ? "text-sm" : "text-base",
            task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'
          )}>
            {task.title}
          </span>
        </div>
        <div className="flex items-center space-x-4 flex-shrink-0">
          {isOverdue && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <AlertTriangle size={20} className="text-red-500" />
            </motion.div>
          )}
          <span className="text-xs text-gray-500 font-medium">
            {format(new Date(task.dueDate), "MMM d, h:mm a")}
          </span>
          <motion.div
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronRight size={20} className="text-gray-400" />
          </motion.div>
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 space-y-4"
          >
            <p className="text-sm text-gray-600">{task.description}</p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{completedSteps}/{task.steps.length} steps completed</span>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm" onClick={() => onEdit(task)} className="hover:bg-blue-50 transition-colors duration-200">
                  <Edit2 size={16} className="text-blue-500" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(task.id)} className="hover:bg-red-50 transition-colors duration-200">
                  <Trash2 size={16} className="text-red-500" />
                </Button>
              </div>
            </div>
            <Progress value={progress} className="h-2 bg-gray-100" />
            <div className="space-y-3">
              {task.steps.map((step) => (
                <motion.div 
                  key={step.id} 
                  className="space-y-2 bg-gray-50 p-3 rounded-lg"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={step.completed}
                      onChange={() => handleStepToggle(step.id)}
                      className="form-checkbox h-5 w-5 text-blue-500 rounded border-gray-300 focus:ring-blue-500 transition-colors duration-200"
                    />
                    <span className={cn(
                      "text-sm",
                      step.completed ? "line-through text-gray-400" : "text-gray-700"
                    )}>
                      {step.content}
                    </span>
                  </div>
                  {step.resources && step.resources.length > 0 && (
                    <div className="ml-8 space-y-1">
                      {step.resources.map((resource, index) => (
                        <a
                          key={index}
                          href={resource}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-xs text-blue-500 hover:text-blue-600 transition-colors duration-200"
                        >
                          <Link size={12} />
                          <span className="truncate">{resource}</span>
                          <ExternalLink size={10} />
                        </a>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TaskCard;