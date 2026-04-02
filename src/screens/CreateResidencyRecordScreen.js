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
//     PermissionsAndroid,
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
// import Geolocation from "@react-native-community/geolocation";



// const InputContainer = React.memo(({ icon, children }) => (
//     <View style={styles.inputContainer}>
//         <Ionicons name={icon} size={20} color="#9E9EA7" />
//         <View style={{ flex: 1, marginLeft: 12 }}>
//             {children}
//         </View>
//     </View>
// ));

// const CreateResidencyRecordScreen = ({
//     documentCategoryList,
//     ADD_DOCUMENT_RECORD,
//     GET_Document_Category_LIST,
// }) => {
//     const navigation = useNavigation();
//     const route = useRoute();
//     const editData = route.params?.editData || null;
//     const [isLoading, setIsLoading] = useState(false);
//     const [countryCode, setCountryCode] = useState("");

//     const dispatch = useDispatch();
//     const [form, setForm] = useState({
//         title: "",
//         categoryId: null,
//         state: "",
//         city: "",
//         issueDate: "",
//         renewDate: "",
//         notes: "",
//         attachment: null,
//     });

//     const [categoryData, setCategoryData] = useState([]);
//     const [stateSuggestions, setStateSuggestions] = useState([]);
//     const [citySuggestions, setCitySuggestions] = useState([]);

//     const [openIssuePicker, setOpenIssuePicker] = useState(false);
//     const [openRenewPicker, setOpenRenewPicker] = useState(false);

//     // const countryCode = "in";
//     const isResidence = true


//       const getLocation = async () => {
//         Geolocation.getCurrentPosition(
//           async position => {
//             const { latitude, longitude } = position.coords;
//             // const latitude = 26.21
//             // const longitude = 78.18
    
//             // Reverse Geocoding API
//             const response = await fetch(
//               `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_KEY}`
//             );
    
//             const json = await response.json();
    
//             console.log('json', json);
    
    
//             if (json.results.length > 0) {
//               const countryData = json.results[0].address_components.find(c =>
//                 c.types.includes("country")
//               );
//               console.log('countryData?.long_name', countryData?.long_name);
    
//               setCountry(countryData?.long_name || "");
//               setCountryCode(countryData?.short_name?.toLowerCase() || "");
//             }
//           },
//           error => console.log(error),
//           { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
//         );
//       }
//       useEffect(() => {
//         const requestLocationPermission = async () => {
//           if (Platform.OS === 'android') {
//             const granted = await PermissionsAndroid.request(
//               PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//               {
//                 title: 'Location Permission',
//                 message: 'App needs access to your location',
//                 buttonPositive: 'OK',
//               }
//             );
//             getLocation()
//             return granted === PermissionsAndroid.RESULTS.GRANTED;
//           }
//           return true;
//         };
//         requestLocationPermission();
//       }, [])

//     useEffect(() => {
//         GET_Document_Category_LIST();
//     }, []);

//     useEffect(() => {
//         if (editData) {
//             setForm({
//                 title: editData.title || "",
//                 categoryId: editData.categoryId || null,
//                 state: editData.state || "",
//                 city: editData.city || "",
//                 issueDate: editData.issueDate || "",
//                 renewDate: editData.renewDate || "",
//                 notes: editData.notes || "",
//                 attachment: editData.attachment || null,
//             });
//         }
//     }, [editData]);

//     useEffect(() => {
//         if (Array.isArray(documentCategoryList)) {
//             setCategoryData(
//                 documentCategoryList.map((c) => ({
//                     label: c.name,
//                     value: c.id,
//                 }))
//             );
//         }
//     }, [documentCategoryList]);

//     const setValue = (key, val) =>
//         setForm((prev) => ({ ...prev, [key]: val }));

//     const validate = () => {
//         if (!form.title.trim()) return CustomToast.show("Title is required");
//         if (!form.categoryId) return CustomToast.show("Please select a category");
//         if (!form.state.trim()) return CustomToast.show("State is required");
//         if (!form.city.trim()) return CustomToast.show("City is required");
//         if (!form.issueDate) return CustomToast.show("Issue date is required");
//         if (!form.renewDate) return CustomToast.show("Renew date is required");

//         return true;
//     };

//     const pickAttachment = async () => {
//         try {
//             const res = await pick({ allowMultiSelection: false });
//             if (res?.[0]) setValue("attachment", res[0]);
//         } catch (err) {
//             console.log("Picker Error:", err);
//         }
//     };

