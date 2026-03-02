// import React, { useCallback, useEffect } from "react";
// import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
// import Ionicons from "react-native-vector-icons/Ionicons";
// import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
// import Feather from "react-native-vector-icons/Feather";
// import Header from '../components/Header';
// import { SafeAreaView } from "react-native-safe-area-context";
// import LinearGradient from "react-native-linear-gradient";
// import { connect, useDispatch } from "react-redux";
// import { DELETE_RESIDENCY_RECORD, GET_Document_Category_LIST, GET_RESIDENCY_RECORD_LIST } from "../redux/actions/action-creator";
// import { useNavigation } from "@react-navigation/native";
// import colors from "../theme/colors";
// import { CustomToast } from "../helpers/CommonHelpers";

// function ResidencyHistoryScreen({ documentCategoryList, GET_RESIDENCY_RECORD_LIST, ResidencydocumentList }) {
//     console.log('ResidencydocumentList', ResidencydocumentList);
//     const navigation = useNavigation();
//     const dispatch = useDispatch();
//     const groupedByYear = ResidencydocumentList.reduce((acc, item) => {
//         const year = new Date(item.issueDate).getFullYear();
//         if (!acc[year]) acc[year] = [];
//         acc[year].push(item);
//         return acc;
//     }, {});

//     const renderCard = (item) => (
//         <TouchableOpacity onPress={() =>
//             navigation.navigate("ResidencyRecordDetails", { id: item.id })
//         } key={item.id} style={styles.card}>


//             <View style={styles.iconBox}>
//                 <MaterialCommunityIcons
//                     name={item.category?.name === "domicile" ? "home-outline" : "file-document-outline"}
//                     size={26}
//                     color="#595959"
//                 />
//             </View>

//             <View style={{ flex: 1 }}>
//                 <Text style={styles.cardTitle}>{item.title}</Text>
//                 <Text style={styles.cardDate}>
//                     Issued: {new Date(item.issueDate).toDateString()}
//                 </Text>
//             </View>

//             <View style={styles.actionBtns}>
//                 <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editBtn}>
//                     <Feather name="edit" size={20} color="#3C95FF" />
//                 </TouchableOpacity>

//                 <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
//                     <Ionicons name="trash-outline" size={20} color="#E53935" />
//                 </TouchableOpacity>
//             </View>
//         </TouchableOpacity>
//     );

//     const API_Function = useCallback(
//         (startup = false) =>
//             new Promise((resolve, reject) => {
//                 dispatch(GET_Document_Category_LIST()).then(resolve).catch(reject);
//                 GET_RESIDENCY_RECORD_LIST().then(resolve).catch(reject);
//             }),
//         [
//             GET_Document_Category_LIST,
//             GET_RESIDENCY_RECORD_LIST,
//         ],
//     );
//     useEffect(() => {
//         const unsubscribe = navigation.addListener('focus', () => {
//             API_Function();

//         });
//         return unsubscribe;
//     }, [navigation]);

//     useEffect(() => {
//         API_Function();
//     }, [])
//     const handleDelete = (id) => {
//         Alert.alert(
//             "Delete Record",
//             "Are you sure you want to delete this record?",
//             [
//                 { text: "Cancel", style: "cancel" },
//                 {
//                     text: "Delete",
//                     style: "destructive",
//                     onPress: async () => {
//                         try {
//                             await dispatch(DELETE_RESIDENCY_RECORD(id));
//                             CustomToast.show("Record deleted successfully");
//                             await API_Function();
//                         } catch (error) {
//                             CustomToast.show("Failed to delete record");
//                         }
//                     },
//                 },
//             ]
//         );
//     };
//     const handleEdit = (item) => {
//         navigation.navigate("CreateResidencyRecord", {
//             editData: {
//                 ...item,
//                 categoryId: item.categoryId ?? item.category?.id,
//                 attachment: item.attachment_url ?? null
//             }
//         });
//     };



//     return (
//         <LinearGradient
//             colors={["#9ab1fa", "#ffffff"]}
//             start={{ x: 1, y: 0 }}
//             end={{ x: 0.8, y: 0.4 }}
//             locations={[0.05, 0.55]}
//             style={styles.container}
//         >
//             <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
//                 <Header title={'Residency Records'} />

//                 <ScrollView showsVerticalScrollIndicator={false}>
//                     <TouchableOpacity onPress={() => navigation.navigate("CreateResidencyRecord")} style={styles.addTripButton}>
//                         <Ionicons style={{ backgroundColor: colors.primary, borderRadius: 40 }} name="add" size={20} color={colors.white} />
//                         <Text style={styles.addTripText}>Add Record</Text>
//                     </TouchableOpacity>
//                     {/* <TouchableOpacity
//                         style={styles.addBtn}
//                         onPress={() => navigation.navigate("CreateResidencyRecord")}
//                     >
//                         <Ionicons name="add-circle-outline" size={22} color="#000" />
//                         <Text style={{ color: '#000', fontSize: 13 }}>{' '}Add Record</Text>
//                     </TouchableOpacity> */}
//                     {Object.keys(groupedByYear).map((year) => (
//                         <View key={year}>
//                             <View style={styles.yearRow}>
//                                 <Ionicons name="calendar-outline" size={20} color="#000" />
//                                 <Text style={styles.yearText}>{year}</Text>
//                             </View>

//                             {groupedByYear[year].map((item) => renderCard(item))}
//                         </View>
//                     ))}
//                     <View style={{ height: 60 }} />
//                 </ScrollView>
//             </SafeAreaView>
//         </LinearGradient>
//     );
// }

// function mapStateToProps(state) {
//     return {
//         loginToken: state.auth.loginToken,
//         userData: state.auth.userData,
//         documentCategoryList: state.common.documentCategoryList,
//         ResidencydocumentList: state.common.ResidencydocumentList,
//     };
// }

// const mapDispatchToProps = {
//     GET_Document_Category_LIST,
//     GET_RESIDENCY_RECORD_LIST,
//     DELETE_RESIDENCY_RECORD
// };

// export default connect(mapStateToProps, mapDispatchToProps)(ResidencyHistoryScreen);


// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         // backgroundColor: "#F2F2F7",
//         // paddingTop: 10,
//     },
//     yearRow: {
//         flexDirection: "row",
//         alignItems: "center",
//         marginTop: 15,
//         paddingHorizontal: 20,
//     },
//     yearText: {
//         fontSize: 18,
//         fontWeight: "700",
//         marginLeft: 10,
//         color: "#000",
//     },
//     card: {
//         flexDirection: "row",
//         backgroundColor: "#fff",
//         marginHorizontal: 15,
//         marginVertical: 8,
//         padding: 15,
//         borderRadius: 16,
//         alignItems: "center",
//         elevation: 1,
//         borderWidth: 1,
//         borderColor: '#E0E0E0'
//     },
//     iconBox: {
//         width: 48,
//         height: 48,
//         borderRadius: 24,
//         backgroundColor: "#E9E9E9",
//         justifyContent: "center",
//         alignItems: "center",
//         marginRight: 12,
//     },
//     cardTitle: {
//         fontSize: 15,
//         fontWeight: "500",
//         color: "#000",
//     },
//     cardDate: {
//         fontSize: 12,
//         // fontWeight: "500",
//         color: "#000",
//         marginTop: 3,
//     },
//     actionBtns: {
//         // flexDirection: "row",
//         alignItems: "center",
//         // gap: 10,
//     },
//     editBtn: { padding: 3 },
//     deleteBtn: { padding: 3 },
//     addTripButton: {
//         flexDirection: "row",
//         alignItems: "center",
//         // borderWidth: 1,
//         // borderColor: colors.primary,
//         borderRadius: 12,
//         paddingVertical: 5,
//         paddingHorizontal: 10,
//         backgroundColor: "#F1F1F1",
//         padding: 5,
//         // width: 100,
//         justifyContent: 'flex-end',
//         alignSelf: 'flex-end',
//         marginRight: 20
//     },
//     addTripText: {
//         color: '#000',
//         fontSize: 15,
//         fontWeight: "500",
//         marginLeft: 4,
//     },

