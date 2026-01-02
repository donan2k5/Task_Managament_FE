import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileDialog = ({ open, onOpenChange }: ProfileDialogProps) => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [annotation, setAnnotation] = useState(user?.annotation || "");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
        setName(user.name);
        setAnnotation(user.annotation || "");
    }
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await updateProfile({ name, annotation });
      toast.success("Profile updated successfully");
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 bg-zinc-950 border-zinc-800 text-zinc-100 shadow-2xl overflow-hidden rounded-3xl">
        
        {/* Header Background */}
        <div className="relative h-32 bg-gradient-to-br from-indigo-900 via-purple-900 to-zinc-900">
             <div className="absolute inset-0 bg-black/20" />
             <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-4 right-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full"
                onClick={() => onOpenChange(false)}
             >
                <span className="sr-only">Close</span>
             </Button>
        </div>

        {/* Profile Content */}
        <div className="px-8 pb-8 relative">
            {/* Avatar Section */}
            <div className="-mt-12 mb-6 flex flex-col items-center">
                 <div className="relative">
                     <div className="w-24 h-24 rounded-full border-4 border-zinc-950 bg-zinc-800 flex items-center justify-center text-3xl font-bold text-zinc-400 shadow-xl overflow-hidden">
                         {user?.avatar ? (
                             <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                         ) : (
                             user?.name?.charAt(0) || "U"
                         )}
                     </div>
                     <button className="absolute bottom-1 right-1 bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded-full shadow-lg border-2 border-zinc-950 transition-colors">
                        <Loader2 className={cn("w-3 h-3", isLoading ? "animate-spin" : "hidden")} />
                         {!isLoading && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                             <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                         </svg>}
                     </button>
                 </div>
                 <DialogTitle className="text-xl font-bold mt-3 text-white">Edit Profile</DialogTitle>
                 <DialogDescription className="text-zinc-500 text-sm">Update your personal details</DialogDescription>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Display Name</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-0 rounded-xl h-11"
                        placeholder="e.g. John Doe"
                        disabled={isLoading}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="annotation" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Bio / Status</Label>
                    <div className="relative">
                        <Input
                            id="annotation"
                            value={annotation}
                            onChange={(e) => setAnnotation(e.target.value)}
                            className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-0 rounded-xl h-24 pb-14 resize-none items-start" 
                            placeholder="What's on your mind?"
                            disabled={isLoading}
                        />
                        <div className="absolute bottom-3 right-3 text-[10px] text-zinc-600">
                             {annotation.length}/60
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex gap-3">
                    <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => onOpenChange(false)} 
                        className="flex-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl h-11"
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button 
                        type="submit" 
                        disabled={isLoading || !name.trim()}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-11 font-medium shadow-lg shadow-indigo-900/20"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                    </Button>
                </div>
            </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