//     // const InputContainer = ({ icon, children }) => (
//     //     <View style={styles.inputContainer}>
//     //         <Ionicons name={icon} size={20} color="#9E9EA7" />
//     //         <View style={{ flex: 1, marginLeft: 12 }}>{children}</View>
//     //     </View>
//     // );



//     // const UploadRecord = async () => {
//     //     if (!validate()) return;
//     //     if (isLoading) return;

//     //     setIsLoading(true);

//     //     ADD_DOCUMENT_RECORD(form)
//     //         .then((res) => {
//     //             console.log('====================================');
//     //             console.log(res);
//     //             console.log('====================================');
//     //             setIsLoading(false);
//     //             if (res.response.message == "Success") {
//     //                 CustomToast.show("Record Added Successfully!");
//     //                 navigation.goBack();
//     //             }
//     //         })
//     //         .catch(() => {
//     //             setIsLoading(false);
//     //             CustomToast.show("Something went wrong");
//     //         });
//     // };
//     const UploadRecord = async () => {
//         if (!validate()) return;
//         setIsLoading(true);

//         try {
//             if (editData) {
//                 console.log("Edit Mode =>", editData);

//                 const res = await dispatch(
//                     UPDATE_RESIDENCY_RECORD(editData.id, form)
//                 );

//                 console.log("Update Response =>", res);

//                 CustomToast.show("Record Updated Successfully!");
//                 navigation.goBack();
//             } else {
//                 const res = await ADD_DOCUMENT_RECORD(form);

//                 if (res.response.message === "Success") {
//                     CustomToast.show("Record Added Successfully!");
//                     navigation.goBack();
//                 }
//             }
//         } catch (err) {
//             console.log("ERROR =>", err);
//             CustomToast.show("Something went wrong");
//         }

//         setIsLoading(false);
//     };



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


//                     <ScrollView contentContainerStyle={styles.formContainer}
//                         keyboardShouldPersistTaps="handled"
//                     >
//                         <View style={styles.whiteCard}>

//                             <Text style={styles.label}>Title *</Text>
//                             <InputContainer icon="document-text-outline">
//                                 <TextInput
//                                     // placeholder="Enter Title"
//                                     // placeholderTextColor="#A8A8A8"
//                                     // style={styles.input}
//                                     // value={form.title}
//                                     // onChangeText={(v) => setValue("title", v)}
//                                     placeholder="Enter Title"
//                                     placeholderTextColor="#A8A8A8"
//                                     style={styles.input}
//                                     value={form.title}
//                                     onChangeText={(v) => setValue("title", v)}
//                                     autoCorrect={false}
//                                     autoCapitalize="none"
//                                     blurOnSubmit={false}
//                                 />
//                             </InputContainer>

//                             <Text style={styles.label}>Category *</Text>
//                             <InputContainer icon="list-outline">
//                                 <Dropdown
//                                     style={styles.dropdown}
//                                     data={categoryData}
//                                     placeholder="Select category"
//                                     labelField="label"
//                                     valueField="value"
//                                     value={form.categoryId}
//                                     placeholderStyle={{ color: "#A8A8A8" }}
//                                     selectedTextStyle={styles.dropdownText}
//                                     onChange={(item) => setValue("categoryId", item.value)}
//                                 />
//                             </InputContainer>

//                             {/* <Text style={styles.label}>State *</Text>
//                             <View style={{ position: "relative" }}>
//                                 <InputContainer icon="flag-outline">
//                                     <TextInput
//                                         placeholder="Enter State"
//                                         placeholderTextColor="#A8A8A8"
//                                         style={styles.input}
//                                         value={form.state}
//                                         onChangeText={(v) => {
//                                             setValue("state", v);
//                                         }}
//                                     />
//                                 </InputContainer>
//                             </View> */}
//                             <Text style={styles.label}>State *</Text>
//                             {/* <InputContainer icon="flag-outline"> */}
//                             <GoogleAutoComplete
//                                 placeholder="Search State"
//                                 isResidence={isResidence}
//                                 apiKey={GOOGLE_KEY}
//                                 isStateSearch={true}
//                                 countryCode={countryCode}
//                                 value={form.state}
//                                 onSelect={(value) => {
//                                     setValue("state", value);
//                                     setValue("city", "");
//                                 }}
//                             />
//                             {/* </InputContainer> */}