// });


// import React, { useState, useEffect } from "react";
// import {
//     View,
//     Text,
//     TextInput,
//     StyleSheet,
//     TouchableOpacity,
//     ScrollView,
//     Platform,
//     ActivityIndicator,
//     KeyboardAvoidingView,
//     Switch,
//     Alert,
// } from "react-native";
// import Ionicons from "react-native-vector-icons/Ionicons";
// import DatePicker from "react-native-date-picker";
// import { pick } from "@react-native-documents/picker";
// import LinearGradient from "react-native-linear-gradient";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { Dropdown } from "react-native-element-dropdown";
// import Header from "../components/Header";
// import { connect, useDispatch } from "react-redux";
// import {
//     ADD_DOCUMENT_RECORD,
//     GET_Document_Category_LIST,
//     UPDATE_RESIDENCY_RECORD,
// } from "../redux/actions/action-creator";
// import { CustomToast, GOOGLE_KEY } from "../helpers/CommonHelpers";
// import colors from "../theme/colors";
// import { useNavigation, useRoute } from "@react-navigation/native";
// import GoogleAutoComplete from "../components/GoogleAutoComplete";

// // ==================== Reusable Components ====================

// const ToggleSection = ({ title, isEnabled, onToggle, children }) => (
//     <View style={styles.section}>
//         <View style={styles.toggleRow}>
//             <Text style={styles.sectionTitle}>{title}</Text>
//             <Switch
//                 trackColor={{ false: "#E0E0E0", true: colors.primary }}
//                 thumbColor={isEnabled ? "#fff" : "#f4f3f4"}
//                 onValueChange={onToggle}
//                 value={isEnabled}
//             />
//         </View>
//         {isEnabled && <View style={styles.sectionContent}>{children}</View>}
//     </View>
// );

// const InputField = ({ icon, placeholder, value, onChangeText, multiline, keyboardType }) => (
//     <View style={styles.inputContainer}>
//         <Ionicons name={icon} size={20} color="#9E9EA7" />
//         <TextInput
//             style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }]}
//             placeholder={placeholder}
//             placeholderTextColor="#A8A8A8"
//             value={value}
//             onChangeText={onChangeText}
//             multiline={multiline}
//             keyboardType={keyboardType}
//         />
//     </View>
// );

// const DateField = ({ icon, label, value, onPress }) => (
//     <TouchableOpacity onPress={onPress} style={styles.inputContainer}>
//         <Ionicons name={icon} size={20} color="#9E9EA7" />
//         <Text style={[styles.input, !value && styles.placeholder]}>
//             {value || label}
//         </Text>
//     </TouchableOpacity>
// );

// const DocumentPickerField = ({ onPick, fileName }) => (
//     <TouchableOpacity onPress={onPick} style={styles.inputContainer}>
//         <Ionicons name="cloud-upload-outline" size={20} color="#9E9EA7" />
//         <Text style={[styles.input, !fileName && styles.placeholder]}>
//             {fileName || "Upload PDF / Image"}
//         </Text>
//     </TouchableOpacity>
// );

// const YearsDropdown = ({ value, onChange }) => {
//     const years = ["1", "2", "3", "4", "5", "6+"];
//     return (
//         <View style={styles.dropdownContainer}>
//             {years.map((year) => (
//                 <TouchableOpacity
//                     key={year}
//                     style={[
//                         styles.yearChip,
//                         value === year && styles.yearChipSelected
//                     ]}
//                     onPress={() => onChange(year)}
//                 >
//                     <Text style={[
//                         styles.yearChipText,
//                         value === year && styles.yearChipTextSelected
//                     ]}>
//                         {year} {year !== "6+" ? "year" : "years"}
//                     </Text>
//                 </TouchableOpacity>
//             ))}
//         </View>
//     );
// };

// // ==================== Main Component ====================

// const ResidencyHistoryScreen = ({
//     documentCategoryList,
//     ADD_DOCUMENT_RECORD,
//     GET_Document_Category_LIST,
// }) => {
//     const navigation = useNavigation();
//     const route = useRoute();
//     const editData = route.params?.editData || null;
//     const dispatch = useDispatch();

//     const [isLoading, setIsLoading] = useState(false);
//     const [openDatePicker, setOpenDatePicker] = useState({ field: null, visible: false });

//     // ==================== Section States ====================
//     const [sections, setSections] = useState({
//         // Declaration of Residency / Domicile
//         declaration: {
//             enabled: false,
//             date: null
//         },

//         // Address of Record
//         addressOfRecord: {
//             enabled: false,
//             dateEstablished: null,
//             address: ""
//         },

//         // Property Ownership
//         propertyOwnership: {
//             enabled: false,
//             owns: false
//         },

//         // Property Exemptions
//         propertyExemptions: {
//             enabled: false,
//             startDate: null,
//             address: "",
//             type: ""
//         },

//         // Driver's License
//         driversLicense: {
//             enabled: false,
//             issueDate: null,
//             state: "",
//             number: "",
//             document: null
//         },

//         // Voting Registration
//         votingRegistration: {
//             enabled: false,
//             registrationDate: null,
//             state: "",
//             county: "",
//             city: "",
//             document: null
//         },

//         // Work Location
//         workLocation: {
//             enabled: false,
//             startDate: null,
//             address: "",
//             document: null
//         },

//         // Primary Doctor
//         primaryDoctor: {
//             enabled: false,
//             startDate: null,
//             address: ""
//         },

//         // Tax Filing
//         taxFiling: {
//             enabled: false,
//             lastFileDate: null,
//             state: "",
//             yearsFiled: ""
//         },

//         // Business Records
//         businessRecords: {
//             enabled: false,
//             name: "",
//             startDate: null,
//             regNumber: "",
//             document: null
//         },

//         // Others - Multiple entries
//         others: [] // Array of { type: "lease" | "title" | "insurance", data: {} }
//     });

//     const [secondHome, setSecondHome] = useState({
//         enabled: false,
//         dateEstablished: null,
//         address: "",
//         owns: false,
//         exemptions: false,
//         dissolutionDate: null
//     });

//     const [businessRecordsMulti, setBusinessRecordsMulti] = useState([]);

//     // ==================== Helper Functions ====================

//     const updateSection = (section, field, value) => {
//         setSections(prev => ({
//             ...prev,
//             [section]: {
//                 ...prev[section],
//                 [field]: value
//             }
//         }));
//     };

