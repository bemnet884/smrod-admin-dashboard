'use client';

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    onPageChange: (page: number) => void;
}

export function PaginationControls({
    currentPage,
    totalPages,
    totalItems,
    onPageChange
}: PaginationControlsProps) {
    // If there are no pages or just 1 page, don't show the controls
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between px-4 py-4 border-t border-border bg-card">
            <div className="text-xs text-muted-foreground font-medium">
                Showing Page <span className="text-foreground font-bold">{currentPage}</span> of{" "}
                <span className="text-foreground font-bold">{totalPages}</span>
                <span className="ml-2 hidden sm:inline-block">({totalItems} total records)</span>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground border-border"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground border-border"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            </div>
        </div>
    );
}