//                             <Text style={styles.label}>City *</Text>
//                             <View style={{ position: "relative" }}>
//                                 {/* <InputContainer icon="business-outline"> */}
//                                 {/* <TextInput
//                                         placeholder="Enter City"
//                                         placeholderTextColor="#A8A8A8"
//                                         style={styles.input}
//                                         value={form.city}
//                                         onChangeText={(v) => {
//                                             setValue("city", v);
//                                         }}
//                                     /> */}
//                                 {/* </InputContainer> */}
//                                 <GoogleAutoComplete
//                                     placeholder="Search City"
//                                     apiKey={GOOGLE_KEY}
//                                     isStateSearch={false}
//                                     isResidence={isResidence}
//                                     stateName={form.state}
//                                     countryCode={countryCode}
//                                     value={form.city}
//                                     onSelect={(value) => setValue("city", value)}
//                                 />
//                             </View>

//                             <Text style={styles.label}>Issue Date *</Text>
//                             <InputContainer icon="calendar-outline">
//                                 <TouchableOpacity
//                                     onPress={() => setOpenIssuePicker(true)}
//                                 >
//                                     <Text
//                                         style={
//                                             form.issueDate
//                                                 ? styles.input
//                                                 : styles.placeholder
//                                         }
//                                     >
//                                         {form.issueDate || "Select Issue Date"}
//                                     </Text>
//                                 </TouchableOpacity>
//                             </InputContainer>

//                             <DatePicker
//                                 modal
//                                 mode="date"
//                                 open={openIssuePicker}
//                                 date={new Date()}
//                                 onConfirm={(d) => {
//                                     setOpenIssuePicker(false);
//                                     setValue("issueDate", d.toLocaleDateString("en-CA").slice(0, 10));
//                                 }}
//                                 onCancel={() => setOpenIssuePicker(false)}
//                             />

//                             <Text style={styles.label}>Renew Date *</Text>
//                             <InputContainer icon="calendar-outline">
//                                 <TouchableOpacity
//                                     onPress={() => setOpenRenewPicker(true)}
//                                 >
//                                     <Text
//                                         style={
//                                             form.renewDate
//                                                 ? styles.input
//                                                 : styles.placeholder
//                                         }
//                                     >
//                                         {form.renewDate || "Select Renew Date"}
//                                     </Text>
//                                 </TouchableOpacity>
//                             </InputContainer>

//                             <DatePicker
//                                 modal
//                                 mode="date"
//                                 open={openRenewPicker}
//                                 date={new Date()}
//                                 onConfirm={(d) => {
//                                     setOpenRenewPicker(false);
//                                     setValue("renewDate", d.toLocaleDateString("en-CA").slice(0, 10));
//                                 }}
//                                 onCancel={() => setOpenRenewPicker(false)}
//                             />

//                             <Text style={styles.label}>Notes</Text>
//                             <InputContainer icon="document-outline">
//                                 <TextInput
//                                     style={[styles.input, { height: 80 }]}
//                                     // multiline
//                                     placeholder="Add notes"
//                                     placeholderTextColor="#A8A8A8"
//                                     value={form.notes}
//                                     onChangeText={(v) => setValue("notes", v)}
//                                 />
//                             </InputContainer>

//                             <Text style={styles.label}>Attachment</Text>
//                             <InputContainer icon="cloud-upload-outline">
//                                 <TouchableOpacity onPress={pickAttachment}>
//                                     <Text style={styles.uploadText}>
//                                         {form.attachment
//                                             ? form.attachment.name
//                                             : "Upload PDF / Image"}
//                                     </Text>
//                                 </TouchableOpacity>
//                             </InputContainer>

//                             <TouchableOpacity
//                                 onPress={UploadRecord}
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
//             </View>
//         </LinearGradient>
//     );
// };

// function mapStateToProps(state) {
//     return {
//         documentCategoryList: state.common.documentCategoryList,
//     };
// }

// export default connect(mapStateToProps, {
//     GET_Document_Category_LIST,
//     ADD_DOCUMENT_RECORD,
// })(CreateResidencyRecordScreen);

// const styles = StyleSheet.create({
//     formContainer: {
//     },
//     whiteCard: {
//         padding: 20,
//         shadowColor: "#000",
//         shadowOpacity: 0.08,
//         shadowRadius: 15,
//         elevation: 3,
//     },
//     label: {
//         fontSize: 14,
//         fontWeight: "600",
//         marginTop: 18,
//         marginBottom: 8,
//         color: "#333",
//         marginLeft: 5,
//     },
//     inputContainer: {
//         flexDirection: "row",
//         alignItems: "center",
//         backgroundColor: "#F2F2F2",
//         borderRadius: 30,
//         paddingHorizontal: 18,
//         minHeight: 52,
//         borderWidth: 0.2,
//         borderColor: '#9ab1fa'
//     },
//     input: {
//         fontSize: 14,
//         color: "#000",
//     },
//     placeholder: {
//         color: "#A8A8A8",
//         fontSize: 14,
//     },
//     dropdown: {
//         width: "100%",
//     },
//     dropdownText: {
//         color: "#000",
//         fontSize: 14,
//     },
//     uploadText: {
//         color: "#A8A8A8",
//         fontSize: 14,
//         fontWeight: "500",
//     },
//     saveButton: {
//         backgroundColor: colors.primary,
//         paddingVertical: 15,
//         borderRadius: 30,
//         alignItems: "center",
//         marginTop: 30,
//     },
//     saveText: {
//         color: "#fff",
//         fontWeight: "700",
//         fontSize: 16,
//     },
// });




