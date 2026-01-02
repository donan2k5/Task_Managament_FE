import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ArrowRight, Folder, X, Loader2 } from "lucide-react";
import { Project } from "@/data/mockData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getProjectIcon } from "@/lib/projectIcons";

interface ProjectsCardProps {
  projects: Project[];
  onAddProject: (name: string) => Promise<void>; // Prop mới để gọi hàm add
}

export const ProjectsCard = ({ projects, onAddProject }: ProjectsCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setIsSubmitting(true);
    await onAddProject(newProjectName);
    setIsSubmitting(false);
    setIsModalOpen(false);
    setNewProjectName("");
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Folder className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Projects</h3>
          </div>

          <button className="group flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">
            View all
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* BUTTON: Open Modal */}
          <motion.button
            whileHover={{
              scale: 1.02,
              borderColor: "#6366f1",
              backgroundColor: "#eef2ff",
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsModalOpen(true)}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-slate-200 transition-colors h-full min-h-[100px]"
          >
            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
              <Plus className="w-5 h-5 text-slate-400" />
            </div>
            <span className="text-xs font-bold text-slate-600">Create New</span>
          </motion.button>

          {/* LIST: Projects */}
          {projects.map((project, index) => {
            const IconComponent = getProjectIcon(project.icon);
            return (
              <motion.div
                key={project.id || index}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{
                  y: -4,
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                }}
                whileTap={{ scale: 0.98 }}
                className="flex flex-col gap-3 p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:border-indigo-100 cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-100"
                    style={{
                      color: project.color || "#6366f1",
                      backgroundColor: `${project.color || "#6366f1"}15`,
                    }}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="w-8 h-8 rounded-full border-2 border-slate-50 flex items-center justify-center text-[9px] font-bold text-slate-400">
                    {project.progress || 0}%
                  </div>
                </div>

                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate mb-0.5">
                    {project.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium truncate">
                    {project.tasksCount || 0} tasks • {project.teammates || 1}{" "}
                    members
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* MODAL CREATE PROJECT */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a new project to start tracking tasks.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Input
                placeholder="Project Name (e.g. Website Redesign)"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!newProjectName.trim() || isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Project
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