//     const addOtherEntry = (type) => {
//         setSections(prev => ({
//             ...prev,
//             others: [
//                 ...prev.others,
//                 {
//                     id: Date.now().toString(),
//                     type,
//                     startDate: null,
//                     details: "",
//                     document: null
//                 }
//             ]
//         }));
//     };

//     const removeOtherEntry = (id) => {
//         setSections(prev => ({
//             ...prev,
//             others: prev.others.filter(item => item.id !== id)
//         }));
//     };

//     const updateOtherEntry = (id, field, value) => {
//         setSections(prev => ({
//             ...prev,
//             others: prev.others.map(item =>
//                 item.id === id ? { ...item, [field]: value } : item
//             )
//         }));
//     };

//     const addBusinessRecord = () => {
//         setBusinessRecordsMulti(prev => [
//             ...prev,
//             {
//                 id: Date.now().toString(),
//                 name: "",
//                 startDate: null,
//                 regNumber: "",
//                 dissolutionDate: null,
//                 document: null
//             }
//         ]);
//     };

//     const removeBusinessRecord = (id) => {
//         setBusinessRecordsMulti(prev => prev.filter(item => item.id !== id));
//     };

//     const updateBusinessRecord = (id, field, value) => {
//         setBusinessRecordsMulti(prev => prev.map(item =>
//             item.id === id ? { ...item, [field]: value } : item
//         ));
//     };

//     const pickDocument = async (section, field) => {
//         try {
//             const res = await pick({ allowMultiSelection: false });
//             if (res?.[0]) {
//                 if (section === 'driversLicense') {
//                     updateSection('driversLicense', 'document', res[0]);
//                 } else if (section === 'votingRegistration') {
//                     updateSection('votingRegistration', 'document', res[0]);
//                 } else if (section === 'workLocation') {
//                     updateSection('workLocation', 'document', res[0]);
//                 } else if (section === 'businessRecords') {
//                     updateSection('businessRecords', 'document', res[0]);
//                 }
//             }
//         } catch (err) {
//             console.log("Picker Error:", err);
//         }
//     };

//     const pickOtherDocument = async (id) => {
//         try {
//             const res = await pick({ allowMultiSelection: false });
//             if (res?.[0]) {
//                 updateOtherEntry(id, 'document', res[0]);
//             }
//         } catch (err) {
//             console.log("Picker Error:", err);
//         }
//     };

//     const pickBusinessDocument = async (id) => {
//         try {
//             const res = await pick({ allowMultiSelection: false });
//             if (res?.[0]) {
//                 updateBusinessRecord(id, 'document', res[0]);
//             }
//         } catch (err) {
//             console.log("Picker Error:", err);
//         }
//     };

//     // ==================== Validation ====================

//     const validate = () => {
//         // Add your validation logic here
//         return true;
//     };

//     // ==================== Submit Handler ====================

//     const handleSubmit = async () => {
//         if (!validate()) return;
//         setIsLoading(true);

//         const formData = {
//             sections,
//             secondHome,
//             businessRecordsMulti,
//             createdAt: new Date().toISOString()
//         };

//         try {
//             if (editData) {
//                 await dispatch(UPDATE_RESIDENCY_RECORD(editData.id, formData));
//                 CustomToast.show("Record Updated Successfully!");
//             } else {
//                 await ADD_DOCUMENT_RECORD(formData);
//                 CustomToast.show("Record Added Successfully!");
//             }
//             navigation.goBack();
//         } catch (err) {
//             console.log("ERROR =>", err);
//             CustomToast.show("Something went wrong");
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     // ==================== Render ====================

//     return (
//         <LinearGradient
//             colors={["#9ab1fa", "#ffffff"]}
//             start={{ x: 1, y: 0 }}
//             end={{ x: 0.8, y: 0.4 }}
//             locations={[0.05, 0.55]}
//             style={{ flex: 1 }}
//         >
//             <View style={{ flex: 1, paddingTop: 50 }}>
//                 <Header title={editData ? "Edit Residency Record" : "Add Residency Record"} />
//                 <KeyboardAvoidingView
//                     behavior={Platform.OS === "ios" ? "padding" : undefined}
//                     style={{ flex: 1 }}
//                 >
//                     <ScrollView 
//                         contentContainerStyle={styles.formContainer}
//                         keyboardShouldPersistTaps="handled"
//                         showsVerticalScrollIndicator={false}
//                     >
//                         <View style={styles.whiteCard}>
                            
//                             {/* ========== DECLARATION OF RESIDENCY ========== */}
//                             <ToggleSection
//                                 title="Declaration of Residency / Domicile"
//                                 isEnabled={sections.declaration.enabled}
//                                 onToggle={(val) => updateSection('declaration', 'enabled', val)}
//                             >
//                                 <DateField
//                                     icon="calendar-outline"
//                                     label="Select Date of Declaration"
//                                     value={sections.declaration.date}
//                                     onPress={() => setOpenDatePicker({
//                                         field: 'declaration.date',
//                                         visible: true
//                                     })}
//                                 />
//                             </ToggleSection>

//                             {/* ========== ADDRESS OF RECORD ========== */}
//                             <ToggleSection
//                                 title="Address of Record"
//                                 isEnabled={sections.addressOfRecord.enabled}
//                                 onToggle={(val) => updateSection('addressOfRecord', 'enabled', val)}
//                             >
//                                 <DateField
//                                     icon="calendar-outline"
//                                     label="Select Date Established"
//                                     value={sections.addressOfRecord.dateEstablished}
//                                     onPress={() => setOpenDatePicker({
//                                         field: 'addressOfRecord.dateEstablished',
//                                         visible: true
//                                     })}
//                                 />
//                                 <GoogleAutoComplete
//                                     placeholder="Search Address"
//                                     apiKey={GOOGLE_KEY}
//                                     isResidence={true}
//                                     value={sections.addressOfRecord.address}
//                                     onSelect={(value) => updateSection('addressOfRecord', 'address', value)}
//                                 />
//                             </ToggleSection>

//                             {/* ========== PROPERTY OWNERSHIP ========== */}
//                             <ToggleSection
//                                 title="Property Ownership"
//                                 isEnabled={sections.propertyOwnership.enabled}
//                                 onToggle={(val) => updateSection('propertyOwnership', 'enabled', val)}
//                             >
//                                 <View style={styles.yesNoRow}>
//                                     <Text style={styles.label}>Do you own this property?</Text>
//                                     <View style={styles.yesNoButtons}>
//                                         <TouchableOpacity
//                                             style={[
//                                                 styles.yesNoButton,
//                                                 sections.propertyOwnership.owns === true && styles.yesNoButtonActive
//                                             ]}
//                                             onPress={() => updateSection('propertyOwnership', 'owns', true)}
//                                         >
//                                             <Text style={[
//                                                 styles.yesNoText,
//                                                 sections.propertyOwnership.owns === true && styles.yesNoTextActive
//                                             ]}>Yes</Text>
//                                         </TouchableOpacity>
//                                         <TouchableOpacity
//                                             style={[
//                                                 styles.yesNoButton,
//                                                 sections.propertyOwnership.owns === false && styles.yesNoButtonActive
//                                             ]}
//                                             onPress={() => updateSection('propertyOwnership', 'owns', false)}
//                                         >
//                                             <Text style={[
//                                                 styles.yesNoText,
//                                                 sections.propertyOwnership.owns === false && styles.yesNoTextActive
//                                             ]}>No</Text>
//                                         </TouchableOpacity>
//                                     </View>
//                                 </View>
//                             </ToggleSection>

