import { differenceInDays } from "date-fns";

const formatDate = (date: Date | null): string => {
    date = date ?? new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
  
    const diffDays = differenceInDays(compareDate, today);
  
    switch (diffDays) {
      case 0:
        return "Today";
      case 1:
        return "Tomorrow";
      case -1:
        return "Yesterday";
      default:
        const absDay = Math.abs(diffDays);
        return diffDays > 0 ? `${absDay} days after` : `${absDay} days ago`;
    }
  };

export default formatDate;
