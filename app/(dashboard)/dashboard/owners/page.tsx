'use client';

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ownerService } from "@/services/owner.service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { InviteOwnerDialog } from "@/components/shared/invite-owner-dialog";
import { Loader2, Mail, Phone, ShieldUser, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { User } from "@/types";

// Reusable UI Components
import { PageHeader } from "@/components/shared/page-header";
import { DataFilterBar } from "@/components/shared/data-filter-bar";
import { PaginationControls } from "@/components/shared/pagination-controls";

export default function OwnersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Fetch real data
  const { data: response, isLoading, isError } = useQuery({
    queryKey: ["owners", page, searchTerm],
    queryFn: () => ownerService.getOwners({
      search: searchTerm || undefined,
      page,
      limit
    }),
    placeholderData: (prev) => prev, // Keeps table from flashing
  });

  const ownersList: User[] = response?.data || [];
  const meta = response?.meta || { currentPage: 1, totalPages: 1, totalItems: 0 };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* 1. Standardized Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="Vehicle Owners"
          subtitle="Manage fleet owners and their registration status."
        />
        <InviteOwnerDialog />
      </div>

      {/* 2. Standardized Filter Bar */}
      <DataFilterBar
        searchTerm={searchTerm}
        onSearch={(val) => { setSearchTerm(val); setPage(1); }}
        placeholder="Search owners by name, email, or phone..."
        totalItems={meta.totalItems}
        label="Owners"
      />

      {/* 3. Table Area */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow>
              <TableHead className="font-semibold text-slate-700">Owner Details</TableHead>
              <TableHead className="font-semibold text-slate-700">Contact Info</TableHead>
              <TableHead className="font-semibold text-slate-700">Status</TableHead>
              <TableHead className="font-semibold text-slate-700">Joined Date</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="h-48 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto text-emerald-600" /></TableCell></TableRow>
            ) : isError ? (
                <TableRow><TableCell colSpan={5} className="h-48 text-center text-red-500"><AlertCircle className="mx-auto mb-2" /> Failed to load.</TableCell></TableRow>
              ) : ownersList.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-48 text-center text-slate-400 italic">No owners found.</TableCell></TableRow>
            ) : (
                    ownersList.map((owner) => (
                      <TableRow key={owner.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <div className="font-bold text-slate-900">{owner.name || "Unnamed Owner"}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{owner.id}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs text-slate-600">
                      {owner.email && <div className="flex items-center gap-2"><Mail className="w-3 h-3 text-slate-400" /> {owner.email}</div>}
                      {owner.phone && <div className="flex items-center gap-2"><Phone className="w-3 h-3 text-slate-400" /> {owner.phone}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={owner.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"}>
                      {owner.isActive ? "Active" : "Suspended"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">{new Date(owner.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700">View Fleet</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* 4. Standardized Pagination */}
        <PaginationControls
          currentPage={meta.currentPage}
          totalPages={meta.totalPages}
          totalItems={meta.totalItems}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}