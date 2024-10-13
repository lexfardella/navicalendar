import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Sparkles } from 'lucide-react';

const RequestPremium: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send this data to your backend
    console.log('Submitted:', { email, name, reason });
    
    // Simulating an API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: "Request Submitted",
      description: "We've received your premium access request. We'll be in touch soon!",
    });

    setIsOpen(false);
    setEmail('');
    setName('');
    setReason('');
  };

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button 
          onClick={() => setIsOpen(true)} 
          variant="outline" 
          size="sm"
          className="bg-gradient-to-r from-purple-400 to-pink-600 hover:from-purple-500 hover:to-pink-700 text-white hover:text-white border-none font-semibold"
        >
          <Sparkles size={16} className="mr-2" />
          Get full access
        </Button>
      </motion.div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-purple-50 to-pink-50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-purple-800">Request Premium Access</DialogTitle>
            <DialogDescription className="text-center text-purple-600">
              Upgrade your experience with Navi Premium
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-purple-700">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border-purple-300 focus:border-pink-500 focus:ring-pink-500"
                required
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-purple-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-purple-300 focus:border-pink-500 focus:ring-pink-500"
                required
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm font-medium text-purple-700">
                Why do you want premium access?
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border-purple-300 focus:border-pink-500 focus:ring-pink-500"
                rows={3}
                required
                placeholder="I'm excited about premium features because..."
              />
            </div>
            <DialogFooter>
              <Button 
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold"
              >
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RequestPremium;