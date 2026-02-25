import React, { useState } from "react";
import { TouchableOpacity, Text } from "react-native";
import DatePicker from "react-native-date-picker";

const DateInput = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)}>
        <Text style={{ paddingVertical: 10 }}>
          {value || "Select Date"}
        </Text>
      </TouchableOpacity>

      <DatePicker
        modal
        mode="date"
        open={open}
        date={new Date()}
        onConfirm={(d) => {
          setOpen(false);
          onChange(d.toISOString().slice(0, 10));
        }}
        onCancel={() => setOpen(false)}
      />
    </>
  );
};

export default DateInput;