//                             {/* ========== PROPERTY EXEMPTIONS ========== */}
//                             <ToggleSection
//                                 title="Property Exemptions"
//                                 isEnabled={sections.propertyExemptions.enabled}
//                                 onToggle={(val) => updateSection('propertyExemptions', 'enabled', val)}
//                             >
//                                 <DateField
//                                     icon="calendar-outline"
//                                     label="Select Start Date"
//                                     value={sections.propertyExemptions.startDate}
//                                     onPress={() => setOpenDatePicker({
//                                         field: 'propertyExemptions.startDate',
//                                         visible: true
//                                     })}
//                                 />
//                                 <GoogleAutoComplete
//                                     placeholder="Address of Record"
//                                     apiKey={GOOGLE_KEY}
//                                     isResidence={true}
//                                     value={sections.propertyExemptions.address}
//                                     onSelect={(value) => updateSection('propertyExemptions', 'address', value)}
//                                 />
//                                 <InputField
//                                     icon="document-text-outline"
//                                     placeholder="Exemption Type"
//                                     value={sections.propertyExemptions.type}
//                                     onChangeText={(val) => updateSection('propertyExemptions', 'type', val)}
//                                 />
//                             </ToggleSection>

//                             {/* ========== DRIVER'S LICENSE ========== */}
//                             <ToggleSection
//                                 title="Driver's License"
//                                 isEnabled={sections.driversLicense.enabled}
//                                 onToggle={(val) => updateSection('driversLicense', 'enabled', val)}
//                             >
//                                 <DateField
//                                     icon="calendar-outline"
//                                     label="Select Issue Date"
//                                     value={sections.driversLicense.issueDate}
//                                     onPress={() => setOpenDatePicker({
//                                         field: 'driversLicense.issueDate',
//                                         visible: true
//                                     })}
//                                 />
//                                 <InputField
//                                     icon="flag-outline"
//                                     placeholder="Issuing State"
//                                     value={sections.driversLicense.state}
//                                     onChangeText={(val) => updateSection('driversLicense', 'state', val)}
//                                 />
//                                 <InputField
//                                     icon="card-outline"
//                                     placeholder="License Number (Optional)"
//                                     value={sections.driversLicense.number}
//                                     onChangeText={(val) => updateSection('driversLicense', 'number', val)}
//                                 />
//                                 <DocumentPickerField
//                                     fileName={sections.driversLicense.document?.name}
//                                     onPick={() => pickDocument('driversLicense')}
//                                 />
//                                 <Text style={styles.disclaimer}>* Save document at your own risk</Text>
//                             </ToggleSection>

//                             {/* ========== VOTING REGISTRATION ========== */}
//                             <ToggleSection
//                                 title="Voting Registration"
//                                 isEnabled={sections.votingRegistration.enabled}
//                                 onToggle={(val) => updateSection('votingRegistration', 'enabled', val)}
//                             >
//                                 <DateField
//                                     icon="calendar-outline"
//                                     label="Select Registration Date"
//                                     value={sections.votingRegistration.registrationDate}
//                                     onPress={() => setOpenDatePicker({
//                                         field: 'votingRegistration.registrationDate',
//                                         visible: true
//                                     })}
//                                 />
//                                 <InputField
//                                     icon="flag-outline"
//                                     placeholder="Registered State"
//                                     value={sections.votingRegistration.state}
//                                     onChangeText={(val) => updateSection('votingRegistration', 'state', val)}
//                                 />
//                                 <InputField
//                                     icon="location-outline"
//                                     placeholder="Registered County"
//                                     value={sections.votingRegistration.county}
//                                     onChangeText={(val) => updateSection('votingRegistration', 'county', val)}
//                                 />
//                                 <InputField
//                                     icon="business-outline"
//                                     placeholder="Registered City"
//                                     value={sections.votingRegistration.city}
//                                     onChangeText={(val) => updateSection('votingRegistration', 'city', val)}
//                                 />
//                                 <DocumentPickerField
//                                     fileName={sections.votingRegistration.document?.name}
//                                     onPick={() => pickDocument('votingRegistration')}
//                                 />
//                                 <Text style={styles.disclaimer}>* Save document at your own risk</Text>
//                             </ToggleSection>

//                             {/* ========== WORK LOCATION ========== */}
//                             <ToggleSection
//                                 title="Work Location"
//                                 isEnabled={sections.workLocation.enabled}
//                                 onToggle={(val) => updateSection('workLocation', 'enabled', val)}
//                             >
//                                 <DateField
//                                     icon="calendar-outline"
//                                     label="Select Start Date"
//                                     value={sections.workLocation.startDate}
//                                     onPress={() => setOpenDatePicker({
//                                         field: 'workLocation.startDate',
//                                         visible: true
//                                     })}
//                                 />
//                                 <GoogleAutoComplete
//                                     placeholder="Work Address"
//                                     apiKey={GOOGLE_KEY}
//                                     isResidence={false}
//                                     value={sections.workLocation.address}
//                                     onSelect={(value) => updateSection('workLocation', 'address', value)}
//                                 />
//                                 <DocumentPickerField
//                                     fileName={sections.workLocation.document?.name}
//                                     onPick={() => pickDocument('workLocation')}
//                                 />
//                                 <Text style={styles.disclaimer}>* Save document at your own risk</Text>
//                             </ToggleSection>

//                             {/* ========== PRIMARY DOCTOR ========== */}
//                             <ToggleSection
//                                 title="Primary Doctor"
//                                 isEnabled={sections.primaryDoctor.enabled}
//                                 onToggle={(val) => updateSection('primaryDoctor', 'enabled', val)}
//                             >
//                                 <DateField
//                                     icon="calendar-outline"
//                                     label="Select Start Date"
//                                     value={sections.primaryDoctor.startDate}
//                                     onPress={() => setOpenDatePicker({
//                                         field: 'primaryDoctor.startDate',
//                                         visible: true
//                                     })}
//                                 />
//                                 <GoogleAutoComplete
//                                     placeholder="Doctor's Address"
//                                     apiKey={GOOGLE_KEY}
//                                     isResidence={false}
//                                     value={sections.primaryDoctor.address}
//                                     onSelect={(value) => updateSection('primaryDoctor', 'address', value)}
//                                 />
//                             </ToggleSection>

