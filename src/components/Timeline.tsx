import React from 'react';
import { motion } from 'framer-motion';
import { Task, Event } from '../../types/index';
import { format } from 'date-fns';
import { CheckSquare, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface TimelineProps {
  tasks: Task[];
  events: Event[];
  isExpanded: boolean;
  toggleTimeline: () => void;
}

const Timeline: React.FC<TimelineProps> = ({ tasks, events, isExpanded, toggleTimeline }) => {
  const combinedItems = [...tasks, ...events].sort((a, b) => {
    const dateA = 'dueDate' in a ? a.dueDate : a.start;
    const dateB = 'dueDate' in b ? b.dueDate : b.start;
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <motion.div
      className={`fixed top-0 right-0 h-full bg-white shadow-lg z-50 overflow-y-auto ${
        isExpanded ? 'w-80' : 'w-12'
      }`}
      initial={false}
      animate={{ width: isExpanded ? 320 : 48 }}
      transition={{ duration: 0.3 }}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-2"
        onClick={toggleTimeline}
      >
        {isExpanded ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
      </Button>
      {isExpanded && (
        <div className="p-4 mt-12">
          <h2 className="text-xl font-semibold mb-4">Timeline</h2>
          <div className="space-y-4">
            {combinedItems.map((item, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {'steps' in item ? (
                    <CheckSquare size={20} className="text-blue-500" />
                  ) : (
                    <Calendar size={20} className="text-green-500" />
                  )}
                </div>
                <div className="flex-grow">
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="text-sm text-gray-500">
                    {('dueDate' in item
                      ? `Due: ${format(item.dueDate, 'MMM d, h:mm a')}`
                      : `${format(item.start, 'MMM d, h:mm a')} - ${format(item.end, 'h:mm a')}`
                    )}
                  </p>
                  {'description' in item && (
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Timeline;