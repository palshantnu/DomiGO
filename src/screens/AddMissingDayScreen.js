import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { SelectList } from "react-native-dropdown-select-list";
import Header from "../components/Header";
import { CustomToast } from "../helpers/CommonHelpers";
import { connect, useDispatch } from "react-redux";
import { useNavigation, useRoute } from "@react-navigation/native";
import colors from "../theme/colors";
import { ADDMISSINGDAY, GET_STATES_LIST, GET_TYPE_OF_DAY_LIST, UPDATEMISSINGDAY } from "../redux/actions/action-creator";
// import { ADD_MISSING_DAY } from "../redux/actions/action-creator";

const DAY_TYPES = [
  { key: "Weekend", value: "Weekend" },
  { key: "Work", value: "Work" },
  { key: "Holiday", value: "Holiday" },
  { key: "Leave", value: "Leave" },
  { key: "Other", value: "Other" },
];

const STATES = [
  { key: "CA", value: "California" },
  { key: "TX", value: "Texas" },
  { key: "NY", value: "New York" },
  { key: "FL", value: "Florida" },
];

const AddMissingDayScreen = ({
  typeOfDayList,
  statesList,
  }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  console.log('typeOfDayList',typeOfDayList);
  console.log('statesList',statesList);


  const dayOptions = typeOfDayList?.map(item => ({
    key: item.id,
    value: item.name
  }));

  const tripOptions = statesList?.map(item => ({
    key: item.id,
    value: item.name
  }));

  const date = route?.params?.date;

  const isEdit = route?.params?.isEdit || false;
  const editData = route?.params?.data || null;

  const [typeOfDay, setTypeOfDay] = useState(null);
  const [confirmationNo, setConfirmationNo] = useState("");
  const [isCommissionDay, setIsCommissionDay] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [isRemoteWork, setIsRemoteWork] = useState(false);
  const [remoteHours, setRemoteHours] = useState("");
  const [remoteState, setRemoteState] = useState(null);

  const [notes, setNotes] = useState("");
  console.log('isEdit',isEdit);
  console.log('editData',editData);
  console.log('date',date);

  /* -------------------- AUTO WEEKEND -------------------- */
  // useEffect(() => {
  //   const day = new Date(date).getDay();
  //   if (day === 0 || day === 6) {
  //     setTypeOfDay(4);
  //   }
  // }, [date]);
  const weekendTypeId = useMemo(() => {
    return typeOfDayList?.find(item => item.name === "Weekend")?.id;
  }, [typeOfDayList]);

  useEffect(() => {
    if (isEdit) return; // edit mode me overwrite nahi karega
    if (!date || !weekendTypeId) return;
  
    const day = new Date(date).getDay(); // 0 = Sunday, 6 = Saturday
    if (day === 0 || day === 6) {
      setTypeOfDay(weekendTypeId);
    }
  }, [date, weekendTypeId, isEdit]);

  
  useEffect(() => {
    dispatch(GET_TYPE_OF_DAY_LIST());
    dispatch(GET_STATES_LIST());
  }, []);

  console.log('typeOfDay',typeOfDay);
  console.log('remoteState',remoteState);
  const validate = () => {
    if (!typeOfDay) {
      CustomToast.show("Please select Type of Day");
      return false;
    }

    if (isRemoteWork) {
      if (!remoteHours || Number(remoteHours) <= 0) {
        CustomToast.show("Enter valid remote work hours");
        return false;
      }

      if (Number(remoteHours) > 24) {
        CustomToast.show("Hours cannot exceed 24");
        return false;
      }

      if (!remoteState) {
        CustomToast.show("Please select work location (State)");
        return false;
      }
    }

    return true;
  };

  // navigation.navigate("AddMissingDay", {
  //   date: item.date,
  //   isEdit: true,
  //   data: item, // existing missing day object
  // });
  

  useEffect(() => {
    if (isEdit && editData) {
      setTypeOfDay(editData.typeOfDayId);
      setConfirmationNo(editData.confirmationNo || "");
      setIsCommissionDay(editData.isCommissionDay || false);
  
      setIsRemoteWork(editData.isRemoteWork || false);
      setRemoteHours(
        editData.isRemoteWork ? String(editData.remoteHours) : ""
      );
      setRemoteState(editData.stateId || null);
  
      setNotes(editData.notes || "");
    }
  }, [isEdit, editData]);

  // useEffect(() => {
  //   if (isEdit) return;
  
  //   const day = new Date(date).getDay();
  //   if (day === 0 || day === 6) {
  //     setTypeOfDay("Weekend");
  //   }
  // }, [date, isEdit]);
  

  /* -------------------- SAVE -------------------- */
  // const handleSave = () => {
  //   if (!validate()) return;

  //   const payload = {
  //     date,
  //     isMissingDay: true,
  //     typeOfDay,
  //     confirmationNumber: confirmationNo,
  //     isCommissionDay,
  //     isRemoteWork,
  //     remoteHours: isRemoteWork ? Number(remoteHours) : 0,
  //     remoteState: isRemoteWork ? remoteState : null,
  //     notes,
  //   };

  //   console.log("MISSING DAY PAYLOAD =>", payload);

  //   // dispatch(ADD_MISSING_DAY(payload)).then(() => {
  //   navigation.goBack();
  //   CustomToast.show("Missing Day Added Successfully");
  //   // });
  // };

  
  const createTripPayload = () => {
    const payload = {
      typeOfDayId: Number(typeOfDay),
      isRemoteWork: isRemoteWork,
      remoteHours: isRemoteWork ? Number(remoteHours) : 0,
      isCommissionDay: isCommissionDay,
      stateId: isRemoteWork ? Number(remoteState) : null,
      confirmationNo: confirmationNo,
      notes: notes,
    };

    if (!isEdit) {
      payload.date = new Date(date).toISOString().split("T")[0]
    }
  
    return payload;
  };
  
  const handleSave = () => {
    if (!validate()) return;

    const payload = createTripPayload();
    if (isEdit) {
      payload.id = editData?.id;
    }
    console.log("FINAL PAYLOAD =>", payload);
    const action = isEdit ? UPDATEMISSINGDAY(payload) : ADDMISSINGDAY(payload);

    setIsLoading(true);
    dispatch(action).then(({ response }) => {
      console.log('response==>', response);
      setIsLoading(false);
      if (response.success) {
        CustomToast.show(isEdit ? "MissingDay Updated Successfully!" : "MissingDay Added Successfully!");
       navigation.goBack();
      }
      else {
        CustomToast.show("Something Went Wrong!");
      }
    }).catch((error) => {
      setIsLoading(false);
      console.log(error);
      CustomToast.show(error?.toString() ?? 'something went wrong');

    });
  };

  return (
    <LinearGradient
      colors={["#9ab1fa", "#ffffff"]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0.8, y: 0.4 }}
      locations={[0.05, 0.55]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <Header title= {isEdit ? "Update Missing Day" : "Add Missing Day"} />

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.card}>

            <Text style={styles.sectionTitle}>
              {new Date(date).toDateString()}
            </Text>

            {/* Type of Day */}
            <Text style={styles.label}>Type of Day *</Text>
            <SelectList
              data={dayOptions}
              // setSelected={setTypeOfDay}
              setSelected={(val) => setTypeOfDay(val)}
              save="key"
              // defaultOption={
              //   typeOfDay ? { key: typeOfDay?.id, value: typeOfDay?.name } : null
              // }
              // defaultOption={
              //   isEdit && editData.typeOfDayId
              //     ? { key: editData.typeOfDay.id, value: editData.typeOfDay.name }
              //     : null
              // }
              defaultOption={
                typeOfDay
                  ? {
                      key: typeOfDay,
                      value: typeOfDayList?.find(i => i.id === typeOfDay)?.name
                    }
                  : null
              }
              search={false}
              boxStyles={styles.dropdownBox}
              inputStyles={styles.dropdownInput}
              dropdownStyles={styles.dropdownList}
              arrowicon={<FontAwesome name="chevron-down" size={12} />}
            />

            {/* Confirmation No */}
            <TextInput
              placeholder="Confirmation No (PNR / Ref No)"
              placeholderTextColor={'#000'}
              value={confirmationNo}
              onChangeText={setConfirmationNo}
              style={styles.input}
            />

            {/* Commission Day */}
            <Text style={styles.label}>Commission Day</Text>
            <View style={styles.toggleRow}>
              {["Yes", "No"].map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[
                    styles.toggleBtn,
                    isCommissionDay === (v === "Yes") &&
                      styles.toggleBtnActive,
                  ]}
                  onPress={() => setIsCommissionDay(v === "Yes")}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      isCommissionDay === (v === "Yes") &&
                        styles.toggleTextActive,
                    ]}
                  >
                    {v}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Remote Work */}
            <Text style={styles.label}>Remote Work</Text>
            <View style={styles.toggleRow}>
              {["Yes", "No"].map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[
                    styles.toggleBtn,
                    isRemoteWork === (v === "Yes") &&
                      styles.toggleBtnActive,
                  ]}
                  onPress={() => setIsRemoteWork(v === "Yes")}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      isRemoteWork === (v === "Yes") &&
                        styles.toggleTextActive,
                    ]}
                  >
                    {v}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {isRemoteWork && (
              <>
                <TextInput
                  placeholder="No. of Hours"
                  keyboardType="numeric"
                  placeholderTextColor={'#000'}
                  value={remoteHours}
                  onChangeText={setRemoteHours}
                  style={styles.input}
                />

                <Text style={styles.label}>Work Location (State)</Text>
                <SelectList
                  data={tripOptions}
                  // setSelected={setRemoteState}
                  setSelected={(val) => setRemoteState(val)}
                  defaultOption={
                    isEdit && editData.stateId
                      ? { key: editData.state.id, value: editData.state.name }
                      : null
                  }
                  save="key"
                  search={true}
                  boxStyles={styles.dropdownBox}
                  inputStyles={{
                    color: '#111',
                    fontSize: 14,
                  }}
                />
              </>
            )}

            <TextInput
              placeholder="Notes"
              value={notes}
              onChangeText={setNotes}
              multiline
              style={styles.notesBox}
              placeholderTextColor={'#000'}
            />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveText}> {isEdit ? "Update Missing Day" : "Save Missing Day"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const mapStateToProps = (state) => ({
  typeOfDayList: state.common.typeOfDayList,
  statesList: state.common.statesList,
})

export default connect(mapStateToProps)(AddMissingDayScreen);

const styles = StyleSheet.create({
    card: {
      margin: 15,
      backgroundColor: "#fff",
      borderRadius: 20,
      padding: 15,
    },
  
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: "#000",
      marginBottom: 20,
      textAlign: "center",
    },
  
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: "#000",
      marginBottom: 6,
      marginTop: 14,
    },
  
    input: {
      backgroundColor: "#F2F2F2",
      height: 55,
      borderRadius: 30,
      paddingHorizontal: 20,
      fontSize: 14,
      color: "#000",
      marginTop: 12,
    },
  
    notesBox: {
      backgroundColor: "#F2F2F2",
      minHeight: 120,
      borderRadius: 25,
      padding: 15,
      fontSize: 14,
      textAlignVertical: "top",
      marginTop: 14,
      color: "#000",
    },
  
    dropdownBox: {
      backgroundColor: "#F2F2F2",
      borderRadius: 30,
      borderWidth: 0,
      height: 55,
      alignItems: "center",
      marginTop: 4,
      placeholderTextColor:'#111',
    },
  
    dropdownInput: {
      color: "#000",
      fontSize: 14,
    },
  
    dropdownList: {
      backgroundColor: "#fff",
      borderRadius: 10,
    },
  
    toggleRow: {
      flexDirection: "row",
      marginTop: 6,
    },
  
    toggleBtn: {
      flex: 1,
      height: 48,
      borderRadius: 24,
      backgroundColor: "#F2F2F2",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 10,
    },
  
    toggleBtnActive: {
      backgroundColor: colors.primary,
    },
  
    toggleText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#555",
    },
  
    toggleTextActive: {
      color: "#fff",
    },
  
    saveBtn: {
      backgroundColor: colors.primary,
      height: 55,
      borderRadius: 30,
      justifyContent: "center",
      alignItems: "center",
      margin: 15,
    },
  
    saveText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
  });
  