//                             {/* ========== TAX FILING ========== */}
//                             <ToggleSection
//                                 title="Tax Filing"
//                                 isEnabled={sections.taxFiling.enabled}
//                                 onToggle={(val) => updateSection('taxFiling', 'enabled', val)}
//                             >
//                                 <DateField
//                                     icon="calendar-outline"
//                                     label="Select Last File Date"
//                                     value={sections.taxFiling.lastFileDate}
//                                     onPress={() => setOpenDatePicker({
//                                         field: 'taxFiling.lastFileDate',
//                                         visible: true
//                                     })}
//                                 />
//                                 <InputField
//                                     icon="flag-outline"
//                                     placeholder="State (from signup)"
//                                     value={sections.taxFiling.state}
//                                     onChangeText={(val) => updateSection('taxFiling', 'state', val)}
//                                 />
//                                 <Text style={styles.label}>Years Filed</Text>
//                                 <YearsDropdown
//                                     value={sections.taxFiling.yearsFiled}
//                                     onChange={(val) => updateSection('taxFiling', 'yearsFiled', val)}
//                                 />
//                             </ToggleSection>

//                             {/* ========== BUSINESS RECORDS ========== */}
//                             <ToggleSection
//                                 title="Business Records"
//                                 isEnabled={sections.businessRecords.enabled}
//                                 onToggle={(val) => updateSection('businessRecords', 'enabled', val)}
//                             >
//                                 <InputField
//                                     icon="business-outline"
//                                     placeholder="Business Name"
//                                     value={sections.businessRecords.name}
//                                     onChangeText={(val) => updateSection('businessRecords', 'name', val)}
//                                 />
//                                 <DateField
//                                     icon="calendar-outline"
//                                     label="Select Start Date"
//                                     value={sections.businessRecords.startDate}
//                                     onPress={() => setOpenDatePicker({
//                                         field: 'businessRecords.startDate',
//                                         visible: true
//                                     })}
//                                 />
//                                 <InputField
//                                     icon="document-text-outline"
//                                     placeholder="Registration / File Number"
//                                     value={sections.businessRecords.regNumber}
//                                     onChangeText={(val) => updateSection('businessRecords', 'regNumber', val)}
//                                 />
//                                 <DocumentPickerField
//                                     fileName={sections.businessRecords.document?.name}
//                                     onPick={() => pickDocument('businessRecords')}
//                                 />
//                                 <Text style={styles.disclaimer}>* Save document at your own risk</Text>
//                             </ToggleSection>

//                             {/* ========== OTHERS (Multiple Entries) ========== */}
//                             <View style={styles.section}>
//                                 <Text style={styles.sectionTitle}>Others</Text>
                                
//                                 {/* Add Buttons for different types */}
//                                 <View style={styles.addButtonsRow}>
//                                     <TouchableOpacity
//                                         style={styles.addButton}
//                                         onPress={() => addOtherEntry('lease')}
//                                     >
//                                         <Ionicons name="add-circle" size={20} color={colors.primary} />
//                                         <Text style={styles.addButtonText}>Property Lease</Text>
//                                     </TouchableOpacity>
                                    
//                                     <TouchableOpacity
//                                         style={styles.addButton}
//                                         onPress={() => addOtherEntry('title')}
//                                     >
//                                         <Ionicons name="add-circle" size={20} color={colors.primary} />
//                                         <Text style={styles.addButtonText}>Vehicle Title</Text>
//                                     </TouchableOpacity>
                                    
//                                     <TouchableOpacity
//                                         style={styles.addButton}
//                                         onPress={() => addOtherEntry('insurance')}
//                                     >
//                                         <Ionicons name="add-circle" size={20} color={colors.primary} />
//                                         <Text style={styles.addButtonText}>Vehicle Insurance</Text>
//                                     </TouchableOpacity>
//                                 </View>

//                                 {/* Render Other Entries */}
//                                 {sections.others.map((item) => (
//                                     <View key={item.id} style={styles.otherEntry}>
//                                         <View style={styles.otherEntryHeader}>
//                                             <Text style={styles.otherEntryTitle}>
//                                                 {item.type === 'lease' ? 'Property Lease' :
//                                                  item.type === 'title' ? 'Vehicle Title' : 'Vehicle Insurance'}
//                                             </Text>
//                                             <TouchableOpacity
//                                                 onPress={() => removeOtherEntry(item.id)}
//                                             >
//                                                 <Ionicons name="close-circle" size={24} color="#E53935" />
//                                             </TouchableOpacity>
//                                         </View>
                                        
//                                         <DateField
//                                             icon="calendar-outline"
//                                             label="Start Date"
//                                             value={item.startDate}
//                                             onPress={() => setOpenDatePicker({
//                                                 field: `other.${item.id}.startDate`,
//                                                 visible: true
//                                             })}
//                                         />
                                        
//                                         <InputField
//                                             icon="document-text-outline"
//                                             placeholder="Details"
//                                             value={item.details}
//                                             onChangeText={(val) => updateOtherEntry(item.id, 'details', val)}
//                                         />
                                        
//                                         <DocumentPickerField
//                                             fileName={item.document?.name}
//                                             onPick={() => pickOtherDocument(item.id)}
//                                         />
//                                     </View>
//                                 ))}
//                             </View>

//                             {/* ========== SECOND HOME ========== */}
//                             <View style={styles.section}>
//                                 <View style={styles.toggleRow}>
//                                     <Text style={styles.sectionTitle}>Second Home</Text>
//                                     <Switch
//                                         trackColor={{ false: "#E0E0E0", true: colors.primary }}
//                                         thumbColor={secondHome.enabled ? "#fff" : "#f4f3f4"}
//                                         onValueChange={(val) => setSecondHome(prev => ({ ...prev, enabled: val }))}
//                                         value={secondHome.enabled}
//                                     />
//                                 </View>
                                
//                                 {secondHome.enabled && (
//                                     <View style={styles.sectionContent}>
//                                         <DateField
//                                             icon="calendar-outline"
//                                             label="Date Established"
//                                             value={secondHome.dateEstablished}
//                                             onPress={() => setOpenDatePicker({
//                                                 field: 'secondHome.dateEstablished',
//                                                 visible: true
//                                             })}
//                                         />
                                        
//                                         <GoogleAutoComplete
//                                             placeholder="Address"
//                                             apiKey={GOOGLE_KEY}
//                                             isResidence={true}
//                                             value={secondHome.address}
//                                             onSelect={(value) => setSecondHome(prev => ({ ...prev, address: value }))}
//                                         />
                                        
//                                         <View style={styles.yesNoRow}>
//                                             <Text style={styles.label}>Do you own this property?</Text>
//                                             <View style={styles.yesNoButtons}>
//                                                 <TouchableOpacity
//                                                     style={[
//                                                         styles.yesNoButton,
//                                                         secondHome.owns === true && styles.yesNoButtonActive
//                                                     ]}
//                                                     onPress={() => setSecondHome(prev => ({ ...prev, owns: true }))}
//                                                 >
//                                                     <Text style={[
//                                                         styles.yesNoText,
//                                                         secondHome.owns === true && styles.yesNoTextActive
//                                                     ]}>Yes</Text>
//                                                 </TouchableOpacity>
//                                                 <TouchableOpacity
//                                                     style={[
//                                                         styles.yesNoButton,
//                                                         secondHome.owns === false && styles.yesNoButtonActive
//                                                     ]}
//                                                     onPress={() => setSecondHome(prev => ({ ...prev, owns: false }))}
//                                                 >
//                                                     <Text style={[
//                                                         styles.yesNoText,
//                                                         secondHome.owns === false && styles.yesNoTextActive
//                                                     ]}>No</Text>
//                                                 </TouchableOpacity>
//                                             </View>
//                                         </View>
                                        
