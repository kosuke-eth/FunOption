import { useRef } from "react";
import { usePrediction } from "./input/usePrediction";
import DatePicker from "react-datepicker";
import formatDate from "./input/formatDate";

export const DatePickerItem = ({
  selectedDate,
  setSelectedDate,
}: ReturnType<typeof usePrediction>) => {
  const ref = useRef<DatePicker>(null);
  const formattedDate = formatDate(selectedDate);
  const handleClick = () => {
    ref.current?.setOpen(true);
  };
  return (
    <div
      className="bg-surface-container-high px-5 h-10 font-bold flex text-sm items-center gap-2 rounded-lg"
      onClick={handleClick}
    >
      <span>{formattedDate}</span>
      <DatePicker
        ref={ref}
        selected={selectedDate}
        onChange={(date: Date | null) => {
          if (date) {
            setSelectedDate(date);
          }
        }}
        dateFormat="(d MMM yyyy)"
        placeholderText="Select date"
        className="bg-surface-container-high outline-none"
      />
    </div>
  );
};
