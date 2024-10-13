// types/index.ts

// Task-related types
export interface Task {
  id: number;
  title: string;
  description: string;
  steps: TaskStep[];
  status: TaskStatus;
  priority: Priority;
  dueDate: Date;
}

export interface TaskStep {
  id: number;
  content: string;
  completed: boolean;
  resources?: string[]; // New optional field for resources
}

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export type Priority = 'low' | 'medium' | 'high';

// Conversation-related types
export interface ConversationEntry {
  id: number;
  text: string;
  timestamp: Date;
  isAI: boolean;
}

// UI-related types
export interface HeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  setIsAddingTask: () => void;
}

export interface TaskListProps {
  tasks: Task[];
  searchTerm: string;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: number) => void;
  onUpdateTask: (updatedTask: Task) => void;
}

export interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onUpdateTask: (updatedTask: Task) => void;
}

export interface AddEditTaskDialogProps {
  task: Task | null;
  onClose: () => void;
  onSave: (task: Task) => void;
  taskList: Task[];
  userTimeZone: string;  // Add this line
  isTaskLimitReached: boolean;
}

export interface VoiceCommandButtonProps {
  isListening: boolean;
  handleVoiceCommand: () => void;
}

export interface ConversationHistoryDialogProps {
  conversation: ConversationEntry[];
}

export interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export type AICommandType = 'create_task' | 'delete_task' | 'modify_task' | 'query';

export interface AIResponse {
  success: boolean;
  message: string;
  data?: {
    action: AICommandType;
    task?: Task;
    deletedTask?: {
      id: number;
      title: string;
    };
    aiInterpretation?: {
      originalInput: string;
      parsedDueDate?: string;
      formattedDueDate?: string;
    };
    response?: string;
  };
}

export interface AIAssistantHookResult {
  processCommand: (command: string) => Promise<string>;
  isProcessing: boolean;
  error: string | null;
}

export interface UseAIAssistantProps {
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: number) => void;
}

export interface InputSectionProps {
  isListening: boolean;
  handleVoiceCommand: () => void;
  handleAICommand: (command: string) => Promise<void>;
  isProcessing: boolean;
}