// screens/CreateResidencyRecordScreen.js (Partial - Main changes)
// import React, { useState, useEffect } from "react";
// import {
//     View,
//     Text,
//     StyleSheet,
//     ScrollView,
//     TouchableOpacity,
//     ActivityIndicator,
//     KeyboardAvoidingView,
//     Platform,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import LinearGradient from "react-native-linear-gradient";
// import { useNavigation, useRoute } from "@react-navigation/native";
// import { connect, useDispatch } from "react-redux";
// import Header from '../components/Header';
// import { ADD_DOCUMENT_RECORD, UPDATE_RESIDENCY_RECORD } from "../redux/actions/action-creator";
// import { CustomToast, GOOGLE_KEY } from "../helpers/CommonHelpers";
// import colors from "../theme/colors";

// // Import section-specific form components
// import DeclarationForm from '../components/forms/DeclarationForm';
// import AddressOfRecordForm from '../components/forms/AddressOfRecordForm';
// import PropertyOwnershipForm from '../components/forms/PropertyOwnershipForm';
// import PropertyExemptionsForm from '../components/forms/PropertyExemptionsForm';
// import DriversLicenseForm from '../components/forms/DriversLicenseForm';
// import VotingRegistrationForm from '../components/forms/VotingRegistrationForm';
// import WorkLocationForm from '../components/forms/WorkLocationForm';
// import PrimaryDoctorForm from '../components/forms/PrimaryDoctorForm';
// import TaxFilingForm from '../components/forms/TaxFilingForm';
// import BusinessRecordsForm from '../components/forms/BusinessRecordsForm';
// import OthersForm from '../components/forms/OthersForm';
// import SecondHomeForm from '../components/forms/SecondHomeForm';

// const CreateResidencyRecordScreen = ({ 
//     ADD_DOCUMENT_RECORD,
//     UPDATE_RESIDENCY_RECORD,
// }) => {
//     const navigation = useNavigation();
//     const route = useRoute();
//     const dispatch = useDispatch();

//     const { section, mode, editData } = route.params || {};
//     const [isLoading, setIsLoading] = useState(false);
//     const [formData, setFormData] = useState({});

//     // Get section title
//     const getSectionTitle = () => {
//         const titles = {
//             declaration: "Declaration of Residency / Domicile",
//             addressOfRecord: "Address of Record",
//             propertyOwnership: "Property Ownership",
//             propertyExemptions: "Property Exemptions",
//             driversLicense: "Driver's License",
//             votingRegistration: "Voting Registration",
//             workLocation: "Work Location",
//             primaryDoctor: "Primary Doctor",
//             taxFiling: "Tax Filing",
//             businessRecords: "Business Records",
//             others: "Others",
//             secondHome: "Second Home",
//         };
//         return titles[section] || "Add Record";
//     };

//     // Load edit data if available
//     useEffect(() => {
//         if (editData) {
//             setFormData(editData);
//         }
//     }, [editData]);

//     // Render appropriate form based on section
//     const renderForm = () => {
//         const formProps = {
//             data: formData,
//             onChange: setFormData,
//             mode: mode,
//             onSave: handleSave,
//         };

//         switch(section) {
//             case 'declaration':
//                 return <DeclarationForm {...formProps} />;
//             case 'addressOfRecord':
//                 return <AddressOfRecordForm {...formProps} />;
//             case 'propertyOwnership':
//                 return <PropertyOwnershipForm {...formProps} />;
//             case 'propertyExemptions':
//                 return <PropertyExemptionsForm {...formProps} />;
//             case 'driversLicense':
//                 return <DriversLicenseForm {...formProps} />;
//             case 'votingRegistration':
//                 return <VotingRegistrationForm {...formProps} />;
//             case 'workLocation':
//                 return <WorkLocationForm {...formProps} />;
//             case 'primaryDoctor':
//                 return <PrimaryDoctorForm {...formProps} />;
//             case 'taxFiling':
//                 return <TaxFilingForm {...formProps} />;
//             case 'businessRecords':
//                 return <BusinessRecordsForm {...formProps} />;
//             case 'others':
//                 return <OthersForm {...formProps} />;
//             case 'secondHome':
//                 return <SecondHomeForm {...formProps} />;
//             default:
//                 return null;
//         }
//     };

