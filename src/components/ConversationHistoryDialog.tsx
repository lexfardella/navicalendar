import React, { ReactNode } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Waypoints } from 'lucide-react';
import { ConversationEntry } from '../../types/index';

interface ConversationHistoryDialogProps {
  conversation: ConversationEntry[];
  children: ReactNode;
}

const ConversationHistoryDialog: React.FC<ConversationHistoryDialogProps> = ({ conversation, children }) => {
  const formatDate = (date: Date) => {
    return format(date, 'MMM d, h:mm a');
  };

  const formatMessage = (text: string) => {
    const isoDateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/g;
    return text.replace(isoDateRegex, (match) => {
      const date = new Date(match);
      return format(date, 'MMM d, h:mm a');
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">Conversation History</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[70vh] pr-4 mt-4">
          {conversation.map((entry, index) => (
            <div key={entry.id} className={`mb-4 ${entry.isAI ? 'text-left' : 'text-right'}`}>
              <div className={`inline-block max-w-[80%] ${entry.isAI ? 'mr-auto' : 'ml-auto'}`}>
                <div className={`p-3 rounded-lg ${entry.isAI ? 'bg-blue-100' : 'bg-gray-200'}`}>
                  <p className={`text-sm ${entry.isAI ? 'text-blue-800' : 'text-gray-800'}`}>
                    {formatMessage(entry.text)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(entry.timestamp)}
                  </p>
                </div>
                {index === 0 || conversation[index - 1].isAI !== entry.isAI ? (
                  <div className={`flex items-center mt-1 ${entry.isAI ? 'justify-start' : 'justify-end'}`}>
                    {entry.isAI ? (
                      <>
                        <Waypoints size={14} className="text-blue-500 mr-1" />
                        <span className="text-xs text-blue-500">Navi</span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-gray-500">You</span>
                        <User size={14} className="text-gray-500 ml-1" />
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ConversationHistoryDialog;