//                                         <View style={styles.yesNoRow}>
//                                             <Text style={styles.label}>Property Exemptions?</Text>
//                                             <View style={styles.yesNoButtons}>
//                                                 <TouchableOpacity
//                                                     style={[
//                                                         styles.yesNoButton,
//                                                         secondHome.exemptions === true && styles.yesNoButtonActive
//                                                     ]}
//                                                     onPress={() => setSecondHome(prev => ({ ...prev, exemptions: true }))}
//                                                 >
//                                                     <Text style={[
//                                                         styles.yesNoText,
//                                                         secondHome.exemptions === true && styles.yesNoTextActive
//                                                     ]}>Yes</Text>
//                                                 </TouchableOpacity>
//                                                 <TouchableOpacity
//                                                     style={[
//                                                         styles.yesNoButton,
//                                                         secondHome.exemptions === false && styles.yesNoButtonActive
//                                                     ]}
//                                                     onPress={() => setSecondHome(prev => ({ ...prev, exemptions: false }))}
//                                                 >
//                                                     <Text style={[
//                                                         styles.yesNoText,
//                                                         secondHome.exemptions === false && styles.yesNoTextActive
//                                                     ]}>No</Text>
//                                                 </TouchableOpacity>
//                                             </View>
//                                         </View>
                                        
//                                         {!secondHome.exemptions && (
//                                             <DateField
//                                                 icon="calendar-outline"
//                                                 label="Dissolution Date (Optional)"
//                                                 value={secondHome.dissolutionDate}
//                                                 onPress={() => setOpenDatePicker({
//                                                     field: 'secondHome.dissolutionDate',
//                                                     visible: true
//                                                 })}
//                                             />
//                                         )}
//                                     </View>
//                                 )}
//                             </View>

//                             {/* ========== MULTIPLE BUSINESS RECORDS ========== */}
//                             <View style={styles.section}>
//                                 <Text style={styles.sectionTitle}>Business Records (Multiple States)</Text>
                                
//                                 <TouchableOpacity
//                                     style={styles.addBusinessButton}
//                                     onPress={addBusinessRecord}
//                                 >
//                                     <Ionicons name="add-circle" size={24} color={colors.primary} />
//                                     <Text style={styles.addBusinessText}>Add Business Record</Text>
//                                 </TouchableOpacity>

//                                 {businessRecordsMulti.map((business) => (
//                                     <View key={business.id} style={styles.businessEntry}>
//                                         <View style={styles.otherEntryHeader}>
//                                             <Text style={styles.businessEntryTitle}>Business Record</Text>
//                                             <TouchableOpacity
//                                                 onPress={() => removeBusinessRecord(business.id)}
//                                             >
//                                                 <Ionicons name="close-circle" size={24} color="#E53935" />
//                                             </TouchableOpacity>
//                                         </View>
                                        
//                                         <View style={styles.yesNoRow}>
//                                             <Text style={styles.label}>Registered active business?</Text>
//                                             <View style={styles.yesNoButtons}>
//                                                 <TouchableOpacity
//                                                     style={[
//                                                         styles.yesNoButton,
//                                                         business.isActive === true && styles.yesNoButtonActive
//                                                     ]}
//                                                     onPress={() => updateBusinessRecord(business.id, 'isActive', true)}
//                                                 >
//                                                     <Text style={[
//                                                         styles.yesNoText,
//                                                         business.isActive === true && styles.yesNoTextActive
//                                                     ]}>Yes</Text>
//                                                 </TouchableOpacity>
//                                                 <TouchableOpacity
//                                                     style={[
//                                                         styles.yesNoButton,
//                                                         business.isActive === false && styles.yesNoButtonActive
//                                                     ]}
//                                                     onPress={() => updateBusinessRecord(business.id, 'isActive', false)}
//                                                 >
//                                                     <Text style={[
//                                                         styles.yesNoText,
//                                                         business.isActive === false && styles.yesNoTextActive
//                                                     ]}>No</Text>
//                                                 </TouchableOpacity>
//                                             </View>
//                                         </View>
                                        
//                                         {business.isActive && (
//                                             <>
//                                                 <InputField
//                                                     icon="business-outline"
//                                                     placeholder="Business Name"
//                                                     value={business.name}
//                                                     onChangeText={(val) => updateBusinessRecord(business.id, 'name', val)}
//                                                 />
                                                
//                                                 <DateField
//                                                     icon="calendar-outline"
//                                                     label="Start Date"
//                                                     value={business.startDate}
//                                                     onPress={() => setOpenDatePicker({
//                                                         field: `business.${business.id}.startDate`,
//                                                         visible: true
//                                                     })}
//                                                 />
                                                
//                                                 <InputField
//                                                     icon="document-text-outline"
//                                                     placeholder="Registration / File Number"
//                                                     value={business.regNumber}
//                                                     onChangeText={(val) => updateBusinessRecord(business.id, 'regNumber', val)}
//                                                 />
                                                
//                                                 <DocumentPickerField
//                                                     fileName={business.document?.name}
//                                                     onPick={() => pickBusinessDocument(business.id)}
//                                                 />
                                                
//                                                 <DateField
//                                                     icon="calendar-outline"
//                                                     label="Dissolution Date (Optional)"
//                                                     value={business.dissolutionDate}
//                                                     onPress={() => setOpenDatePicker({
//                                                         field: `business.${business.id}.dissolutionDate`,
//                                                         visible: true
//                                                     })}
//                                                 />
//                                             </>
//                                         )}
//                                     </View>
//                                 ))}
//                             </View>

//                             {/* ========== SUBMIT BUTTON ========== */}
//                             <TouchableOpacity
//                                 onPress={handleSubmit}
//                                 style={styles.saveButton}
//                                 disabled={isLoading}
//                             >
//                                 {isLoading ? (
//                                     <ActivityIndicator color="#fff" />
//                                 ) : (
//                                     <Text style={styles.saveText}>
//                                         {editData ? "Update Record" : "Save Record"}
//                                     </Text>
//                                 )}
//                             </TouchableOpacity>
//                         </View>
//                     </ScrollView>
//                 </KeyboardAvoidingView>

//                 {/* ========== DATE PICKER MODAL ========== */}
//                 <DatePicker
//                     modal
//                     mode="date"
//                     open={openDatePicker.visible}
//                     date={new Date()}
//                     onConfirm={(date) => {
//                         const [section, field] = openDatePicker.field.split('.');
//                         if (section === 'other') {
//                             updateOtherEntry(field, 'startDate', date.toISOString().slice(0, 10));
//                         } else if (section === 'business') {
//                             const [id, businessField] = field.split('.');
//                             updateBusinessRecord(id, businessField, date.toISOString().slice(0, 10));
//                         } else if (section === 'secondHome') {
//                             setSecondHome(prev => ({ ...prev, [field]: date.toISOString().slice(0, 10) }));
//                         } else {
//                             updateSection(section, field, date.toISOString().slice(0, 10));
//                         }
//                         setOpenDatePicker({ field: null, visible: false });
//                     }}
//                     onCancel={() => setOpenDatePicker({ field: null, visible: false })}
//                 />
//             </View>
//         </LinearGradient>
//     );
// };

