import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";

interface DateRangeFilterProps {
  fromDate?: string;
  toDate?: string;
  onFromDateChange: (date: string | undefined) => void;
  onToDateChange: (date: string | undefined) => void;
  label?: string;
  disabled?: boolean;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  label = "Date Range",
  disabled,
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Select date";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return "Select date";
    }
  };

  return (
    <div className="w-full space-y-2">
      <Label className="text-base font-medium text-muted-foreground mb-2">
        {label}
      </Label>

      <div className="grid grid-cols-2 gap-6">
        <div className="relative group">
          <Button
            variant="outline"
            className="w-full h-14 justify-center text-center font-semibold bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 hover:from-cyan-100 hover:via-blue-100 hover:to-indigo-100 border-cyan-200 hover:border-cyan-300 transition-all duration-500 shadow-md hover:shadow-lg hover:scale-[1.03] rounded-xl relative overflow-hidden"
            disabled={disabled}
            onClick={() => {
              const input = document.getElementById('from-date-input') as HTMLInputElement;
              if (input) {
                // Position the input at the center of the button before showing picker
                const button = input.previousElementSibling as HTMLElement;
                if (button) {
                  const rect = button.getBoundingClientRect();
                  input.style.position = 'fixed';
                  input.style.left = `${rect.left + rect.width / 2}px`;
                  input.style.top = `${rect.top + rect.height / 2}px`;
                  input.style.opacity = '0';
                  input.style.pointerEvents = 'none';
                }
                input.focus();
                if (input.showPicker) {
                  input.showPicker();
                } else {
                  input.click();
                }
              }
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="flex flex-col items-center gap-1 relative z-10">
              <Calendar className="h-5 w-5 text-cyan-600 group-hover:text-cyan-700 transition-colors" />
              <span className="text-sm text-cyan-800 group-hover:text-cyan-900 font-bold tracking-wide">
                {formatDate(fromDate)}
              </span>
            </div>
          </Button>
          <input
            id="from-date-input"
            type="date"
            value={fromDate ? fromDate.split('T')[0] : ""}
            onChange={(e) => {
              const value = e.target.value;
              if (value) {
                // Convert to ISO datetime string (add time 00:00:00)
                onFromDateChange(`${value}T00:00:00.000Z`);
              } else {
                onFromDateChange(undefined);
              }
            }}
            className="sr-only"
            disabled={disabled}
          />
        </div>

        <div className="relative group">
          <Button
            variant="outline"
            className="w-full h-14 justify-center text-center font-semibold bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50 hover:from-rose-100 hover:via-pink-100 hover:to-fuchsia-100 border-rose-200 hover:border-rose-300 transition-all duration-500 shadow-md hover:shadow-lg hover:scale-[1.03] rounded-xl relative overflow-hidden"
            disabled={disabled}
            onClick={() => {
              const input = document.getElementById('to-date-input') as HTMLInputElement;
              if (input) {
                // Position the input at the center of the button before showing picker
                const button = input.previousElementSibling as HTMLElement;
                if (button) {
                  const rect = button.getBoundingClientRect();
                  input.style.position = 'fixed';
                  input.style.left = `${rect.left + rect.width / 2}px`;
                  input.style.top = `${rect.top + rect.height / 2}px`;
                  input.style.opacity = '0';
                  input.style.pointerEvents = 'none';
                }
                input.focus();
                if (input.showPicker) {
                  input.showPicker();
                } else {
                  input.click();
                }
              }
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="flex flex-col items-center gap-1 relative z-10">
              <Calendar className="h-5 w-5 text-purple-600 group-hover:text-purple-700 transition-colors" />
              <span className="text-sm text-purple-800 group-hover:text-purple-900 font-bold tracking-wide">
                {formatDate(toDate)}
              </span>
            </div>
          </Button>
          <input
            id="to-date-input"
            type="date"
            value={toDate ? toDate.split('T')[0] : ""}
            onChange={(e) => {
              const value = e.target.value;
              if (value) {
                // Convert to ISO datetime string (add time 23:59:59 for "to" date to include the whole day)
                onToDateChange(`${value}T23:59:59.999Z`);
              } else {
                onToDateChange(undefined);
              }
            }}
            className="sr-only"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
};

export default DateRangeFilter;