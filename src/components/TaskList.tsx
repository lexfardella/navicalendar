import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from "@/components/ui/scroll-area";
import TaskCard from './TaskCard';
import { Task } from '../../types/index';
import { Calendar, Plus, ChevronRight, Mic, MessageSquare } from 'lucide-react';
import { format, startOfWeek, endOfWeek, isWithinInterval, startOfDay, endOfDay, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { Button } from "@/components/ui/button";

export interface TaskListProps {
  tasks: Task[];
  selectedDate: Date;
  activeView: 'day' | 'week';
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: number) => Promise<void>;
  onUpdateTask: (updatedTask: Task) => void;
  onAddTask: () => void;
  onChangeView: (view: 'day' | 'week', date: Date) => void;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  selectedDate,
  activeView,
  onEditTask,
  onDeleteTask,
  onUpdateTask,
  onAddTask,
  onChangeView,
}) => {
  const isDateInRange = (date: Date, start: Date, end: Date) => {
    return isWithinInterval(date, { start: startOfDay(start), end: endOfDay(end) });
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      if (activeView === 'day') {
        return isDateInRange(taskDate, selectedDate, selectedDate);
      } else if (activeView === 'week') {
        const weekStart = startOfWeek(selectedDate);
        const weekEnd = endOfWeek(selectedDate);
        return isWithinInterval(taskDate, { start: weekStart, end: weekEnd });
      }
      return true;
    });
  }, [tasks, selectedDate, activeView]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate);
    const end = endOfWeek(selectedDate);
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  const EmptyDayState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center h-full text-gray-500 py-2 px-4 text-center"
    >
      <motion.h3 
        className="text-2xl font-semibold mb-4 text-gray-700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Welcome to Navi!
      </motion.h3>
      <motion.p
        className="text-lg mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Tell Navi what you want to do through voice or text
      </motion.p>
      <motion.div
        className="bg-gray-100 rounded-lg p-6 max-w-md"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <h4 className="font-semibold mb-3 text-gray-700">Try saying or typing:</h4>
        <ul className="list-disc list-inside space-y-2 text-left">
          <li>"Schedule a team meeting at 4 PM"</li>
          <li>"Set a task for the product management interview today and provide resources for preparing"</li>
          <li>"Remind me to call Mom on her birthday next week"</li>
        </ul>
      </motion.div>
    </motion.div>
  );

  const CompactTaskCard: React.FC<{ task: Task }> = ({ task }) => (
    <div className={`p-2 mb-2 rounded-md text-xs ${getPriorityColor(task.priority)}`}>
      <div className="font-semibold truncate">{task.title}</div>
      <div className="text-gray-600">{format(new Date(task.dueDate), 'HH:mm')}</div>
    </div>
  );

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderTasks = (tasksToRender: Task[], view: 'day' | 'week') => (
    <AnimatePresence mode="wait">
      {tasksToRender.length > 0 ? (
        tasksToRender.map((task) => (
          <motion.div
            key={task.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            {view === 'day' ? (
              <TaskCard
                task={task}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onUpdateTask={onUpdateTask}
                view={view}
              />
            ) : (
              <CompactTaskCard task={task} />
            )}
          </motion.div>
        ))
      ) : view === 'day' ? (
        <EmptyDayState />
      ) : null}
    </AnimatePresence>
  );

  if (activeView === 'day') {
    return (
      <ScrollArea className="h-[calc(100vh-16rem)] px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-24"
        >
          {renderTasks(filteredTasks, 'day')}
        </motion.div>
      </ScrollArea>
    );
  }

  return (
    <div className="grid grid-cols-7 gap-4">
      {weekDays.map((day) => (
        <motion.div 
          key={day.toISOString()} 
          className="space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div 
            className={`text-sm font-medium cursor-pointer ${isSameMonth(day, selectedDate) ? 'text-gray-900' : 'text-gray-400'}`}
            onClick={() => onChangeView('day', day)}
          >
            <motion.div 
              className={`flex justify-between items-center mb-1 p-2 rounded-lg ${isToday(day) ? 'bg-blue-100' : ''}`}
              whileHover={{ scale: 1.05 }}
            >
              <span>{format(day, 'EEE')}</span>
              <span className={`text-lg ${isSameMonth(day, selectedDate) ? 'text-blue-500' : 'text-gray-400'}`}>
                {format(day, 'd')}
              </span>
            </motion.div>
          </div>
          <ScrollArea className="h-[calc(100vh-24rem)] border-t pt-2">
            {renderTasks(
              filteredTasks.filter((task) => isDateInRange(new Date(task.dueDate), day, day)),
              'week'
            )}
          </ScrollArea>
          {filteredTasks.filter((task) => isDateInRange(new Date(task.dueDate), day, day)).length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-blue-500 hover:text-blue-600"
              onClick={() => onChangeView('day', day)}
            >
              View All <ChevronRight size={16} />
            </Button>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default TaskList;