import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    ActivityIndicator,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import DatePicker from "react-native-date-picker";
import { pick } from "@react-native-documents/picker";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Dropdown } from "react-native-element-dropdown";
import Header from "../components/Header";
import { connect, useDispatch } from "react-redux";
import {
    ADD_DOCUMENT_RECORD,
    GET_Document_Category_LIST,
    UPDATE_RESIDENCY_RECORD,
} from "../redux/actions/action-creator";
import { CustomToast, GOOGLE_KEY } from "../helpers/CommonHelpers";
import colors from "../theme/colors";
import { useNavigation, useRoute } from "@react-navigation/native";

const CreateResidencyRecordScreen = ({
    documentCategoryList,
    ADD_DOCUMENT_RECORD,
    GET_Document_Category_LIST,
}) => {
    const navigation = useNavigation();
    const route = useRoute();
    const editData = route.params?.editData || null;
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();
    const [form, setForm] = useState({
        title: "",
        categoryId: null,
        state: "",
        city: "",
        issueDate: "",
        renewDate: "",
        notes: "",
        attachment: null,
    });

    const [categoryData, setCategoryData] = useState([]);
    const [stateSuggestions, setStateSuggestions] = useState([]);
    const [citySuggestions, setCitySuggestions] = useState([]);

    const [openIssuePicker, setOpenIssuePicker] = useState(false);
    const [openRenewPicker, setOpenRenewPicker] = useState(false);

    useEffect(() => {
        GET_Document_Category_LIST();
    }, []);

    useEffect(() => {
        if (editData) {
            setForm({
                title: editData.title || "",
                categoryId: editData.categoryId || null,
                state: editData.state || "",
                city: editData.city || "",
                issueDate: editData.issueDate || "",
                renewDate: editData.renewDate || "",
                notes: editData.notes || "",
                attachment: editData.attachment || null,
            });
        }
    }, [editData]);

    useEffect(() => {
        if (Array.isArray(documentCategoryList)) {
            setCategoryData(
                documentCategoryList.map((c) => ({
                    label: c.name,
                    value: c.id,
                }))
            );
        }
    }, [documentCategoryList]);

    const setValue = (key, val) =>
        setForm((prev) => ({ ...prev, [key]: val }));

    const validate = () => {
        if (!form.title.trim()) return CustomToast.show("Title is required");
        if (!form.categoryId) return CustomToast.show("Please select a category");
        if (!form.state.trim()) return CustomToast.show("State is required");
        if (!form.city.trim()) return CustomToast.show("City is required");
        if (!form.issueDate) return CustomToast.show("Issue date is required");
        if (!form.renewDate) return CustomToast.show("Renew date is required");

        return true;
    };

    const pickAttachment = async () => {
        try {
            const res = await pick({ allowMultiSelection: false });
            if (res?.[0]) setValue("attachment", res[0]);
        } catch (err) {
            console.log("Picker Error:", err);
        }
    };

    const InputContainer = ({ icon, children }) => (
        <View style={styles.inputContainer}>
            <Ionicons name={icon} size={20} color="#9E9EA7" />
            <View style={{ flex: 1, marginLeft: 12 }}>{children}</View>
        </View>
    );

    // const UploadRecord = async () => {
    //     if (!validate()) return;
    //     if (isLoading) return;

    //     setIsLoading(true);

    //     ADD_DOCUMENT_RECORD(form)
    //         .then((res) => {
    //             console.log('====================================');
    //             console.log(res);
    //             console.log('====================================');
    //             setIsLoading(false);
    //             if (res.response.message == "Success") {
    //                 CustomToast.show("Record Added Successfully!");
    //                 navigation.goBack();
    //             }
    //         })
    //         .catch(() => {
    //             setIsLoading(false);
    //             CustomToast.show("Something went wrong");
    //         });
    // };
    const UploadRecord = async () => {
        if (!validate()) return;
        setIsLoading(true);

        try {
            if (editData) {
                console.log("Edit Mode =>", editData);

                const res = await dispatch(
                    UPDATE_RESIDENCY_RECORD(editData.id, form)
                );

                console.log("Update Response =>", res);

                CustomToast.show("Record Updated Successfully!");
                navigation.goBack();
            } else {
                const res = await ADD_DOCUMENT_RECORD(form);

                if (res.response.message === "Success") {
                    CustomToast.show("Record Added Successfully!");
                    navigation.goBack();
                }
            }
        } catch (err) {
            console.log("ERROR =>", err);
            CustomToast.show("Something went wrong");
        }

        setIsLoading(false);
    };



    return (
        <LinearGradient
            colors={["#9ab1fa", "#ffffff"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.8, y: 0.4 }}
            locations={[0.05, 0.55]}
            style={{ flex: 1 }}
        >
            <View style={{ flex: 1 ,paddingTop:50}}>
                <Header title={editData ? "Edit Residency Record" : "Add Residency Record"} />

                <ScrollView contentContainerStyle={styles.formContainer}>
                    <View style={styles.whiteCard}>

                        <Text style={styles.label}>Title *</Text>
                        <InputContainer icon="document-text-outline">
                            <TextInput
                                placeholder="Enter Title"
                                placeholderTextColor="#A8A8A8"
                                style={styles.input}
                                value={form.title}
                                onChangeText={(v) => setValue("title", v)}
                            />
                        </InputContainer>

                        <Text style={styles.label}>Category *</Text>
                        <InputContainer icon="list-outline">
                            <Dropdown
                                style={styles.dropdown}
                                data={categoryData}
                                placeholder="Select category"
                                labelField="label"
                                valueField="value"
                                value={form.categoryId}
                                placeholderStyle={{ color: "#A8A8A8" }}
                                selectedTextStyle={styles.dropdownText}
                                onChange={(item) => setValue("categoryId", item.value)}
                            />
                        </InputContainer>

                        <Text style={styles.label}>State *</Text>
                        <View style={{ position: "relative" }}>
                            <InputContainer icon="flag-outline">
                                <TextInput
                                    placeholder="Enter State"
                                    placeholderTextColor="#A8A8A8"
                                    style={styles.input}
                                    value={form.state}
                                    onChangeText={(v) => {
                                        setValue("state", v);
                                    }}
                                />
                            </InputContainer>
                        </View>

                        <Text style={styles.label}>City *</Text>
                        <View style={{ position: "relative" }}>
                            <InputContainer icon="business-outline">
                                <TextInput
                                    placeholder="Enter City"
                                    placeholderTextColor="#A8A8A8"
                                    style={styles.input}
                                    value={form.city}
                                    onChangeText={(v) => {
                                        setValue("city", v);
                                    }}
                                />
                            </InputContainer>
                        </View>

                        <Text style={styles.label}>Issue Date *</Text>
                        <InputContainer icon="calendar-outline">
                            <TouchableOpacity
                                onPress={() => setOpenIssuePicker(true)}
                            >
                                <Text
                                    style={
                                        form.issueDate
                                            ? styles.input
                                            : styles.placeholder
                                    }
                                >
                                    {form.issueDate || "Select Issue Date"}
                                </Text>
                            </TouchableOpacity>
                        </InputContainer>

                        <DatePicker
                            modal
                            mode="date"
                            open={openIssuePicker}
                            date={new Date()}
                            onConfirm={(d) => {
                                setOpenIssuePicker(false);
                                setValue("issueDate", d.toISOString().slice(0, 10));
                            }}
                            onCancel={() => setOpenIssuePicker(false)}
                        />

                        <Text style={styles.label}>Renew Date *</Text>
                        <InputContainer icon="calendar-outline">
                            <TouchableOpacity
                                onPress={() => setOpenRenewPicker(true)}
                            >
                                <Text
                                    style={
                                        form.renewDate
                                            ? styles.input
                                            : styles.placeholder
                                    }
                                >
                                    {form.renewDate || "Select Renew Date"}
                                </Text>
                            </TouchableOpacity>
                        </InputContainer>

                        <DatePicker
                            modal
                            mode="date"
                            open={openRenewPicker}
                            date={new Date()}
                            onConfirm={(d) => {
                                setOpenRenewPicker(false);
                                setValue("renewDate", d.toISOString().slice(0, 10));
                            }}
                            onCancel={() => setOpenRenewPicker(false)}
                        />

                        <Text style={styles.label}>Notes</Text>
                        <InputContainer icon="document-outline">
                            <TextInput
                                style={[styles.input, { height: 80 }]}
                                // multiline
                                placeholder="Add notes"
                                placeholderTextColor="#A8A8A8"
                                value={form.notes}
                                onChangeText={(v) => setValue("notes", v)}
                            />
                        </InputContainer>

                        <Text style={styles.label}>Attachment</Text>
                        <InputContainer icon="cloud-upload-outline">
                            <TouchableOpacity onPress={pickAttachment}>
                                <Text style={styles.uploadText}>
                                    {form.attachment
                                        ? form.attachment.name
                                        : "Upload PDF / Image"}
                                </Text>
                            </TouchableOpacity>
                        </InputContainer>

                        <TouchableOpacity
                            onPress={UploadRecord}
                            style={styles.saveButton}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveText}>
                                    {editData ? "Update Record" : "Save Record"}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </LinearGradient>
    );
};

