// src/components/forms/OthersForm.js
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DatePicker from 'react-native-date-picker';
import { pick } from '@react-native-documents/picker';
import { Dropdown } from 'react-native-element-dropdown';
import colors from '../../theme/colors';

const OthersForm = ({ data, onChange, mode }) => {
    const [openDatePicker, setOpenDatePicker] = useState(false);

    const updateField = (field, value) => {
        onChange({ ...data, [field]: value });
    };

    const pickDocument = async () => {
        try {
            const res = await pick({ allowMultiSelection: false });
            if (res?.[0]) {
                updateField('document', res[0]);
            }
        } catch (err) {
            console.log("Picker Error:", err);
        }
    };

    const typeOptions = [
        { label: 'Property Lease', value: 'lease' },
        { label: 'Vehicle Title', value: 'title' },
        { label: 'Vehicle Insurance', value: 'insurance' },
    ];

    return (
        <View>
            {mode === 'add' && (
                <>
                    <Text style={styles.label}>Type *</Text>
                    <Dropdown
                        style={styles.dropdown}
                        data={typeOptions}
                        labelField="label"
                        valueField="value"
                        placeholder="Select type"
                        value={data.type}
                        onChange={(item) => updateField('type', item.value)}
                    />
                </>
            )}

            <Text style={styles.label}>Start Date *</Text>
            <TouchableOpacity 
                style={styles.inputContainer}
                onPress={() => setOpenDatePicker(true)}
            >
                <Ionicons name="calendar-outline" size={20} color="#9E9EA7" />
                <Text style={[styles.input, !data.startDate && styles.placeholder]}>
                    {data.startDate || "Select Date"}
                </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Details</Text>
            <View style={[styles.inputContainer, { minHeight: 80 }]}>
                <Ionicons name="document-text-outline" size={20} color="#9E9EA7" />
                <TextInput
                    style={[styles.input, { textAlignVertical: 'top', paddingVertical: 12 }]}
                    placeholder="Enter details"
                    placeholderTextColor="#A8A8A8"
                    multiline
                    numberOfLines={3}
                    value={data.details}
                    onChangeText={(val) => updateField('details', val)}
                />
            </View>

            <Text style={styles.label}>Document</Text>
            <TouchableOpacity 
                style={styles.inputContainer}
                onPress={pickDocument}
            >
                <Ionicons name="cloud-upload-outline" size={20} color="#9E9EA7" />
                <Text style={[styles.input, !data.document && styles.placeholder]}>
                    {data.document?.name || "Upload PDF / Image"}
                </Text>
            </TouchableOpacity>

            <DatePicker
                modal
                mode="date"
                open={openDatePicker}
                date={data.startDate ? new Date(data.startDate) : new Date()}
                onConfirm={(date) => {
                    updateField('startDate', date.toISOString().slice(0, 10));
                    setOpenDatePicker(false);
                }}
                onCancel={() => setOpenDatePicker(false)}
            />
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
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F8F8F8",
        borderRadius: 12,
        paddingHorizontal: 16,
        minHeight: 52,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        marginBottom: 8,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: "#000",
        marginLeft: 12,
    },
    placeholder: {
        color: "#A8A8A8",
    },
    dropdown: {
        backgroundColor: "#F8F8F8",
        borderRadius: 12,
        paddingHorizontal: 16,
        minHeight: 52,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        marginBottom: 8,
    },
});

export default OthersForm;