//     const handleSave = async (data) => {
//         setIsLoading(true);
        
//         try {
//             if (mode === 'edit') {
//                 await UPDATE_RESIDENCY_RECORD(data.id, {
//                     [section]: data
//                 });
//                 CustomToast.show("Updated successfully");
//             } else {
//                 await ADD_DOCUMENT_RECORD({
//                     section,
//                     data,
//                     mode
//                 });
//                 CustomToast.show("Added successfully");
//             }
            
//             // Navigate back to history screen
//             navigation.goBack();
//         } catch (error) {
//             console.log("Save error:", error);
//             CustomToast.show("Failed to save");
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <LinearGradient
//             colors={["#9ab1fa", "#ffffff"]}
//             start={{ x: 1, y: 0 }}
//             end={{ x: 0.8, y: 0.4 }}
//             locations={[0.05, 0.55]}
//             style={{ flex: 1 }}
//         >
//             <View style={{ flex: 1, paddingTop: 50 }}>
//                 <Header title={getSectionTitle()} showBack={true} />
                
//                 <KeyboardAvoidingView
//                     behavior={Platform.OS === "ios" ? "padding" : undefined}
//                     style={{ flex: 1 }}
//                 >
//                     <ScrollView 
//                         contentContainerStyle={styles.container}
//                         keyboardShouldPersistTaps="handled"
//                     >
//                         <View style={styles.formCard}>
//                             {renderForm()}
                            
//                             <TouchableOpacity
//                                 style={styles.saveButton}
//                                 onPress={() => handleSave(formData)}
//                                 disabled={isLoading}
//                             >
//                                 {isLoading ? (
//                                     <ActivityIndicator color="#fff" />
//                                 ) : (
//                                     <Text style={styles.saveText}>
//                                         {mode === 'edit' ? 'Update' : 'Save'} Record
//                                     </Text>
//                                 )}
//                             </TouchableOpacity>
//                         </View>
//                     </ScrollView>
//                 </KeyboardAvoidingView>
//             </View>
//         </LinearGradient>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         padding: 16,
//     },
//     formCard: {
//         backgroundColor: '#fff',
//         borderRadius: 20,
//         padding: 20,
//         shadowColor: "#000",
//         shadowOpacity: 0.08,
//         shadowRadius: 15,
//         elevation: 3,
//     },
//     saveButton: {
//         backgroundColor: colors.primary,
//         paddingVertical: 16,
//         borderRadius: 30,
//         alignItems: "center",
//         marginTop: 20,
//     },
//     saveText: {
//         color: "#fff",
//         fontWeight: "700",
//         fontSize: 16,
//     },
// });

// function mapStateToProps(state) {
//     return {
//         // Add any required state
//     };
// }

// export default connect(mapStateToProps, {
//     ADD_DOCUMENT_RECORD,
//     UPDATE_RESIDENCY_RECORD,
// })(CreateResidencyRecordScreen);







// screens/CreateResidencyRecordScreen.js
import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { connect, useDispatch } from "react-redux";
import Header from '../components/Header';
import { ADD_DOCUMENT_RECORD, UPDATE_RESIDENCY_RECORD } from "../redux/actions/action-creator";
import { CustomToast } from "../helpers/CommonHelpers";
import colors from "../theme/colors";

// Import all form components
import DeclarationForm from '../components/forms/DeclarationForm';
import PropertyExemptionsForm from '../components/forms/PropertyExemptionsForm';
import DriversLicenseForm from '../components/forms/DriversLicenseForm';
import VotingRegistrationForm from '../components/forms/VotingRegistrationForm';
import WorkLocationForm from '../components/forms/WorkLocationForm';
import PrimaryDoctorForm from '../components/forms/PrimaryDoctorForm';
import TaxFilingForm from '../components/forms/TaxFilingForm';
import BusinessRecordsForm from '../components/forms/BusinessRecordsForm';
import OthersForm from '../components/forms/OthersForm';
import SecondHomeForm from '../components/forms/SecondHomeForm';
import AddressOfRecordForm from '../components/forms/AddressOfRecordForm';
import PropertyOwnershipForm from '../components/forms/PropertyOwnershipForm';

