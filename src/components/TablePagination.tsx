import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
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
  // Display logic: show a limited set of pages with ellipsis
  const getPageNumbers = () => {
    const maxPagesToShow = 5; // Maximum number of page buttons to show at once
    
    if (totalPages <= maxPagesToShow) {
      // If we have fewer pages than our max, show all pages
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Always show first and last page
    // For the middle, show pages around the current page
    const middlePagesToShow = maxPagesToShow - 2; // Subtract first and last
    const startPage = Math.max(2, currentPage - Math.floor(middlePagesToShow / 2));
    const endPage = Math.min(totalPages - 1, startPage + middlePagesToShow - 1);
    
    const pages = [1]; // Always include first page
    
    // Add ellipsis after first page if needed
    if (startPage > 2) {
      pages.push(-1); // Use -1 to represent ellipsis
    }
    
    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1) {
      pages.push(-2); // Use -2 to represent ellipsis
    }
    
    // Always include last page
    pages.push(totalPages);
    
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <Pagination className="mt-4">
      <PaginationContent className="flex-wrap justify-center">
        <PaginationItem>
          <Button
            type="button"
            variant="ghost"
            aria-label="Go to previous page"
            disabled={currentPage <= 1}
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          ><ChevronLeft className="mr-1 h-4 w-4" />Previous</Button>
        </PaginationItem>
        
        {getPageNumbers().map((page, index) => {
          if (page === -1 || page === -2) {
            // Render ellipsis
            return (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }
          
          return (
            <PaginationItem key={page}>
              <Button
                type="button"
                size="icon"
                variant={page === currentPage ? "outline" : "ghost"}
                aria-label={`Go to page ${page}`}
                aria-current={page === currentPage ? "page" : undefined}
                onClick={() => onPageChange(page)}
                className="cursor-pointer"
              >
                {page}
              </Button>
            </PaginationItem>
          );
        })}

        <PaginationItem>
          <Button
            type="button"
            variant="ghost"
            aria-label="Go to next page"
            disabled={currentPage >= totalPages}
            onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          >Next<ChevronRight className="ml-1 h-4 w-4" /></Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default TablePagination;