function mapStateToProps(state) {
    return {
        documentCategoryList: state.common.documentCategoryList,
    };
}

export default connect(mapStateToProps, {
    GET_Document_Category_LIST,
    ADD_DOCUMENT_RECORD,
})(CreateResidencyRecordScreen);

const styles = StyleSheet.create({
    formContainer: {
    },
    whiteCard: {
        padding: 20,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 15,
        elevation: 3,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        marginTop: 18,
        marginBottom: 8,
        color: "#333",
        marginLeft: 5,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F2F2F2",
        borderRadius: 30,
        paddingHorizontal: 18,
        minHeight: 52,
        borderWidth: 0.2,
        borderColor: '#9ab1fa'
    },
    input: {
        fontSize: 14,
        color: "#000",
    },
    placeholder: {
        color: "#A8A8A8",
        fontSize: 14,
    },
    dropdown: {
        width: "100%",
    },
    dropdownText: {
        color: "#000",
        fontSize: 14,
    },
    uploadText: {
        color: "#A8A8A8",
        fontSize: 14,
        fontWeight: "500",
    },
    saveButton: {
        backgroundColor: colors.primary,
        paddingVertical: 15,
        borderRadius: 30,
        alignItems: "center",
        marginTop: 30,
    },
    saveText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
    },
});