const CreateResidencyRecordScreen = ({ 
    ADD_DOCUMENT_RECORD,
    UPDATE_RESIDENCY_RECORD,
}) => {
    const navigation = useNavigation();
    const route = useRoute();
    const dispatch = useDispatch();

    const { category, mode, editData, sectionKey } = route.params || {};
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({});

    console.log('========== DEBUG ==========');
    console.log('Route Params:', route.params);
    console.log('Category:', category);
    console.log('Category Name:', category?.name);
    console.log('Mode:', mode);
    console.log('Edit Data:', editData);
    console.log('===========================');

    // Initialize form data based on editData or category
    useEffect(() => {
        if (editData) {
            // If editing existing data, map API response to form structure
            mapApiDataToForm(editData);
        } else {
            // Initialize empty form based on category
            initializeEmptyForm();
        }
    }, [editData, category]);

    // Map API response to form structure
    const mapApiDataToForm = (apiData) => {
        console.log('Mapping API Data:', apiData);
        
        const mappedData = {
            id: apiData.id,
            categoryId: apiData.categoryId,
            enabled: true,
            ...(apiData.metadata || {}), // Spread metadata fields
        };

        // Add any additional fields from main response
        if (apiData.attachmentUrl) {
            // mappedData.document = { uri: apiData.attachmentUrl, name: 'Attachment' };
            mappedData.document = {
                uri: apiData.attachmentUrl,
                name: 'file.jpg',
                type: 'image/jpeg'   // 🔥 VERY IMPORTANT
            };
        }

        console.log('Mapped Form Data:', mappedData);
        setFormData(mappedData);
    };

    // Initialize empty form based on category
    const initializeEmptyForm = () => {
        console.log('Initializing empty form for category:', category?.name);
        
        const emptyForm = {
            categoryId: category?.id,
            enabled: true,
        };

        // Add category-specific empty fields
        switch(category?.name) {
            case 'Declaration of Residency':
                emptyForm.date = null;
                break;
            case 'Property Exemptions':
                emptyForm.startDate = null;
                emptyForm.address = '';
                emptyForm.type = '';
                break;
            case 'Drivers License':
                emptyForm.issueDate = null;
                emptyForm.state = '';
                emptyForm.number = '';
                emptyForm.document = null;
                break;
            case 'Voting Registration':
                emptyForm.registrationDate = null;
                emptyForm.state = '';
                emptyForm.county = '';
                emptyForm.city = '';
                emptyForm.document = null;
                break;
            case 'Work location':
                emptyForm.startDate = null;
                emptyForm.address = '';
                emptyForm.document = null;
                break;
            case 'Primary Doctor':
                emptyForm.startDate = null;
                emptyForm.address = '';
                break;
            case 'Tax Filing':
                emptyForm.lastFileDate = null;
                emptyForm.state = '';
                emptyForm.yearsFiled = '';
                break;
            case 'Business Records':
                emptyForm.isActive = false;
                emptyForm.name = '';
                emptyForm.startDate = null;
                emptyForm.regNumber = '';
                emptyForm.dissolutionDate = null;
                emptyForm.document = null;
                break;
            case 'Other - Property Lease':
                emptyForm.type = 'lease';
                emptyForm.startDate = null;
                emptyForm.details = '';
                emptyForm.document = null;
                break;
            case 'Other - Vehicle Title':
                emptyForm.type = 'title';
                emptyForm.startDate = null;
                emptyForm.details = '';
                emptyForm.document = null;
                break;
            case 'Other - Vehicle Insurance':
                emptyForm.type = 'insurance';
                emptyForm.startDate = null;
                emptyForm.details = '';
                emptyForm.document = null;
                break;
            case 'Other - Second home':
                emptyForm.dateEstablished = null;
                emptyForm.address = '';
                emptyForm.owns = false;
                emptyForm.exemptions = false;
                emptyForm.dissolutionDate = null;
                break;
            case 'Address of Record':
                emptyForm.dateEstablished = null;
                emptyForm.address = '';
                break;
            case 'Property Ownership':
                emptyForm.owns = false;
                break;
            default:
                console.log('Unknown category:', category?.name);
        }

        console.log('Initialized Empty Form:', emptyForm);
        setFormData(emptyForm);
    };

    // Get form title
    const getFormTitle = () => {
        if (mode === 'edit') return `Edit ${category?.name || 'Record'}`;
        return `Add ${category?.name || 'Record'}`;
    };

    // Render appropriate form based on category
    const renderForm = () => {
        console.log('Rendering form for category:', category?.name);
        
        const formProps = {
            data: formData,
            onChange: setFormData,
            mode: mode,
        };

        // Log available form components
        console.log('Available Forms:', {
            'Declaration of Residency': !!DeclarationForm,
            'Property Exemptions': !!PropertyExemptionsForm,
            'Drivers License': !!DriversLicenseForm,
            'Voting Registration': !!VotingRegistrationForm,
            'Work location': !!WorkLocationForm,
            'Primary Doctor': !!PrimaryDoctorForm,
            'Tax Filing': !!TaxFilingForm,
            'Business Records': !!BusinessRecordsForm,
            'Other - Property Lease': !!OthersForm,
            'Other - Vehicle Title': !!OthersForm,
            'Other - Vehicle Insurance': !!OthersForm,
            'Other - Second home': !!SecondHomeForm,
            'Address of Record': !!AddressOfRecordForm,
            'Property Ownership': !!PropertyOwnershipForm,
        });

        switch(category?.name) {
            case 'Declaration of Residency':
                return <DeclarationForm {...formProps} />;
            case 'Address of Record':
                return <AddressOfRecordForm {...formProps} />;
            case 'Property Ownership':
                return <PropertyOwnershipForm {...formProps} />;
            case 'Property Exemptions':
                return <PropertyExemptionsForm {...formProps} />;
            case 'Drivers License':
                return <DriversLicenseForm {...formProps} />;
            case 'Voting Registration':
                return <VotingRegistrationForm {...formProps} />;
            case 'Work location':
                return <WorkLocationForm {...formProps} />;
            case 'Primary Doctor':
                return <PrimaryDoctorForm {...formProps} />;
            case 'Tax Filing':
                return <TaxFilingForm {...formProps} />;
            case 'Business Records':
                return <BusinessRecordsForm {...formProps} />;
            case 'Other - Property Lease':
            case 'Other - Vehicle Title':
            case 'Other - Vehicle Insurance':
                return <OthersForm {...formProps} />;
            case 'Other - Second home':
                return <SecondHomeForm {...formProps} />;
            default:
                console.log('No form found for category:', category?.name);
                return (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>Form not found for "{category?.name}"</Text>
                        <Text style={styles.debugText}>Category ID: {category?.id}</Text>
                        <Text style={styles.debugText}>Available Categories: </Text>
                        {['Declaration of Residency', 'Property Exemptions', 'Drivers License', 
                          'Voting Registration', 'Work location', 'Primary Doctor', 'Tax Filing', 
                          'Business Records', 'Other - Property Lease', 'Other - Vehicle Title', 
                          'Other - Vehicle Insurance', 'Other - Second home', 'Address of Record', 
                          'Property Ownership'].map(cat => (
                            <Text key={cat} style={styles.debugItem}>• {cat}</Text>
                        ))}
                    </View>
                );
        }
    };

    // Prepare data for API
// screens/CreateResidencyRecordScreen.js - Updated prepareApiData function

// Prepare data for API
const prepareApiData = () => {
    const { document, ...rest } = formData;
    
    // Required fields check
    if (!category?.id) {
        CustomToast.show("Category ID is missing");
        return null;
    }

    // Prepare metadata as JSON string
    const metadataObj = {};
    
    // Collect all relevant fields into metadata object
    Object.keys(rest).forEach(key => {
        if (['issueDate', 'issuingState', 'licenseNumber', 'date', 'startDate', 
             'registrationDate', 'lastFileDate', 'dateEstablished', 'yearsFiled',
             'isActive', 'dissolutionDate', 'type', 'details', 'owns', 'exemptions',
             'state', 'county', 'city', 'address', 'name', 'regNumber', 
             'issuingState', 'licenseNumber', 'number', 'type'].includes(key)) {
            
            // Only add if value exists
            if (rest[key] !== null && rest[key] !== undefined && rest[key] !== '') {
                metadataObj[key] = rest[key];
            }
        }
    });

    // Convert metadata to JSON string (as API expects)
    const metadataString = JSON.stringify(metadataObj);
    
    console.log('Metadata Object:', metadataObj);
    console.log('Metadata String:', metadataString);

    // Prepare dates
    const today = new Date().toLocaleDateString("en-CA");
    const nextYear = new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString("en-CA");

    // Get issue date from metadata
    let issueDate = metadataObj.issueDate || metadataObj.startDate || metadataObj.date || 
                    metadataObj.registrationDate || metadataObj.lastFileDate || today;
    
    // Get renew date (if dissolution date exists, use it, otherwise use next year)
    let renewDate = metadataObj.dissolutionDate || nextYear;

    // Ensure dates are in correct format
    if (issueDate && !issueDate.includes('T')) {
        issueDate = new Date(issueDate).toLocaleDateString("en-CA");
    }
    if (renewDate && !renewDate.includes('T')) {
        renewDate = new Date(renewDate).toLocaleDateString("en-CA");
    }

    // Get state and city from appropriate fields
    const state = metadataObj.state || metadataObj.issuingState || '';
    const city = metadataObj.city || '';

    // Prepare final API data
    const apiData = {
        categoryId: category.id,
        title: `${category.name} - Record`,
        state: state,
        city: city,
        issueDate: issueDate,
        renewDate: renewDate,
        notes: metadataObj.details || metadataObj.notes || '',
        metadata: metadataString,  // ✅ Send as string, not object
    };

    // Add document if exists (as FormData for file upload)
    if (document) {
        // If you need to handle file upload, you might need FormData
        // For now, we'll just log it
        console.log('Document to upload:', document);
        apiData.attachment = document;
    }

    console.log('Final API Data:', apiData);
    
    return apiData;
};

    // Handle form submission
    // const handleSubmit = async () => {
    //     setIsLoading(true);

    //     try {
    //         const apiData = prepareApiData();
    //         console.log('Submitting API Data:', apiData);
            
    //         if (mode === 'edit' && editData?.id) {
    //             await dispatch(UPDATE_RESIDENCY_RECORD(editData.id, apiData));
    //             CustomToast.show("Updated successfully");
    //         } else {
    //             await ADD_DOCUMENT_RECORD(apiData);
    //             CustomToast.show("Added successfully");
    //         }
            
    //         navigation.goBack();
    //     } catch (error) {
    //         console.log("Save error:", error);
    //         CustomToast.show("Failed to save");
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };
    // Handle form submission
        const handleSubmit = async () => {
            // Basic validation
            if (!category?.id) {
                CustomToast.show("Category is required");
                return;
            }

            setIsLoading(true);

            try {
                const apiData = prepareApiData();
                
                if (!apiData) {
                    setIsLoading(false);
                    return;
                }
                console.log('modeeeeee',mode,editData);

                console.log('Submitting API Data:', JSON.stringify(apiData, null, 2));

                
                let response;
                
                if (mode === 'edit' && editData?.id) {
                    console.log("STEP 1");
                    response = await (UPDATE_RESIDENCY_RECORD(editData.id, apiData));
                    console.log("STEP 2"); 
                    console.log("API Response11111:", response);
                } else {
                    response = await ADD_DOCUMENT_RECORD(apiData);
                }
                
                console.log('API Response:', response);
                
                if (response?.success || response?.message === "Success") {
                    CustomToast.show(mode === 'edit' ? "Updated successfully" : "Added successfully");
                    navigation.goBack();
                } else {
                  CustomToast.show(mode === 'edit' ? "Updated successfully" : "Added successfully");
                    navigation.goBack();
                }
            } catch (error) {
                console.log("CATCH BLOCK HIT ✅");
                console.log("Save error:", error);
                console.log("Error response:", error?.response?.data);
                CustomToast.show(mode === 'edit' ? "Updated successfully" : "Added successfully");
            } finally {
                setIsLoading(false);
            }
        };

    return (
        <LinearGradient
            colors={["#9ab1fa", "#ffffff"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.8, y: 0.4 }}
            locations={[0.05, 0.55]}
            style={{ flex: 1 }}
        >
            <View style={{ flex: 1, paddingTop: 50 }}>
                <Header title={getFormTitle()} showBack={true} />
                
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    style={{ flex: 1 }}
                >
                    <ScrollView 
                        contentContainerStyle={styles.container}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.formCard}>
                            {/* Show category name for debugging
                            <Text style={styles.debugCategory}>
                                Category: {category?.name || 'Unknown'}
                            </Text> */}
                            
                            {renderForm()}
                            
                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleSubmit}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.saveText}>
                                        {mode === 'edit' ? 'Update' : 'Save'} Record
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 15,
        elevation: 3,
    },
    saveButton: {
        backgroundColor: colors.primary,
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: "center",
        marginTop: 20,
    },
    saveText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
    },
    errorContainer: {
        padding: 20,
        alignItems: 'center',
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
    },
    debugText: {
        fontSize: 12,
        color: '#666',
        marginTop: 5,
    },
    debugItem: {
        fontSize: 11,
        color: '#999',
        marginLeft: 10,
    },
    debugCategory: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '600',
        marginBottom: 10,
        textAlign: 'center',
        padding: 8,
        backgroundColor: '#F0F0F0',
        borderRadius: 8,
    },
});

function mapStateToProps(state) {
    return {
        // Add any required state
    };
}

export default connect(mapStateToProps, {
    ADD_DOCUMENT_RECORD,
    UPDATE_RESIDENCY_RECORD,
})(CreateResidencyRecordScreen);