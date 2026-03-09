import { useEditMode } from "@/contexts/EditModeContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface EditableDropdownProps {
  value: string;
  options: string[];
  onSave: (value: string) => void;
  className?: string;
  renderValue?: (value: string) => React.ReactNode;
}

const EditableDropdown = ({
  value,
  options,
  onSave,
  className,
  renderValue,
}: EditableDropdownProps) => {
  const { canEdit } = useEditMode();

  if (!canEdit) {
    return <span className={className}>{renderValue ? renderValue(value) : value}</span>;
  }

  return (
    <div className="group/dropdown inline-block">
      <Select value={value} onValueChange={onSave}>
        <SelectTrigger
          className={cn(
            "h-auto p-0 border border-dashed border-transparent hover:border-accent hover:bg-accent/5 rounded transition-all bg-transparent shadow-none focus:ring-0 focus:ring-offset-0 w-auto gap-2",
            className
          )}
        >
          <SelectValue>
            {renderValue ? renderValue(value) : value}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default EditableDropdown;
