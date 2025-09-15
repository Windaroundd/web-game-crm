"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ComboboxProps {
  options: string[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  allowCustom?: boolean;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  className,
  disabled = false,
  allowCustom = true,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  const handleSelect = (selectedValue: string) => {
    // Find the original option that matches (case-insensitive)
    const originalOption = options.find(
      (option) => option.toLowerCase() === selectedValue.toLowerCase()
    );
    onValueChange(originalOption || selectedValue);
    setOpen(false);
    setSearchValue("");
  };

  const handleCreateNew = () => {
    const newValue = searchValue.trim();
    if (newValue && allowCustom) {
      onValueChange(newValue);
      setOpen(false);
      setSearchValue("");
    }
  };

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchValue.toLowerCase())
  );
  console.log("filteredOptions: ", filteredOptions);

  // Check if search value is a new option not in the list
  const isNewOption =
    searchValue.trim() && !options.includes(searchValue.trim()) && allowCustom;

  const displayValue = value || placeholder;
  console.log("displayValue: ", displayValue);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          {displayValue}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder={`Search ${placeholder.toLowerCase()}...`}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>No option found.</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={(currentValue) => {
                    handleSelect(currentValue);
                  }}
                >
                  <Check className="mr-2 h-4 w-4 opacity-0" />

                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </CommandItem>
              ))}
              {isNewOption && (
                <>
                  <CommandItem
                    value={`create-${searchValue.trim()}`}
                    onSelect={handleCreateNew}
                  >
                    {/* <Check className="mr-2 h-4 w-4 opacity-0" />
                    Create &quot;{searchValue.trim()}&quot; */}
                  </CommandItem>
                  {/* Fallback button in case CommandItem doesn't work */}
                  <div className="px-2 py-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-auto p-0 font-normal"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCreateNew();
                      }}
                    >
                      <Check className="mr-2 h-4 w-4 opacity-50" />
                      Create &quot;{searchValue.trim()}&quot;
                    </Button>
                  </div>
                </>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
