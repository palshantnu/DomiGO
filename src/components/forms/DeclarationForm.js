// import React, { useState } from 'react';
// import {
//     View,
//     Text,
//     StyleSheet,
//     TouchableOpacity,
// } from 'react-native';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import DatePicker from 'react-native-date-picker';

// const DeclarationForm = ({ data, onChange }) => {
//     const [openDatePicker, setOpenDatePicker] = useState(false);

//     const updateField = (field, value) => {
//         onChange({ ...data, [field]: value, enabled: true });
//     };

//     return (
//         <View>
//             <Text style={styles.label}>Date of Declaration *</Text>
//             <TouchableOpacity 
//                 style={styles.inputContainer}
//                 onPress={() => setOpenDatePicker(true)}
//             >
//                 <Ionicons name="calendar-outline" size={20} color="#9E9EA7" />
//                 <Text style={[styles.input, !data.date && styles.placeholder]}>
//                     {data.date || "Select Date"}
//                 </Text>
//             </TouchableOpacity>

//             <DatePicker
//                 modal
//                 mode="date"
//                 open={openDatePicker}
//                 date={data.date ? new Date(data.date) : new Date()}
//                 onConfirm={(date) => {
//                     updateField('date', date.toLocaleDateString("en-CA").slice(0, 10));
//                     setOpenDatePicker(false);
//                 }}
//                 onCancel={() => setOpenDatePicker(false)}
//             />
//         </View>
//     );
// };

// const styles = StyleSheet.create({
//     label: {
//         fontSize: 14,
//         fontWeight: "600",
//         marginTop: 16,
//         marginBottom: 8,
//         color: "#333",
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
//     },
//     input: {
//         flex: 1,
//         fontSize: 14,
//         color: "#000",
//         marginLeft: 12,
//     },
//     placeholder: {
//         color: "#A8A8A8",
//     },
// });

// export default DeclarationForm;
import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import DatePicker from "react-native-date-picker";
import { GOOGLE_KEY } from "../../helpers/CommonHelpers";
import GoogleAutoComplete from "../GoogleAutoComplete";
import colors from "../../theme/colors";

