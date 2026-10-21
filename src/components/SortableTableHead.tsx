import React from "react";
import { TableHead } from "@/components/ui/table";

interface Props extends React.ThHTMLAttributes<HTMLTableCellElement> {
  onClick: () => void;
  direction?: "asc" | "desc";
}
export default function SortableTableHead({ children, onClick, direction, className, ...props }: Props) {
  return <TableHead {...props} className={className} aria-sort={direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none"}>
    <button type="button" onClick={onClick} className="inline-flex w-full items-center gap-1 rounded py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {children}
    </button>
  </TableHead>;
}
