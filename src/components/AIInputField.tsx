import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, MessageSquare, History, X, Loader2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ConversationHistoryDialog from './ConversationHistoryDialog';
import { ConversationEntry } from '../../types/index';

interface AIInputFieldProps {
  onSubmit: (input: string) => void;
  conversation: ConversationEntry[];
  isProcessing: boolean;
}

const AIInputField: React.FC<AIInputFieldProps> = ({ onSubmit, conversation, isProcessing }) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [audioData, setAudioData] = useState<number[]>(Array(20).fill(0));
  const inputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (showTextInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showTextInput]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !isProcessing) {
      onSubmit(input.trim());
      setInput('');
      setShowTextInput(false);
    }
  };

  const startRecording = async () => {
    if (isProcessing) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 64;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateAudioData = () => {
        analyserRef.current!.getByteFrequencyData(dataArray);
        setAudioData(Array.from(dataArray).slice(0, 20));
        animationFrameRef.current = requestAnimationFrame(updateAudioData);
      };
      updateAudioData();

      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = handleRecordingComplete;
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setAudioData(Array(20).fill(0));
    setIsRecording(false);
  };

  const handleRecordingComplete = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    audioChunksRef.current = [];
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Failed to transcribe audio');
      }
      const data = await response.json();
      onSubmit(data.text);
    } catch (error) {
      console.error('Transcription error:', error);
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <TooltipProvider>
      <AnimatePresence>
        {(isProcessing || isTranscribing) && (
          <motion.div
            className="fixed bottom-32 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4 flex items-center space-x-2">
                <Loader2 className="animate-spin text-blue-600" size={24} />
                <span className="text-sm font-medium text-gray-800">
                  {isProcessing ? 'Processing your request...' : 'Transcribing audio...'}
                </span>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      <Card className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-2xl bg-transparent">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowTextInput(!showTextInput)}
                  className="text-gray-600 hover:text-blue-600 transition-colors duration-300"
                >
                  <MessageSquare size={22} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle text input</p>
              </TooltipContent>
            </Tooltip>
            <AnimatePresence>
              {showTextInput && (
                <motion.div
                  className="flex-grow"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                >
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Ask Navi anything..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                    className="w-full bg-transparent focus:border-blue-500 focus:ring focus:ring-blue-200 rounded-xl transition-all duration-300"
                    disabled={isProcessing || isTranscribing}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {showTextInput && input.trim() && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSubmit}
                        disabled={!input.trim() || isProcessing || isTranscribing}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors duration-300"
                      >
                        <Send size={22} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Send message</p>
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div
              className="relative"
              animate={{
                scale: isRecording ? 1.1 : 1,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isRecording ? "destructive" : "default"}
                    size="icon"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessing || isTranscribing}
                    className={`z-10 relative w-12 h-12 p-0 overflow-hidden transition-all duration-300 ${
                      isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                    }`}
                  >
                    {isRecording ? (
                      <X size={24} className="absolute inset-0 m-auto text-white" />
                    ) : (
                      <Mic size={24} className="absolute inset-0 m-auto text-white" />
                    )}
                    <AnimatePresence>
                      {isRecording && (
                        <motion.div 
                          className="absolute inset-0 flex items-center justify-center pointer-events-none"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {audioData.map((value, index) => (
                            <motion.div
                              key={index}
                              className="absolute bottom-0 w-0.5 mx-px bg-white"
                              style={{
                                height: `${value * 100 / 255}%`,
                                left: `${(index / audioData.length) * 100}%`,
                              }}
                              initial={{ height: 0 }}
                              animate={{ height: `${value * 100 / 255}%` }}
                              transition={{ type: "spring", stiffness: 300, damping: 10 }}
                            />
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isRecording ? 'Stop recording' : 'Start recording'}</p>
                </TooltipContent>
              </Tooltip>
            </motion.div>
            <Tooltip>
              <TooltipTrigger asChild>
                <ConversationHistoryDialog conversation={conversation}>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-colors duration-300"
                  >
                    <History size={22} />
                  </Button>
                </ConversationHistoryDialog>
              </TooltipTrigger>
              <TooltipContent>
                <p>View conversation history</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default AIInputField;