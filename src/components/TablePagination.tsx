
import React from "react";
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
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
            className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
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
              <PaginationLink
                onClick={() => onPageChange(page)}
                isActive={page === currentPage}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        <PaginationItem>
          <PaginationNext
            onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
            className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default TablePagination;