// // ==================== Styles ====================

// const styles = StyleSheet.create({
//     formContainer: {
//         paddingBottom: 20,
//     },
//     whiteCard: {
//         padding: 20,
//         shadowColor: "#000",
//         shadowOpacity: 0.08,
//         shadowRadius: 15,
//         elevation: 3,
//     },
//     section: {
//         marginBottom: 24,
//         backgroundColor: '#fff',
//         borderRadius: 16,
//         padding: 16,
//         borderWidth: 1,
//         borderColor: '#F0F0F0',
//     },
//     toggleRow: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginBottom: 12,
//     },
//     sectionTitle: {
//         fontSize: 16,
//         fontWeight: '700',
//         color: '#333',
//         flex: 1,
//     },
//     sectionContent: {
//         marginTop: 12,
//     },
//     inputContainer: {
//         flexDirection: "row",
//         alignItems: "center",
//         backgroundColor: "#F8F8F8",
//         borderRadius: 12,
//         paddingHorizontal: 16,
//         minHeight: 52,
//         borderWidth: 1,
//         borderColor: '#F0F0F0',
//         marginBottom: 12,
//     },
//     input: {
//         flex: 1,
//         fontSize: 14,
//         color: "#000",
//         marginLeft: 12,
//         paddingVertical: 12,
//     },
//     placeholder: {
//         color: "#A8A8A8",
//         fontSize: 14,
//         marginLeft: 12,
//     },
//     label: {
//         fontSize: 14,
//         fontWeight: "600",
//         color: "#666",
//         marginBottom: 8,
//     },
//     yesNoRow: {
//         marginBottom: 16,
//     },
//     yesNoButtons: {
//         flexDirection: 'row',
//         marginTop: 8,
//     },
//     yesNoButton: {
//         flex: 1,
//         paddingVertical: 12,
//         backgroundColor: '#F5F5F5',
//         borderRadius: 8,
//         marginRight: 8,
//         alignItems: 'center',
//         borderWidth: 1,
//         borderColor: '#E0E0E0',
//     },
//     yesNoButtonActive: {
//         backgroundColor: colors.primary,
//         borderColor: colors.primary,
//     },
//     yesNoText: {
//         fontSize: 14,
//         fontWeight: '600',
//         color: '#666',
//     },
//     yesNoTextActive: {
//         color: '#fff',
//     },
//     disclaimer: {
//         fontSize: 12,
//         color: '#999',
//         fontStyle: 'italic',
//         marginTop: 4,
//         marginBottom: 8,
//     },
//     dropdownContainer: {
//         flexDirection: 'row',
//         flexWrap: 'wrap',
//         marginBottom: 12,
//     },
//     yearChip: {
//         paddingHorizontal: 16,
//         paddingVertical: 10,
//         backgroundColor: '#F5F5F5',
//         borderRadius: 20,
//         marginRight: 8,
//         marginBottom: 8,
//         borderWidth: 1,
//         borderColor: '#E0E0E0',
//     },
//     yearChipSelected: {
//         backgroundColor: colors.primary,
//         borderColor: colors.primary,
//     },
//     yearChipText: {
//         fontSize: 14,
//         color: '#666',
//     },
//     yearChipTextSelected: {
//         color: '#fff',
//     },
//     addButtonsRow: {
//         flexDirection: 'row',
//         flexWrap: 'wrap',
//         marginBottom: 16,
//     },
//     addButton: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         backgroundColor: '#F5F5F5',
//         paddingHorizontal: 12,
//         paddingVertical: 8,
//         borderRadius: 20,
//         marginRight: 8,
//         marginBottom: 8,
//         borderWidth: 1,
//         borderColor: '#E0E0E0',
//     },
//     addButtonText: {
//         fontSize: 13,
//         color: '#666',
//         marginLeft: 4,
//     },
//     otherEntry: {
//         backgroundColor: '#FAFAFA',
//         borderRadius: 12,
//         padding: 16,
//         marginBottom: 16,
//         borderWidth: 1,
//         borderColor: '#F0F0F0',
//     },
//     otherEntryHeader: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginBottom: 12,
//     },
//     otherEntryTitle: {
//         fontSize: 15,
//         fontWeight: '600',
//         color: '#333',
//     },
//     addBusinessButton: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'center',
//         backgroundColor: '#F5F5F5',
//         padding: 12,
//         borderRadius: 12,
//         marginBottom: 16,
//         borderWidth: 1,
//         borderColor: colors.primary,
//         borderStyle: 'dashed',
//     },
//     addBusinessText: {
//         fontSize: 15,
//         color: colors.primary,
//         fontWeight: '600',
//         marginLeft: 8,
//     },
//     businessEntry: {
//         backgroundColor: '#FAFAFA',
//         borderRadius: 12,
//         padding: 16,
//         marginBottom: 16,
//         borderWidth: 1,
//         borderColor: '#F0F0F0',
//     },
//     businessEntryTitle: {
//         fontSize: 15,
//         fontWeight: '600',
//         color: colors.primary,
//     },
//     saveButton: {
//         backgroundColor: colors.primary,
//         paddingVertical: 16,
//         borderRadius: 30,
//         alignItems: "center",
//         marginTop: 20,
//         marginBottom: 30,
//     },
//     saveText: {
//         color: "#fff",
//         fontWeight: "700",
//         fontSize: 16,
//     },
// });

// function mapStateToProps(state) {
//     return {
//         documentCategoryList: state.common.documentCategoryList,
//     };
// }

// export default connect(mapStateToProps, {
//     GET_Document_Category_LIST,
//     ADD_DOCUMENT_RECORD,
// })(ResidencyHistoryScreen);


// screens/ResidencyHistoryScreen.js
import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { connect, useDispatch } from "react-redux";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Header from '../components/Header';
import ResidencySection from '../components/ResidencySection';
import {
    GET_RESIDENCY_RECORD_LIST,
    DELETE_RESIDENCY_RECORD,
    UPDATE_RESIDENCY_RECORD,
} from "../redux/actions/action-creator";
import colors from "../theme/colors";
import { CustomToast } from "../helpers/CommonHelpers";

