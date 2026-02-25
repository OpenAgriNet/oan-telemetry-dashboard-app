
import React, { useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const TablePagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: TablePaginationProps) => {
  const [jumpValue, setJumpValue] = useState("");

  const getPageNumbers = (): number[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const SIBLINGS = 1;
    const left = Math.max(2, currentPage - SIBLINGS);
    const right = Math.min(totalPages - 1, currentPage + SIBLINGS);

    const pages: number[] = [1];
    if (left > 2) pages.push(-1);
    for (let p = left; p <= right; p++) pages.push(p);
    if (right < totalPages - 1) pages.push(-2);
    pages.push(totalPages);
    return pages;
  };

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(jumpValue, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page);
      setJumpValue("");
    }
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col lg:flex-row items-center gap-2 w-full max-w-full">
      {/* Page number row with horizontal scroll on very small screens */}
      <div className="w-full overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex justify-center">
        <Pagination className="w-max mx-auto">
          <PaginationContent className="flex-nowrap sm:flex-wrap gap-1">
            <PaginationItem>
              <PaginationPrevious
                onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                className={
                  (currentPage <= 1
                    ? "pointer-events-none opacity-40 "
                    : "cursor-pointer ") +
                  "h-8 px-2 sm:h-9 sm:px-4 sm:pl-2.5 ml-0 [&>span]:sr-only sm:[&>span]:not-sr-only"
                }
              />
            </PaginationItem>

            {getPageNumbers().map((page, index) => {
              if (page < 0) {
                return (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis className="h-8 w-8 sm:h-9 sm:w-9" />
                  </PaginationItem>
                );
              }
              return (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => onPageChange(page)}
                    isActive={page === currentPage}
                    className="cursor-pointer h-8 min-w-8 px-2 text-xs sm:h-9 sm:min-w-9 sm:px-3 sm:text-sm text-center"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  currentPage < totalPages && onPageChange(currentPage + 1)
                }
                className={
                  (currentPage >= totalPages
                    ? "pointer-events-none opacity-40 "
                    : "cursor-pointer ") +
                  "h-8 px-2 sm:h-9 sm:px-4 sm:pr-2.5 mr-0 [&>span]:sr-only sm:[&>span]:not-sr-only"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* Go-to-page form — inline on desktop */}
      {totalPages > 7 && (
        <form
          onSubmit={handleJump}
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-1 lg:mt-0 lg:ml-2 flex-shrink-0"
        >
          <span className="whitespace-nowrap hidden sm:inline">Go to page</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            className="w-14 sm:w-16 h-8 sm:h-9 rounded-md border border-border bg-background px-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
            placeholder={String(currentPage)}
          />
          <button
            type="submit"
            className="h-8 sm:h-9 rounded-md border border-border bg-background hover:bg-muted px-3 text-xs font-medium transition-colors shadow-sm"
          >
            Go
          </button>
        </form>
      )}
    </div>
  );
};

export default TablePagination;
