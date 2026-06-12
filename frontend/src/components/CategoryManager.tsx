import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Tag, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { CategoryManagerProps } from "@/types";

const CategoryManager: React.FC<CategoryManagerProps> = ({ open, onOpenChange, onCategoriesChange }) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [adding, setAdding] = useState<boolean>(false);

  useEffect(() => {
    if (open) loadCategories();
  }, [open]);

  const loadCategories = async (): Promise<void> => {
    setLoading(true);
    const [{ data: clients }, { data: websites }] = await Promise.all([
      supabase.from("clients").select("category"),
      supabase.from("personal_websites").select("category"),
    ]);
    
    const allCategories = new Set<string>();
    [...(clients || []), ...(websites || [])].forEach((item: { category?: string }) => {
      if (item.category) allCategories.add(item.category);
    });
    
    setCategories(Array.from(allCategories).sort());
    setLoading(false);
  };

  const addCategory = async (): Promise<void> => {
    if (!newCategory.trim()) {
      toast.error("Category name is required");
      return;
    }
    
    const trimmed = newCategory.trim();
    
    if (categories.includes(trimmed)) {
      toast.error("Category already exists");
      return;
    }
    
    setAdding(true);
    
    // Add category by creating a temporary client with that category
    // This ensures the category exists in the system
    const { error } = await supabase
      .from("clients")
      .insert({
        name: "_category_placeholder_",
        domain: "_placeholder_.com",
        category: trimmed,
        active: false,
        plan_tier: "basic"
      });
    
    if (error) {
      toast.error("Failed to add category");
      setAdding(false);
      return;
    }
    
    // Delete the placeholder
    await supabase
      .from("clients")
      .delete()
      .eq("domain", "_placeholder_.com");
    
    setCategories([...categories, trimmed].sort());
    setNewCategory("");
    setAdding(false);
    toast.success(`Category "${trimmed}" added`);
    if (onCategoriesChange) onCategoriesChange();
  };

  const deleteCategory = async (categoryToDelete: string): Promise<void> => {
    const [{ error: clientError }, { error: websiteError }] = await Promise.all([
      supabase.from("clients").update({ category: null }).eq("category", categoryToDelete),
      supabase.from("personal_websites").update({ category: null }).eq("category", categoryToDelete),
    ]);
    
    if (clientError || websiteError) {
      toast.error("Failed to remove category from items");
      return;
    }
    
    setCategories(categories.filter(c => c !== categoryToDelete));
    toast.success(`Category "${categoryToDelete}" removed from all items`);
    if (onCategoriesChange) onCategoriesChange();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1e2130] border border-[#2e3245] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
            <Tag className="h-5 w-5 text-[#007bff]" />
            Manage Categories
          </DialogTitle>
          <DialogDescription className="text-[#94a3b8]">
            Add or remove categories. Removing a category will unassign it from all clients and websites.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Input
              placeholder="New category name..."
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !adding && addCategory()}
              className="bg-[#0f1117] border-[#2e3245] text-white placeholder:text-[#64748b] focus-visible:ring-[#007bff] focus-visible:border-transparent"
            />
            <Button 
              onClick={addCategory} 
              size="icon"
              disabled={adding}
              className="bg-[#007bff] hover:bg-[#0056b3] text-white"
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {loading ? (
              <p className="text-sm text-[#64748b]">Loading...</p>
            ) : categories.length === 0 ? (
              <p className="text-sm text-[#64748b]">No categories yet</p>
            ) : (
              categories.map((category) => (
                <div
                  key={category}
                  className="flex items-center justify-between p-3 rounded-lg border border-[#2e3245] bg-[#0f1117] hover:border-[#3e445e] transition-colors"
                >
                  <span className="text-sm text-white font-medium">{category}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[#ef4444] hover:text-[#ef4444] hover:bg-[#ef4444]/10"
                    onClick={() => deleteCategory(category)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryManager;