const ResidencyHistoryScreen = ({ 
    ResidencydocumentList,
    GET_RESIDENCY_RECORD_LIST,
    UPDATE_RESIDENCY_RECORD,
    DELETE_RESIDENCY_RECORD 
}) => {
    const navigation = useNavigation();
    const dispatch = useDispatch();

    // Load data when screen focuses
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        await GET_RESIDENCY_RECORD_LIST();
    };

    // Get the residency data (assuming first item or handle accordingly)
    const residencyData = ResidencydocumentList?.[0] || {};

    const handleSectionToggle = async (section, value) => {
        // Update local state or API
        const updatedData = {
            ...residencyData,
            [section]: {
                ...residencyData[section],
                enabled: value
            }
        };
        
        try {
            await UPDATE_RESIDENCY_RECORD(residencyData.id, updatedData);
            await loadData();
        } catch (error) {
            CustomToast.show("Failed to update");
        }
    };

    const handleSectionPress = (section, sectionData) => {
        if (sectionData?.enabled) {
            // If enabled, navigate to details
            navigation.navigate("ResidencyRecordDetails", { 
                section,
                data: sectionData 
            });
        } else {
            // If disabled, navigate to add form for this section
            navigation.navigate("CreateResidencyRecord", {
                section,
                mode: 'add'
            });
        }
    };

    const handleAddMultiple = (section) => {
        navigation.navigate("CreateResidencyRecord", {
            section,
            mode: 'add_multiple'
        });
    };

    const handleDelete = (id) => {
        Alert.alert(
            "Delete Record",
            "Are you sure you want to delete this record?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await DELETE_RESIDENCY_RECORD(id);
                            CustomToast.show("Record deleted successfully");
                            await loadData();
                        } catch (error) {
                            CustomToast.show("Failed to delete record");
                        }
                    },
                },
            ]
        );
    };

    return (
        <LinearGradient
            colors={["#9ab1fa", "#ffffff"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.8, y: 0.4 }}
            locations={[0.05, 0.55]}
            style={styles.container}
        >
            <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
                <Header title={'Residency Records'} />

                <ScrollView showsVerticalScrollIndicator={false}>
                    
                    {/* Declaration of Residency */}
                    <ResidencySection
                        title="Declaration of Residency / Domicile"
                        isEnabled={residencyData.declaration?.enabled}
                        onToggle={(val) => handleSectionToggle('declaration', val)}
                        onPress={() => handleSectionPress('declaration', residencyData.declaration)}
                        values={residencyData.declaration}
                    />

                    {/* Address of Record */}
                    <ResidencySection
                        title="Address of Record"
                        isEnabled={residencyData.addressOfRecord?.enabled}
                        onToggle={(val) => handleSectionToggle('addressOfRecord', val)}
                        onPress={() => handleSectionPress('addressOfRecord', residencyData.addressOfRecord)}
                        values={residencyData.addressOfRecord}
                    />

                    {/* Property Ownership */}
                    <ResidencySection
                        title="Property Ownership"
                        isEnabled={residencyData.propertyOwnership?.enabled}
                        onToggle={(val) => handleSectionToggle('propertyOwnership', val)}
                        onPress={() => handleSectionPress('propertyOwnership', residencyData.propertyOwnership)}
                        values={residencyData.propertyOwnership}
                    />

                    {/* Property Exemptions */}
                    <ResidencySection
                        title="Property Exemptions"
                        isEnabled={residencyData.propertyExemptions?.enabled}
                        onToggle={(val) => handleSectionToggle('propertyExemptions', val)}
                        onPress={() => handleSectionPress('propertyExemptions', residencyData.propertyExemptions)}
                        values={residencyData.propertyExemptions}
                    />

                    {/* Driver's License */}
                    <ResidencySection
                        title="Driver's License"
                        isEnabled={residencyData.driversLicense?.enabled}
                        onToggle={(val) => handleSectionToggle('driversLicense', val)}
                        onPress={() => handleSectionPress('driversLicense', residencyData.driversLicense)}
                        values={residencyData.driversLicense}
                    />

                    {/* Voting Registration */}
                    <ResidencySection
                        title="Voting Registration"
                        isEnabled={residencyData.votingRegistration?.enabled}
                        onToggle={(val) => handleSectionToggle('votingRegistration', val)}
                        onPress={() => handleSectionPress('votingRegistration', residencyData.votingRegistration)}
                        values={residencyData.votingRegistration}
                    />

                    {/* Work Location */}
                    <ResidencySection
                        title="Work Location"
                        isEnabled={residencyData.workLocation?.enabled}
                        onToggle={(val) => handleSectionToggle('workLocation', val)}
                        onPress={() => handleSectionPress('workLocation', residencyData.workLocation)}
                        values={residencyData.workLocation}
                    />

                    {/* Primary Doctor */}
                    <ResidencySection
                        title="Primary Doctor"
                        isEnabled={residencyData.primaryDoctor?.enabled}
                        onToggle={(val) => handleSectionToggle('primaryDoctor', val)}
                        onPress={() => handleSectionPress('primaryDoctor', residencyData.primaryDoctor)}
                        values={residencyData.primaryDoctor}
                    />

                    {/* Tax Filing */}
                    <ResidencySection
                        title="Tax Filing"
                        isEnabled={residencyData.taxFiling?.enabled}
                        onToggle={(val) => handleSectionToggle('taxFiling', val)}
                        onPress={() => handleSectionPress('taxFiling', residencyData.taxFiling)}
                        values={residencyData.taxFiling}
                    />

                    {/* Business Records */}
                    <ResidencySection
                        title="Business Records"
                        isEnabled={residencyData.businessRecords?.enabled}
                        onToggle={(val) => handleSectionToggle('businessRecords', val)}
                        onPress={() => handleSectionPress('businessRecords', residencyData.businessRecords)}
                        values={residencyData.businessRecords}
                        showAddMultiple={residencyData.businessRecords?.enabled}
                        onAddMultiple={() => handleAddMultiple('businessRecords')}
                    />

                    {/* Others Section with Multiple Entries */}
                    <View style={styles.multipleSection}>
                        <Text style={styles.multipleSectionTitle}>Others</Text>
                        
                        {residencyData.others?.map((item, index) => (
                            <ResidencySection
                                key={item.id || index}
                                title={
                                    item.type === 'lease' ? 'Property Lease' :
                                    item.type === 'title' ? 'Vehicle Title' : 'Vehicle Insurance'
                                }
                                isEnabled={true}
                                showToggle={false}
                                onPress={() => navigation.navigate("ResidencyRecordDetails", { 
                                    section: 'others',
                                    data: item 
                                })}
                                values={item}
                            />
                        ))}

                        <TouchableOpacity 
                            style={styles.addOtherButton}
                            onPress={() => navigation.navigate("CreateResidencyRecord", {
                                section: 'others',
                                mode: 'add'
                            })}
                        >
                            <Ionicons name="add-circle" size={24} color={colors.primary} />
                            <Text style={styles.addOtherText}>Add Other Record</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Second Home */}
                    <ResidencySection
                        title="Second Home"
                        isEnabled={residencyData.secondHome?.enabled}
                        onToggle={(val) => handleSectionToggle('secondHome', val)}
                        onPress={() => handleSectionPress('secondHome', residencyData.secondHome)}
                        values={residencyData.secondHome}
                    />

                    <View style={{ height: 60 }} />
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    multipleSection: {
        marginTop: 16,
        marginBottom: 8,
    },
    multipleSectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginLeft: 16,
        marginBottom: 12,
        color: "#000",
    },
    addOtherButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        padding: 16,
        borderRadius: 16,
        marginHorizontal: 16,
        marginTop: 8,
        borderWidth: 1,
        borderColor: colors.primary,
        borderStyle: 'dashed',
    },
    addOtherText: {
        fontSize: 15,
        color: colors.primary,
        fontWeight: '600',
        marginLeft: 12,
    },
});

function mapStateToProps(state) {
    return {
        ResidencydocumentList: state.common.ResidencydocumentList,
    };
}

export default connect(mapStateToProps, {
    GET_RESIDENCY_RECORD_LIST,
    UPDATE_RESIDENCY_RECORD,
    DELETE_RESIDENCY_RECORD,
})(ResidencyHistoryScreen);