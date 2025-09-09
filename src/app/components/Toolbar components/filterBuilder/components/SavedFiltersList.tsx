import React from "react";
import { Loader2, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Filter } from "@/app/store/filterStore";
import { FilterPreview } from "./FilterPreview";

interface SavedFiltersListProps {
  filters: Filter[];
  selectedFilter: Filter | null;
  isLoading: boolean;
  error: Error | null;
  onApplyFilter: (filter: Filter) => void;
  onDeleteFilter: (id: string) => void;
  isDeleting: boolean;
}

export const SavedFiltersList: React.FC<SavedFiltersListProps> = ({
  filters,
  selectedFilter,
  isLoading,
  error,
  onApplyFilter,
  onDeleteFilter,
  isDeleting,
}) => {
  if (filters.length === 0 && !isLoading && !error) {
    return null;
  }

  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium mb-2">Your Filters</h3>
      <p className="text-xs text-gray-500 mb-2">
        Click a filter to apply it. Click again to remove it.
      </p>
      <Separator className="mb-2" />
      <ScrollArea className="h-48">
        <div className="space-y-2">
          {filters.map((filter) => (
            <Card
              key={filter.id}
              className={`cursor-pointer ${
                selectedFilter?.id === filter.id
                  ? "border-primary bg-primary/5"
                  : "border-neutral-200 dark:border-neutral-800"
              }`}
              onClick={() => onApplyFilter(filter)}
            >
              <CardHeader className="p-3 pb-0">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <CardTitle className="text-sm">{filter.name}</CardTitle>
                    {selectedFilter?.id === filter.id && (
                      <Check size={14} className="text-primary" />
                    )}
                  </div>
                  {!filter.isDefault && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFilter(filter.id);
                      }}
                      disabled={isDeleting}
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <FilterPreview filter={filter.filter} height="h-10" />
              </CardContent>
            </Card>
          ))}

          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="animate-spin h-5 w-5 text-neutral-400" />
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="text-center py-4 text-red-500 text-sm">
              {error.message || "An error occurred while loading filters"}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
