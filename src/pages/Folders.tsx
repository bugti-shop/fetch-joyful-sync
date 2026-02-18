import { useState, useEffect } from 'react';
import { Folder, Plus, ChevronRight, Trash2, Edit2, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { storage } from '@/lib/storage';

interface FolderType {
  id: number;
  name: string;
  isDefault: boolean;
  goalCount: number;
}

const Folders = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<FolderType | null>(null);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = () => {
    const loadedFolders = storage.loadFolders();
    const jars = storage.loadJars();
    
    // Count goals per folder
    const foldersWithCount = loadedFolders.map(folder => ({
      ...folder,
      goalCount: folder.id === 1 ? jars.filter(jar => !jar.imageUrl).length :
                 folder.id === 2 ? jars.filter(jar => jar.imageUrl).length :
                 folder.id === 3 ? jars.length :
                 jars.filter(jar => jar.folderId === folder.id).length
    }));
    
    setFolders(foldersWithCount);
  };

  const createFolder = () => {
    if (!newFolderName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a folder name",
        variant: "destructive"
      });
      return;
    }

    const newFolder: FolderType = {
      id: Date.now(),
      name: newFolderName.trim(),
      isDefault: false,
      goalCount: 0
    };

    const updatedFolders = [...folders, newFolder];
    setFolders(updatedFolders);
    storage.saveFolders(updatedFolders);
    
    setNewFolderName('');
    setShowCreateModal(false);
    
    toast({
      title: "Success",
      description: "Folder created successfully"
    });
  };

  const deleteFolder = () => {
    if (!folderToDelete) return;

    const updatedFolders = folders.filter(f => f.id !== folderToDelete.id);
    setFolders(updatedFolders);
    storage.saveFolders(updatedFolders);
    
    setShowDeleteConfirm(false);
    setFolderToDelete(null);
    
    toast({
      title: "Success",
      description: "Folder deleted successfully"
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-screen-xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Folders</h1>
          <Button
            onClick={() => navigate('/settings')}
            variant="ghost"
            size="icon"
          >
            <Settings size={20} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <Button
          onClick={() => setShowCreateModal(true)}
          className="w-full mb-6"
          size="lg"
        >
          <Plus size={20} />
          New Folder
        </Button>

        {/* Folders List */}
        <div className="space-y-3">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="bg-card rounded-xl p-4 border border-border flex items-center justify-between group hover:shadow-md transition-all"
            >
              <div
                className="flex items-center gap-4 flex-1 cursor-pointer"
                onClick={() => navigate(`/folder/${folder.id}`)}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Folder className="text-primary" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{folder.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {folder.goalCount} {folder.goalCount === 1 ? 'goal' : 'goals'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!folder.isDefault && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFolderToDelete(folder);
                      setShowDeleteConfirm(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={18} className="text-destructive" />
                  </Button>
                )}
                <ChevronRight className="text-muted-foreground" size={20} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Folder Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="folderName" className="text-foreground">Folder Name</Label>
              <Input
                id="folderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
                className="mt-2"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewFolderName('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={createFolder} className="flex-1">
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground">Delete Folder</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete "{folderToDelete?.name}"? Goals in this folder will be moved to "All Goals".
          </p>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setFolderToDelete(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={deleteFolder} variant="destructive" className="flex-1">
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Folders;
