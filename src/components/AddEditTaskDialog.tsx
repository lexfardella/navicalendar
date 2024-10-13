import React, { useState, useEffect } from 'react';
import { parseISO, isValid, format } from 'date-fns';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Task, TaskStep, Priority, TaskStatus, AIResponse, AddEditTaskDialogProps, AICommandType } from '../../types/index';
import { X, Wand, Plus, Link, Trash2 } from 'lucide-react';

const AddEditTaskDialog: React.FC<AddEditTaskDialogProps> = ({ task, onClose, onSave, taskList, isTaskLimitReached }) => {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<Priority>(task?.priority || 'medium');
  const [dueDate, setDueDate] = useState(() => {
    if (task?.dueDate) {
      return format(new Date(task.dueDate), "yyyy-MM-dd'T'HH:mm");
    }
    return '';
  });
  const [steps, setSteps] = useState<TaskStep[]>(task?.steps || []);
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'todo');
  const [error, setError] = useState('');

  useEffect(() => {
    ensureCompletionStep();
  }, []);

  const ensureCompletionStep = () => {
    const completionStep = steps.find(step => step.content === 'Complete task');
    if (!completionStep) {
      setSteps([...steps, { id: Date.now(), content: 'Complete task', completed: false, resources: [] }]);
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!isValid(parseISO(dueDate))) {
      setError('Invalid due date');
      return;
    }

    ensureCompletionStep();

    const updatedTask: Task = {
      id: task?.id || Date.now(),
      title: title.trim(),
      description,
      steps,
      status,
      priority,
      dueDate: new Date(dueDate),
    };
    onSave(updatedTask);
    onClose();
  };

  const addStep = () => {
    const newStep: TaskStep = { id: Date.now(), content: '', completed: false, resources: [] };
    setSteps([...steps.slice(0, -1), newStep, steps[steps.length - 1]]);
  };

  const removeStep = (id: number) => {
    setSteps(steps.filter(step => step.id !== id && step.content !== 'Complete task'));
    ensureCompletionStep();
  };

  const updateStep = (id: number, content: string) => {
    setSteps(steps.map(step => step.id === id ? { ...step, content } : step));
  };

  const addResource = (stepId: number) => {
    setSteps(steps.map(step => 
      step.id === stepId 
        ? { ...step, resources: [...(step.resources || []), ''] } 
        : step
    ));
  };

  const updateResource = (stepId: number, index: number, value: string) => {
    setSteps(steps.map(step => 
      step.id === stepId 
        ? { ...step, resources: step.resources?.map((res, i) => i === index ? value : res) } 
        : step
    ));
  };

  const removeResource = (stepId: number, index: number) => {
    setSteps(steps.map(step => 
      step.id === stepId 
        ? { ...step, resources: step.resources?.filter((_, i) => i !== index) } 
        : step
    ));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Add New Task'}</DialogTitle>
        </DialogHeader>
        {!task && isTaskLimitReached && (
          <Alert variant="destructive">
            <AlertDescription>
              You've reached the maximum limit of tasks. Please complete or remove existing tasks before adding new ones.
            </AlertDescription>
          </Alert>
        )}
        <div className="flex-grow flex gap-6 py-4 overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto pr-4">
            <div>
              <label htmlFor="title" className="text-sm font-medium">Title</label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label htmlFor="description" className="text-sm font-medium">Description</label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="priority" className="text-sm font-medium">Priority</label>
                <Select value={priority} onValueChange={(value: Priority) => setPriority(value)}>
                  <SelectTrigger id="priority" className="mt-1">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="status" className="text-sm font-medium">Status</label>
                <Select value={status} onValueChange={(value: TaskStatus) => setStatus(value)}>
                  <SelectTrigger id="status" className="mt-1">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label htmlFor="dueDate" className="text-sm font-medium">Due Date</label>
              <Input 
                id="dueDate" 
                type="datetime-local" 
                value={dueDate} 
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex-1 overflow-hidden flex flex-col">
            <label className="text-sm font-medium mb-1">Steps</label>
            <ScrollArea className="flex-grow pr-4">
              <div className="space-y-4">
                {steps.map((step) => (
                  <div key={step.id} className="space-y-2 border p-2 rounded">
                    <div className="flex items-center space-x-2">
                      <Input
                        value={step.content}
                        onChange={(e) => updateStep(step.id, e.target.value)}
                        placeholder="Enter step description"
                        disabled={step.content === 'Complete task'}
                      />
                      {step.content !== 'Complete task' && (
                        <Button variant="ghost" size="icon" onClick={() => removeStep(step.id)}>
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                    {step.content !== 'Complete task' && (
                      <div className="space-y-2">
                        {step.resources?.map((resource, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Link size={16} className="text-gray-400 flex-shrink-0" />
                            <Input
                              value={resource}
                              onChange={(e) => updateResource(step.id, index, e.target.value)}
                              placeholder="Enter resource URL"
                            />
                            <Button variant="ghost" size="icon" onClick={() => removeResource(step.id, index)}>
                              <X size={16} />
                            </Button>
                          </div>
                        ))}
                        <Button variant="outline" onClick={() => addResource(step.id)} className="w-full">
                          <Plus size={16} className="mr-2" /> Add Resource
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Button variant="outline" onClick={addStep} className="w-full mt-4">
              <Plus size={16} className="mr-2" /> Add Step
            </Button>
          </div>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <DialogFooter>
          <Button onClick={handleSave} disabled={!task && isTaskLimitReached}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditTaskDialog;