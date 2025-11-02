'use client';

import { useState, useMemo, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FileText } from 'lucide-react';

interface DocumentPickerSidebarProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    allDocs: any[];
    focusedDocIds: Set<string>;
    onFocusedDocIdsChange: (ids: Set<string>) => void;
}

export function DocumentPickerSidebar({
    isOpen,
    onOpenChange,
    allDocs,
    focusedDocIds,
    onFocusedDocIdsChange
}: DocumentPickerSidebarProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredDocs = useMemo(() => {
        if (!searchTerm) return allDocs;
        return allDocs.filter(doc => 
            doc.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allDocs, searchTerm]);
    
    const handleCheckedChange = (docId: string, checked: boolean | 'indeterminate') => {
        const newSet = new Set(focusedDocIds);
        if (checked) {
            newSet.add(docId);
        } else {
            newSet.delete(docId);
        }
        onFocusedDocIdsChange(newSet);
    };

    const handleClearSelection = () => {
        onFocusedDocIdsChange(new Set());
    }

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="flex flex-col">
                <SheetHeader>
                    <SheetTitle>Focus Documents</SheetTitle>
                    <SheetDescription>
                        Select documents to focus the conversation on. If none are selected, Ryzor will search all documents.
                    </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                    <Input 
                        placeholder="Search documents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <ScrollArea className="flex-1 -mx-6 px-6">
                    <div className="space-y-3">
                        {filteredDocs.map(doc => (
                            <div key={doc.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent/50">
                                <Checkbox
                                    id={`doc-${doc.id}`}
                                    checked={focusedDocIds.has(doc.id)}
                                    onCheckedChange={(checked) => handleCheckedChange(doc.id, checked)}
                                />
                                <label
                                    htmlFor={`doc-${doc.id}`}
                                    className="flex items-center gap-3 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                     <FileText className="h-4 w-4 text-muted-foreground" />
                                    <div className="flex-1 truncate">
                                        <p className="truncate">{doc.name}</p>
                                        <p className="text-xs text-muted-foreground">{doc.source === 'drive' ? `Google Drive (${doc.accountType})` : 'Local Upload'}</p>
                                    </div>
                                </label>
                            </div>
                        ))}
                         {filteredDocs.length === 0 && (
                            <div className="text-center py-10 text-muted-foreground">
                                <p>No documents found.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <SheetFooter className="mt-auto pt-4 border-t">
                    <Button variant="outline" onClick={handleClearSelection} disabled={focusedDocIds.size === 0}>Clear Selection</Button>
                    <Button onClick={() => onOpenChange(false)}>
                        {`Apply (${focusedDocIds.size})`}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
