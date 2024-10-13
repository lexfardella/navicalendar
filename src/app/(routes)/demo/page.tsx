"use client"

import React, { useState, useCallback, useMemo } from 'react';
import { startOfDay, addDays, subDays, format, isSameDay, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, LayoutGrid, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import TaskList from '@/components/TaskList';
import AddEditTaskDialog from '@/components/AddEditTaskDialog';
import AIInputField from '@/components/AIInputField';
import RequestPremium from '@/components/RequestPremium';

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Task, ConversationEntry, AIResponse, TaskStatus } from '../../../../types';
import Link from 'next/link';

const MAX_TASKS = 10;

const Home: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeView, setActiveView] = useState<'day' | 'week'>('day');
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const { toast } = useToast();

  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const isTaskLimitReached = tasks.length >= MAX_TASKS;

  const addTask = useCallback((task: Task) => {
    if (isTaskLimitReached) {
      toast({
        title: "Task Limit Reached",
        description: `You've reached the maximum limit of ${MAX_TASKS} tasks. Please complete or remove existing tasks before adding new ones.`,
        variant: "destructive",
      });
      return;
    }

    setTasks(prevTasks => {
      const newTask = {
        ...task,
        id: Date.now()
      };
      toast({
        title: "Task Created",
        description: `"${newTask.title}" has been added to your tasks.`,
      });
      return [...prevTasks, newTask];
    });
  }, [toast, isTaskLimitReached]);

  const updateTask = useCallback((updatedTask: Task) => {
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === updatedTask.id) {
        const steps = updatedTask.steps || [];
        const completedSteps = steps.filter(step => step.completed).length;
        const totalSteps = steps.length;
        let newStatus: TaskStatus;
  
        if (completedSteps === 0) {
          newStatus = 'todo';
        } else if (completedSteps === totalSteps) {
          newStatus = 'done';
        } else {
          newStatus = 'in-progress';
        }
  
        const finalTask = { 
          ...updatedTask, 
          status: newStatus
        };
        toast({
          title: "Task Updated",
          description: `Changes to "${finalTask.title}" have been saved.`,
        });
        return finalTask;
      }
      return task;
    }));
  }, [toast]);

  const deleteTask = useCallback(async (taskId: number) => {
    setTasks(prevTasks => {
      const taskToDelete = prevTasks.find(task => task.id === taskId);
      if (taskToDelete) {
        toast({
          title: "Task Deleted",
          description: `"${taskToDelete.title}" has been removed from your tasks.`,
          variant: "destructive",
        });
      }
      return prevTasks.filter(task => task.id !== taskId);
    });
  }, [toast]);

  const handleAddTask = useCallback(() => {
    if (isTaskLimitReached) {
      toast({
        title: "Task Limit Reached",
        description: `You've reached the maximum limit of ${MAX_TASKS} tasks. Please complete or remove existing tasks before adding new ones.`,
        variant: "destructive",
      });
      return;
    }
    setIsAddingTask(true);
  }, [isTaskLimitReached, toast]);

  const handleViewChange = (newView: 'day' | 'week', date: Date) => {
    setActiveView(newView);
    setSelectedDate(date);
  };

  const handleAIRequest = async (input: string): Promise<AIResponse> => {
    setIsAIProcessing(true);
    const userEntry: ConversationEntry = {
      id: Date.now(),
      text: input,
      timestamp: new Date(),
      isAI: false
    };
    setConversation(prev => [...prev, userEntry]);
  
    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input, taskList: tasks, userTimeZone }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to process AI request');
      }
  
      const aiResponse: AIResponse = await response.json();
  
      if (aiResponse.success && aiResponse.data) {
        switch (aiResponse.data.action) {
          case "create_task":
            if (isTaskLimitReached) {
              const limitMessage = `I'm sorry, but you've reached the maximum limit of ${MAX_TASKS} tasks. Please complete or remove existing tasks before adding new ones.`;
              setConversation(prev => [...prev, {
                id: Date.now() + 1,
                text: limitMessage,
                timestamp: new Date(),
                isAI: true
              }]);
              return aiResponse;
            }
            if (aiResponse.data.task) {
              const newTask: Task = {
                ...aiResponse.data.task,
                id: Date.now()
              };
              addTask(newTask);
              const createMessage = `
                Task created: ${newTask.title}
                Due Date: ${format(new Date(newTask.dueDate), 'PPP')}
                Priority: ${newTask.priority}
                Status: ${newTask.status}
              `;
              setConversation(prev => [...prev, {
                id: Date.now() + 1,
                text: createMessage,
                timestamp: new Date(),
                isAI: true
              }]);
            } else {
              throw new Error('Task creation data is missing');
            }
            break;
          case "modify_task":
            if (aiResponse.data.task && typeof aiResponse.data.task.id === 'number') {
              const modifiedTask: Task = {
                ...aiResponse.data.task
              };
              updateTask(modifiedTask);
              const modifyMessage = `
                Task modified: ${modifiedTask.title || 'Untitled'}
                Due Date: ${format(new Date(modifiedTask.dueDate), 'PPP')}
                Priority: ${modifiedTask.priority || 'Not specified'}
                Status: ${modifiedTask.status || 'Not specified'}
              `;
              setConversation(prev => [...prev, {
                id: Date.now() + 1,
                text: modifyMessage,
                timestamp: new Date(),
                isAI: true
              }]);
            } else {
              throw new Error('Task modification data is missing or invalid');
            }
            break;
          case "delete_task":
            if (aiResponse.data.deletedTask) {
              const taskToDelete = tasks.find(task => 
                task.title.toLowerCase() === aiResponse.data!.deletedTask!.title.toLowerCase()
              );
              if (taskToDelete) {
                deleteTask(taskToDelete.id);
                const deleteMessage = `Task "${taskToDelete.title}" has been deleted.`;
                setConversation(prev => [...prev, {
                  id: Date.now() + 1,
                  text: deleteMessage,
                  timestamp: new Date(),
                  isAI: true
                }]);
              } else {
                const notFoundMessage = `Could not find a task with the title "${aiResponse.data.deletedTask.title}" to delete.`;
                setConversation(prev => [...prev, {
                  id: Date.now() + 1,
                  text: notFoundMessage,
                  timestamp: new Date(),
                  isAI: true
                }]);
              }
            } else {
              throw new Error('Task deletion data is missing');
            }
            break;
          case "query":
            setConversation(prev => [...prev, {
              id: Date.now() + 1,
              text: aiResponse.data!.response || aiResponse.message,
              timestamp: new Date(),
              isAI: true
            }]);
            break;
          default:
            throw new Error('Unknown action type');
        }
      } else {
        throw new Error(aiResponse.message || 'Unknown error occurred');
      }
  
      return aiResponse;
    } catch (error) {
      console.error('Error processing AI request:', error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      const errorEntry: ConversationEntry = {
        id: Date.now() + 1,
        text: `Sorry, I encountered an error while processing your request: ${errorMessage}`,
        timestamp: new Date(),
        isAI: true
      };
      setConversation(prev => [...prev, errorEntry]);
  
      toast({
        title: "Error",
        description: `An error occurred: ${errorMessage}`,
        variant: "destructive",
      });
  
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsAIProcessing(false);
    }
  };

  const handleDateChange = (direction: 'prev' | 'next') => {
    setSelectedDate(prevDate => {
      if (activeView === 'day') {
        return direction === 'prev' ? subDays(prevDate, 1) : addDays(prevDate, 1);
      } else {
        return direction === 'prev' ? subDays(prevDate, 7) : addDays(prevDate, 7);
      }
    });
  };

  const dateRangeText = useMemo(() => {
    if (activeView === 'day') {
      return format(selectedDate, 'EEEE, MMMM d');
    } else {
      const weekStart = startOfWeek(selectedDate);
      const weekEnd = endOfWeek(selectedDate);
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    }
  }, [selectedDate, activeView]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900 flex flex-col font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className='flex flex-col'>
              <Link href="/">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Navi</h1>
              </Link>
              <p className="text-sm text-gray-600">The AI-powered calendar you can talk to</p>
            </div>
            <div className='flex space-x-6'>
              <RequestPremium />
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddTask}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition duration-300"
                disabled={isTaskLimitReached}
              >
                <Plus size={20} className="mr-2" />
                New Task
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-grow p-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-0">
              <div className="flex justify-between items-center bg-white p-4">
                <div className="flex items-center space-x-4">
                  <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'day' | 'week')}>
                    <TabsList className="bg-gray-100">
                      <TabsTrigger value="day" className="data-[state=active]:bg-gradient-to-r from-blue-600 to-purple-600 data-[state=active]:text-white transition-all duration-300">
                        <CalendarIcon size={16} className="mr-2" />Day
                      </TabsTrigger>
                      <TabsTrigger value="week" className="data-[state=active]:bg-gradient-to-r from-blue-600 to-purple-600 data-[state=active]:text-white transition-all duration-300">
                        <LayoutGrid size={16} className="mr-2" />Week
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => handleDateChange('prev')}>
                    <ChevronLeft size={20} />
                  </Button>
                  <h2 className="text-lg font-medium w-48 text-center">{dateRangeText}</h2>
                  <Button variant="ghost" size="icon" onClick={() => handleDateChange('next')}>
                    <ChevronRight size={20} />
                  </Button>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedDate(new Date())}
                  className={isSameDay(selectedDate, new Date()) ? "bg-blue-100" : ""}
                >
                  Today
                </Button>
              </div>
            </CardContent>
          </Card>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TaskList
                tasks={tasks}
                selectedDate={selectedDate}
                activeView={activeView}
                onEditTask={setEditingTask}
                onDeleteTask={deleteTask}
                onUpdateTask={updateTask}
                onAddTask={handleAddTask}
                onChangeView={handleViewChange}
              />
            </motion.div>
          </AnimatePresence>
          </div>
      </main>
      <footer className="fixed bottom-0 left-0 right-0 bg-white shadow-lg z-10">
        <div className="max-w-5xl mx-auto p-4">
          <AIInputField 
            onSubmit={handleAIRequest} 
            conversation={conversation} 
            isProcessing={isAIProcessing}
          />
        </div>
      </footer>
      <AnimatePresence>
        {(isAddingTask || editingTask) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            >
              <AddEditTaskDialog
                task={editingTask}
                onClose={() => {
                  setIsAddingTask(false);
                  setEditingTask(null);
                }}
                onSave={(task) => {
                  if (editingTask) {
                    updateTask(task);
                  } else {
                    if (!isTaskLimitReached) {
                      addTask(task);
                    } else {
                      toast({
                        title: "Task Limit Reached",
                        description: `You've reached the maximum limit of ${MAX_TASKS} tasks. Please complete or remove existing tasks before adding new ones.`,
                        variant: "destructive",
                      });
                    }
                  }
                  setIsAddingTask(false);
                  setEditingTask(null);
                }}
                taskList={tasks}
                userTimeZone={userTimeZone}
                isTaskLimitReached={isTaskLimitReached}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <Toaster />
    </div>
  );
};

export default Home;