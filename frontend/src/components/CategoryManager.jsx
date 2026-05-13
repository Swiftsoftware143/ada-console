import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Tag } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function CategoryManager({ open, onOpenChange, onCategoriesChange }) {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) loadCategories();
  }, [open]);

  const loadCategories = async () => {
    setLoading(true);
    const [{ data: clients }, { data: websites }] = await Promise.all([
      supabase.from("clients").select("category"),
      supabase.from("personal_websites").select("category"),
    ]);
    
    const allCategories = new Set();
    [...(clients || []), ...(websites || [])].forEach(item => {
      if (item.category) allCategories.add(item.category);
    });
    
    setCategories(Array.from(allCategories).sort());
    setLoading(false);
  };

  const addCategory = () => {
    if (!newCategory.trim()) {
      toast.error("Category name is required");
      return;
    }
    
    if (categories.includes(newCategory.trim())) {
      toast.error("Category already exists");
      return;
    }
    
    setCategories([...categories, newCategory.trim()].sort());
    setNewCategory("");
    toast.success("Category added");
    if (onCategoriesChange) onCategoriesChange();
  };

  const deleteCategory = async (categoryToDelete) => {
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Manage Categories
          </DialogTitle>
          <DialogDescription>
            Add or remove categories. Removing a category will unassign it from all websites.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Input
              placeholder="New category name..."
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCategory()}
            />
            <Button onClick={addCategory} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No categories yet</p>
            ) : (
              categories.map((category) => (
                <div
                  key={category}
                  className="flex items-center justify-between p-2 rounded-md border bg-card"
                >
                  <span className="text-sm">{category}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
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
}
