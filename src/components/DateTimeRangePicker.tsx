import React from "react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import TimePicker from "react-multi-date-picker/plugins/time_picker";

interface IDateTimeRangePickerProps {
  value: Date[] | undefined;
  onChange: (value: Date[] | undefined) => void;
  numberOfMonthsShow: number
  reservations?: string[]; // Array of reserved date strings
  showTime?: boolean; // Prop to toggle time selection
}

const DateTimeRangePicker: React.FC<IDateTimeRangePickerProps> = ({
  value,
  onChange,
  numberOfMonthsShow,
  reservations = [],
  showTime = false, // Default value for showTime
}) => {
  const format = showTime ? "DD-MM-YYYY HH:mm:ss" : "DD-MM-YYYY";

  const isDateTimeIncluded = (date: Date): boolean => {
    for (let i = 0; i < reservations.length; i++) {
      let reservationDate = new Date(reservations[i]);
      if (date.getTime() === reservationDate.getTime()) {
        return true;
      }
    }
    return false;
  };
  const handleChange = (dateObjects: DateObject[] | DateObject): void => {
    // Normalize single vs array input
    const dateArray = Array.isArray(dateObjects) ? dateObjects : [dateObjects];
    // Convert DateObject to Date
    const dates = dateArray.map((dateObj) => dateObj?.toDate());
    onChange(dates.length > 0 ? dates : undefined);
  };
  return (
    <DatePicker
      style={{ height: "42px" }}
      value={value}
      onChange={handleChange}
      range
      numberOfMonths={numberOfMonthsShow}
      format={format}
      plugins={showTime ? [<TimePicker key="timePicker" />] : []}
      mapDays={({ date }) => {
        const dateToCompare = new Date(
          `${date.year}-${date.month}-${date.day}T${date.hour || "00"}:${date.minute || "00"
          }:00`
        );
        if (isDateTimeIncluded(dateToCompare))
          return {
            disabled: true,
            style: { color: "#ccc" },
            onClick: () => alert("This date and time are reserved"),
          };
      }}
    />
  );
};

export default DateTimeRangePicker;
