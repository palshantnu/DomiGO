import React from "react";
import { View, TextInput, Text } from "react-native";
import DateInput from "./DateInput";

const MultiEntryBlock = ({ data, type, setForm }) => {

  return data.map((item, index) => (
    <View key={index} style={{ marginBottom: 20, padding: 10, backgroundColor: "#F8F8F8", borderRadius: 12 }}>

      {type === "business" && (
        <>
          <Text>Business Name</Text>
          <TextInput
            value={item.name}
            onChangeText={(val) =>
              setForm(prev => {
                const copy = [...prev.businessRecords];
                copy[index].name = val;
                return { ...prev, businessRecords: copy };
              })
            }
          />

          <Text>Start Date</Text>
          <DateInput
            value={item.startDate}
            onChange={(val) =>
              setForm(prev => {
                const copy = [...prev.businessRecords];
                copy[index].startDate = val;
                return { ...prev, businessRecords: copy };
              })
            }
          />
        </>
      )}

      {type === "secondHome" && (
        <>
          <Text>Established Date</Text>
          <DateInput
            value={item.establishedDate}
            onChange={(val) =>
              setForm(prev => {
                const copy = [...prev.secondHomes];
                copy[index].establishedDate = val;
                return { ...prev, secondHomes: copy };
              })
            }
          />
        </>
      )}

    </View>
  ));
};

export default MultiEntryBlock;