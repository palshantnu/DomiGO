import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DatePicker from 'react-native-date-picker';
import { pick } from '@react-native-documents/picker';
import colors from '../../theme/colors';

const DriversLicenseForm = ({ data, onChange }) => {
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

    return (
        <View>
            <Text style={styles.label}>Issue Date *</Text>
            <TouchableOpacity 
                style={styles.inputContainer}
                onPress={() => setOpenDatePicker(true)}
            >
                <Ionicons name="calendar-outline" size={20} color="#9E9EA7" />
                <Text style={[styles.input, !data.issueDate && styles.placeholder]}>
                    {data.issueDate || "Select Issue Date"}
                </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Issuing State *</Text>
            <View style={styles.inputContainer}>
                <Ionicons name="flag-outline" size={20} color="#9E9EA7" />
                <TextInput
                    style={styles.input}
                    placeholder="Enter State"
                    placeholderTextColor="#A8A8A8"
                    value={data.state}
                    onChangeText={(val) => updateField('state', val)}
                />
            </View>

            <Text style={styles.label}>License Number</Text>
            <View style={styles.inputContainer}>
                <Ionicons name="card-outline" size={20} color="#9E9EA7" />
                <TextInput
                    style={styles.input}
                    placeholder="Optional"
                    placeholderTextColor="#A8A8A8"
                    value={data.number}
                    onChangeText={(val) => updateField('number', val)}
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

            <Text style={styles.disclaimer}>
                * Save document at your own risk
            </Text>

            <DatePicker
                modal
                mode="date"
                open={openDatePicker}
                date={new Date()}
                onConfirm={(date) => {
                    updateField('issueDate', date.toISOString().slice(0, 10));
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
    disclaimer: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
        marginTop: 8,
    },
});

export default DriversLicenseForm;