const DeclarationForm = ({ data, onChange,userData }) => {
    const [openDeclarationDate, setOpenDeclarationDate] = useState(false);
    const [openEstablishedDate, setOpenEstablishedDate] = useState(false);

    const updateField = (field, value) => {
        onChange({ ...data, [field]: value });
    };
    const YesNoButton = ({ label, field }) => (
        // <View style={styles.row}>
        //     <TouchableOpacity
        //         style={[
        //             styles.optionBtn,
        //             data[field] === "yes" && styles.selectedBtn,
        //         ]}
        //         onPress={() => updateField(field, "yes")}
        //     >
        //         <Text
        //             style={[
        //                 styles.optionText,
        //                 data[field] === "yes" && styles.selectedText,
        //             ]}
        //         >
        //             Yes
        //         </Text>
        //     </TouchableOpacity>

        //     <TouchableOpacity
        //         style={[
        //             styles.optionBtn,
        //             data[field] === "no" && styles.selectedBtn,
        //         ]}
        //         onPress={() => updateField(field, "no")}
        //     >
        //         <Text
        //             style={[
        //                 styles.optionText,
        //                 data[field] === "no" && styles.selectedText,
        //             ]}
        //         >
        //             No
        //         </Text>
        //     </TouchableOpacity>
        // </View>
        <View style={styles.yesNoContainer}>
        <TouchableOpacity
            style={[
                styles.yesNoButton,
                data[field] === "yes" && styles.yesNoButtonActive
            ]}
            onPress={() => updateField(field, "yes")}
        >
            <Text style={[
                styles.yesNoText,
                data[field] === "yes" && styles.yesNoTextActive
            ]}>Yes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
            style={[
                styles.yesNoButton,
                data[field] === "no" && styles.yesNoButtonActive
            ]}
            onPress={() => updateField(field, "no")}
        >
            <Text style={[
                styles.yesNoText,
                data[field] === "no" && styles.yesNoTextActive
            ]}>No</Text>
        </TouchableOpacity>
    </View>
    );

    return (
        <View>

            {/* Declaration Question */}
            <Text style={styles.label}>
                Declaration of Residency / Domicile
            </Text>
            <YesNoButton field="hasDeclaration" />

            {/* Date of Declaration */}
            {data.hasDeclaration === "yes" && (
                <>
                    <Text style={styles.label}>Date of Declaration *</Text>

                    <TouchableOpacity
                        style={styles.inputContainer}
                        onPress={() => setOpenDeclarationDate(true)}
                    >
                        <Ionicons name="calendar-outline" size={20} color="#9E9EA7" />
                        <Text style={[styles.input, !data.declarationDate && styles.placeholder]}>
                            {data.declarationDate || "Select Date"}
                        </Text>
                    </TouchableOpacity>

                    <DatePicker
                        modal
                        open={openDeclarationDate}
                        mode="date"
                        date={
                            data.declarationDate
                                ? new Date(data.declarationDate)
                                : new Date()
                        }
                        onConfirm={(date) => {
                            updateField(
                                "declarationDate",
                                date.toLocaleDateString("en-CA").slice(0, 10)
                            );
                            setOpenDeclarationDate(false);
                        }}
                        onCancel={() => setOpenDeclarationDate(false)}
                    />
                </>
            )}

            {/* Address of Record */}
            <Text style={styles.label}>Address of Record</Text>
            {/* <TextInput
        style={styles.textInput}
        placeholder="Enter address"
        value={data.address}
        onChangeText={(text) => updateField("address", text)}
      /> */}
            <GoogleAutoComplete
                placeholder="Search Address"
                apiKey={GOOGLE_KEY}
                isResidence={true}
                value={userData.state}
                onSelect={(value) => updateField('address', value)}
            />

            {/* Date Established */}
            {/* {data.hasDeclaration === "yes" && (
                <>
                    <Text style={styles.label}>Date Established</Text>

                    <TouchableOpacity
                        style={styles.inputContainer}
                        onPress={() => setOpenEstablishedDate(true)}
                    >
                        <Ionicons name="calendar-outline" size={20} color="#9E9EA7" />
                        <Text style={[styles.input, !data.establishedDate && styles.placeholder]}>
                            {data.establishedDate || "Select Date"}
                        </Text>
                    </TouchableOpacity>

                    <DatePicker
                        modal
                        open={openEstablishedDate}
                        mode="date"
                        date={
                            data.establishedDate
                                ? new Date(data.establishedDate)
                                : new Date()
                        }
                        onConfirm={(date) => {
                            updateField(
                                "establishedDate",
                                date.toLocaleDateString("en-CA").slice(0, 10)
                            );
                            setOpenEstablishedDate(false);
                        }}
                        onCancel={() => setOpenEstablishedDate(false)}
                    />
                </>
            )} */}

            {/* Signup Address */}
            {/* {data.hasDeclaration === "yes" && (
                <TouchableOpacity style={styles.linkBtn}>
                    <Text style={styles.linkText}>Link to Sign Up Address</Text>
                </TouchableOpacity>
            )} */}

            {/* Own Property */}
            <Text style={styles.label}>Do you own this property?</Text>
            <YesNoButton field="ownProperty" />

        </View>
    );
};

const styles = StyleSheet.create({
    label: {
        fontSize: 14,
        fontWeight: "600",
        marginTop: 16,
        marginBottom: 8,
        color: "#333",
    },

    row: {
        flexDirection: "row",
    },

    optionBtn: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        marginRight: 10,
    },

    selectedBtn: {
        backgroundColor: "#2F80ED",
        borderColor: "#2F80ED",
    },

    optionText: {
        color: "#333",
    },

    selectedText: {
        color: "#fff",
    },

    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F8F8F8",
        borderRadius: 12,
        paddingHorizontal: 16,
        minHeight: 52,
        borderWidth: 1,
        borderColor: "#F0F0F0",
    },

    input: {
        flex: 1,
        fontSize: 14,
        marginLeft: 12,
    },

    placeholder: {
        color: "#A8A8A8",
    },

    textInput: {
        backgroundColor: "#F8F8F8",
        borderRadius: 12,
        paddingHorizontal: 16,
        minHeight: 52,
        borderWidth: 1,
        borderColor: "#F0F0F0",
    },

    linkBtn: {
        marginTop: 10,
    },

    linkText: {
        color: "#2F80ED",
        fontWeight: "500",
    },
    yesNoContainer: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    yesNoButton: {
        flex: 1,
        paddingVertical: 14,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        marginRight: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    yesNoButtonActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    yesNoText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#666',
    },
    yesNoTextActive: {
        color: '#fff',
    },
});

export default DeclarationForm;